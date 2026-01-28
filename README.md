# 校园智能调度系统

[![GitHub](https://img.shields.io/badge/GitHub-tju--scheduling--lab-blue)](https://github.com)
[![Python](https://img.shields.io/badge/Python-3.8%2B-green)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 项目简介
校园环境下无人驾驶接驳车/物流车的智能调度系统，通过可视化界面让用户直观体验各种调度算法的运行效果。

## 📚 快速导航

- ⚡ [5分钟快速开始](QUICKSTART.md) - 新手必读，快速上手
- 📖 [完整项目说明](PROJECT.md) - 详细的项目架构和技术文档
- 🚀 [使用指南](USAGE.md) - 详细的操作教程
- 🎬 [功能演示](docs/DEMO.md) - 操作示例和最佳实践
- 📋 [更新日志](CHANGELOG.md) - 版本历史和变更记录
- 🔧 API文档 - 见下方接口说明

## ⚡ 一键安装部署

### 🚀 推荐方式：自动安装（适合新手）

```bash
# 1. 下载或克隆项目
cd ~/Documents/tju-scheduling-lab

# 2. 运行一键安装脚本
./install.sh
```

**自动完成以下操作：**
- ✅ 检测系统环境
- ✅ 安装Python依赖
- ✅ 创建虚拟环境
- ✅ 配置数据目录
- ✅ 创建桌面快捷方式

**安装完成后：**
- 双击桌面的"智能调度系统"图标启动
- 或运行 `./start.sh` 命令启动

### 🔧 手动安装（适合开发者）

如果自动安装失败，可以手动执行：

#### 1. 安装后端依赖
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. 启动后端服务
```bash
python app.py
```
后端将运行在 `http://localhost:5000`

#### 3. 打开前端页面
```bash
cd frontend
# 直接在浏览器中打开 map-editor.html
# 或使用简单的HTTP服务器
python -m http.server 8080
```
然后在浏览器访问 `http://localhost:8080/map-editor.html`

## 使用说明

### 地图编辑器操作

#### 创建节点
1. 在左侧工具栏选择"创建节点"模式
2. 输入节点名称（如"东门"）
3. 选择节点类型（如"大门"）
4. 在地图上点击位置创建节点

#### 创建边（道路）
1. 在左侧工具栏选择"创建边"模式
2. 点击起始节点
3. 在地图上点击添加折点（可选，用于创建弯曲道路）
4. 点击目标节点完成创建
5. 系统会自动计算并显示道路长度

#### 删除元素
1. 在左侧工具栏选择"删除"模式
2. 点击要删除的节点或边
3. 删除节点会同时删除相关的所有边

#### 保存和加载地图
1. 输入地图名称
2. 点击"💾 保存地图"按钮
3. 点击"📂 加载地图"按钮可加载之前保存的地图

## 项目结构
```
tju-scheduling-lab/
├── backend/
│   ├── app.py              # Flask后端服务
│   ├── requirements.txt    # Python依赖
│   └── data/              # 数据存储目录
│       ├── maps/          # 地图配置文件
│       └── uploads/       # 上传的图片
├── frontend/
│   ├── map-editor.html    # 地图编辑器界面
│   ├── map-editor.js      # 地图编辑器逻辑
│   └── map.png           # 示例背景图
└── docs/
    └── README.md         # 项目文档
```

## API文档

### 节点类型
- `GET /api/node-types` - 获取所有节点类型

### 地图管理
- `GET /api/maps` - 获取所有地图列表
- `GET /api/map/<map_id>` - 获取指定地图
- `POST /api/map` - 保存地图
- `DELETE /api/map/<map_id>` - 删除地图

### 图片上传
- `POST /api/upload-image` - 上传背景图片
- `GET /api/images/<filename>` - 获取图片

## 数据格式

### 地图数据结构
```json
{
  "id": "map_20250127_120000",
  "name": "天津大学卫津路校区",
  "background_image": "data:image/png;base64,...",
  "nodes": [
    {
      "id": 1706345678901,
      "name": "东门",
      "type": "大门",
      "x": 350,
      "y": 250
    }
  ],
  "edges": [
    {
      "id": 1706345678902,
      "startNodeId": 1706345678901,
      "endNodeId": 1706345678903,
      "waypoints": [
        {"x": 400, "y": 300},
        {"x": 450, "y": 350}
      ],
      "length": 156
    }
  ],
  "created_at": "2025-01-27T12:00:00",
  "updated_at": "2025-01-27T12:30:00"
}
```

## 开发计划

### 已完成 ✅
- [x] 地图编辑器界面设计
- [x] 节点创建和管理
- [x] 边创建和折线支持
- [x] 地图保存和加载
- [x] 后端API服务

### 待实现 🚧
- [ ] 调度算法实现（Dijkstra、A*等）
- [ ] 车辆模拟和动画
- [ ] 实时调度可视化
- [ ] 多车辆协同调度
- [ ] 性能统计和分析
- [ ] 充电站调度策略

## 技术栈
- **前端**: HTML5 Canvas、原生JavaScript
- **后端**: Python Flask
- **数据存储**: JSON文件
- **通信**: RESTful API

## 注意事项
1. 确保后端服务运行后再打开前端页面
2. 背景图片建议使用清晰的卫星地图
3. 节点名称建议使用有意义的中文名称
4. 创建边时可以添加多个折点来模拟真实道路
5. 定期保存地图以防数据丢失

## 贡献
欢迎提交问题和改进建议！

## 许可
MIT License
