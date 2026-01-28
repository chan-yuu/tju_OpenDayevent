# 自动驾驶决策规划演示系统

## 🎉 项目介绍

这是一个基于Web的交互式自动驾驶路径规划演示系统，集成了 `python_motion_planning` 库的多种经典路径规划算法，提供直观的可视化界面和实时性能对比功能。

![Demo Screenshot](demo/screenshots/demo.png)

## ✨ 主要特性

- 🗺️ **交互式地图编辑**：点击或拖拽绘制障碍物、设置起终点
- 🎯 **10种路径规划算法**：A*, Dijkstra, RRT, RRT*, JPS等
- 📊 **实时性能对比**：计算时间、路径长度、搜索节点数
- 🎬 **可视化展示**：搜索过程、扩展节点、规划路径
- 🎮 **预设场景**：迷宫、停车场、城市道路等
- 📱 **响应式设计**：支持不同屏幕尺寸

## 🚀 快速开始

### 环境要求
- Python 3.8+
- 现代浏览器（Chrome, Firefox, Edge等）

### 一键启动
```bash
cd demo
chmod +x start.sh
./start.sh
```

然后访问：**http://localhost:8000**

### 手动启动
```bash
# 1. 安装后端依赖
cd demo/backend
pip install -r requirements.txt

# 2. 安装python_motion_planning
cd ../../python_motion_planning
pip install -e .

# 3. 启动服务器
cd ../demo/backend
python main.py
```

## 📖 使用说明

### 基本操作

1. **设置起点和终点**
   - 点击左侧的"起点"或"终点"按钮
   - 在画布上点击设置位置

2. **添加障碍物**
   - 点击"障碍物"按钮
   - 在画布上点击或拖拽绘制

3. **选择算法并规划**
   - 从下拉菜单选择算法
   - 点击"开始规划"
   - 查看可视化结果和性能统计

4. **使用预设场景**
   - 从"预设场景"下拉菜单选择
   - 系统自动加载地图配置

### 支持的算法

**图搜索算法**
- A* - 平衡性能和最优性
- Dijkstra - 保证最优解
- GBFS - 快速搜索
- JPS - Jump Point Search
- Theta* - 任意角度路径
- Lazy Theta* - 优化的Theta*

**采样算法**
- RRT - 快速扩展随机树
- RRT* - 渐近最优
- RRT-Connect - 双向搜索

**混合算法**
- Voronoi Planner - 安全导航

## 📁 项目结构

```
demo/
├── README.md              # 项目文档
├── GUIDE.md              # 使用指南
├── PROJECT_SUMMARY.md    # 项目总结
├── start.sh              # 启动脚本
├── backend/
│   ├── main.py           # FastAPI服务器
│   └── requirements.txt  # 依赖列表
├── frontend/
│   ├── index.html        # 主页面
│   ├── css/
│   │   └── style.css     # 样式
│   └── js/
│       ├── config.js     # 配置
│       ├── canvas.js     # Canvas绘图
│       ├── api.js        # API通信
│       └── app.js        # 应用逻辑
└── scenarios/            # 预设场景
    ├── simple_maze.json
    ├── parking_lot.json
    ├── city_road.json
    └── narrow_passage.json
```

## 🎯 核心功能

### 1. 地图编辑
- 自由绘制障碍物
- 设置起点和终点
- 调整地图尺寸
- 清除和重置

### 2. 算法规划
- 多种算法选择
- 一键规划执行
- 实时结果展示
- 性能数据统计

### 3. 可视化
- 搜索节点展示
- 路径高亮显示
- 网格线切换
- 清晰的颜色区分

### 4. 性能对比
- 多算法运行
- 结果对比列表
- 详细性能指标
- 算法信息说明

## 🔧 技术栈

### 后端
- **FastAPI** - 现代Web框架
- **Python Motion Planning** - 算法库
- **NumPy** - 数值计算

### 前端
- **HTML5/CSS3** - 页面结构和样式
- **JavaScript (ES6+)** - 交互逻辑
- **Canvas API** - 2D图形绘制

## 📊 性能

测试环境：50×50地图，中等复杂度

| 算法 | 平均时间 | 路径质量 | 搜索节点 |
|------|----------|----------|----------|
| A* | 5-50ms | 最优 | 中等 |
| Dijkstra | 10-100ms | 最优 | 较多 |
| GBFS | 3-30ms | 较好 | 较少 |
| RRT | 20-200ms | 一般 | 取决采样 |
| Theta* | 8-60ms | 平滑最优 | 中等 |

## 🎓 适用场景

- **教学演示**：算法课程、机器人导航
- **研究开发**：快速原型、算法测试
- **技术展示**：产品Demo、概念验证
- **学习练习**：理解算法原理

## 📝 文档

- [README.md](README.md) - 项目主文档
- [GUIDE.md](GUIDE.md) - 快速使用指南
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - 项目总结
- [API文档](http://localhost:8000/docs) - Swagger UI（启动后访问）

## 🐛 故障排除

### 后端无法启动
```bash
# 检查Python版本
python --version  # 需要 >=3.8

# 重新安装依赖
pip install -r backend/requirements.txt
```

### 前端无法连接
- 确认后端已启动
- 检查端口8000是否被占用
- 查看浏览器控制台错误

### 规划失败
- 确保已设置起点和终点
- 检查起终点是否在障碍物上
- 验证是否存在可达路径

## 🚀 未来计划

- [ ] 路径跟踪与车辆控制
- [ ] 曲线平滑优化
- [ ] 搜索过程动画
- [ ] 动态障碍物
- [ ] 3D可视化
- [ ] 地图导入导出
- [ ] 更多算法集成

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

基于 python_motion_planning 项目开发。

## 📧 联系

如有问题或建议，请提交Issue。

---

**开始你的路径规划之旅！** 🚗💨
