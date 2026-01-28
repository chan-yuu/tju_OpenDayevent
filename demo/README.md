# 自动驾驶决策规划演示系统

一个交互式的Web应用，用于演示和对比多种路径规划算法。

## ✅ 最新更新 (修复完成)

### 已解决的问题

1. **✅ 桌面图标显示**
   - 创建了 `icon.svg` 矢量图标文件
   - 更新 `deploy_desktop.sh` 脚本使用正确的图标路径

2. **✅ 规划失败修复**
   - 修正了规划器初始化参数传递问题
   - 使用命名参数: `AlgorithmClass(map_=grid, start=start.current, goal=goal.current)`
   - 已通过完整测试，A*算法成功规划出路径

3. **✅ UI面板分离**
   - 将控制面板改为标签页设计
   - 分为"🎯 路径规划"和"🚗 轨迹控制"两个独立标签页
   - 添加平滑切换动画，解决单屏拥挤问题

### 验证测试
运行 `python test_fixes.py` 可验证所有修复：
- ✅ Grid创建
- ✅ Node创建  
- ✅ 规划器初始化
- ✅ 桌面图标
- ✅ HTML标签页

---

## ✨ 功能特性

### 🗺️ 地图与场景编辑
- 多种预设场景（迷宫、停车场、城市道路等）
- 交互式地图编辑器（点击添加/删除障碍物）
- 起点/终点拖拽设置
- 可调节的地图尺寸

### 🎯 路径规划算法
支持多种经典和先进的路径规划算法：

**图搜索算法**
- A* (A-Star)
- Dijkstra
- GBFS (Greedy Best-First Search)
- JPS (Jump Point Search)
- Theta*
- Lazy Theta*

**采样算法**
- RRT (Rapidly-exploring Random Tree)
- RRT*
- RRT-Connect

**混合算法**
- Voronoi Planner

### � 轨迹跟踪控制
- 多种车辆模型（差速驱动、类车模型）
- 控制算法（PID、Pure Pursuit、DWA）
- 实时参数调节
- 轨迹动画演示

### �📊 可视化与分析
- 算法执行过程可视化（搜索树、扩展节点）
- 实时性能对比（计算时间、路径长度、节点数）
- 多算法并行对比模式
- 详细的算法信息和说明

### 🎮 交互功能
- 实时参数调整
- 播放控制（播放/暂停/速度调节）
- 多视角显示选项
- 数据导入导出

## 🚀 快速开始

### 环境要求
- Python 3.8+
- 现代浏览器（Chrome, Firefox, Edge等）

### 安装步骤

1. **安装后端依赖**
```bash
cd demo/backend
pip install -r requirements.txt
```

2. **安装python_motion_planning库**
```bash
cd ../../python_motion_planning
pip install -e .
```

### 启动应用

**方法一：使用启动脚本**
```bash
cd demo
chmod +x start.sh
./start.sh
```

**方法二：手动启动**
```bash
cd demo/backend
python main.py
```

然后在浏览器中访问：`http://localhost:8000`

## 📖 使用说明

### 1. 编辑地图
- 选择编辑模式（障碍物、起点、终点、擦除）
- 在画布上点击或拖拽来编辑地图
- 或者从预设场景中选择

### 2. 规划路径
- 选择路径规划算法
- 点击"开始规划"按钮
- 查看可视化结果和性能统计

### 3. 对比算法
- 运行多个不同算法
- 在右侧面板查看对比结果
- 分析各算法的优劣

### 4. 调整显示
- 使用显示选项切换网格、搜索节点、路径的显示
- 调整播放速度查看算法执行过程

## 🎨 界面布局

```
┌─────────────────────────────────────────────────┐
│  导航栏                                          │
├──────────┬──────────────────────┬───────────────┤
│          │                      │               │
│  控制面板 │    主画布区域         │   性能面板    │
│          │   (地图可视化)        │               │
│  - 场景   │                      │  - 统计数据   │
│  - 编辑   │                      │  - 算法对比   │
│  - 算法   │                      │  - 算法信息   │
│  - 控制   │                      │               │
│          │                      │               │
├──────────┴──────────────────────┴───────────────┤
│  状态栏                                          │
└─────────────────────────────────────────────────┘
```

## 🛠️ 技术栈

### 后端
- **FastAPI**: 现代高性能Web框架
- **Python Motion Planning**: 路径规划算法库
- **NumPy**: 数值计算

### 前端
- **原生HTML/CSS/JavaScript**: 无框架依赖
- **Canvas API**: 高性能2D绘图
- **Fetch API**: 异步HTTP请求

## 📁 项目结构

```
demo/
├── backend/
│   ├── main.py              # FastAPI服务器
│   └── requirements.txt     # Python依赖
├── frontend/
│   ├── index.html          # 主页面
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       ├── config.js       # 配置
│       ├── canvas.js       # Canvas绘图
│       ├── api.js          # API通信
│       └── app.js          # 主应用逻辑
├── scenarios/              # 预设场景
│   ├── simple_maze.json
│   ├── parking_lot.json
│   ├── city_road.json
│   └── narrow_passage.json
└── README.md
```

## 🔧 配置说明

可以在 `frontend/js/config.js` 中修改配置：

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000/api',
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 800,
    CELL_SIZE: 16,
    // ... 更多配置
};
```

## 🎓 算法说明

### A*算法
结合了Dijkstra和贪婪搜索的优点，使用启发函数 f(n) = g(n) + h(n)，保证找到最优路径。

### RRT算法
基于采样的方法，通过随机采样和树的增量构建来探索空间，适合高维和复杂约束问题。

### Theta*算法
允许任意角度路径，生成更平滑和自然的路径，通过视线检测来优化路径。

更多算法详情请在界面中选择算法查看。

## 📝 添加自定义场景

在 `scenarios/` 目录下创建JSON文件：

```json
{
    "name": "场景名称",
    "description": "场景描述",
    "map": {
        "width": 50,
        "height": 50,
        "obstacles": [[x1, y1], [x2, y2], ...],
        "start": [x, y],
        "goal": [x, y]
    }
}
```

## 🐛 故障排除

### 后端无法启动
- 检查Python版本是否≥3.8
- 确保已安装所有依赖：`pip install -r requirements.txt`
- 检查8000端口是否被占用

### 前端无法连接后端
- 检查后端是否正常运行
- 确认API地址配置正确
- 检查浏览器控制台的错误信息

### 算法执行失败
- 确保起点和终点已设置
- 检查起点和终点不在障碍物上
- 查看性能面板的错误信息

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

本项目基于现有的python_motion_planning库开发。

## 📧 联系方式

如有问题或建议，请提交Issue。

---

**Enjoy Planning! 🚗💨**
