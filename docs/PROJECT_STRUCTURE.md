# AI Vision Lab 项目结构

## 📁 目录结构

```
tju-vision-lab/
├── src/                          # 前端源代码
│   ├── App.tsx                   # 主应用组件
│   ├── types.ts                  # TypeScript 类型定义
│   ├── components/               # React 组件
│   │   └── QuizSystem.tsx        # 知识挑战赛组件
│   ├── services/                 # 服务层
│   │   └── pythonService.ts      # Python 后端通信服务
│   └── data/                     # 数据文件
│       └── quizData.ts           # 题库数据（60题）
│
├── backend/                      # Python 后端
│   ├── main.py                   # FastAPI 主程序
│   ├── run.py                    # 启动脚本
│   ├── requirements.txt          # Python 依赖
│   ├── yolov8n.pt                # YOLOv8 预训练模型
│   ├── temp_data.yaml            # 临时训练配置
│   └── runs/                     # 训练输出目录
│       └── detect/               # 检测模型训练结果
│           ├── custom_model/     # 自定义模型1
│           ├── custom_model2/    # 自定义模型2
│           ├── custom_model3/    # 自定义模型3
│           ├── train/            # 训练会话1
│           └── train2/           # 训练会话2
│
├── dataset/                      # 数据集目录
│   ├── data.yaml                 # 数据集配置
│   ├── predefined_classes.txt    # 预定义类别
│   ├── images/                   # 图像文件
│   └── labels/                   # 标注文件
│       └── classes.txt           # 类别列表
│
├── assets/                       # 静态资源
│   ├── icon.png                  # 应用图标（PNG）
│   └── icon.svg                  # 应用图标（SVG）
│
├── scripts/                      # 脚本文件
│   ├── install.sh                # 一键安装脚本
│   ├── start.sh                  # 启动服务
│   ├── stop.sh                   # 停止服务
│   └── AI-Vision-Lab.desktop     # Linux 桌面快捷方式
│
├── docs/                         # 文档目录
│   ├── AI_LEARNING_GUIDE.md      # AI 学习指南（10章）
│   ├── QUICKSTART.md             # 快速开始
│   ├── QUICK_START.md            # 快速开始（备份）
│   ├── TRAINING_TIPS.md          # 训练技巧
│   ├── TROUBLESHOOTING.md        # 故障排除
│   ├── STORAGE_INFO.md           # 数据存储说明
│   ├── QUIZ_SYSTEM.md            # 题库系统说明
│   ├── QUIZ_UPDATE.md            # 题库更新日志
│   ├── FEATURES.md               # 功能说明
│   ├── USAGE_GUIDE.md            # 使用指南
│   └── CHANGELOG.md              # 更新日志
│
├── logs/                         # 日志目录
│
├── node_modules/                 # Node.js 依赖（自动生成）
│
├── index.html                    # HTML 入口
├── index.tsx                     # React 入口
├── package.json                  # Node.js 包配置
├── package-lock.json             # 依赖锁定文件
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 构建配置
├── .gitignore                    # Git 忽略文件
├── README.md                     # 项目说明
├── .backend.pid                  # 后端进程 PID
└── .frontend.pid                 # 前端进程 PID

```

## 🎯 核心模块说明

### 1. 前端 (React + TypeScript + Vite)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite (快速热更新)
- **UI 库**: TailwindCSS + Lucide React
- **状态管理**: React Hooks
- **数据持久化**: LocalStorage

### 2. 后端 (Python + FastAPI)
- **框架**: FastAPI (高性能异步)
- **AI 引擎**: Ultralytics YOLOv8
- **图像处理**: PIL
- **数据格式**: YAML

### 3. 四大功能模块

#### 标注模式 (ANNOTATE)
- 启动 LabelImg 标注工具
- 支持可视化边界框标注
- 自动生成 YOLO 格式标签

#### 训练模式 (TRAIN)
- 自定义训练参数（Epochs）
- 实时训练进度显示
- 支持多模型管理
- 训练结果自动保存

#### 推理模式 (INFERENCE)
- 上传图片检测
- 实时摄像头检测
- 多模型切换
- 可视化检测结果

#### 知识挑战赛 (QUIZ)
- 60题题库（20易+20中+20难）
- 随机抽取20题（300分）
- 实时排行榜（LocalStorage）
- 用户成绩记录

## 📦 安装与部署

### 快速安装（推荐）
```bash
cd /home/cyun/Documents/tju-vision-lab
./scripts/install.sh
```

### 手动安装
```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
pip install -r backend/requirements.txt

# 3. 启动服务
./scripts/start.sh
```

## 🚀 启动方式

### 方式1: 桌面快捷方式
双击桌面上的 "AI Vision Lab" 图标

### 方式2: 命令行启动
```bash
cd /home/cyun/Documents/tju-vision-lab
./scripts/start.sh
```

### 方式3: 分别启动
```bash
# 终端1 - 启动后端
cd backend && python run.py

# 终端2 - 启动前端
npm run dev
```

## 🔌 端口配置
- **前端**: http://localhost:3000
- **后端**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## 💾 数据存储

### LocalStorage (浏览器)
- **排行榜数据**: `aiQuizLeaderboard`
- **位置**: 浏览器开发者工具 → Application → Local Storage
- **格式**: JSON 数组，最多保存前10名

### 文件系统
- **训练模型**: `backend/runs/detect/*/weights/`
- **数据集**: `dataset/images/` + `dataset/labels/`
- **日志文件**: `logs/`

## 🛠️ 开发工具

### 前端开发
```bash
npm run dev          # 开发模式（热更新）
npm run build        # 生产构建
npm run preview      # 预览构建结果
```

### 后端开发
```bash
cd backend
uvicorn main:app --reload  # 开发模式
```

## 🔧 常见问题

### 端口被占用
```bash
# 停止所有服务
./scripts/stop.sh

# 手动清理端口
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Python 依赖问题
```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Node.js 依赖问题
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 文档链接
- [快速开始](docs/QUICKSTART.md)
- [AI 学习指南](docs/AI_LEARNING_GUIDE.md)
- [训练技巧](docs/TRAINING_TIPS.md)
- [故障排除](docs/TROUBLESHOOTING.md)
- [数据存储说明](docs/STORAGE_INFO.md)

## 📝 版本信息
- **项目版本**: 2.0
- **创建日期**: 2026-01-27
- **最后更新**: 2026-01-27

## 👥 维护者
天津大学视觉实验室

## 📄 许可证
MIT License
