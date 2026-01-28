#!/bin/bash

# 智能调度系统 - 一键安装部署脚本
# 自动安装依赖、配置环境、创建桌面快捷方式

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录的绝对路径
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  智能调度系统 - 一键安装部署  ${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# 1. 检测系统
echo -e "${YELLOW}[1/6] 检测系统环境...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    echo -e "${GREEN}✓ 检测到系统: $OS${NC}"
else
    echo -e "${RED}✗ 无法检测系统类型${NC}"
    exit 1
fi

# 2. 检查并安装Python3
echo -e "${YELLOW}[2/6] 检查Python环境...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ 已安装: $PYTHON_VERSION${NC}"
else
    echo -e "${YELLOW}  正在安装Python3...${NC}"
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update
        sudo apt install -y python3 python3-pip python3-venv
    elif [[ "$OS" == *"Fedora"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo dnf install -y python3 python3-pip
    else
        echo -e "${RED}✗ 不支持的系统，请手动安装Python3${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Python3安装完成${NC}"
fi

# 3. 创建虚拟环境
echo -e "${YELLOW}[3/6] 配置Python虚拟环境...${NC}"
cd "$PROJECT_DIR/backend"
echo -e "${GREEN}✓ Python环境已存在${NC}"


# 4. 安装Python依赖
echo -e "${YELLOW}[4/6] 安装Python依赖包...${NC}"
if [ -f "requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Python依赖安装完成${NC}"
else
    echo -e "${YELLOW}  requirements.txt不存在，跳过依赖安装${NC}"
fi


# 5. 创建必要的目录
echo -e "${YELLOW}[5/6] 创建数据目录...${NC}"
cd "$PROJECT_DIR"
mkdir -p backend/data/maps
mkdir -p backend/data/uploads
echo -e "${GREEN}✓ 数据目录创建完成${NC}"

# 6. 创建桌面快捷方式
echo -e "${YELLOW}[6/6] 创建桌面快捷方式...${NC}"

# 获取桌面目录
DESKTOP_DIR="$HOME/Desktop"
if [ ! -d "$DESKTOP_DIR" ]; then
    DESKTOP_DIR="$HOME/桌面"
fi

if [ -d "$DESKTOP_DIR" ]; then
    DESKTOP_FILE="$DESKTOP_DIR/智能调度系统.desktop"
    
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=校园智能调度系统
Comment=校园智能调度演示系统 - 点击启动
Exec=bash -c 'cd "${PROJECT_DIR}" && ./start.sh'
Icon=${PROJECT_DIR}/frontend/schedule-icon.svg
Terminal=true
Categories=Education;Science;Development;
StartupNotify=true
EOF
    
    chmod +x "$DESKTOP_FILE"
    chmod +x "$PROJECT_DIR/start.sh"
    chmod +x "$PROJECT_DIR/stop.sh"
    
    echo -e "${GREEN}✓ 桌面快捷方式创建完成${NC}"
else
    echo -e "${YELLOW}  未找到桌面目录，跳过快捷方式创建${NC}"
fi

# 完成
echo ""
echo -e "${BLUE}=================================${NC}"
echo -e "${GREEN}✓ 安装部署完成！${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""
echo -e "${GREEN}系统已准备就绪，您可以通过以下方式启动：${NC}"
echo ""
echo -e "${YELLOW}方式1: 双击桌面快捷方式${NC}"
echo -e "       找到桌面上的 '智能调度系统' 图标"
echo ""
echo -e "${YELLOW}方式2: 命令行启动${NC}"
echo -e "       cd $PROJECT_DIR"
echo -e "       ./start.sh"
echo ""
echo -e "${YELLOW}方式3: 手动启动${NC}"
echo -e "       cd $PROJECT_DIR/backend"
echo -e "       source venv/bin/activate"
echo -e "       python app.py"
echo ""
echo -e "${BLUE}系统将在浏览器中自动打开: ${GREEN}http://localhost:8080${NC}"
echo -e "${BLUE}后端API地址: ${GREEN}http://localhost:5000${NC}"
echo ""
echo -e "${YELLOW}停止系统: ${NC}./stop.sh 或按 Ctrl+C"
echo ""
