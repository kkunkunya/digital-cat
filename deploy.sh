#!/bin/sh
# 一键上线数字猫猫到 Cloudflare Pages。用保存在本机的 API Token（~/bin/cf-pages），不用任何浏览器登录。
# 用法（任意目录都行）：sh /Volumes/Storge/digital-cat/deploy.sh
# 第一次 / Token 换了：python3 ~/bin/cf-pages token
set -e
cd "$(dirname "$0")"
PROJECT=digital-cat

# 0. 没保存 Token 就先停下，告诉人该敲哪一行
[ -f "${CF_PAGES_TOKEN_FILE:-$HOME/.config/kun-cloudflare/pages-token.json}" ] || { echo "还没有保存 Cloudflare Token。先运行这一行，把 Token 粘进去：python3 ~/bin/cf-pages token"; exit 1; }

# 1. 打包（带缓存戳）
npx --yes esbuild@0.25.10 src/main.js --bundle --minify --format=esm --target=es2020,safari15 --outfile=dist/app.js --log-level=warning
sed -i '' -E "s#dist/app\.js(\?v=[0-9a-f]+)?\"#dist/app.js?v=$(md5 -q dist/app.js | cut -c1-8)\"#" index.html

# 2. 只放页面真正加载的文件（备份 / 测试页不上公网）
rm -rf _deploy && mkdir -p _deploy/dist
cp index.html _deploy/ && cp dist/app.js _deploy/dist/ && cp -R audio _deploy/audio

# 3. 没有项目就建，然后发布到正式分支，最后打印 Cloudflare 返回的正式地址
python3 "$HOME/bin/cf-pages" deploy _deploy "$PROJECT" main
