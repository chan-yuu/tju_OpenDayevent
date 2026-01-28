# 安装与部署指南

## 📋 系统要求

### 最低要求
- **操作系统**: Linux, macOS, Windows
- **Python**: 3.8 或更高版本
- **内存**: 512MB
- **磁盘空间**: 500MB

### 推荐配置
- **操作系统**: Ubuntu 20.04+ / macOS 11+ / Windows 10+
- **Python**: 3.9+
- **内存**: 2GB+
- **浏览器**: Chrome 90+ / Firefox 88+ / Edge 90+

## 🚀 安装步骤

### 方式一：快速安装（推荐）

#### Linux / macOS
```bash
# 1. 进入demo目录
cd demo

# 2. 运行启动脚本
chmod +x start.sh
./start.sh
```

启动脚本会自动：
- 检查Python环境
- 安装后端依赖
- 安装python_motion_planning库
- 启动服务器

#### Windows
```powershell
# 1. 进入demo目录
cd demo

# 2. 手动执行安装步骤（见方式二）
```

### 方式二：手动安装

#### 步骤1: 克隆或下载项目
```bash
# 如果从Git克隆
git clone <repository-url>
cd tju-planner-lab

# 或解压下载的压缩包
unzip tju-planner-lab.zip
cd tju-planner-lab
```

#### 步骤2: 安装Python依赖
```bash
# 安装后端依赖
cd demo/backend
pip install -r requirements.txt

# 返回项目根目录
cd ../..
```

#### 步骤3: 安装python_motion_planning
```bash
cd python_motion_planning
pip install -e .
cd ..
```

#### 步骤4: 启动服务器
```bash
cd demo/backend
python main.py
```

#### 步骤5: 访问应用
在浏览器中打开：`http://localhost:8000`

## 🔧 详细配置

### Python环境配置

#### 使用虚拟环境（推荐）
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 然后执行安装步骤
```

#### 使用Conda
```bash
# 创建conda环境
conda create -n motion_planning python=3.9
conda activate motion_planning

# 安装依赖
cd demo/backend
pip install -r requirements.txt
```

### 依赖项说明

#### 后端依赖 (backend/requirements.txt)
```
fastapi==0.109.0      # Web框架
uvicorn[standard]==0.27.0  # ASGI服务器
pydantic==2.5.3       # 数据验证
numpy==1.24.3         # 数值计算
```

#### python_motion_planning依赖
```
numpy                 # 数值计算
scipy                 # 科学计算
matplotlib            # 绘图（后端可选）
osqp                  # 优化求解器
gymnasium             # 环境模拟
faiss-cpu             # 向量搜索
pyvista              # 3D可视化（可选）
pyvistaqt            # Qt界面（可选）
```

## 🐛 常见问题解决

### 问题1: pip安装失败

**症状**: `pip install` 命令报错

**解决方案**:
```bash
# 升级pip
pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或使用阿里云镜像
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
```

### 问题2: python_motion_planning安装失败

**症状**: `ERROR: File "setup.py" not found`

**解决方案**:
```bash
# 确保在正确的目录
cd python_motion_planning

# 检查是否有setup.py
ls setup.py

# 如果没有，使用项目提供的setup.py
# (已在项目中创建)

# 重新安装
pip install -e .
```

### 问题3: 端口8000被占用

**症状**: `Address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
# Linux/macOS:
lsof -i :8000
# Windows:
netstat -ano | findstr :8000

# 杀死进程或使用其他端口
# 修改 backend/main.py 最后一行:
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### 问题4: 前端无法访问

**症状**: 浏览器显示连接失败

**解决方案**:
```bash
# 1. 检查后端是否启动
ps aux | grep python

# 2. 检查防火墙设置
# Linux:
sudo ufw allow 8000
# macOS:
# 系统偏好设置 -> 安全性与隐私 -> 防火墙

# 3. 尝试使用localhost
http://localhost:8000

# 4. 查看后端日志
# 终端会显示访问日志
```

### 问题5: 规划失败

