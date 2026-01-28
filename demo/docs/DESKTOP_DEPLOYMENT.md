# 桌面快捷方式部署说明

## 🚀 快速部署

### 自动部署（推荐）
```bash
cd /home/cyun/Documents/tju-planner-lab/demo
./deploy_desktop.sh
```

脚本会自动：
1. ✅ 创建启动脚本
2. ✅ 创建停止脚本
3. ✅ 生成桌面快捷方式
4. ✅ 添加到应用程序菜单
5. ✅ 询问是否立即启动

## 📝 生成的文件

部署完成后会生成以下文件：

### 1. launch_demo.sh
**位置**: `demo/launch_demo.sh`  
**功能**: 启动演示系统的主脚本

**用法**:
```bash
./launch_demo.sh          # 启动
./launch_demo.sh start    # 启动
./launch_demo.sh stop     # 停止
./launch_demo.sh restart  # 重启
```

### 2. stop_demo.sh
**位置**: `demo/stop_demo.sh`  
**功能**: 快速停止服务器

**用法**:
```bash
./stop_demo.sh
```

### 3. MotionPlanningDemo.desktop
**位置**: 
- 桌面: `~/Desktop/MotionPlanningDemo.desktop`
- 应用菜单: `~/.local/share/applications/MotionPlanningDemo.desktop`

**功能**: 桌面快捷方式，双击启动

## 🎮 使用方式

### 方式一：双击桌面图标
1. 在桌面找到"自动驾驶决策规划演示"图标
2. 双击图标
3. 系统自动启动并打开浏览器

### 方式二：应用程序菜单
1. 打开应用程序菜单
2. 搜索"自动驾驶决策规划"
3. 点击启动

### 方式三：命令行
```bash
cd /home/cyun/Documents/tju-planner-lab/demo
./launch_demo.sh
```

## 🛑 停止服务

### 方式一：使用停止脚本
```bash
cd /home/cyun/Documents/tju-planner-lab/demo
./stop_demo.sh
```

### 方式二：终端命令
如果在终端运行，按 `Ctrl+C`

### 方式三：查找并终止进程
```bash
# 查找进程
ps aux | grep "python.*main.py"

# 终止进程
kill <PID>
```

## 📊 日志查看

日志文件位置：`demo/logs/`

每次启动会创建新的日志文件：
```
demo_20260127_143052.log
```

查看日志：
```bash
cd /home/cyun/Documents/tju-planner-lab/demo/logs
tail -f demo_*.log
```

## 🔧 故障排除

### 问题1: 双击图标没反应
**解决方案**:
```bash
# 1. 检查文件权限
ls -l ~/Desktop/MotionPlanningDemo.desktop

# 2. 添加执行权限
chmod +x ~/Desktop/MotionPlanningDemo.desktop

# 3. 标记为可信任（Ubuntu/GNOME）
gio set ~/Desktop/MotionPlanningDemo.desktop metadata::trusted true
```

### 问题2: 端口已被占用
```bash
# 查找占用8000端口的进程
lsof -i :8000

# 终止进程
kill <PID>

# 或使用stop脚本
./stop_demo.sh
```

### 问题3: Python未找到
```bash
# 检查Python
which python3
python3 --version

# 安装Python（Ubuntu）
sudo apt install python3 python3-pip
```

### 问题4: 浏览器未自动打开
**手动打开**: http://localhost:8000

或修改 `launch_demo.sh` 中的浏览器命令

## 🎯 功能特性

### 自动化功能
- ✅ 自动检测Python环境
- ✅ 自动启动服务器
- ✅ 自动打开浏览器
- ✅ 自动记录日志
- ✅ 自动保存PID

### 用户友好
- ✅ 图形化提示（使用zenity）
- ✅ 桌面通知（使用notify-send）
- ✅ 双击启动
- ✅ 应用菜单集成

### 系统集成
- ✅ 支持GNOME桌面
- ✅ 支持KDE桌面
- ✅ 支持其他Linux桌面环境
- ✅ 自适应桌面目录

## 📱 界面优化

新界面采用科技感设计，特点：

### 视觉效果
- 🎨 深色科技主题
- ✨ 渐变色彩方案
- 💫 发光特效
- 🌈 动态背景

### 颜色方案
- **主色调**: 青色 (#00d9ff)
- **辅助色**: 绿色 (#00ff88)
- **强调色**: 粉红 (#ff3366)
- **背景色**: 深蓝 (#0a0e27)

### 交互效果
- 悬停动画
- 按钮发光
- 平滑过渡
- 阴影效果

## 🎓 教学应用

### 适合年龄
- 小学高年级（5-6年级）
- 初中生
- 高中生

### 教学场景
1. **算法教学** - 直观展示算法原理
2. **互动演示** - 学生动手操作
3. **对比学习** - 多算法性能对比
4. **项目实践** - 编程实践项目

### 教学建议
1. 从预设场景开始
2. 逐步增加复杂度
3. 引导学生对比算法
4. 鼓励自定义地图

## 📚 相关文档

- [README.md](README.md) - 项目主文档
- [GUIDE.md](GUIDE.md) - 使用指南
- [INSTALL.md](INSTALL.md) - 安装指南
- [API.md](API.md) - API文档

## 🆘 获取帮助

### 查看日志
```bash
cd demo/logs
cat demo_*.log
```

### 测试脚本
```bash
# 测试启动脚本
./launch_demo.sh

# 测试停止脚本
./stop_demo.sh
```

### 检查进程
```bash
# 查看是否运行
ps aux | grep python.*main.py

# 查看PID文件
cat .demo_pid
```

## 🎉 快速开始

```bash
# 1. 进入demo目录
cd /home/cyun/Documents/tju-planner-lab/demo

# 2. 运行部署脚本
./deploy_desktop.sh

# 3. 根据提示操作
# 4. 双击桌面图标启动！
```

---

**享受教学演示！** 🚀📚🎓
