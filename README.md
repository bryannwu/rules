# rules

个人维护的代理分流规则，Surge 规则集格式（Surge / Egern 可直接引用）。

| 文件 | 说明 | 建议策略 |
|---|---|---|
| [Claude.list](Claude.list) | Claude / Anthropic 域名与 IP 段 | 固定出口的 Claude 策略组 |

引用地址：

```
https://raw.githubusercontent.com/bryannwu/rules/main/Claude.list
```

部分条目参考 [SukkaW/Surge](https://github.com/SukkaW/Surge) 的 ai.conf。

## Surge 模块

| 模块 | 说明 | 安装地址 |
|---|---|---|
| [广告域名拦截](Surge/Yubee-AdBlock-Domain.sgmodule) | Sukka 广告域名表，只按域名拦截，不解密；STUN 不拦截 | `https://raw.githubusercontent.com/bryannwu/rules/main/Surge/Yubee-AdBlock-Domain.sgmodule` |
| [VPS 流量面板](Surge/Komari-Traffic-Panel.sgmodule) | 读取 Komari 只读汇总接口显示 VPS 月流量；token 在模块参数里填，不在仓库里 | `https://raw.githubusercontent.com/bryannwu/rules/main/Surge/Komari-Traffic-Panel.sgmodule` |
