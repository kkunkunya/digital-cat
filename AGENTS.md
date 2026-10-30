# digital-cat — Agent 规矩

本文件是本仓给 Agent 的唯一规则源：Codex、OpenCode 直接读，Claude Code 经一行的 `CLAUDE.md` 读到。仓库长什么样见 kun-agent-mono 技能 `repo-layout`。

## 用途

数字猫猫（Digital Cats）：手机上的一只 3D 毛绒猫网页，拍一下它就抖毛、呼噜、回一声喵，不用下载也不用登录；正式站 https://cat.kunkunzheten.top，面向海外手机用户，打赏可选（Waffo）。纯静态页 + Three.js，托管在 Cloudflare Workers，`worker/` 只管 `/api/*`。对外的中英说明在 `README.md`。

## 怎么跑

- 本地看：`python3 -m http.server 8000`，打开 http://localhost:8000
- 改了 `src/main.js` 后打包进 `dist/app.js`：`npx --yes esbuild@0.25.10 src/main.js --bundle --minify --format=esm --target=es2020,safari15 --outfile=dist/app.js`
- 没有测试和 lint；上线 `sh deploy.sh`（先看下面的红线）

## 地图

一行一处：`路径` → 是什么 → 什么时候读。用到哪层才读哪层；新建顶层目录或文档，同一个改动在这里加一行。档位「轻」（rules `grow`）：只长这张地图，不建词汇表和 ADR。

- `index.html` → 首页，猫在第一屏 → 改首屏、加载顺序时读
- `src/main.js` → 猫的 Three.js 渲染和拍打交互 → 改猫的动作、声音触发时读
- `dist/` → `src/main.js` 打包出的 `app.js`，页面直接加载 → 只由打包命令生成，不手改
- `site.css`、`site.js`、`page.css`、`page.js` → 首页和内页的样式、脚本
- `about.html`、`privacy.html`、`terms.html`、`thanks.html` → 介绍、隐私、条款、打赏后的感谢页 → 改合规文案时读
- `audio/` → 拍打、喵、呼噜的录音，来源和许可在 `audio/CREDITS.txt` → 加或换声音时读
- `vendor/` → Three.js 和它的 MIT 许可
- `worker/` → Cloudflare Worker：`/api/tip` 打赏收银（Waffo）、`/api/e` 匿名计数 → 改收款或计数前读
- `wrangler.jsonc` → Worker 设置：域名、变量（`TIP_LIVE` 打赏开关）、计数用的 Durable Object
- `deploy.sh` → 打包、拷进 `_deploy/`、`wrangler deploy` 发正式站 → 上线前读
- `_deploy/` → `deploy.sh` 每次重建的上线文件夹 → 不手改
- `index_v1_backup.html`、`bench_before.html`、`数字猫猫-头脑风暴-三遍整合-1015.html` → 旧版首页备份、性能对比页、头脑风暴整理 → 只查历史时读，不上线
- `README.md` → 对外说明（中英）和上线步骤
- `docs/` → 决定（`docs/adr/`）和现状（`docs/status.md`），都是第一次用到才建；`docs/deleted-paths.txt` 是删过不许复活的路径

## 红线：绝对不能碰

- 不在 `main/` 里改文件、提交或推送：每个任务在 `<根>/worktrees/<任务>` 开分支，只经 PR 合进主分支。
- 不强推、不 `reset --hard`、不改已推送的历史；不删别人的东西，多余的挪进 `<根>/_trash-<日期>/`。
- 密钥、Token、个人信息、本机私有路径不进 git；`.env` 不读、不提交。
- 仓外的原件和输入（下一节的 `data/` 和登记的原件文件夹）只读：不改、不删、不挪，也不在原地跑会写文件的程序；跑出来的结果只往 `outputs/<日期>-<任务>/` 新加，不改已有的。
- `sh deploy.sh` 把当前工作树原样发到正式站，没有测试站：改动先 PR 进主分支，合并后从包含最新 `origin/main` 的检出部署；检出落后 `origin/main` 时绝不跑，否则会把已上线的改动冲掉。
- Cloudflare 令牌只从 Mac 钥匙串读，Waffo 的 key 只用 `wrangler secret` 设，都不进仓、不回显。
- 录音是 Kun 家猫的真实录音，版权归 Kun：不换成来源不明的音频，新加的写进 `audio/CREDITS.txt`。

## 仓外资料（不进 git）

放在项目根（`main/` 的上一层；在 worktree 里是 `git rev-parse --path-format=absolute --git-common-dir` 的上两层），所有检出共用，名字登记在 rules 的 `outside_dirs`：

- `data/` → 输入原件和大文件，只读（文件系统设了只读，防手滑；同一用户能改回可写，所以靠上面的红线守）
- `outputs/` → 跑出来的大结果，可写：每次新建一个 `<日期>-<任务>/` 往里写，已有的不改
- 要进论文或交付的小结果，复制进仓提交；大于 rules `max_file_mb` 的提交钩子会拦

## 仓库规矩（机器可读，防腐化标准见 kun-agent-mono docs/anti-rot-standard.md）

`doc_watch` 填改了就要同步改文档的代码路径（空格分隔，`*` 跨目录，`!` 开头排除），空着 = 不查；`outside_dirs` 填项目根里 `main/`、`worktrees/` 之外的仓外资料文件夹；`max_file_mb` 是单个文件进 git 的上限。

```rules
root_dirs: _deploy audio dist src vendor worker docs .agents .claude
root_files: .gitignore AGENTS.md CLAUDE.md README.md about-cat.jpg about.html bench_before.html deploy.sh favicon-32.png favicon.svg icon-180.png icon-512.png index.html index_v1_backup.html og.png opencode.json page.css page.js privacy.html robots.txt site.css site.js site.webmanifest sitemap.xml terms.html thanks.html wrangler.jsonc 数字猫猫-头脑风暴-三遍整合-1015.html
tombstones: docs/deleted-paths.txt
grow: 轻
doc_watch:
outside_dirs:
max_file_mb: 5
```
