#!/bin/bash

# 自动驾驶决策规划演示系统 - 一键安装脚本
# 功能：安装依赖、部署环境、创建桌面快捷方式

set -e  # 遇到错误立即退出

echo "🚗 自动驾驶决策规划演示系统 - 一键安装"
echo "=================================================="
echo ""

# 获取脚本所在的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$SCRIPT_DIR/demo"
DESKTOP_DIR="$HOME/Desktop"

# 检查Desktop目录
if [ ! -d "$DESKTOP_DIR" ]; then
    DESKTOP_DIR="$HOME/桌面"
fi

if [ ! -d "$DESKTOP_DIR" ]; then
    echo "❌ 错误: 未找到桌面目录"
    exit 1
fi

echo "✓ 项目目录: $SCRIPT_DIR"
echo "✓ 桌面目录: $DESKTOP_DIR"
echo ""

# ==================== 1. 系统依赖检查 ====================
echo "📋 步骤 1/5: 检查系统依赖"
echo "----------------------------------------"

# 检查操作系统
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✓ 操作系统: Linux"
    
    # 检测包管理器
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
    elif command -v pacman &> /dev/null; then
        PKG_MANAGER="pacman"
    else
        echo "❌ 未检测到支持的包管理器"
        exit 1
    fi
    echo "✓ 包管理器: $PKG_MANAGER"
else
    echo "❌ 仅支持 Linux 系统"
    exit 1
fi

