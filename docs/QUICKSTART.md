# 快速使用指南

## 🚀 启动步骤

### 1. 启动后端（推荐方式）
```bash
cd backend
python3 run.py
```

或使用完整命令：
```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000 --ws none
```

### 2. 启动前端（新终端）
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问: `http://localhost:3001`

---

## 📝 完整工作流程

### 第一步：标注数据

1. 将图片复制到 `dataset/images/` 目录
2. 在标注界面点击"启动 LabelImg 标注工具"
3. 在 LabelImg 中：
   - 选择 YOLO 格式
   - 按 `W` 键绘制边界框
   - 输入类别名称（如：person, car, dog）
   - 按 `D` 键切换到下一张
4. 标注会自动保存到 `dataset/labels/`

### 第二步：训练模型

1. 确保 `dataset/data.yaml` 配置正确（已预创建）
2. 在训练界面设置训练轮数（建议 10-50）
3. 点击"开始训练模型"
4. 等待训练完成（会显示进度）
5. 模型自动保存到 `backend/runs/detect/custom_model/weights/best.pt`

### 第三步：运行推理

**图像检测：**
1. 点击"上传图片"选择测试图片
2. 点击"运行检测"
3. 查看检测结果

**相机检测：**
1. 点击"使用相机"启动摄像头
2. 点击"拍摄并检测"进行实时检测
3. 点击"停止相机"结束

---

## ⚙️ 数据集配置

`dataset/data.yaml` 示例：

```yaml
path: ./dataset
train: images
val: images

names:
  0: person
  1: car
  2: dog
  3: cat
```

**注意**：类别 ID 必须与 LabelImg 标注时使用的一致！

---

## 💡 常用命令

### 检查后端状态
```bash
curl http://localhost:8000/
```

### 停止所有服务
```bash
# Ctrl+C 在每个终端
```

### 清理训练输出
```bash
rm -rf backend/runs/
```

### 重新开始标注
```bash
rm -rf dataset/labels/*.txt
```

---

## 🐛 常见问题

### LabelImg 启动失败？
```bash
pip install labelimg
```

**如果安装后仍然提示 "command not found"：**

这是因为 labelimg 安装在用户目录但不在 PATH 中。解决方案：

1. **使用 Python 模块方式运行（推荐）：**
   ```bash
   python3 -m labelImg dataset/images dataset/labels
   ```

2. **或者在 Web 界面点击"启动 LabelImg"按钮**（已自动使用 Python 模块方式）

3. **添加到 PATH（永久方案）：**
   ```bash
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

### 训练失败？
- 检查 `dataset/images/` 是否有图片
- 检查 `dataset/labels/` 是否有对应的标注文件
- 检查 `dataset/data.yaml` 配置是否正确

### 推理无结果？
- 确保使用了训练好的模型
- 检查测试图片是否包含训练过的类别
- 查看浏览器控制台的错误信息

---

## 📊 训练建议

- **测试阶段**：10-20 epochs
- **小数据集**：50-100 epochs  
- **大数据集**：100-300 epochs

每个类别至少需要 **50-100** 张标注图片才能获得良好效果。
