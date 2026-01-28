#!/bin/bash

################################################################################
# AI Vision Lab - 一键安装脚本
# 功能：自动安装所有依赖，配置环境，创建桌面快捷方式
# 作者：天津大学视觉实验室
# 日期：2026-01-27
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="$HOME/Desktop"
DESKTOP_FILE="AI-Vision-Lab.desktop"

# 打印带颜色的消息
print_msg() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🤖 AI Vision Lab - 一键安装程序${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo ""
    print_msg "📦 $1" "$BLUE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_success() {
    print_msg "✅ $1" "$GREEN"
}

print_error() {
    print_msg "❌ 错误: $1" "$RED"
}

print_warning() {
    print_msg "⚠️  警告: $1" "$YELLOW"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查系统要求
check_system_requirements() {
    print_step "检查系统环境"
    
    # 检查操作系统
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_error "此脚本仅支持 Linux 系统"
        exit 1
    fi
    print_success "操作系统: Linux"
    
    # 检查是否有 root 权限（用于系统包安装）
    if [[ $EUID -eq 0 ]]; then
        print_warning "不建议使用 root 用户运行此脚本"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "系统检查完成"
}

# 检查并安装 Node.js
install_nodejs() {
    print_step "检查 Node.js 环境"
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否符合要求 (>= 16.0.0)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            print_warning "Node.js 版本过低（需要 >= 16.0.0），建议升级"
        fi
    else
        print_warning "未检测到 Node.js"
        print_msg "开始安装 Node.js..." "$YELLOW"
        
        # 尝试使用包管理器安装
        if command_exists apt-get; then
            # Ubuntu/Debian
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            # CentOS/RHEL
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        elif command_exists dnf; then
            # Fedora
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo dnf install -y nodejs
        else
            print_error "无法自动安装 Node.js，请手动安装后重试"
            print_msg "访问: https://nodejs.org/" "$CYAN"
            exit 1
        fi
        
        if command_exists node; then
            print_success "Node.js 安装成功: $(node --version)"
        else
            print_error "Node.js 安装失败"
            exit 1
        fi
    fi
    
    # 检查 npm
    if command_exists npm; then
        print_success "npm 已安装: $(npm --version)"
    else
        print_error "npm 未安装"
        exit 1
    fi
}

# 检查并安装 Python
install_python() {
    print_step "检查 Python 环境"
    
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python3 已安装: $PYTHON_VERSION"
        
        # 检查版本是否符合要求 (>= 3.8)
        PYTHON_MINOR=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f2)
        if [ "$PYTHON_MINOR" -lt 8 ]; then
            print_warning "Python 版本过低（需要 >= 3.8），建议升级"
        fi
    else
        print_warning "未检测到 Python3"
        print_msg "开始安装 Python3..." "$YELLOW"
        
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv
        elif command_exists yum; then
            sudo yum install -y python3 python3-pip
        elif command_exists dnf; then
            sudo dnf install -y python3 python3-pip
        else
            print_error "无法自动安装 Python3，请手动安装后重试"
            exit 1
        fi
        
        if command_exists python3; then
            print_success "Python3 安装成功: $(python3 --version)"
        else
            print_error "Python3 安装失败"
            exit 1
        fi
    fi
    
    # 检查 pip
    if command_exists pip3; then
        print_success "pip3 已安装: $(pip3 --version)"
    else
        print_error "pip3 未安装"
        exit 1
    fi
}

# 安装前端依赖
install_frontend_dependencies() {
    print_step "安装前端依赖"
    
    cd "$PROJECT_ROOT"
    
    if [ -f "package.json" ]; then
        print_msg "正在安装 npm 包..." "$YELLOW"
        npm install
        print_success "前端依赖安装完成"
    else
        print_error "未找到 package.json 文件"
        exit 1
    fi
}

# 安装后端依赖
install_backend_dependencies() {
    print_step "安装后端依赖"
    
    cd "$PROJECT_ROOT/backend"
    
    if [ -f "requirements.txt" ]; then
        print_msg "正在安装 Python 包..." "$YELLOW"
        pip3 install -r requirements.txt
        print_success "后端依赖安装完成"
    else
        print_error "未找到 requirements.txt 文件"
        exit 1
    fi
}

grep -qxF 'export PATH="$HOME/.local/bin:$PATH"' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc


