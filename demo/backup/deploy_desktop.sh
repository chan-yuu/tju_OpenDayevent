#!/bin/bash

# 自动驾驶决策规划演示系统 - 桌面快捷方式部署脚本

echo "🚗 自动驾驶决策规划演示系统 - 桌面快捷方式部署"
echo "=================================================="
echo ""

# 获取当前脚本所在的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
DESKTOP_DIR="$HOME/Desktop"

# 检查Desktop目录
if [ ! -d "$DESKTOP_DIR" ]; then
    DESKTOP_DIR="$HOME/桌面"
fi

if [ ! -d "$DESKTOP_DIR" ]; then
    echo "❌ 错误: 未找到桌面目录"
    echo "请手动指定桌面路径，或者使用以下命令："
    echo "  DESKTOP_DIR=/path/to/desktop ./deploy_desktop.sh"
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
BACKEND_DIR="$SCRIPT_DIR/backend"

# 创建日志目录
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/demo_$(date +%Y%m%d_%H%M%S).log"

# 启动函数
start_demo() {
    echo "🚗 启动自动驾驶决策规划演示系统..."
    echo "项目目录: $SCRIPT_DIR"
    echo "日志文件: $LOG_FILE"
    echo ""
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        zenity --error --text="未找到Python3\n请先安装Python 3.8或更高版本" --width=300 2>/dev/null || \
        xmessage -center "未找到Python3，请先安装Python 3.8或更高版本" 2>/dev/null || \
        echo "❌ 错误: 未找到Python3"
        exit 1
    fi
    
    # 检查端口8000是否被占用
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  端口8000已被占用，正在停止旧服务..."
        # 杀死占用端口的进程
        lsof -ti :8000 | xargs kill -9 2>/dev/null
        sleep 2
        echo "✓ 旧服务已停止"
    fi
    
    # 清理旧的PID文件
    if [ -f "$SCRIPT_DIR/.demo_pid" ]; then
        OLD_PID=$(cat "$SCRIPT_DIR/.demo_pid")
        if ps -p $OLD_PID > /dev/null 2>&1; then
            echo "停止旧进程 (PID: $OLD_PID)..."
            kill $OLD_PID 2>/dev/null
            sleep 1
        fi
        rm "$SCRIPT_DIR/.demo_pid"
    fi
    
    # 切换到后端目录
    cd "$BACKEND_DIR" || exit 1
    
    # 启动服务器（使用nohup确保后台运行，不依赖终端）
    echo "启动服务器..." | tee -a "$LOG_FILE"
    nohup python3 main.py >> "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    # 从shell任务列表中移除，关闭终端不影响
    disown $SERVER_PID
    
    # 保存PID
    echo $SERVER_PID > "$SCRIPT_DIR/.demo_pid"
    
    # 等待服务器启动
    sleep 3
    
    # 检查服务器是否启动成功
    if ps -p $SERVER_PID > /dev/null; then
        echo "✓ 服务器启动成功 (PID: $SERVER_PID)" | tee -a "$LOG_FILE"
        echo "✓ 服务已在后台运行，关闭终端不影响服务" | tee -a "$LOG_FILE"
        
        # 打开浏览器
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:8000 2>/dev/null &
        elif command -v gnome-open &> /dev/null; then
            gnome-open http://localhost:8000 2>/dev/null &
        elif command -v firefox &> /dev/null; then
            firefox http://localhost:8000 2>/dev/null &
        elif command -v google-chrome &> /dev/null; then
            google-chrome http://localhost:8000 2>/dev/null &
        fi
        
        # 显示成功消息（在终端窗口中）
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="自动驾驶规划演示系统" -- bash -c "
                echo '╔═══════════════════════════════════════════════════════════════╗'
                echo '║     🚗 智能车路径规划与控制系统 - 运行中             ║'
                echo '╚═══════════════════════════════════════════════════════════════╝'
                echo ''
                echo '✅ 服务已启动成功！'
                echo ''
                echo '📊 服务信息:'
                echo '   • URL: http://localhost:8000'
                echo '   • PID: $SERVER_PID'
                echo '   • 日志: $LOG_FILE'
                echo ''
                echo '🌐 浏览器应该已自动打开，如未打开请手动访问:'
                echo '   http://localhost:8000'
                echo ''
                echo '⚠️  注意: 关闭此窗口不会停止服务'
                echo '   如需停止服务，请运行: ./stop_demo.sh'
                echo ''
                echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                echo ''
                echo '按Ctrl+C或关闭窗口退出（服务继续运行）'
                echo ''
                # 保持终端打开
                tail -f '$LOG_FILE'
            " 2>/dev/null &
        elif command -v xterm &> /dev/null; then
            xterm -T "自动驾驶规划演示系统" -e "
                echo '系统已启动 - http://localhost:8000';
                echo '按Ctrl+C关闭窗口（服务继续运行）';
                tail -f '$LOG_FILE'
            " 2>/dev/null &
        else
            # 无图形终端，使用通知
            zenity --info --text="✓ 系统启动成功！\n\n浏览器将自动打开\n访问: http://localhost:8000\n\n服务在后台运行" --width=350 2>/dev/null || \
            notify-send "自动驾驶决策规划系统" "启动成功！访问 http://localhost:8000" 2>/dev/null || \
            echo "✓ 系统启动成功！访问 http://localhost:8000"
        fi
    else
        echo "❌ 服务器启动失败" | tee -a "$LOG_FILE"
        zenity --error --text="服务器启动失败\n请查看日志文件:\n$LOG_FILE" --width=400 2>/dev/null || \
        echo "❌ 服务器启动失败，查看日志: $LOG_FILE"
        exit 1
    fi
}

