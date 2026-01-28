# 项目更新日志

## 版本 2.0 (2026-01-27)

### 🎯 重大更新

#### 1. 文件结构重组
- ✅ 创建规范的项目目录结构
- ✅ 前端代码移至 `src/` 目录
  - `src/App.tsx` - 主应用
  - `src/components/` - React组件
  - `src/services/` - 服务层
  - `src/data/` - 数据文件
- ✅ 脚本文件移至 `scripts/` 目录
- ✅ 静态资源移至 `assets/` 目录
- ✅ 文档移至 `docs/` 目录

#### 2. 一键安装脚本
- ✅ 创建 `scripts/install.sh` 自动化安装脚本
- ✅ 自动检测并安装 Node.js
- ✅ 自动检测并安装 Python
- ✅ 自动安装前后端依赖
- ✅ 自动创建桌面快捷方式
- ✅ 彩色终端输出，友好的用户界面

#### 3. 数据持久化
- ✅ 确认排行榜数据保存到浏览器 LocalStorage
- ✅ 键名：`aiQuizLeaderboard`
- ✅ 自动保存前10名成绩
- ✅ 详细文档：[STORAGE_INFO.md](STORAGE_INFO.md)

#### 4. 识别模块修复
- ✅ 修复模型显示问题：现在正确显示当前使用的模型名称
- ✅ 初始化时正确设置模型名称
- ✅ 切换模型时实时更新显示名称
- ✅ 自定义训练模型显示友好名称（如 "custom_model (自定义训练模型)"）
- ✅ 预训练模型显示大写名称（如 "YOLOV8N"）

### 📁 新增文件

- `PROJECT_STRUCTURE.md` - 完整项目结构文档
- `scripts/install.sh` - 一键安装脚本
- `UPDATE_LOG.md` - 更新日志（本文件）

### 🔧 修改文件

#### 前端
- `index.tsx` - 更新导入路径 `./src/App`
- `src/App.tsx` - 更新导入路径（types, services, components）
- `src/components/QuizSystem.tsx` - 更新 quizData 导入路径

#### 后端
- `backend/main.py`:
  - 初始化时设置正确的模型名称
  - 改进模型切换逻辑
  - 优化模型名称显示格式

#### 脚本
- `scripts/AI-Vision-Lab.desktop` - 更新路径指向新的文件位置
- `scripts/start.sh` - 保持不变（已包含cleanup功能）
- `scripts/stop.sh` - 保持不变

#### 文档
- `README.md` - 更新启动方式和文档链接

### 📊 项目统计

- **总文件数**: 约60+个文件
- **代码行数**: 约5000+行
- **文档数**: 12个Markdown文档
- **功能模块**: 4个（标注/训练/识别/答题）

### 🎯 目录结构对比

#### 之前（混乱）
```
tju-vision-lab/
├── App.tsx (根目录)
├── QuizSystem.tsx (根目录)
├── types.ts (根目录)
├── start.sh (根目录)
├── icon.png (根目录)
└── ...
```

#### 之后（规范）
```
tju-vision-lab/
├── src/               (前端源码)
├── backend/           (后端代码)
├── scripts/           (启动脚本)
├── assets/            (静态资源)
├── docs/              (文档)
├── dataset/           (数据集)
└── ...
```

### 🚀 使用方法

#### 新用户
```bash
# 克隆或下载项目后
cd tju-vision-lab
./scripts/install.sh
# 然后双击桌面快捷方式或运行：
./scripts/start.sh
```

#### 老用户升级
```bash
# 已有项目目录的用户
cd /home/cyun/Documents/tju-vision-lab
git pull  # 或手动更新文件
./scripts/install.sh  # 重新安装依赖和快捷方式
```

### ⚠️ 注意事项

1. **导入路径变化**: 如果你修改过代码，注意更新导入路径
2. **桌面快捷方式**: 旧的快捷方式需要删除，使用新的
3. **启动脚本位置**: `start.sh` 移至 `scripts/start.sh`
4. **排行榜数据**: LocalStorage 数据会保留，无需迁移

### 🔮 后续计划

- [ ] 添加数据库支持（多设备同步排行榜）
- [ ] 导出训练报告功能
- [ ] 模型性能对比工具
- [ ] 视频流实时检测
- [ ] 批量图片处理
- [ ] 教师管理后台

---

## 版本 1.0 (2026-01-26)

### 初始版本功能

- ✅ 数据标注功能
- ✅ 模型训练功能
- ✅ 智能识别功能
- ✅ 知识答题系统（60题）
- ✅ 科技感UI设计
- ✅ 桌面快捷方式
- ✅ 自动启动脚本

---

**维护者**: 天津大学视觉实验室  
**更新时间**: 2026-01-27  
**版本**: 2.0
