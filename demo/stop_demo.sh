#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/.demo_pid" ]; then
    SERVER_PID=$(cat "$SCRIPT_DIR/.demo_pid")
    if ps -p $SERVER_PID > /dev/null; then
        echo "停止服务器 (PID: $SERVER_PID)..."
        kill $SERVER_PID
        rm "$SCRIPT_DIR/.demo_pid"
        
        zenity --info --text="✓ 服务器已停止" --width=250 2>/dev/null || \
        notify-send "自动驾驶决策规划系统" "服务器已停止" 2>/dev/null || \
        echo "✓ 服务器已停止"
    else
        echo "服务器未运行"
        rm "$SCRIPT_DIR/.demo_pid"
    fi
else
    echo "未找到运行中的服务器"
    zenity --info --text="未找到运行中的服务器" --width=250 2>/dev/null || \
    echo "未找到运行中的服务器"
fi