# 停止函数
stop_demo() {
    if [ -f "$SCRIPT_DIR/.demo_pid" ]; then
        SERVER_PID=$(cat "$SCRIPT_DIR/.demo_pid")
        if ps -p $SERVER_PID > /dev/null; then
            echo "停止服务器 (PID: $SERVER_PID)..."
            kill $SERVER_PID
            rm "$SCRIPT_DIR/.demo_pid"
            echo "✓ 服务器已停止"
        else
            echo "服务器未运行"
            rm "$SCRIPT_DIR/.demo_pid"
        fi
    else
        echo "未找到运行中的服务器"
    fi
}

# 主程序
case "${1:-start}" in
    start)
        start_demo
        ;;
    stop)
        stop_demo
        ;;
    restart)
        stop_demo
        sleep 2
        start_demo
        ;;
    *)
        echo "用法: $0 {start|stop|restart}"
        exit 1
        ;;
esac
LAUNCH_EOF

chmod +x "$LAUNCH_SCRIPT"
echo "✓ 启动脚本创建完成: $LAUNCH_SCRIPT"
echo ""

# 创建停止脚本
STOP_SCRIPT="$SCRIPT_DIR/stop_demo.sh"
echo "📝 创建停止脚本..."

cat > "$STOP_SCRIPT" << 'STOP_EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/.demo_pid" ]; then
    SERVER_PID=$(cat "$SCRIPT_DIR/.demo_pid")
    if ps -p $SERVER_PID > /dev/null; then
        echo "停止服务器 (PID: $SERVER_PID)..."
        kill $SERVER_PID
        rm "$SCRIPT_DIR/.demo_pid"
        
        zenity --info --text="✓ 服务器已停止" --width=250 2>/dev/null || \
        notify-send "自动驾驶决策规划系统" "服务器已停止" 2>/dev/null || \
        echo "✓ 服务器已停止"
    else
        echo "服务器未运行"
        rm "$SCRIPT_DIR/.demo_pid"
    fi
else
    echo "未找到运行中的服务器"
    zenity --info --text="未找到运行中的服务器" --width=250 2>/dev/null || \
    echo "未找到运行中的服务器"
fi
STOP_EOF

chmod +x "$STOP_SCRIPT"
echo "✓ 停止脚本创建完成: $STOP_SCRIPT"
echo ""

# 创建Desktop文件
DESKTOP_FILE="$DESKTOP_DIR/MotionPlanningDemo.desktop"
echo "📝 创建桌面快捷方式..."

cat > "$DESKTOP_FILE" << DESKTOP_EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=自动驾驶决策规划演示
Name[en]=Motion Planning Demo
Comment=交互式路径规划算法演示系统
Comment[en]=Interactive Path Planning Algorithm Demo
Exec=gnome-terminal -- bash -c "cd $SCRIPT_DIR && $LAUNCH_SCRIPT; exec bash"
Icon=$SCRIPT_DIR/icon.svg
Terminal=true
Categories=Development;Science;Education;
Keywords=路径规划;自动驾驶;算法;教学;
StartupNotify=true
DESKTOP_EOF

chmod +x "$DESKTOP_FILE"

# 如果是Ubuntu/GNOME，标记为可信任
if command -v gio &> /dev/null; then
    gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null
fi

echo "✓ 桌面快捷方式创建完成: $DESKTOP_FILE"
echo ""

# 创建应用程序菜单项（可选）
APPLICATIONS_DIR="$HOME/.local/share/applications"
if [ -d "$APPLICATIONS_DIR" ]; then
    cp "$DESKTOP_FILE" "$APPLICATIONS_DIR/"
    echo "✓ 已添加到应用程序菜单"
else
    mkdir -p "$APPLICATIONS_DIR"
    cp "$DESKTOP_FILE" "$APPLICATIONS_DIR/"
    echo "✓ 已添加到应用程序菜单"
fi

echo ""
echo "=================================================="
echo "✅ 部署完成！"
echo ""
echo "使用方式："
echo "1. 双击桌面图标 '自动驾驶决策规划演示' 启动"
echo "2. 或在应用程序菜单中查找启动"
echo "3. 或运行命令: $LAUNCH_SCRIPT"
echo ""
echo "停止服务："
echo "1. 运行: $STOP_SCRIPT"
echo "2. 或按 Ctrl+C（如果在终端中运行）"
echo ""
echo "日志目录: $SCRIPT_DIR/logs"
echo "=================================================="
echo ""

# 询问是否立即启动
read -p "是否立即启动系统？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$LAUNCH_SCRIPT"
fi
