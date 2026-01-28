# 问题排查指南

## 🔍 常见问题及解决方案

### 1. ❌ labelimg: command not found

**问题描述：**
```bash
$ labelimg
labelimg: command not found
```

**原因：** labelimg 安装在 `~/.local/bin/` 目录，但该目录不在系统的 PATH 环境变量中

**解决方案（推荐顺序）：**

#### 方案 A: 使用 Python 模块方式（最简单）
```bash
python3 -m labelImg dataset/images dataset/labels
```

#### 方案 B: 在 Web 界面启动
直接在浏览器的"标注"界面点击"启动 LabelImg 标注工具"按钮（已自动使用方案 A）

#### 方案 C: 添加到 PATH（永久解决）
```bash
# 添加到 ~/.bashrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# 立即生效
source ~/.bashrc

# 验证
which labelimg  # 应该显示 /home/cyun/.local/bin/labelimg
```

---

### 2. 🚀 uvicorn 命令太长

**旧命令：**
```bash
python3 -m uvicorn main:app --reload --port 8000 --ws none
```

**新命令（简化）：**
```bash
python3 run.py
```

已创建 `backend/run.py` 脚本，包含所有必要参数。

---

### 3. ⚠️ WebSocket 相关错误

**问题描述：**
```
ModuleNotFoundError: No module named 'websockets.datastructures'
```

**解决方案：**
启动时添加 `--ws none` 参数（已在 `run.py` 中配置）

---

### 4. 🔴 后端显示离线状态

**检查步骤：**

1. **确认后端是否运行：**
   ```bash
   curl http://localhost:8000/
   ```
   应该返回：`{"status":"online","has_gpu":false,"has_yolo":true}`

2. **检查端口占用：**
   ```bash
   lsof -i :8000
   ```

3. **查看后端日志：**
   查看启动后端的终端输出，是否有错误信息

4. **重启后端：**
   ```bash
   cd backend
   python3 run.py
   ```

---

### 5. 📦 Node.js 版本过低

**问题描述：**
```
SyntaxError: Unexpected token {
```

**原因：** Node.js 版本低于 14.18

**解决方案：**
```bash
# 检查版本
node --version

# 如果低于 v14.18，使用 nvm 升级
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

---

### 6. 🏋️ 训练失败

**常见原因及解决：**

#### 错误 1: Dataset not found
```
Dataset not found. Please create ./dataset/data.yaml
```

**解决：**
```bash
# 确保目录存在
ls dataset/data.yaml
ls dataset/images/
ls dataset/labels/

# 如果缺少 data.yaml，创建它
cat > dataset/data.yaml << EOF
path: ./dataset
train: images
val: images

names:
  0: person
  1: car
  2: dog
EOF
```

#### 错误 2: No images found
**解决：**
- 确保 `dataset/images/` 中有图片文件
- 图片格式应为 `.jpg`, `.jpeg`, `.png` 等

#### 错误 3: No labels found  
**解决：**
- 使用 LabelImg 标注图片
- 确保 `dataset/labels/` 中有对应的 `.txt` 文件
- 每个图片都应该有对应的标注文件

---

### 7. 🎯 推理无结果

**可能原因：**

1. **使用的是预训练模型而非训练后的模型**
   - 预训练模型只能识别 COCO 数据集的 80 个类别
   - 解决：先完成训练，后端会自动加载新模型

2. **测试图片不包含训练过的类别**
   - 解决：确保测试图片包含在 `data.yaml` 中定义的类别

3. **置信度阈值太高**
   - 解决：在 `backend/main.py` 的检测函数中降低阈值：
     ```python
     results = model(image, conf=0.25)  # 默认 0.25
     ```

---

### 8. 📷 相机无法启动

**问题描述：**
```
无法访问相机: Permission denied
```

**解决方案：**

1. **检查浏览器权限：**
   - 确保浏览器允许访问相机
   - Chrome: 地址栏左侧的锁图标 → 网站设置 → 相机

2. **使用 HTTPS 或 localhost：**
   - 浏览器只允许在安全上下文中访问相机
   - `http://localhost` 是允许的
   - 如果使用 IP 访问，需要配置 HTTPS

3. **检查相机设备：**
   ```bash
   ls /dev/video*  # 应该显示 /dev/video0 等
   ```

---

### 9. 🐍 Python 依赖问题

**常见警告（可忽略）：**

```
UserWarning: Pandas requires version '2.7.3' or newer of 'numexpr'
```
不影响功能，可选升级：
```bash
pip install --upgrade numexpr
```

**关键依赖检查：**
```bash
pip list | grep -E "fastapi|uvicorn|ultralytics|Pillow"
```

---

### 10. 🗂️ 文件权限问题

**错误：**
```
Permission denied: 'dataset/images'
```

**解决：**
```bash
# 确保目录权限正确
chmod -R 755 dataset/
```

---

## 🔧 调试技巧

### 查看后端日志
后端启动的终端会实时显示所有请求和错误信息

### 查看浏览器控制台
按 F12 打开开发者工具 → Console 标签，查看前端错误

### 测试 API 接口
```bash
# 健康检查
curl http://localhost:8000/

# 测试检测接口
curl -X POST -F "file=@test.jpg" http://localhost:8000/detect
```

---

## 📞 需要帮助？

如果以上方案都无法解决问题，请提供以下信息：

1. 操作系统版本：`uname -a`
2. Python 版本：`python3 --version`
3. Node.js 版本：`node --version`
4. 完整错误信息（终端输出和浏览器控制台）
5. 执行的操作步骤
