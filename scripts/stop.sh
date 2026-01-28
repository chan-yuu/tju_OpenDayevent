#!/bin/bash

# AI Vision Lab 停止脚本
# 停止后端和前端服务

PROJECT_DIR="/home/cyun/Documents/tju-vision-lab"

echo "🛑 正在停止 AI Vision Lab..."
echo "================================"

# 读取 PID 文件
BACKEND_PID_FILE="$PROJECT_DIR/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_DIR/.frontend.pid"

# 停止后端
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "📡 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
        sleep 2
        # 强制杀死
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        echo "   ✅ 后端服务已停止"
    else
        echo "   ℹ️  后端服务未运行"
    fi
    rm -f "$BACKEND_PID_FILE"
else
    echo "   ℹ️  未找到后端 PID 文件"
fi

# 停止前端
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🎨 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
        sleep 2
        # 强制杀死
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        echo "   ✅ 前端服务已停止"
    else
        echo "   ℹ️  前端服务未运行"
    fi
    rm -f "$FRONTEND_PID_FILE"
else
    echo "   ℹ️  未找到前端 PID 文件"
fi

# 额外清理：杀死所有相关进程
echo ""
echo "🔍 清理残留进程..."

# 清理 Python 后端进程
PYTHON_PIDS=$(pgrep -f "python.*run.py")
if [ -n "$PYTHON_PIDS" ]; then
    echo "   发现 Python 后端进程: $PYTHON_PIDS"
    kill $PYTHON_PIDS 2>/dev/null
    echo "   ✅ Python 进程已清理"
fi

# 清理 Node 前端进程
NODE_PIDS=$(pgrep -f "vite.*tju-vision-lab")
if [ -n "$NODE_PIDS" ]; then
    echo "   发现 Node 前端进程: $NODE_PIDS"
    kill $NODE_PIDS 2>/dev/null
    echo "   ✅ Node 进程已清理"
fi

echo ""
echo "================================"
echo "✅ AI Vision Lab 已完全停止"