# 检查Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ 未安装 Python3，正在安装..."
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv
    elif [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
        sudo $PKG_MANAGER install -y python3 python3-pip
    elif [ "$PKG_MANAGER" = "pacman" ]; then
        sudo pacman -S --noconfirm python python-pip
    fi
else
    echo "✓ Python3: $(python3 --version)"
fi

# 检查pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ 未安装 pip3，正在安装..."
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo apt-get install -y python3-pip
    else
        python3 -m ensurepip --upgrade
    fi
else
    echo "✓ pip3: $(pip3 --version)"
fi

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，正在安装..."
    if [ "$PKG_MANAGER" = "apt" ]; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        sudo $PKG_MANAGER install -y nodejs
    elif [ "$PKG_MANAGER" = "pacman" ]; then
        sudo pacman -S --noconfirm nodejs npm
    fi
else
    echo "✓ Node.js: $(node --version)"
    echo "✓ npm: $(npm --version)"
fi

echo ""

# ==================== 2. Python依赖安装 ====================
echo "📦 步骤 2/5: 安装Python依赖"
echo "----------------------------------------"

# 使用系统Python环境（不创建虚拟环境）
echo "✓ 使用系统Python环境"

# 升级pip
echo "升级pip..."
pip3 install --upgrade pip

# 安装demo后端依赖
if [ -f "$DEMO_DIR/backend/requirements.txt" ]; then
    echo "正在安装demo后端依赖..."
    pip3 install -r "$DEMO_DIR/backend/requirements.txt"
    echo "✓ demo后端依赖安装完成"
fi

# 安装主项目依赖
if [ -f "$SCRIPT_DIR/python_motion_planning/requirements.txt" ]; then
    echo "正在安装主项目依赖..."
    pip3 install -r "$SCRIPT_DIR/python_motion_planning/requirements.txt"
    echo "✓ 主项目依赖安装完成"
fi

# 安装主项目包
if [ -f "$SCRIPT_DIR/python_motion_planning/setup.py" ]; then
    echo "正在安装python_motion_planning包..."
    cd "$SCRIPT_DIR/python_motion_planning"
    pip3 install -e .
    cd "$SCRIPT_DIR"
    echo "✓ python_motion_planning包安装完成"
fi

echo ""

# ==================== 3. Node.js依赖安装 ====================
echo "📦 步骤 3/5: 安装Node.js依赖"
echo "----------------------------------------"

# 安装http-server
if ! command -v http-server &> /dev/null; then
    echo "正在安装http-server..."
    sudo npm install -g http-server
    echo "✓ http-server安装完成"
else
    echo "✓ http-server已安装"
fi

echo ""

# ==================== 4. 创建启动脚本 ====================
echo "📝 步骤 4/5: 创建启动脚本"
echo "----------------------------------------"

LAUNCH_SCRIPT="$DEMO_DIR/launch_demo.sh"

cat > "$LAUNCH_SCRIPT" << 'LAUNCH_EOF'
#!/bin/bash

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
LAUNCH_EOF

chmod +x "$LAUNCH_SCRIPT"
echo "✓ 启动脚本创建完成: $LAUNCH_SCRIPT"
echo ""

# ==================== 5. 创建桌面快捷方式 ====================
echo "🖥️  步骤 5/5: 创建桌面快捷方式"
echo "----------------------------------------"

# 创建图标文件（如果不存在）
ICON_FILE="$DEMO_DIR/icon.svg"
if [ ! -f "$ICON_FILE" ]; then
    echo "正在创建图标文件..."
    cat > "$ICON_FILE" << 'ICON_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="8" fill="#4CAF50"/>
  <path d="M 16 32 L 32 16 L 48 32 L 32 48 Z" fill="white" stroke="white" stroke-width="2"/>
  <circle cx="32" cy="32" r="4" fill="#FFC107"/>
  <path d="M 16 32 L 24 28" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <path d="M 40 28 L 48 32" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <path d="M 24 36 L 16 32" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <path d="M 48 32 L 40 36" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
ICON_EOF
    echo "✓ 图标文件已创建"
fi

# 创建Desktop文件
DESKTOP_FILE="$DESKTOP_DIR/MotionPlanningDemo.desktop"

cat > "$DESKTOP_FILE" << DESKTOP_EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=规划控制系统
Name[zh_CN]=轨迹规划控制系统
Name[en]=轨迹规划控制系统
Comment=交互式路径规划算法演示系统
Comment[zh_CN]=交互式路径规划算法演示系统
Comment[en]=Interactive Path Planning Algorithm Demo
Exec=gnome-terminal -- bash -c "$LAUNCH_SCRIPT; exec bash"
Icon=$ICON_FILE
Terminal=true
Categories=Development;Science;Education;
Keywords=路径规划;自动驾驶;算法;教学;planning;autonomous;
StartupNotify=true
Path=$DEMO_DIR
DESKTOP_EOF

chmod +x "$DESKTOP_FILE"

# 标记为可信任（针对GNOME桌面环境）
if command -v gio &> /dev/null; then
    gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null
    echo "✓ 桌面快捷方式已标记为可信任"
fi

echo "✓ 桌面快捷方式创建完成: MotionPlanningDemo.desktop"

# 创建应用程序菜单项
APPLICATIONS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPLICATIONS_DIR"
cp "$DESKTOP_FILE" "$APPLICATIONS_DIR/"
echo "✓ 已添加到应用程序菜单"

# 更新桌面数据库
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null
    echo "✓ 桌面数据库已更新"
fi

echo ""

# ==================== 安装完成 ====================
echo "=================================================="
echo "✅ 安装完成！"
echo "=================================================="
echo ""
echo "📋 安装摘要："
echo "  • Python环境: 系统环境 ($(python3 --version))"
echo "  • 启动脚本: $LAUNCH_SCRIPT"
echo "  • 桌面快捷方式: $DESKTOP_FILE"
echo "  • 应用菜单: 已添加"
echo ""
echo "🚀 使用方式："
echo "  1. 双击桌面图标 '规划控制系统' 启动"
echo "  2. 或在应用程序菜单中搜索并启动"
echo "  3. 或手动运行: bash $LAUNCH_SCRIPT"
echo ""
echo "🌐 访问地址："
echo "  • 前端界面: http://localhost:8080"
echo "  • 后端API: http://localhost:8000"
echo ""
echo "⚠️  重要提示："
echo "  • 系统将在新终端窗口中启动"
echo "  • 关闭终端窗口将自动停止所有服务"
echo "  • 日志文件保存在: $DEMO_DIR/logs/"
echo ""
echo "📖 更多信息："
echo "  • 查看文档: $DEMO_DIR/docs/"
echo "  • README: $DEMO_DIR/README.md"
echo ""
echo "=================================================="
echo "现在可以启动系统了！"
echo "=================================================="
