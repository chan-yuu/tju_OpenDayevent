# 📋 快速参考卡

## 🚀 启动命令

```bash
# 一键安装（首次使用）
./scripts/install.sh

# 启动服务
./scripts/start.sh

# 停止服务
./scripts/stop.sh
# 或按 Ctrl+C
```

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端界面 | http://localhost:3000 | 主应用界面 |
| 后端API | http://localhost:8000 | FastAPI服务 |
| API文档 | http://localhost:8000/docs | Swagger自动文档 |

## 📁 重要目录

| 目录 | 用途 |
|------|------|
| `src/` | 前端React源码 |
| `backend/` | Python后端代码 |
| `scripts/` | 启动和安装脚本 |
| `dataset/` | 训练数据集 |
| `backend/runs/detect/` | 训练结果模型 |
| `docs/` | 文档文件 |
| `assets/` | 图标等静态资源 |

## 📝 数据文件位置

| 数据类型 | 位置 |
|----------|------|
| 排行榜数据 | 浏览器 LocalStorage<br>键: `aiQuizLeaderboard` |
| 训练模型 | `backend/runs/detect/*/weights/best.pt` |
| 数据集图片 | `dataset/images/` |
| 标注文件 | `dataset/labels/` |
| 进程PID | `.backend.pid`, `.frontend.pid` |

## 🎯 功能快捷键

| 功能 | 操作 |
|------|------|
| 切换标注模式 | 点击侧边栏 📊 图标 |
| 切换训练模式 | 点击侧边栏 🧠 图标 |
| 切换识别模式 | 点击侧边栏 🔍 图标 |
| 切换答题模式 | 点击侧边栏 📖 图标 |
| 开始训练 | 训练模式 → 输入Epochs → 点击开始 |
| 上传图片识别 | 识别模式 → 拖拽或点击上传 |
| 开启摄像头 | 识别模式 → 打开"使用相机"开关 |

## 🔧 常见问题快速解决

### 端口被占用
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
./scripts/start.sh
```

### 依赖问题
```bash
# 前端依赖
rm -rf node_modules package-lock.json
npm install

# 后端依赖
pip3 install --upgrade -r backend/requirements.txt
```

### 权限问题
```bash
chmod +x scripts/*.sh
```

### 清理缓存
```bash
# 清理构建产物
rm -rf dist

# 清理Python缓存
find . -type d -name __pycache__ -exec rm -rf {} +
```

## 📚 文档导航

| 文档 | 内容 |
|------|------|
| [README.md](../README.md) | 项目总览 |
| [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) | 完整目录结构 |
| [docs/QUICKSTART.md](QUICKSTART.md) | 快速入门 |
| [docs/AI_LEARNING_GUIDE.md](AI_LEARNING_GUIDE.md) | AI学习指南（10章） |
| [docs/TRAINING_TIPS.md](TRAINING_TIPS.md) | 训练技巧 |
| [docs/STORAGE_INFO.md](STORAGE_INFO.md) | 数据存储说明 |
| [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 故障排除 |
| [UPDATE_LOG.md](../UPDATE_LOG.md) | 更新日志 |

## 🎓 学习路径

```
1. 阅读 AI_LEARNING_GUIDE.md (30分钟)
   ↓
2. 完成答题系统测试 (15分钟)
   ↓
3. 标注10-20张图片 (30分钟)
   ↓
4. 训练第一个模型 (30-60分钟)
   ↓
5. 测试识别效果 (10分钟)
   ↓
6. 优化和改进 (持续)
```

## ⚙️ 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | Node.js依赖和脚本 |
| `tsconfig.json` | TypeScript配置 |
| `vite.config.ts` | Vite构建配置 |
| `backend/requirements.txt` | Python依赖 |
| `dataset/data.yaml` | 数据集配置 |

## 🔐 默认配置

```yaml
前端端口: 3000
后端端口: 8000
默认Epochs: 50
图片大小: 640x640
模型: YOLOv8n
置信度阈值: 0.5
```

## 📊 性能参考

| 硬件 | 训练速度 (50 epochs) |
|------|---------------------|
| CPU (i5) | ~30-45分钟 |
| CPU (i7) | ~20-30分钟 |
| GPU (GTX 1060) | ~5-10分钟 |
| GPU (RTX 3060) | ~2-5分钟 |

## 🆘 紧急救援

```bash
# 完全重启
./scripts/stop.sh
pkill -f "python.*run.py"
pkill -f "vite"
sleep 2
./scripts/start.sh

# 恢复默认设置
# 删除浏览器中的 LocalStorage 数据
# F12 → Application → Local Storage → Clear
```

## 📞 联系方式

- **项目**: AI Vision Lab
- **版本**: 2.0
- **维护**: 天津大学视觉实验室
- **更新**: 2026-01-27

---

**💡 提示**: 将此文档加入书签，方便快速查阅！
