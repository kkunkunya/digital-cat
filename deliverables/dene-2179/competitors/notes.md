# 竞品「网站基础件」对比（手机 390×844，2026-10-16）

样本：5 个可正常打开的小玩具站，均有截图；另附 neal.fun 作参考（见表末行）。neal.fun 现在被 Cloudflare 人机验证拦下，浏览器和 curl 都进不去，所以没有截图，只用了 2024-06 的 Wayback 存档文字，信息可能已过时。

截图：`<站>-mobile.png` 是落地首屏；`<站>-footer.png` 是页脚、关于或赞助区；`hackertyper-about.png` 是 About 弹层；`pointerpointer-play.png` 是游玩中画面（这个站没有页脚）。

## 对比表

| 站点 | About / 简介 | 打赏/赞助：方式 · 位置 · 时机 | GitHub/源码 | OG 分享图 | favicon | 隐私说明 | 页脚内容 | 语言切换 | 统计/广告 |
|---|---|---|---|---|---|---|---|---|---|
| **pointerpointer.com** | 无。只有 meta description 一句 | 无打赏。靠 Google AdSense 赚钱（head 里加载，手机上没看到广告位） | 无 | 有：og:title/desc/image（like3.jpg，很小）；没有 twitter:card | 声明了 `/favicon.ico`，实际返回 HTML，**是坏的**；apple-touch-icon 和 manifest 都用同一张 jpg | 无 | **无页脚**，整屏只有玩具 | 无（lang=en） | 旧版 Google Analytics + AdSense |
| **patatap.com** | 首屏不显示；藏在 credits 栏的「Merchandise」浮层里：一句产品说明 + 姊妹作品 + 技术致谢 | 浮层标题「Support the makers」，实际是 **Newsletter + App Store 付费 App + Spotify 专辑**，没有打赏。首屏底部常驻两枚黑色胶囊（Stay in the Loop / App Store），不打断游玩 | 无（只致谢 Two.js） | 有：og 和 twitter:card=summary，640×360，**用的是 http 链接** | ico + apple-touch-icon | 有：`/privacy-policy.html`，页脚里标成「terms」 | 浮层底部：lullatone · jono · inquiries（邮箱）· conversion table · terms · © 2014—2024 | 无 | GA4 |
| **theuselessweb.com** | 页脚一句话简介 + 「Read About The Sites」 | 无。只有「Submit」链接（Google 表单），让用户投稿网站 | 无（署名链接到作者主页） | 有：og 和 twitter:card=**summary_large_image**，**1200×630 大图** | 根目录有 `/favicon.ico`，但 head 里没写 link 标签 | 有：`/privacy`，用生成器套的模板 | 深色条一行：一句 slogan / 两个链接 / © Tim Holman · Submit · Terms · Privacy | 无 | GA（UA 和 G- 两套） |
| **bongo.cat**（最像我们：猫 + 单屏玩具） | 无独立 About；页脚署名说明画师、梗作者、开发者 | 无 | 有：右上角 GitHub 角标（octocat），但 **≤769px 时 CSS 把它隐藏了**，手机上看不到 | 有：og 和 twitter:card=summary，419×381，带 image:alt | 完整一套：16/32 png、ico、apple-touch 180、safari mask-icon、webmanifest | 只有 **cookie 横幅**（"匿名聚合统计"），**首次进入时盖住约 20% 屏幕**；没有隐私页 | 一行小字：En català · Art courtesy of @StrayRogue · Meme by @DitzyFlama · Website by Eric Huber | **有**：页脚第一个文字链 `?lang=ca`，html lang 跟着变 | Cloudflare Web Analytics |
| **hackertyper.net** | **About 是弹层**（☰ → About），4 段：缘起 / 欢迎在作品里用 / 联系邮箱 / 一句 FAQ（"不帮人黑东西"） | 无打赏。底部常驻条有「Become a real Hacker」和「Learn AI [Ad]」，☰ 菜单里还有「Run your own AI [Ad]」，都是**联盟/广告链接**；可以点 X 关掉 | 无 | **无 OG**，也没有 twitter 标签 | ico（**285KB，太大**）+ apple-touch 192 + manifest | 无 | 底部固定条：☰ · 两个 [Ad] · X；☰ 里有 Settings / Help / About / 广告 | 无 | 自建统计 sum.duiker101.net + 跳转追踪 link.duiker101.net |
| *neal.fun（参考，2024-06 存档）* | 页脚一句「Hi! I'm Neal. This is where I make stuff on the web.」 | **Ko-fi「Buy me a coffee」**，放在首页页脚，和 Newsletter、Twitter 并列；不弹窗，不打断 | 无 | （存档里没抓到） | png favicon，每个玩具各有一个 | 有：`/privacy-policy/` | Obligatory links: Newsletter · Twitter · Buy me a coffee · Say hello（邮箱）· Privacy policy | 无 | AdSense |

