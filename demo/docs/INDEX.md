# 🚗 自动驾驶决策规划演示系统

## 项目完成情况

✅ **项目已完成并可正常运行**

系统已成功搭建，集成了10种路径规划算法，提供完整的Web交互界面。

---

## 📚 文档导航

| 文档 | 说明 | 路径 |
|------|------|------|
| **README.md** | 项目主文档 | [README.md](README.md) |
| **GUIDE.md** | 快速使用指南 | [GUIDE.md](GUIDE.md) |
| **INSTALL.md** | 安装部署指南 | [INSTALL.md](INSTALL.md) |
| **API.md** | API接口文档 | [API.md](API.md) |
| **PROJECT_SUMMARY.md** | 项目总结 | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |
| **SCREENSHOTS.md** | 界面说明 | [SCREENSHOTS.md](SCREENSHOTS.md) |

---

## 🚀 快速开始

### 一键启动
```bash
cd demo
./start.sh
```

### 访问系统
浏览器打开: **http://localhost:8000**

---

## ✨ 核心功能

### ✅ 已实现
- ✅ 10种路径规划算法（A*, Dijkstra, RRT, RRT*, JPS等）
- ✅ 交互式地图编辑器
- ✅ 实时性能统计和对比
- ✅ 可视化展示（搜索节点、规划路径）
- ✅ 4个预设场景
- ✅ 响应式Web界面
- ✅ RESTful API接口
- ✅ 完整的文档

### 🚧 待扩展
- 路径跟踪与车辆控制
- 曲线平滑优化
- 搜索过程动画
- 动态障碍物
- 地图保存/加载
- 3D可视化

---

## 📁 项目结构

```
demo/
├── 📄 README.md              - 项目主文档
├── 📄 GUIDE.md              - 使用指南
├── 📄 INSTALL.md            - 安装指南
├── 📄 API.md                - API文档
├── 📄 PROJECT_SUMMARY.md    - 项目总结
├── 📄 SCREENSHOTS.md        - 界面说明
├── 📄 README_MAIN.md        - 主页说明
├── 🔧 start.sh              - 启动脚本
│
├── backend/                  - 后端服务
│   ├── main.py              - FastAPI服务器
│   └── requirements.txt     - Python依赖
│
├── frontend/                 - 前端界面
│   ├── index.html           - 主页面
│   ├── css/
│   │   └── style.css        - 样式文件
│   └── js/
│       ├── config.js        - 配置
│       ├── canvas.js        - Canvas绘图
│       ├── api.js           - API通信
│       └── app.js           - 应用逻辑
│
└── scenarios/               - 预设场景
    ├── simple_maze.json     - 简单迷宫
    ├── parking_lot.json     - 停车场
    ├── city_road.json       - 城市道路
    └── narrow_passage.json  - 窄通道
```

---

## 🎯 使用流程

### 1️⃣ 设置地图
- 选择预设场景 或 手动编辑
- 点击画布添加障碍物
- 设置起点和终点

### 2️⃣ 选择算法
- 从下拉菜单选择算法
- 查看算法信息了解特点

### 3️⃣ 执行规划
- 点击"开始规划"按钮
- 查看可视化结果

### 4️⃣ 对比分析
- 运行多个算法
- 查看性能对比
- 分析优劣差异

---

## 💻 技术栈

### 后端
- **FastAPI** - 现代Python Web框架
- **Python Motion Planning** - 路径规划算法库
- **Uvicorn** - ASGI服务器
- **NumPy** - 数值计算

### 前端
- **HTML5/CSS3** - 页面结构
- **JavaScript (ES6+)** - 交互逻辑
- **Canvas API** - 2D绘图

---

## 🎓 适用场景

### 教育
- 算法课程演示
- 机器人导航教学
- 自动驾驶课程

### 研究
- 算法快速原型
- 性能测试对比
- 论文实验演示

### 工程
- 产品Demo展示
- 技术方案验证
- 概念原型设计

---

## 📊 性能指标

**测试环境**: 50×50地图

| 算法 | 平均时间 | 路径质量 |
|------|----------|----------|
| A* | 5-50ms | 最优 |
| Dijkstra | 10-100ms | 最优 |
| GBFS | 3-30ms | 较好 |
| RRT | 20-200ms | 一般 |

---

## 🔧 常用命令

```bash
# 启动服务
./start.sh

# 停止服务
Ctrl+C

# 查看日志
python main.py

# 测试API
curl http://localhost:8000/api/algorithms

# 安装依赖
pip install -r backend/requirements.txt
```

---

## 🐛 故障排除

### 问题：无法启动
```bash
# 检查Python版本
python --version

# 重新安装依赖
pip install -r backend/requirements.txt
```

### 问题：端口占用
```bash
# 查找占用进程
lsof -i :8000

# 或修改端口
# 编辑 backend/main.py 最后一行
```

### 问题：规划失败
- 确保设置了起点和终点
- 检查是否存在可达路径
- 查看浏览器控制台错误

---

## 📖 详细文档

- **完整功能**: 查看 [README.md](README.md)
- **使用教程**: 查看 [GUIDE.md](GUIDE.md)
- **安装步骤**: 查看 [INSTALL.md](INSTALL.md)
- **API接口**: 查看 [API.md](API.md)
- **项目总结**: 查看 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

## 🎉 立即体验

```bash
# 1. 进入demo目录
cd demo

# 2. 启动系统
./start.sh

# 3. 打开浏览器
http://localhost:8000

# 4. 开始规划！
```

---

## 📧 支持与反馈

- 遇到问题？查看各文档的故障排除章节
- 有建议？欢迎提交Issue
- 想贡献？欢迎Pull Request

---

## 🏆 项目亮点

1. **完整的Web应用** - 前后端分离，功能完备
2. **10种算法集成** - 图搜索、采样、混合算法
3. **实时可视化** - 直观展示搜索过程
4. **性能对比** - 多算法同时运行对比
5. **详尽文档** - 6份文档覆盖各方面
6. **易于使用** - 一键启动，界面友好
7. **可扩展性** - 模块化设计，便于扩展

---

**享受你的路径规划之旅！** 🚀🎯🚗