# 创建必要的目录
create_directories() {
    print_step "创建必要的目录"
    
    cd "$PROJECT_ROOT"
    
    mkdir -p logs
    mkdir -p dataset/images
    mkdir -p dataset/labels
    mkdir -p backend/runs/detect
    
    print_success "目录创建完成"
}

# 创建桌面快捷方式
create_desktop_shortcut() {
    print_step "创建桌面快捷方式"
    
    # 确保桌面目录存在
    if [ ! -d "$DESKTOP_DIR" ]; then
        mkdir -p "$DESKTOP_DIR"
    fi
    
    # 复制 desktop 文件到桌面
    DESKTOP_SOURCE="$PROJECT_ROOT/scripts/$DESKTOP_FILE"
    DESKTOP_TARGET="$DESKTOP_DIR/$DESKTOP_FILE"
    
    if [ ! -f "$DESKTOP_SOURCE" ]; then
        print_error "未找到 desktop 文件: $DESKTOP_SOURCE"
        return
    fi
    
    # 更新 desktop 文件中的路径
    sed "s|Exec=.*|Exec=$PROJECT_ROOT/scripts/start.sh|g" "$DESKTOP_SOURCE" > "$DESKTOP_TARGET"
    sed -i "s|Icon=.*|Icon=$PROJECT_ROOT/assets/icon.png|g" "$DESKTOP_TARGET"
    sed -i "s|Path=.*|Path=$PROJECT_ROOT|g" "$DESKTOP_TARGET"
    
    # 设置可执行权限
    chmod +x "$DESKTOP_TARGET"
    chmod +x "$PROJECT_ROOT/scripts/start.sh"
    chmod +x "$PROJECT_ROOT/scripts/stop.sh"
    
    # 如果是 Ubuntu/GNOME，需要信任 desktop 文件
    if command_exists gio; then
        gio set "$DESKTOP_TARGET" "metadata::trusted" true 2>/dev/null || true
    fi
    
    print_success "桌面快捷方式已创建: $DESKTOP_TARGET"
}

# 验证安装
verify_installation() {
    print_step "验证安装"
    
    cd "$PROJECT_ROOT"
    
    # 检查前端依赖
    if [ -d "node_modules" ]; then
        print_success "前端依赖已安装"
    else
        print_warning "前端依赖可能未正确安装"
    fi
    
    # 检查后端依赖
    if python3 -c "import fastapi, ultralytics" 2>/dev/null; then
        print_success "后端依赖已安装"
    else
        print_warning "后端依赖可能未完全安装"
    fi
    
    # 检查桌面快捷方式
    if [ -f "$DESKTOP_DIR/$DESKTOP_FILE" ]; then
        print_success "桌面快捷方式已创建"
    else
        print_warning "桌面快捷方式未创建"
    fi
}

# 打印完成信息
print_completion() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  🎉 安装完成！${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    print_msg "📚 项目结构文档: PROJECT_STRUCTURE.md" "$CYAN"
    print_msg "📖 快速开始指南: docs/QUICKSTART.md" "$CYAN"
    print_msg "🔧 故障排除指南: docs/TROUBLESHOOTING.md" "$CYAN"
    echo ""
    print_msg "🚀 启动方式：" "$YELLOW"
    echo -e "   ${GREEN}1.${NC} 双击桌面上的 ${CYAN}'AI Vision Lab'${NC} 图标"
    echo -e "   ${GREEN}2.${NC} 或运行命令: ${CYAN}./scripts/start.sh${NC}"
    echo ""
    print_msg "🌐 访问地址：" "$YELLOW"
    echo -e "   前端: ${CYAN}http://localhost:3000${NC}"
    echo -e "   后端: ${CYAN}http://localhost:8000${NC}"
    echo -e "   API文档: ${CYAN}http://localhost:8000/docs${NC}"
    echo ""
    print_msg "⚠️  首次运行可能需要下载 YOLOv8 模型，请保持网络连接" "$YELLOW"
    echo ""
}

# 主函数
main() {
    print_header
    
    # 检查系统要求
    check_system_requirements
    
    # 安装 Node.js
    install_nodejs
    
    # 安装 Python
    install_python
    
    # 安装前端依赖
    install_frontend_dependencies
    
    # 安装后端依赖
    install_backend_dependencies
    
    # 创建目录
    create_directories
    
    # 创建桌面快捷方式
    create_desktop_shortcut
    
    # 验证安装
    verify_installation
    
    # 打印完成信息
    print_completion
}

# 运行主函数
main
