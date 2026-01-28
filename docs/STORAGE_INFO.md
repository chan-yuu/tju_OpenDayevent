# 数据存储说明

## 📊 排行榜数据存储

### 存储位置
排行榜数据保存在**浏览器的 LocalStorage** 中：

- **存储键名**: `aiQuizLeaderboard`
- **存储位置**: 浏览器本地存储（客户端）
- **URL域**: `http://localhost:3000`

### 如何查看数据

#### 方法1：浏览器开发者工具
1. 打开应用：http://localhost:3000
2. 按 `F12` 打开开发者工具
3. 切换到 `Application` 标签（Chrome/Edge）或 `存储` 标签（Firefox）
4. 左侧菜单展开 `Local Storage`
5. 点击 `http://localhost:3000`
6. 找到 `aiQuizLeaderboard` 键

#### 方法2：控制台查看
在浏览器控制台（F12 → Console）输入：
```javascript
// 查看排行榜数据
console.log(JSON.parse(localStorage.getItem('aiQuizLeaderboard')));

// 查看排行榜人数
console.log(JSON.parse(localStorage.getItem('aiQuizLeaderboard')).length);
```

### 数据格式
```json
[
  {
    "username": "小明",
    "score": 280,
    "correctCount": 18,
    "totalQuestions": 20,
    "timestamp": 1706342400000
  },
  {
    "username": "小红",
    "score": 260,
    "correctCount": 16,
    "totalQuestions": 20,
    "timestamp": 1706342500000
  }
]
```

### 数据特点

#### 优点
✅ **无需数据库**: 不需要配置MySQL、MongoDB等数据库
✅ **快速访问**: 本地存储，读写速度快
✅ **简单可靠**: 浏览器原生支持，兼容性好
✅ **隐私保护**: 数据只保存在本地，不上传服务器

#### 限制
⚠️ **浏览器独立**: 不同浏览器的数据不共享
⚠️ **设备独立**: 不同电脑的数据不同步
⚠️ **容量限制**: LocalStorage通常限制5-10MB
⚠️ **可被清除**: 清除浏览器缓存会删除数据

### 数据管理

#### 清除排行榜数据
在浏览器控制台输入：
```javascript
localStorage.removeItem('aiQuizLeaderboard');
```

#### 导出排行榜数据
```javascript
// 复制到剪贴板
copy(localStorage.getItem('aiQuizLeaderboard'));

// 或下载为文件
const data = localStorage.getItem('aiQuizLeaderboard');
const blob = new Blob([data], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'leaderboard.json';
a.click();
```

#### 导入排行榜数据
```javascript
// 从JSON字符串导入
const jsonData = '...'; // 你的JSON数据
localStorage.setItem('aiQuizLeaderboard', jsonData);
```

### 备份建议

对于正式教学使用，建议定期备份：

#### 方法1：浏览器导出
1. 打开开发者工具
2. 复制 `aiQuizLeaderboard` 的值
3. 保存到文本文件

#### 方法2：屏幕截图
直接截图排行榜界面保存成绩

#### 方法3：手动记录
在纸质或电子表格中记录重要成绩

## 🗄️ 其他数据存储

### 训练数据
- **位置**: `dataset/` 目录
- **内容**: 图片和标注文件
- **格式**: YOLO格式（.txt）

### 模型文件
- **位置**: `backend/runs/detect/*/weights/`
- **文件**: `best.pt`（最佳模型）、`last.pt`（最新模型）

### 日志文件
- **位置**: `logs/` 目录
- **文件**: `backend.log`、`frontend.log`

## 🔧 升级到数据库（可选）

如果需要多设备共享排行榜数据，可以升级到数据库存储：

### 简单方案：SQLite
```python
# 后端添加数据库
import sqlite3

conn = sqlite3.connect('quiz.db')
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY,
        username TEXT,
        score INTEGER,
        correct_count INTEGER,
        total_questions INTEGER,
        timestamp INTEGER
    )
''')
```

### 高级方案：MySQL/PostgreSQL
适合多人同时使用、需要数据分析的场景

## 💡 使用建议

### 课堂教学场景
- **单次课程**: LocalStorage足够使用
- **长期追踪**: 建议定期导出备份
- **多班级**: 每个班级使用不同浏览器或配置文件

### 数据安全
- 定期备份重要成绩
- 教学结束后导出数据
- 不要随意清除浏览器缓存

---

**注意**: 目前系统使用LocalStorage是最简单可靠的方案，适合教学演示使用。如需长期存储或多设备共享，请联系开发者升级到数据库方案。
