# 答题系统更新说明

## 📅 更新日期
2026年1月27日

## ✨ 更新内容

### 1. 题库大幅扩展
- **之前**: 20道固定题目
- **现在**: 60道题目的题库，每次随机抽取20题

题目分类包括：
- 基础概念（AI、计算机视觉、深度学习）
- YOLO算法原理
- 物体检测技术
- 机器学习理论
- 模型训练方法
- 数据处理与标注
- 实践应用案例
- 综合挑战题

### 2. 随机抽题机制
每位学生开始答题时，系统会从题库中随机抽取20道题目：
- **6道简单题** (10分 × 6 = 60分)
- **8道中等题** (15分 × 8 = 120分)
- **6道困难题** (20分 × 6 = 120分)
- **总分固定**: 300分

这确保了：
✅ 每个人的题目都不同，避免抄袭
✅ 难度分布均衡
✅ 总分完全相同，公平竞争

### 3. 标题修正
- **标题**: AI 视觉识别挑战赛
- **副标题**: 测试你的人工智能与计算机视觉知识！

### 4. 分值调整
- 简单题: ~~10分~~ → 10分（保持）
- 中等题: ~~20分~~ → 15分（调整）
- 困难题: ~~30分~~ → 20分（调整）

调整原因：使用三档难度分值，更合理地反映题目难度梯度

## 🎯 使用说明

### 开始答题
1. 输入用户名（至少2个字符）
2. 点击"开始挑战"
3. 系统自动随机抽取20题

### 答题过程
- 每题选择一个答案
- 点击"提交答案"查看结果
- 答对显示绿色提示，答错显示红色提示
- 每题都有详细的知识点解释
- 点击"下一题"继续

### 查看成绩
- 答完所有题目后自动显示成绩
- 显示总分、正确率、排名
- 可查看完整排行榜（TOP 10）
- 支持重新挑战

## 📊 题目分布

### 简单题（20题）
涵盖AI基础概念、计算机视觉基本原理等入门知识

### 中等题（20题）
包括机器学习原理、模型训练方法、数据处理技巧等进阶内容

### 困难题（20题）
深入探讨YOLO算法、模型优化、高级技术等专业知识

## 🏆 排行榜规则
- 按分数从高到低排序
- 相同分数按答题时间先后排序
- 只显示TOP 10
- 数据保存在浏览器本地存储
- 可多次挑战刷新成绩

## 💡 教学建议

### 课前准备
1. 学生先学习 [AI学习指南](AI_LEARNING_GUIDE.md)
2. 熟悉系统的标注、训练、识别功能
3. 了解基本的AI和计算机视觉概念

### 课堂使用
1. **个人挑战**: 每位学生独立答题
2. **小组竞赛**: 分组比拼总分
3. **知识巩固**: 答题后讲解错题
4. **实践结合**: 将理论知识与动手实验结合

### 评估方式
- 答题成绩（占比40%）
- 实际操作能力（占比60%）
- 鼓励多次挑战，取最高分

## 🔧 技术实现

### 核心算法
```typescript
// 随机抽取保证总分300分
export function selectRandomQuestions(): Question[] {
  const easyQuestions = questions.filter(q => q.difficulty === 'easy');
  const mediumQuestions = questions.filter(q => q.difficulty === 'medium');
  const hardQuestions = questions.filter(q => q.difficulty === 'hard');
  
  // 抽取: 6道简单 + 8道中等 + 6道困难 = 300分
  const selectedEasy = shuffleArray(easyQuestions).slice(0, 6);
  const selectedMedium = shuffleArray(mediumQuestions).slice(0, 8);
  const selectedHard = shuffleArray(hardQuestions).slice(0, 6);
  
  return shuffleArray([...selectedEasy, ...selectedMedium, ...selectedHard]);
}
```

### 数据持久化
使用浏览器的 `localStorage` 存储排行榜数据，数据格式：
```typescript
interface UserScore {
  username: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timestamp: number;
}
```

## 📝 注意事项
- 答题开始后无法暂停，请一次性完成
- 刷新页面会丢失当前答题进度
- 排行榜数据保存在浏览器本地，清除浏览器数据会丢失
- 建议使用Chrome、Edge等现代浏览器

## 🎓 题目示例

**简单题示例**:
> Q: AI是什么的缩写？
> A: 人工智能 (Artificial Intelligence)

**中等题示例**:
> Q: 什么是迁移学习？
> A: 利用已训练好的模型来解决新问题

**困难题示例**:
> Q: 非极大值抑制（NMS）的作用是什么？
> A: 去除重复的检测框，保留最优结果

---

**祝大家答题愉快，学习进步！** 🎉