## 共有基础件（出现频率高 → 低）

1. **favicon 系列**：6/6 都有；5 个截图站里 4 个有 apple-touch-icon，3 个有 manifest。但 pointerpointer 是坏的，hackertyper 的 ico 有 285KB。
2. **分享卡片元数据**：4/5 有 OG。只有 useless web 用了 1200×630 + summary_large_image，其余都是小缩略图；hackertyper 完全没有。
3. **一行页脚**：署名 + 几个外链，小字放在底部。5/6 有某种底部信息，只有 pointerpointer 没有；其中 hackertyper 的底部条主要是广告，patatap 的页脚藏在浮层里。
4. **统计**：6/6 都有（GA ×3、Cloudflare、自建、AdSense）。**用了 GA/AdSense 的站基本都挂了隐私页**；bongo.cat 用 cookie 横幅代替隐私页。
5. **钱从哪来**：广告/联盟链接 3 个，付费 App + 音乐 1 个，**Ko-fi 打赏 1 个（neal.fun）**，完全不赚钱 1 个。**没有一个站在游玩中弹赞助窗**；赞助入口都在页脚、浮层或 ☰ 里。
6. **About 都很短**：放在页脚一句话或一个弹层里（hackertyper 4 段），没人做独立的长 About 页。
7. **GitHub 链接很少见**：只有 bongo.cat 有，而且手机上隐藏了。
8. **语言切换很少见**：只有 bongo.cat 做了，用页脚文字链 + `?lang=` 参数。
9. **首屏 = 玩具本身**：最多一行操作提示；所有基础件加起来只占底部 ≤64px，或者收在 ☰/弹层里。

## 给数字猫猫的建议

现状：首屏只有 description 和一个 emoji data-URI favicon，**没有 OG / apple-touch / 页脚 / About / 隐私**；已有中英切换、30 秒「放松完成，分享战绩」结束卡、「音效来源」链接；**没有任何统计**，只在 localStorage 记了语言。

1. **打赏只放在 30 秒结束卡上**（"先玩后要"）：在「分享战绩」主按钮下面加一个次级文字按钮，比如「请煤球吃根小鱼干 🐟 / Buy the cat a treat」。拍猫过程中不出现，也不自动弹出。页脚再放一个低调入口，给想主动支持的人（参考 neal.fun）。渠道按语言分开：中文用**个人微信赞赏码图片**（微信里长按识别，和现在"长按保存战绩图"是同一个手势），英文用 **Ko-fi** 链接。不要两个都塞给同一个人。
2. **首屏底部加一行小字页脚**（参考 bongo.cat / useless web），不要遮挡拍猫区域：`关于 · 音效来源 · 源码 · 隐私 · EN`。把现有的「音效来源」并进来；GitHub 用文字链，**不要用右上角角标**（bongo.cat 自己都在手机上把它藏了）；语言切换如果已经在别处，就不重复放。字号 11–12px、低对比度，留出 safe-area。
3. **About 和隐私合成一个小弹层**（参考 hackertyper），双语各 4 句：这是什么（30 秒拍猫解压）、谁做的、联系方式、一句隐私说明。我们没有统计，可以如实写「不登录、不收集任何数据，只在你的手机上记住语言」。这样**不用 cookie 横幅、也不用单独的隐私页**（bongo.cat 的横幅首屏盖掉 20%，反面教材）。以后要加统计，就选 Cloudflare Web Analytics 这类不用 cookie 的，并同步改这一句。
4. **补全 head**：og:title / og:description / og:image（**1200×630、https 绝对地址**、猫屁屁特写 + 一句中文 slogan）、`twitter:card=summary_large_image`；favicon 换成真实的 32px png + `apple-touch-icon` 180px（iOS 加到主屏幕不认 emoji SVG）；ico 要控制在几 KB（hackertyper 285KB，反面教材）。注意：**微信里转发链接通常不读 og:image**（自定义卡片要公众号 JS-SDK），所以 OG 主要服务 X、Telegram、iMessage、飞书这些渠道；微信侧继续靠已有的「分享战绩」图片。
5. **减法**：不做独立 About 页、Newsletter、广告位、cookie 横幅、GitHub 角标。整套基础件 = head 标签 + 一行页脚 + 一个弹层 + 结束卡上一个按钮。
