#!/bin/zsh
# 双击此文件即可启动本地服务器并打开 3D 选衣页面。
# 页面必须通过 http:// 访问（ES module 在 file:// 下会被浏览器 CORS 拦截，页面全黑）。
cd "$(dirname "$0")"
if ! curl -s -o /dev/null --max-time 1 http://localhost:8000; then
  nohup python3 -m http.server 8000 >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:8000/3d-lab/b-threejs.html"
