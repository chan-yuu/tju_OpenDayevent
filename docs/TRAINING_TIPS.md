# 训练模型识别不了物体？诊断指南

## 常见问题和解决方案

### 问题 1: 训练数据太少
**症状**: 训练完成但推理时检测不到任何目标，或者 `val_batch0_pred.jpg` 中没有预测框

**原因**: 
- 训练图片数量不足（少于 50 张）
- 每个类别的样本太少

**解决方案**:
```bash
# 检查数据集大小
ls dataset/images/*.jpg | wc -l  # 应该至少 50+ 张
ls dataset/labels/*.txt | wc -l  # 应该与图片数量相同

# 每个类别至少需要 10-20 个标注样本
```

**最佳实践**:
- 每个类别至少 20-50 张图片
- 总数据集建议 100-500 张图片
- 训练集:验证集 = 8:2

### 问题 2: 标注质量问题
**症状**: 训练时 loss 很高，验证精度很低

**检查标注文件格式**:
```bash
# 查看标注文件内容
cat dataset/labels/sample_1.txt
# 正确格式: class_id x_center y_center width height (都是 0-1 之间的归一化值)
# 例如: 0 0.5 0.5 0.3 0.4
```

**常见标注错误**:
- ❌ 使用了 PascalVOC (XML) 格式而不是 YOLO (TXT) 格式
- ❌ 坐标值超出 0-1 范围
- ❌ 类别 ID 与 data.yaml 中的不匹配
- ❌ 标注框太小或太大

**修复方法**:
1. 在 LabelImg 中确保选择 **YOLO 格式** (不是 PascalVOC)
2. 重新检查标注，确保边界框准确
3. 验证类别 ID 正确：
```yaml
# dataset/data.yaml
names:
  - person      # 类别 0
  - car         # 类别 1
  - dog         # 类别 2
  - cat         # 类别 3
```

### 问题 3: 训练轮数不够
**症状**: 训练 loss 还在下降，但训练就停止了

**解决方案**:
```python
# 增加训练轮数
# 前端界面中将 Epochs 设置为更大的值

# 推荐配置:
- 小数据集 (<100 张): 50-100 epochs
- 中等数据集 (100-500 张): 100-200 epochs
- 大数据集 (>500 张): 200-300 epochs
```

**观察训练指标**:
- `box_loss` 应该降到 < 0.05
- `cls_loss` 应该降到 < 0.5
- mAP50 应该 > 0.5 (50%以上)

### 问题 4: 类别配置不匹配
**症状**: 模型训练成功，但推理时类别显示错误或无法识别

**检查步骤**:
```bash
# 1. 检查 data.yaml 中的类别配置
cat dataset/data.yaml

# 2. 检查 LabelImg 的预定义类别
cat dataset/predefined_classes.txt

# 3. 检查标注文件中使用的类别 ID
head -5 dataset/labels/*.txt
```

**确保一致性**:
```yaml
# dataset/data.yaml 和 predefined_classes.txt 必须完全一致
names:
  - person      # ID 0
  - car         # ID 1
  - dog         # ID 2
  - cat         # ID 3
  - bicycle     # ID 4
  - motorcycle  # ID 5
  - bus         # ID 6
  - truck       # ID 7
```

### 问题 5: 图片质量问题
**症状**: 训练收敛但推理效果差

**检查项**:
- ❌ 训练图片分辨率太低（< 640x480）
- ❌ 训练图片和测试图片风格差异太大
- ❌ 图片模糊、光照不足、遮挡严重

**解决方案**:
- 使用高质量图片（建议 640x640 以上）
- 增加数据多样性（不同角度、光照、背景）
- 使用数据增强（YOLO 会自动进行）

### 问题 6: 推理置信度阈值太高
**症状**: 模型有预测但前端不显示

**调整置信度阈值**:
```python
# 在 backend/main.py 的 detect 函数中
results = model(image, conf=0.25)  # 默认 0.25，可以降低到 0.1

# 更低的阈值会检测更多目标（包括误检）
# 更高的阈值只显示高置信度的目标
```

## 验证训练效果

### 1. 查看训练结果
```bash
# 查看训练生成的图片
ls -lh runs/detect/custom_model*/

# 重要文件:
- results.csv          # 训练指标记录
- results.png          # 训练曲线图
- confusion_matrix.png # 混淆矩阵
- val_batch0_pred.jpg  # 验证集预测结果
- weights/best.pt      # 最佳模型
```

### 2. 检查验证图片
```bash
# 打开验证预测图查看
xdg-open runs/detect/custom_model3/val_batch0_pred.jpg

# 应该能看到:
- ✅ 绿色边界框标出了目标
- ✅ 显示类别名称和置信度
- ✅ 框的位置基本准确
```

### 3. 查看训练日志
训练完成后检查终端输出：
```
      Epoch    GPU_mem   box_loss   cls_loss   dfl_loss  Instances
       10/10         0G      0.045      0.325      1.234         15

                 Class     Images  Instances      P      R   mAP50   mAP50-95
                   all         10         20   0.85   0.75   0.812      0.556
                person          5         10   0.90   0.80   0.850      0.600
                   dog          5         10   0.80   0.70   0.774      0.512
```

**好的指标**:
- `box_loss` < 0.05 (边界框损失)
- `cls_loss` < 0.5 (分类损失)
- `mAP50` > 0.5 (平均精度 > 50%)
- `P` (Precision 精确率) > 0.7
- `R` (Recall 召回率) > 0.6

## 推荐训练流程

1. **准备数据** (最重要)
   - 收集 100+ 张高质量图片
   - 使用 LabelImg 标注（YOLO 格式）
   - 确保每个类别至少 20 个样本
   - 验证标注质量

2. **配置数据集**
   ```bash
   # 确保目录结构正确
   dataset/
     ├── images/        # 所有图片
     ├── labels/        # 所有标注 (.txt)
     └── data.yaml      # 配置文件
   ```

3. **开始训练**
   - 先用 10 轮测试是否能正常训练
   - 如果正常，增加到 50-100 轮
   - 观察训练曲线，确保 loss 下降

4. **验证结果**
   - 查看 `val_batch0_pred.jpg`
   - 检查混淆矩阵
   - 在真实图片上测试推理

5. **迭代改进**
   - 如果效果不好，增加数据
   - 调整训练参数
   - 重新检查标注质量

## 快速诊断命令

```bash
# 进入项目目录
cd /home/cyun/Documents/neuromark-vision-lab

# 1. 检查数据集
echo "图片数量: $(ls dataset/images/*.jpg 2>/dev/null | wc -l)"
echo "标签数量: $(ls dataset/labels/*.txt 2>/dev/null | wc -l)"

# 2. 检查标注格式
echo "标签示例:"
head -3 dataset/labels/*.txt | head -10

# 3. 检查类别配置
echo "配置的类别:"
grep -A 10 "names:" dataset/data.yaml

# 4. 查看最新训练结果
ls -lht runs/detect/ | head -5

# 5. 查看训练指标
tail -20 runs/detect/custom_model*/results.csv
```

## 需要帮助？

如果以上都检查了还是有问题：

1. 检查终端的完整训练日志
2. 查看 `runs/detect/custom_model*/` 目录下的所有图片
3. 使用预训练模型 (yolov8n.pt) 测试推理是否正常
4. 确认 Python 环境和依赖版本正确

记住：**数据质量 > 模型复杂度**。先确保有足够的高质量标注数据！
