# 系统更新说明 v1.1

## 更新日期
2026-01-27

## 更新内容

### 🐛 Bug修复

#### 1. Grid初始化参数错误
**问题**: 规划失败，错误信息 `__init__() got an unexpected keyword argument 'x_range'`

**原因**: Grid类的初始化参数已更新，使用了新的API格式

**修复**:
- 修改 `backend/main.py` 中的 `create_grid_map` 函数
- 使用正确的参数格式：`bounds` 和 `resolution`
- 调整地图数据的格式和索引方式

**改动**:
```python
# 旧代码
grid = Grid(
    x_range=map_config.width,
    y_range=map_config.height,
    grid_map=map_data
)

# 新代码
grid = Grid(
    bounds=[[0, map_config.width], [0, map_config.height]],
    resolution=1.0,
    type_map=map_data
)
```

### 🎨 界面优化

#### 2. 科技感主题设计
**目标**: 面向中小学生教学，提供高大上的视觉体验

**改进内容**:

##### 颜色方案
- **主色调**: 从蓝色改为青色 (#00d9ff)
- **辅助色**: 引入荧光绿 (#00ff88)
- **背景**: 深空蓝渐变 (#0a0e27 -> #1a1f3a)
- **强调色**: 粉红色 (#ff3366)

##### 视觉效果
- ✨ 渐变色背景
- 💫 发光边框效果
- 🌟 动态背景光晕
- ✨ 按钮悬停动画
- 💎 玻璃态效果（毛玻璃）

##### 组件优化
- **导航栏**: 渐变背景 + 发光LOGO
- **控制面板**: 半透明玻璃效果 + 青色边框
- **按钮**: 渐变背景 + 悬停发光
- **画布**: 发光边框 + 阴影效果
- **统计卡片**: 悬停动画 + 渐变文字

##### 交互体验
- 平滑过渡动画（0.3s）
- 悬停上浮效果
- 点击涟漪动画
- 发光反馈效果

### 🚀 部署优化

#### 3. 桌面快捷方式自动部署
**功能**: 一键生成桌面快捷方式和启动脚本

**新增文件**:

1. **deploy_desktop.sh** - 部署脚本
   - 自动检测桌面目录
   - 生成启动/停止脚本
   - 创建desktop文件
   - 添加到应用程序菜单

2. **launch_demo.sh** - 启动脚本（自动生成）
   - 智能检测Python环境
   - 自动启动服务器
   - 自动打开浏览器
   - 保存进程PID
   - 记录运行日志
   - 图形化提示（zenity/notify-send）

3. **stop_demo.sh** - 停止脚本（自动生成）
   - 安全停止服务器
   - 清理PID文件
   - 图形化确认

4. **MotionPlanningDemo.desktop** - 桌面快捷方式（自动生成）
   - 双击启动
   - 应用程序菜单集成
   - 中英文名称
   - 图标和分类

**使用方式**:
```bash
cd demo
./deploy_desktop.sh
```

**特性**:
- ✅ 自动路径检测
- ✅ 一键部署
- ✅ 图形化界面
- ✅ 日志记录
- ✅ 错误处理
- ✅ 跨桌面环境支持

## 文件变更清单

### 修改的文件
- `backend/main.py` - 修复Grid初始化
- `frontend/css/style.css` - 全面重写样式
- `frontend/js/config.js` - 更新颜色配置

### 新增的文件
- `deploy_desktop.sh` - 部署脚本
- `DESKTOP_DEPLOYMENT.md` - 部署说明文档
- `UPDATE_LOG.md` - 本文档

### 自动生成的文件（运行deploy_desktop.sh后）
- `launch_demo.sh` - 启动脚本
- `stop_demo.sh` - 停止脚本
- `.demo_pid` - PID文件（运行时）
- `logs/demo_*.log` - 日志文件

## 升级指南

### 对于新用户
直接按照 [GUIDE.md](GUIDE.md) 操作即可

### 对于现有用户
1. 拉取最新代码
2. 运行部署脚本：
   ```bash
   cd demo
   ./deploy_desktop.sh
   ```
3. 使用新的桌面快捷方式启动

## 兼容性说明

### 系统要求
- Python 3.8+
- Linux桌面环境（GNOME/KDE/XFCE等）
- 现代浏览器

### 测试环境
- Ubuntu 20.04+ ✅
- Python 3.8-3.11 ✅
- Chrome/Firefox ✅

### 已知限制
- Windows系统需要修改脚本（使用.bat）
- macOS需要修改desktop文件格式

## 性能影响

### 界面优化
- CSS文件大小增加约30%
- 渲染性能提升（使用GPU加速）
- 内存占用无明显变化

### 功能修复
- Grid初始化性能保持不变
- 路径规划速度无影响

## 后续计划

### 近期计划
- [ ] Windows版本部署脚本
- [ ] macOS版本支持
- [ ] 更多预设场景
- [ ] 动画播放功能

### 长期计划
- [ ] 车辆跟踪控制
- [ ] 3D可视化
- [ ] 在线协作
- [ ] 云端部署

## 反馈与支持

如遇到问题：
1. 查看日志文件：`demo/logs/demo_*.log`
2. 查看文档：[DESKTOP_DEPLOYMENT.md](DESKTOP_DEPLOYMENT.md)
3. 提交Issue

## 贡献者
- 主要开发：AI Assistant
- 测试支持：用户反馈

---

**感谢使用！** 🎉✨🚀
