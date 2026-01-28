#!/bin/bash

# 校园智能调度系统 - 启动脚本

echo "================================"
echo "  校园智能调度系统启动脚本"
echo "================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 检查Python是否安装
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null
then
    echo "❌ 错误: 未找到Python，请先安装Python 3.7+"
    exit 1
fi

# 使用python3或python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "✓ Python已找到: $PYTHON_CMD"

# 检查是否安装了依赖
echo ""
echo "正在检查后端依赖..."
cd "$SCRIPT_DIR/backend"

if ! $PYTHON_CMD -c "import flask" 2>/dev/null; then
    echo "📦 安装后端依赖..."
    $PYTHON_CMD -m pip install -r requirements.txt --user
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✓ 依赖安装完成"
else
    echo "✓ 依赖已安装"
fi

# 启动后端服务
echo ""
echo "🚀 启动后端服务 (端口5000)..."
$PYTHON_CMD app.py &
BACKEND_PID=$!
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 2

# 启动前端服务
echo ""
echo "🌐 启动前端服务 (端口8080)..."
cd "$SCRIPT_DIR/frontend"
$PYTHON_CMD -m http.server 8080 2>/dev/null &
FRONTEND_PID=$!
echo "✓ 前端服务已启动 (PID: $FRONTEND_PID)"

# 等待前端启动
sleep 2

# 保存PID到文件以便后续关闭
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

echo ""
echo "================================"
echo "✅ 系统启动成功！"
echo "================================"
echo ""
echo "📌 访问地址:"
echo "   前端界面: http://localhost:8080/index.html"
echo "   后端API:  http://localhost:5000/api"
echo ""
echo "📌 服务进程:"
echo "   后端PID: $BACKEND_PID"
echo "   前端PID: $FRONTEND_PID"
echo ""
echo "💡 提示:"
echo "   - 在浏览器中打开前端地址开始使用"
echo "   - 按 Ctrl+C 或运行 ./stop.sh 停止服务"
echo "   - 查看 README.md 了解详细使用说明"
echo ""

# 尝试自动打开浏览器
if command -v xdg-open &> /dev/null; then
    echo "🌍 正在打开浏览器..."
    xdg-open "http://localhost:8080/index.html" 2>/dev/null &
elif command -v open &> /dev/null; then
    echo "🌍 正在打开浏览器..."
    open "http://localhost:8080/index.html" 2>/dev/null &
fi

# 等待用户按Ctrl+C
echo "按 Ctrl+C 停止服务..."
echo ""

# 捕获退出信号
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f '$SCRIPT_DIR/.backend.pid' '$SCRIPT_DIR/.frontend.pid'; echo '✓ 服务已停止'; exit 0" SIGINT SIGTERM

# 保持脚本运行
wait
