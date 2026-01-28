#!/bin/bash

# ========== 新增：手动加载用户环境变量（解决 nvm 安装的 Node 未生效） ==========
# 加载 bash 配置（若用 zsh 则改为 ~/.zshrc）
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
fi
# 加载 nvm 配置（如果用 nvm 安装 Node）
if [ -f ~/.nvm/nvm.sh ]; then
    source ~/.nvm/nvm.sh
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs"
LOG_FILE="$SCRIPT_DIR/logs/demo_$(date +%Y%m%d_%H%M%S).log"

# 清理函数 - 终端关闭时自动调用
cleanup() {
    echo ""
    echo "🛑 正在停止服务器..."
    
    # 停止后端
    if [ ! -z "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        echo "✓ 后端已停止 (PID: $BACKEND_PID)"
    fi
    
    # 停止前端
    if [ ! -z "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✓ 前端已停止 (PID: $FRONTEND_PID)"
    fi
    
    # 清理残留进程
    pkill -f "python3.*main.py" 2>/dev/null
    pkill -f "http-server.*8080" 2>/dev/null
    
    echo "✓ 服务已完全停止"
    exit 0
}

# 注册清理函数
trap cleanup EXIT INT TERM

echo "🚗 自动驾驶决策规划演示系统"
echo "========================================"
echo ""

# 检查环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3"
    read -p "按回车键退出..."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js"
    read -p "按回车键退出..."
    exit 1
fi

echo "✓ Python: $(python3 --version)"
echo "✓ Node.js: $(node --version)"
echo ""

echo "🚀 启动服务器..."
echo ""

# 启动后端
cd "$SCRIPT_DIR/backend"
python3 main.py > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
echo "✓ 后端启动 (PID: $BACKEND_PID) - 端口: 8000"

# 等待后端启动
sleep 3

# 启动前端
cd "$SCRIPT_DIR/frontend"
http-server -p 8080 --cors -c-1 >> "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!
echo "✓ 前端启动 (PID: $FRONTEND_PID) - 端口: 8080"

sleep 2

echo ""
echo "========================================"
echo "✅ 系统启动成功！"
echo ""
echo "📱 访问地址: http://localhost:8080"
echo "📊 后端API: http://localhost:8000"
echo ""
echo "⚠️  关闭此终端窗口将自动停止所有服务"
echo "按 Ctrl+C 可手动停止"
echo "========================================"
echo ""

# 打开浏览器
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080 2>/dev/null &
elif command -v firefox &> /dev/null; then
    firefox http://localhost:8080 2>/dev/null &
elif command -v google-chrome &> /dev/null; then
    google-chrome http://localhost:8080 2>/dev/null &
fi

# 保持运行，等待用户关闭
echo "📋 服务器运行中，日志: $LOG_FILE"
echo ""
tail -f "$LOG_FILE"
