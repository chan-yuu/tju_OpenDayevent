#!/bin/bash

# AI Vision Lab 启动脚本
# 自动启动后端和前端服务

# 1. 获取当前脚本（start.sh）所在的绝对路径
SCRIPT_PATH=$(readlink -f "$0")
# 2. 获取脚本所在目录（scripts/）
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")
# 3. 项目根目录 = scripts/ 的上级目录（即 tju-vision-lab/）
PROJECT_DIR=$(dirname "$SCRIPT_DIR")
source ~/.bashrc
# PROJECT_DIR="/home/cyun/Documents/tju-vision-lab"
LOG_DIR="$PROJECT_DIR/logs"

# 清理函数 - 在脚本退出时自动停止服务
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    
    # 停止后端
    if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "   停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
        sleep 1
        # 如果还没停止，强制结束
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
    fi
    
    # 停止前端
    if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "   停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
        sleep 1
        # 如果还没停止，强制结束
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
    fi
    
    # 清理 PID 文件
    rm -f "$PROJECT_DIR/.backend.pid" "$PROJECT_DIR/.frontend.pid"
    
    echo "   ✅ 所有服务已停止"
    exit 0
}

# 捕获退出信号，确保服务被停止
trap cleanup SIGINT SIGTERM EXIT

# 创建日志目录
mkdir -p "$LOG_DIR"

# 清空旧日志
> "$LOG_DIR/backend.log"
> "$LOG_DIR/frontend.log"

echo "🚀 正在启动 AI Vision Lab..."
echo "================================"

# 启动后端服务
echo "📡 启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup python3 run.py > "$LOG_DIR/backend.log" 2>&1 &

BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否成功启动
if ps -p $BACKEND_PID > /dev/null; then
    echo "   ✅ 后端启动成功"
else
    echo "   ❌ 后端启动失败，请检查日志: $LOG_DIR/backend.log"
    exit 1
fi

# 启动前端服务
echo "🎨 启动前端服务..."
cd "$PROJECT_DIR"
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

# 等待前端启动
sleep 5

# 检查前端是否成功启动
if ps -p $FRONTEND_PID > /dev/null; then
    echo "   ✅ 前端启动成功"
else
    echo "   ❌ 前端启动失败，请检查日志: $LOG_DIR/frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "================================"
echo "✅ AI Vision Lab 启动完成！"
echo ""
echo "📊 服务信息:"
echo "   后端服务: http://localhost:8000"
echo "   前端服务: http://localhost:3000"
echo ""
echo "📁 日志文件:"
echo "   后端日志: $LOG_DIR/backend.log"
echo "   前端日志: $LOG_DIR/frontend.log"
echo ""
echo "🔧 进程信息:"
echo "   后端 PID: $BACKEND_PID"
echo "   前端 PID: $FRONTEND_PID"
echo ""
echo "💡 提示:"
echo "   - 浏览器将自动打开 http://localhost:3000"
echo "   - 按 Ctrl+C 将停止所有服务并退出"
echo "   - 或者在另一个终端运行: ./stop.sh"
echo ""

# 保存 PID 到文件，方便后续停止
echo $BACKEND_PID > "$PROJECT_DIR/.backend.pid"
echo $FRONTEND_PID > "$PROJECT_DIR/.frontend.pid"

# 等待3秒后自动打开浏览器
sleep 3
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null &
elif command -v gnome-open > /dev/null; then
    gnome-open http://localhost:3000 2>/dev/null &
fi

echo "🌐 正在打开浏览器..."
echo ""
echo "📝 服务运行中... (按 Ctrl+C 停止所有服务)"
echo ""

# 持续监控服务状态
while true; do
    sleep 10
    
    # 检查后端
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "⚠️  后端服务已停止"
        break
    fi
    
    # 检查前端
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "⚠️  前端服务已停止"
        break
    fi
done
