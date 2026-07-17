#!/bin/bash
# 全息选衣 POC 启动脚本：本地起服务并打开浏览器（大屏部署时用 Chrome kiosk 模式）
cd "$(dirname "$0")"
PORT=8765
python3 -m http.server $PORT &>/dev/null &
SERVER_PID=$!
sleep 1
open "http://localhost:$PORT/index.html"
echo "全息选衣 POC 已启动：http://localhost:$PORT"
echo "按回车键退出并关闭服务..."
read
kill $SERVER_PID 2>/dev/null
