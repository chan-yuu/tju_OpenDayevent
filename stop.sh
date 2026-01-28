#!/bin/bash

# 校园智能调度系统 - 停止脚本

echo "正在停止校园智能调度系统..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 从PID文件读取进程ID
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✓ 后端服务已停止 (PID: $BACKEND_PID)"
    fi
    rm -f "$SCRIPT_DIR/.backend.pid"
fi

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✓ 前端服务已停止 (PID: $FRONTEND_PID)"
    fi
    rm -f "$SCRIPT_DIR/.frontend.pid"
fi

# 备用方法：通过端口查找并停止
echo "检查端口占用..."

# 停止5000端口的进程
BACKEND_PORT_PID=$(lsof -ti:5000 2>/dev/null)
if [ ! -z "$BACKEND_PORT_PID" ]; then
    kill $BACKEND_PORT_PID 2>/dev/null
    echo "✓ 已停止占用端口5000的进程"
fi

# 停止8080端口的进程
FRONTEND_PORT_PID=$(lsof -ti:8080 2>/dev/null)
if [ ! -z "$FRONTEND_PORT_PID" ]; then
    kill $FRONTEND_PORT_PID 2>/dev/null
    echo "✓ 已停止占用端口8080的进程"
fi

echo ""
echo "✅ 所有服务已停止"
