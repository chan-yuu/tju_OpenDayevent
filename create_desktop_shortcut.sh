#!/bin/bash

# 智能调度系统 - 桌面快捷方式创建脚本
# 单独创建桌面快捷方式（不安装依赖）

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 获取脚本所在目录的绝对路径
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${YELLOW}正在创建桌面快捷方式...${NC}"

# 获取桌面目录
DESKTOP_DIR="$HOME/Desktop"
if [ ! -d "$DESKTOP_DIR" ]; then
    DESKTOP_DIR="$HOME/桌面"
fi

# 如果桌面目录不存在，退出
if [ ! -d "$DESKTOP_DIR" ]; then
    echo -e "${RED}✗ 错误: 找不到桌面目录${NC}"
    exit 1
fi

# 创建.desktop文件
DESKTOP_FILE="$DESKTOP_DIR/智能调度系统.desktop"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=智能调度系统
Comment=校园智能调度演示系统 - 点击启动
Exec=bash -c 'cd "${PROJECT_DIR}" && ./start.sh'
Icon=${PROJECT_DIR}/frontend/schedule-icon.svg
Terminal=true
Categories=Education;Science;Development;
StartupNotify=true
EOF

# 设置可执行权限
chmod +x "$DESKTOP_FILE"
chmod +x "$PROJECT_DIR/start.sh"
chmod +x "$PROJECT_DIR/stop.sh"

echo -e "${GREEN}✓ 桌面快捷方式已创建: $DESKTOP_FILE${NC}"
echo -e "${GREEN}✓ 双击桌面图标即可启动系统${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo -e "  如果首次使用，请先运行: ${GREEN}./install.sh${NC}"
echo -e "  以安装必要的依赖环境"
