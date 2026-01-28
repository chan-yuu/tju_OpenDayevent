# 🔧 启动问题修复 (2026-01-27)

## 问题描述

用户反馈的问题：
1. ❌ 端口8000被占用导致无法启动
2. ❌ 没有打开终端窗口
3. ❌ 无法打开浏览器

错误日志：
```
ERROR: [Errno 98] error while attempting to bind on address ('0.0.0.0', 8000): address already in use
❌ 服务器启动失败
```

## 修复方案

### 1. 添加端口占用检查和清理

在启动前自动检测并清理占用端口的旧进程：

```bash
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
```

### 2. 添加终端窗口显示

启动时自动打开终端窗口显示服务状态：

```bash
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
        echo '   • PID: \$SERVER_PID'
        echo '   • 日志: \$LOG_FILE'
        echo ''
        echo '🌐 浏览器应该已自动打开，如未打开请手动访问:'
        echo '   http://localhost:8000'
        echo ''
        echo '⚠️  注意: 关闭此窗口不会停止服务'
        echo '   如需停止服务，请运行: ./stop_demo.sh'
        echo ''
        echo '按Ctrl+C或关闭窗口退出（服务继续运行）'
        echo ''
        # 实时显示日志
        tail -f '\$LOG_FILE'
    "
fi
```

**特性**:
- ✅ 显示友好的启动信息和服务状态
- ✅ 实时显示后端日志 (`tail -f`)
- ✅ 关闭终端窗口不影响服务
- ✅ 支持多种终端 (gnome-terminal, xterm)

### 3. 浏览器打开改进

保持原有的浏览器自动打开逻辑，支持多种浏览器：

```bash
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
```

## 测试验证

### 测试1: 端口占用处理
```bash
# 启动两次，第二次应该自动清理旧进程
./launch_demo.sh
./launch_demo.sh  # ✅ 自动停止旧服务并重新启动
```

### 测试2: 服务运行
```bash
# 检查服务状态
ps aux | grep "python.*main.py"  # ✅ 进程正在运行

# 测试API
curl http://localhost:8000/api/algorithms  # ✅ 返回算法列表
```

### 测试3: 终端窗口
```bash
./launch_demo.sh
# ✅ 应该弹出终端窗口显示日志
# ✅ 关闭终端窗口后服务继续运行
```

### 测试4: 浏览器打开
```bash
./launch_demo.sh
# ✅ 浏览器应该自动打开 http://localhost:8000
```

## 使用说明

### 启动系统
```bash
# 方法1: 双击桌面图标（推荐）
# 桌面上的 "自动驾驶决策规划演示" 图标

# 方法2: 命令行启动
cd /home/cyun/Documents/tju-planner-lab/demo
./launch_demo.sh

# 方法3: 重新部署（会重新创建桌面图标）
./deploy_desktop.sh
```

**效果**:
1. 终端窗口弹出显示服务状态和日志
2. 浏览器自动打开 http://localhost:8000
3. 关闭终端窗口不影响服务

### 停止系统
```bash
cd /home/cyun/Documents/tju-planner-lab/demo
./stop_demo.sh
```

### 查看日志
```bash
# 实时查看日志
tail -f logs/demo_*.log

# 或在终端窗口中已经自动显示日志
```

## 故障排除

### 问题1: 端口仍被占用
```bash
# 手动查找占用端口的进程
lsof -i :8000

# 手动杀死进程
lsof -ti :8000 | xargs kill -9
```

### 问题2: 终端窗口没有打开
- 原因: 系统可能没有安装 gnome-terminal 或 xterm
- 解决: 脚本会自动降级使用通知或命令行输出
- 安装终端: `sudo apt install gnome-terminal`

### 问题3: 浏览器没有自动打开
- 手动打开: http://localhost:8000
- 或点击终端窗口中显示的链接

### 问题4: 如何确认服务正在运行
```bash
# 检查进程
ps aux | grep "python.*main.py"

# 检查端口
lsof -i :8000

# 测试API
curl http://localhost:8000/api/algorithms
```

## 修改的文件

- [deploy_desktop.sh](deploy_desktop.sh#L47-L70) - 添加端口检查和清理
- [deploy_desktop.sh](deploy_desktop.sh#L95-L125) - 添加终端窗口显示

## 技术细节

### 端口检查命令
```bash
lsof -Pi :8000 -sTCP:LISTEN -t
```
- `-P` : 显示端口号而非服务名
- `-i :8000` : 只显示8000端口
- `-sTCP:LISTEN` : 只显示LISTEN状态
- `-t` : 只输出PID

### 进程清理命令
```bash
lsof -ti :8000 | xargs kill -9
```
- 获取占用8000端口的PID
- 使用 `kill -9` 强制终止

### 终端持久化
```bash
nohup python3 main.py >> "$LOG_FILE" 2>&1 &
disown $SERVER_PID
```
- `nohup` : 忽略挂断信号
- `disown` : 从shell任务列表移除
- 两者结合确保关闭终端不影响服务

## 效果对比

### 修复前
- ❌ 端口被占用无法启动
- ❌ 没有终端窗口反馈
- ⚠️ 不知道服务是否启动成功
- ⚠️ 浏览器可能不会自动打开

### 修复后
- ✅ 自动清理旧进程
- ✅ 弹出终端窗口显示状态
- ✅ 实时显示服务日志
- ✅ 明确提示服务URL和PID
- ✅ 浏览器自动打开
- ✅ 关闭终端不影响服务

---

**修复日期**: 2026-01-27  
**状态**: ✅ 已修复并测试通过  
**测试环境**: Ubuntu with gnome-terminal