**症状**: 点击"开始规划"后报错

**解决方案**:
```bash
# 1. 检查是否设置了起点和终点
# 2. 查看浏览器控制台错误
F12 -> Console

# 3. 查看后端日志
# 终端会显示Python错误

# 4. 确认算法模块正确导入
python -c "from python_motion_planning.path_planner.graph_search import AStar; print('OK')"
```

### 问题6: 模块导入错误

**症状**: `ModuleNotFoundError: No module named 'python_motion_planning'`

**解决方案**:
```bash
# 1. 确认安装路径
pip show python-motion-planning

# 2. 检查Python路径
python -c "import sys; print('\n'.join(sys.path))"

# 3. 重新安装
cd python_motion_planning
pip uninstall python-motion-planning
pip install -e .

# 4. 或者直接修改后端代码添加路径
# 在 backend/main.py 开头已有路径处理
```

## 🌐 网络配置

### 局域网访问

如果想让局域网内其他设备访问：

#### 1. 获取本机IP
```bash
# Linux/macOS:
ifconfig | grep "inet "
# 或
ip addr show

# Windows:
ipconfig
```

#### 2. 修改访问地址
```bash
# 其他设备访问：
http://192.168.x.x:8000
```

#### 3. 配置防火墙
```bash
# Linux (Ubuntu):
sudo ufw allow 8000/tcp

# macOS:
# 系统偏好设置 -> 安全性与隐私 -> 防火墙 -> 防火墙选项
# 添加Python应用

# Windows:
# 控制面板 -> Windows Defender 防火墙 -> 高级设置
# 入站规则 -> 新建规则 -> 端口 -> TCP 8000
```

### 生产环境部署

#### 使用Gunicorn (推荐用于生产)
```bash
# 安装gunicorn
pip install gunicorn

# 启动（4个工作进程）
cd demo/backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### 使用Nginx反向代理
```nginx
# /etc/nginx/sites-available/motion-planning
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 使用Docker（可选）
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY demo/backend/requirements.txt .
RUN pip install -r requirements.txt

COPY python_motion_planning /app/python_motion_planning
RUN cd python_motion_planning && pip install -e .

COPY demo /app/demo

WORKDIR /app/demo/backend
CMD ["python", "main.py"]
```

```bash
# 构建镜像
docker build -t motion-planning-demo .

# 运行容器
docker run -p 8000:8000 motion-planning-demo
```

## 📊 性能优化

### 1. Python优化
```bash
# 使用PyPy（更快的Python实现）
pypy3 -m pip install -r requirements.txt
pypy3 main.py
```

### 2. 缓存配置
在 `backend/main.py` 中添加缓存：
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def cached_plan(map_hash, algorithm):
    # 缓存规划结果
    pass
```

### 3. 数据库优化
如果添加数据持久化：
```bash
# 使用SQLite或PostgreSQL
pip install sqlalchemy psycopg2-binary
```

## 🔐 安全建议

### 生产环境
1. **禁用调试模式**
2. **配置HTTPS**
3. **限制CORS来源**
4. **添加认证机制**
5. **限制请求频率**

### 示例配置
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # 具体域名
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## 📝 验证安装

### 检查清单
```bash
# 1. Python版本
python --version  # 应该 >= 3.8

# 2. 依赖安装
pip list | grep fastapi
pip list | grep python-motion-planning

# 3. 启动测试
cd demo/backend
python main.py

# 4. API测试
curl http://localhost:8000/api/algorithms

# 5. 前端访问
# 浏览器打开 http://localhost:8000
```

### 预期输出
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

## 🆘 获取帮助

### 日志查看
```bash
# 查看完整启动日志
python main.py 2>&1 | tee server.log

# 查看浏览器控制台
F12 -> Console -> Network
```

### 调试模式
```python
# backend/main.py
# 添加调试输出
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 社区支持
- 查看项目Issues
- 阅读完整文档
- 提交问题报告

---

**安装完成后，开始使用吧！** 🎉
