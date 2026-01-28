# AI Vision Lab - 快速参考

## 🚀 启动应用

### 桌面快捷方式（推荐）
```
双击桌面图标 "AI-Vision-Lab"
```

### 命令行
```bash
cd /home/cyun/Documents/tju-vision-lab
./start.sh
```

## ⏹️ 停止应用

```bash
cd /home/cyun/Documents/tju-vision-lab
./stop.sh
```

## 🔗 访问地址

- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:8000

## 📋 三大功能模式

### 1. 标注模式 📊
- 放图片到 `dataset/images/`
- 点击启动标注工具
- 用LabelImg标注物体
- 保存在 `dataset/labels/`

### 2. 训练模式 🧠
- 设置训练轮数（50-100）
- 点击开始训练
- 等待训练完成
- 模型自动保存

### 3. 识别模式 🔍
- 选择模型
- 上传图片或启动相机
- 点击识别按钮
- 查看识别结果

## ⚙️ 重要配置

### 修改识别类别
编辑 `dataset/data.yaml`:
```yaml
names:
  - 类别1
  - 类别2
  - ...
```

## 🔧 故障排除

### 查看日志
```bash
# 后端日志
cat logs/backend.log

# 前端日志  
cat logs/frontend.log
```

### 重启服务
```bash
./stop.sh && ./start.sh
```

### 清理残留进程
```bash
# 查找Python进程
ps aux | grep "python.*run.py"

# 查找Node进程
ps aux | grep "vite"

# 杀死进程
kill [PID]
```

## 💡 快速技巧

- **快速测试**: 用10轮训练测试
- **生产使用**: 用50-100轮训练
- **提高准确度**: 更多数据 + 更多轮数
- **切换模型**: 识别模式顶部下拉选择

## 📞 常用命令

```bash
# 查看端口占用
lsof -i :8000  # 后端
lsof -i :5173  # 前端

# 重新安装依赖
pip install -r backend/requirements.txt
npm install

# 查看GPU使用
nvidia-smi
```

---

**记住**: 双击桌面图标，一切就绪！✨
