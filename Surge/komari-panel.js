// Komari VPS 流量面板（Surge Panel）
// 由 Egern「流量圆环」移植：同一个只读汇总接口、同样的口径与离线/过期判断。
// 参数：url=<汇总接口>&token=<只读 token>&servers=<探针名:显示名:GB,...>&tz=<计费时区偏移分钟>
// token 只填在手机本地模块参数里，不写进本文件。

const DEFAULT_SERVERS = 'US-LA-HHost/hhost/400|US-LA-DMIT/DMIT/1000|HK-Yecao/野草云/600|US-LA-Novix/Novix/1000';
const MAX_AGE_MS = 120 * 1000;

function parseArgs(raw) {
  const out = {};
  String(raw || '').split('&').forEach(pair => {
    const i = pair.indexOf('=');
    if (i <= 0) return;
    const key = pair.slice(0, i).trim();
    let value = pair.slice(i + 1).trim();
    try { value = decodeURIComponent(value); } catch (e) {}
    out[key] = value;
  });
  return out;
}

function serversFrom(value) {
  const text = value ? value : DEFAULT_SERVERS;
  // 多台用 | 或 , 隔开；每台用 / 或 : 分隔（模块参数里不能有逗号，所以默认用 | 和 /）
  const servers = text.split(/[|,]/).map(entry => {
    const parts = entry.split(/[/:]/).map(p => p.trim());
    if (parts.length !== 3 || !parts[0] || !parts[1] || !/^\d+(\.\d+)?$/.test(parts[2])) return null;
    const quota = Number(parts[2]);
    return quota > 0 ? { id: parts[0], label: parts[1], quota } : null;
  });
  return servers.length >= 1 && servers.length <= 4 && servers.every(Boolean) ? servers : null;
}

function timestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) ? Date.parse(value) : NaN;
}

function fresh(value, now) {
  const at = timestamp(value);
  return Number.isFinite(at) && now - at <= MAX_AGE_MS && at - now <= 30000;
}

const nonnegative = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;

function resetDays(day, now, offset) {
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  const local = new Date(now + offset * 60000);
  const boundary = month =>
    Date.UTC(local.getUTCFullYear(), month, Math.min(day, new Date(Date.UTC(local.getUTCFullYear(), month + 1, 0)).getUTCDate()));
  let next = boundary(local.getUTCMonth());
  if (next <= local.getTime()) next = boundary(local.getUTCMonth() + 1);
  return Math.ceil((next - local.getTime()) / 864e5);
}

function normalize(server, clients, now, offset) {
  const matches = clients.filter(c => c && c.name === server.id);
  const src = matches.length === 1 ? matches[0] : {};
  const current = fresh(src.updatedAt, now) && typeof src.online === 'boolean';
  const online = current ? src.online : null;
  const known = online === true && src.trafficSource === 'komari-month-rotate' && nonnegative(src.trafficUsedBytes);
  const used = known ? src.trafficUsedBytes / 1e9 : null;
  return {
    ...server,
    online,
    used,
    percent: used === null ? null : (used / server.quota) * 100,
    days: current ? resetDays(src.resetDay, now, offset) : null
  };
}

function amount(gb) {
  if (gb === null) return '—';
  return gb >= 1000 ? +(gb / 1000).toFixed(2) + 'T' : +(gb < 10 ? gb.toFixed(1) : gb.toFixed(0)) + 'G';
}

function bar(percent) {
  if (percent === null) return '░░░░░░░░░░';
  const filled = Math.max(0, Math.min(10, Math.round(percent / 10)));
  return '▓'.repeat(filled) + '░'.repeat(10 - filled);
}

function line(host) {
  if (host.online === false) return `${host.label}  离线`;
  if (host.used === null) return `${host.label}  用量未知`;
  const reset = host.days === null ? '' : ` · ${host.days}天重置`;
  return `${host.label}  ${bar(host.percent)} ${Math.round(host.percent)}%\n${amount(host.used)} / ${amount(host.quota)}${reset}`;
}

function clock(ms) {
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function render(hosts, now) {
  const known = hosts.filter(h => h.percent !== null).map(h => h.percent);
  const top = known.length ? Math.max(...known) : null;
  const color = top === null ? '#8E8E93' : top > 85 ? '#FF6B5A' : top >= 60 ? '#FF9F0A' : '#30D158';
  return {
    title: `VPS 流量 · ${clock(now)} 更新`,
    content: hosts.map(line).join('\n') + '\nKomari 统计，可能与账单略有出入',
    icon: 'chart.pie.fill',
    'icon-color': color
  };
}

function fail(message) {
  return { title: 'VPS 流量', content: message, icon: 'exclamationmark.triangle.fill', 'icon-color': '#8E8E93' };
}

function run(argument, httpGet, now, done) {
  const args = parseArgs(argument);
  const servers = serversFrom(args.servers);
  const offset = Number.isFinite(Number(args.tz)) ? Number(args.tz) : 0;
  if (!args.url || !/^https:\/\//.test(args.url)) return done(fail('未配置接口地址'));
  if (!args.token || args.token === 'none' || /^\{\{\{/.test(args.token) || /[\r\n]/.test(args.token)) return done(fail('未配置只读 token'));
  if (!servers) return done(fail('服务器参数格式错误'));
  httpGet(
    { url: args.url, headers: { Authorization: 'Bearer ' + args.token, 'Cache-Control': 'no-cache' }, timeout: 5 },
    (error, response, body) => {
      if (error) return done(fail('接口请求失败'));
      const status = response && (response.status || response.statusCode);
      if (status === 401 || status === 403) return done(fail('只读鉴权失败'));
      if (status !== 200) return done(fail('接口不可用'));
      let data;
      try { data = JSON.parse(body); } catch (e) { return done(fail('数据格式错误')); }
      if (!data || data.schemaVersion !== 2 || !Array.isArray(data.clients)) return done(fail('数据格式错误'));
      if (!fresh(data.generatedAt, now)) return done(fail('流量数据过期'));
      done(render(servers.map(s => normalize(s, data.clients, now, offset)), now));
    }
  );
}

if (typeof $done === 'function') {
  run(typeof $argument === 'string' ? $argument : '', (opts, cb) => $httpClient.get(opts, cb), Date.now(), $done);
} else if (typeof module !== 'undefined') {
  module.exports = { run, parseArgs, serversFrom, resetDays, amount, bar };
}
