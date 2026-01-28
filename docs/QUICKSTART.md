# 🚀 5分钟快速开始

## ⚡ 最快方式：一键安装（推荐）

```bash
# 1. 进入项目目录
cd ~/Documents/tju-scheduling-lab

# 2. 运行一键安装脚本
./install.sh

# 3. 安装完成后，双击桌面图标或运行：
./start.sh
```

**就这么简单！** 脚本会自动：
- 检测并安装Python依赖
- 创建虚拟环境
- 配置数据目录
- 创建桌面快捷方式

---

## ✅ 手动安装（备选方案）

### 第一步：环境检查 (1分钟)
- [ ] Python 3.7+ 已安装
  ```bash
  python3 --version
  ```
- [ ] pip 包管理器可用
  ```bash
  pip --version
  ```

### 第二步：安装依赖 (2分钟)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 第三步：启动系统 (1分钟)
```bash
cd ..
./start.sh
  ```
- [ ] 等待浏览器自动打开

### 第三步：创建第一个地图 (2分钟)
- [ ] 输入地图名称：如"我的第一个地图"
- [ ] 上传背景图或跳过
- [ ] 创建第一个节点：
  - 名称：东门
  - 类型：大门
  - 点击地图位置
- [ ] 创建第二个节点：
  - 名称：图书馆
  - 类型：图书馆
  - 点击地图位置
- [ ] 切换到"创建边"模式
- [ ] 连接两个节点
- [ ] 点击"💾 保存地图"

## 🎉 完成！

你已经成功创建了第一个校园地图！

## 📚 下一步

### 深入学习
- [ ] 阅读 [使用指南](USAGE.md)
- [ ] 查看 [功能演示](docs/DEMO.md)
- [ ] 了解 [项目详情](PROJECT.md)

### 探索功能
- [ ] 创建折线道路
- [ ] 尝试不同节点类型
- [ ] 加载示例地图
- [ ] 体验删除功能

### 高级操作
- [ ] 创建复杂校园网络
- [ ] 导入真实校园地图
- [ ] 优化节点布局
- [ ] 准备调度算法数据

## ⚡ 快捷命令

### 启动服务
```bash
./start.sh          # 一键启动
```

### 停止服务
```bash
./stop.sh           # 优雅停止
# 或 Ctrl+C
```

### 测试API
```bash
python test_api.py  # 验证功能
```

### 查看地图数据
```bash
cat backend/data/maps/*.json  # Linux/Mac
type backend\data\maps\*.json # Windows
```

## 🐛 遇到问题？

### 后端启动失败
```bash
cd backend
pip install -r requirements.txt --user
python app.py
```

### 前端打不开
```bash
cd frontend
python -m http.server 8080
# 手动访问: http://localhost:8080/map-editor.html
```

### 依赖安装失败
```bash
pip install --upgrade pip
pip install flask flask-cors --user
```

## 📞 获取帮助

- 📖 查看 [README.md](README.md)
- 📝 阅读 [FAQ](USAGE.md#常见问题)
- 🐛 提交 Issue
- 💬 查看文档

## 🎯 成功标志

看到以下内容说明启动成功：
```
✅ 系统启动成功！
📌 访问地址:
   前端界面: http://localhost:8080/map-editor.html
   后端API:  http://localhost:5000/api
```

浏览器显示：
- 左侧：工具栏和控制面板
- 右侧：地图编辑画布
- 右上角：实时统计信息

## ⏱️ 时间分配

| 步骤 | 时间 | 任务 |
|------|------|------|
| 1 | 1分钟 | 环境检查 |
| 2 | 2分钟 | 启动系统 |
| 3 | 2分钟 | 创建地图 |
| **总计** | **5分钟** | **完成** |

---

**现在开始你的校园调度系统之旅吧！** 🎉
