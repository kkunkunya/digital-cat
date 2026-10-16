#!/bin/sh
# 一键上线数字猫猫到 Cloudflare Pages（走 Kun 的 cf CLI：~/bin/cf-account.py，按域名选账号，不动全局 wrangler 登录）
# 用法：cd /Volumes/Storge/digital-cat && sh deploy.sh
# 换账号：CF_ACCOUNT=<域名或邮箱> sh deploy.sh   （默认 ferryway.cc 所在账号）
set -e
cd "$(dirname "$0")"
CF="python3 $HOME/bin/cf-account.py exec ${CF_ACCOUNT:-ferryway.cc} --"
PROJECT=digital-cat

# 0. 登录还活着吗？过期就停下，告诉人该敲哪一条
$CF wrangler whoami >/dev/null 2>&1 || { echo "Cloudflare 登录已过期。先运行：python3 ~/bin/cf-account.py login   （浏览器里选 ferryway.cc 所在账号），再重跑本脚本"; exit 1; }

# 1. 打包（带缓存戳）
npx --yes esbuild@0.25.10 src/main.js --bundle --minify --format=esm --target=es2020,safari15 --outfile=dist/app.js --log-level=warning
sed -i '' -E "s#dist/app\.js(\?v=[0-9a-f]+)?\"#dist/app.js?v=$(md5 -q dist/app.js | cut -c1-8)\"#" index.html

# 2. 只放页面真正加载的文件（备份 / 测试页不上公网）
rm -rf _deploy && mkdir -p _deploy/dist
cp index.html _deploy/ && cp dist/app.js _deploy/dist/ && cp -R audio _deploy/audio

# 3. 没有项目就建，然后发布到正式分支
$CF wrangler pages project list 2>/dev/null | grep -q "$PROJECT" || $CF wrangler pages project create "$PROJECT" --production-branch main
$CF wrangler pages deploy _deploy --project-name "$PROJECT" --branch main --commit-dirty=true

# 4. 打印正式公网地址（以 Cloudflare 返回为准，不要自己猜）
echo "--- 正式地址 ---"
$CF wrangler pages project list 2>/dev/null | grep "$PROJECT"
