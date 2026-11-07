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
| [广告拦截&净化合集（fmz200 修正版）](Surge/fmz200-blockAds-fixed.sgmodule) | 改自 [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts) 的 blockAds.module（GPL-3.0，见 [fmz200-LICENSE](Surge/fmz200-LICENSE)），仅删除 1 行 Surge 校验不通过的规则；不会自动跟随上游更新 | `https://raw.githubusercontent.com/bryannwu/rules/main/Surge/fmz200-blockAds-fixed.sgmodule` |
