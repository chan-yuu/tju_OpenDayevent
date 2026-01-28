#!/bin/bash

# 自动驾驶决策规划演示系统 - 桌面快捷方式部署脚本
# 使用终端启动，关闭终端自动停止服务

echo "🚗 自动驾驶决策规划演示系统 - 桌面快捷方式部署"
echo "=================================================="
echo ""

# 获取当前脚本所在的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$HOME/Desktop"

# 检查Desktop目录
if [ ! -d "$DESKTOP_DIR" ]; then
    DESKTOP_DIR="$HOME/桌面"
fi

if [ ! -d "$DESKTOP_DIR" ]; then
    echo "❌ 错误: 未找到桌面目录"
    exit 1
fi

echo "✓ 桌面目录: $DESKTOP_DIR"
echo "✓ 项目目录: $SCRIPT_DIR"
echo ""

# 创建启动脚本
LAUNCH_SCRIPT="$SCRIPT_DIR/launch_demo.sh"
echo "📝 创建启动脚本..."

cat > "$LAUNCH_SCRIPT" << 'LAUNCH_EOF'
#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
    pkill -f "http-server" 2>/dev/null
    
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

# 检查http-server
if ! command -v http-server &> /dev/null; then
    echo "📦 安装 http-server..."
    npm install -g http-server
fi

echo "🚀 启动服务器..."
echo ""

# 启动后端
cd "$SCRIPT_DIR/backend"
python3 main.py > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
echo "✓ 后端启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 2

# 启动前端
cd "$SCRIPT_DIR/frontend"
http-server -p 8080 --cors -c-1 >> "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!
echo "✓ 前端启动 (PID: $FRONTEND_PID)"

sleep 2

echo ""
echo "========================================"
echo "✅ 系统启动成功！"
echo ""
echo "📱 访问地址: http://localhost:8080"
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
fi

# 保持运行，等待用户关闭
echo "服务器运行中，日志: $LOG_FILE"
echo ""
tail -f "$LOG_FILE"
LAUNCH_EOF

chmod +x "$LAUNCH_SCRIPT"
echo "✓ 启动脚本创建完成"
echo ""

# 创建Desktop文件
DESKTOP_FILE="$DESKTOP_DIR/MotionPlanningDemo.desktop"
echo "📝 创建桌面快捷方式..."

cat > "$DESKTOP_FILE" << DESKTOP_EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=规划控制系统
Comment=交互式路径规划算法演示系统
Comment[en]=Interactive Path Planning Algorithm Demo
Exec=gnome-terminal -- bash -c "$LAUNCH_SCRIPT; exec bash"
Icon=$SCRIPT_DIR/icon.svg
Terminal=true
Categories=Development;Science;Education;
Keywords=路径规划;自动驾驶;算法;教学;
StartupNotify=true
DESKTOP_EOF

chmod +x "$DESKTOP_FILE"

# 标记为可信任
if command -v gio &> /dev/null; then
    gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null
fi

echo "✓ 桌面快捷方式创建完成"
echo ""

# 创建应用程序菜单项
APPLICATIONS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPLICATIONS_DIR"
cp "$DESKTOP_FILE" "$APPLICATIONS_DIR/"
echo "✓ 已添加到应用程序菜单"

echo ""
echo "=================================================="
echo "✅ 部署完成！"
echo ""
echo "使用方式："
echo "1. 双击桌面图标 '自动驾驶决策规划演示' 启动"
echo "2. 或在应用程序菜单中查找启动"
echo ""
echo "⚠️  重要提示："
echo "- 系统将在新终端窗口中启动"
echo "- 关闭终端窗口将自动停止所有服务"
echo "- 不会出现端口占用问题"
echo ""
echo "=================================================="
