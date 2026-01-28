# API 文档

本文档描述了自动驾驶决策规划演示系统的后端API接口。

## 基础信息

- **Base URL**: `http://localhost:8000`
- **API前缀**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 自动文档

启动服务器后，访问以下地址查看交互式API文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 端点列表

### 1. 根路径

#### GET `/`
重定向到前端页面

**响应**:
```
Status: 302 Redirect
Location: /static/index.html
```

---

### 2. 获取算法列表

#### GET `/api/algorithms`
获取所有可用的路径规划算法

**请求示例**:
```bash
curl http://localhost:8000/api/algorithms
```

**响应示例**:
```json
{
  "algorithms": [
    {
      "id": "astar",
      "name": "A*",
      "category": "graph_search"
    },
    {
      "id": "dijkstra",
      "name": "Dijkstra",
      "category": "graph_search"
    },
    {
      "id": "rrt",
      "name": "RRT",
      "category": "sample_search"
    }
  ]
}
```

**响应字段**:
- `id` (string): 算法唯一标识符
- `name` (string): 算法显示名称
- `category` (string): 算法分类
  - `graph_search`: 图搜索算法
  - `sample_search`: 采样算法
  - `hybrid_search`: 混合算法

---

### 3. 路径规划

#### POST `/api/plan`
执行路径规划

**请求体**:
```json
{
  "map_config": {
    "width": 50,
    "height": 50,
    "obstacles": [[10, 10], [10, 11], [11, 10]],
    "start": [5, 5],
    "goal": [45, 45]
  },
  "algorithm": "astar",
  "params": {}
}
```

**请求字段**:
- `map_config` (object, 必需): 地图配置
  - `width` (integer): 地图宽度
  - `height` (integer): 地图高度
  - `obstacles` (array): 障碍物坐标列表 `[[x1,y1], [x2,y2], ...]`
  - `start` (array): 起点坐标 `[x, y]`
  - `goal` (array): 终点坐标 `[x, y]`
- `algorithm` (string, 必需): 算法ID
- `params` (object, 可选): 算法参数（暂未使用）

**请求示例**:
```bash
curl -X POST http://localhost:8000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "map_config": {
      "width": 50,
      "height": 50,
      "obstacles": [[10,10], [10,11], [10,12]],
      "start": [5, 5],
      "goal": [45, 45]
    },
    "algorithm": "astar"
  }'
```

**成功响应**:
```json
{
  "success": true,
  "path": [[5,5], [6,6], [7,7], ..., [45,45]],
  "expanded_nodes": [[5,5], [6,5], [5,6], ...],
  "computation_time": 0.0253,
  "path_length": 68.42,
  "nodes_explored": 342,
  "message": "规划成功"
}
```

**失败响应**:
```json
{
  "success": false,
  "path": [],
  "expanded_nodes": [],
  "computation_time": 0.015,
  "path_length": 0.0,
  "nodes_explored": 150,
  "message": "未找到路径"
}
```

**响应字段**:
- `success` (boolean): 规划是否成功
- `path` (array): 路径坐标列表，从起点到终点
- `expanded_nodes` (array): 算法扩展的节点坐标列表
- `computation_time` (float): 计算耗时（秒）
- `path_length` (float): 路径总长度
- `nodes_explored` (integer): 探索的节点总数
- `message` (string): 状态消息

---

### 4. 获取场景列表

#### GET `/api/scenarios`
获取所有预设场景

**请求示例**:
```bash
curl http://localhost:8000/api/scenarios
```

**响应示例**:
```json
{
  "scenarios": [
    {
      "id": "simple_maze",
      "name": "简单迷宫",
      "description": "基础迷宫场景，适合测试图搜索算法"
    },
    {
      "id": "parking_lot",
      "name": "停车场场景",
      "description": "模拟停车场环境，有多个停车位和通道"
    }
  ]
}
```

**响应字段**:
- `id` (string): 场景唯一标识符
- `name` (string): 场景显示名称
- `description` (string): 场景描述

---

### 5. 获取场景详情

#### GET `/api/scenarios/{scenario_id}`
获取特定场景的完整配置

**路径参数**:
- `scenario_id` (string): 场景ID

**请求示例**:
```bash
curl http://localhost:8000/api/scenarios/simple_maze
```

**响应示例**:
```json
{
  "name": "简单迷宫",
  "description": "基础迷宫场景，适合测试图搜索算法",
  "map": {
    "width": 50,
    "height": 50,
    "obstacles": [[10,5], [10,6], [10,7], ...],
    "start": [5, 10],
    "goal": [45, 25]
  }
}
```

**错误响应** (404):
```json
{
  "detail": "场景不存在"
}
```

---

## 数据模型

### MapConfig
```typescript
interface MapConfig {
  width: number;        // 1-100
  height: number;       // 1-100
  obstacles: [number, number][];  // [[x,y], ...]
  start: [number, number];        // [x, y]
  goal: [number, number];         // [x, y]
}
```

### PlanRequest
```typescript
interface PlanRequest {
  map_config: MapConfig;
  algorithm: string;     // 算法ID
  params?: object;       // 可选参数
}
```

### PlanResponse
```typescript
interface PlanResponse {
  success: boolean;
  path: [number, number][];
  expanded_nodes: [number, number][];
  computation_time: number;  // 秒
  path_length: number;
  nodes_explored: number;
  message: string;
}
```

---

## 错误处理

### HTTP状态码

- `200 OK`: 请求成功
- `302 Found`: 重定向
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

### 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

### 常见错误

#### 1. 未知算法
```json
{
  "detail": "未知算法: unknown_algorithm"
}
```

#### 2. 场景不存在
```json
{
  "detail": "场景不存在"
}
```

#### 3. 参数验证失败
```json
{
  "detail": [
    {
      "loc": ["body", "map_config", "width"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 使用示例

### Python示例

```python
import requests

# 基础URL
base_url = "http://localhost:8000"

# 1. 获取算法列表
response = requests.get(f"{base_url}/api/algorithms")
algorithms = response.json()["algorithms"]
print(f"可用算法: {[alg['name'] for alg in algorithms]}")

# 2. 执行路径规划
plan_request = {
    "map_config": {
        "width": 50,
        "height": 50,
        "obstacles": [[10, i] for i in range(10, 20)],
        "start": [5, 5],
        "goal": [45, 45]
    },
    "algorithm": "astar"
}

response = requests.post(
    f"{base_url}/api/plan",
    json=plan_request
)

result = response.json()
if result["success"]:
    print(f"路径长度: {result['path_length']:.2f}")
    print(f"计算时间: {result['computation_time']*1000:.2f} ms")
    print(f"节点数: {result['nodes_explored']}")
else:
    print(f"规划失败: {result['message']}")

# 3. 加载场景
response = requests.get(f"{base_url}/api/scenarios/simple_maze")
scenario = response.json()
print(f"场景: {scenario['name']}")
print(f"障碍物数: {len(scenario['map']['obstacles'])}")
```

### JavaScript示例

```javascript
const baseUrl = 'http://localhost:8000';

// 1. 获取算法列表
async function getAlgorithms() {
  const response = await fetch(`${baseUrl}/api/algorithms`);
  const data = await response.json();
  return data.algorithms;
}

// 2. 执行路径规划
async function planPath(mapConfig, algorithm) {
  const response = await fetch(`${baseUrl}/api/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      map_config: mapConfig,
      algorithm: algorithm
    })
  });
  return await response.json();
}

// 3. 使用示例
const mapConfig = {
  width: 50,
  height: 50,
  obstacles: [[10, 10], [10, 11], [10, 12]],
  start: [5, 5],
  goal: [45, 45]
};

planPath(mapConfig, 'astar').then(result => {
  if (result.success) {
    console.log(`路径长度: ${result.path_length.toFixed(2)}`);
    console.log(`计算时间: ${(result.computation_time * 1000).toFixed(2)} ms`);
  } else {
    console.log(`规划失败: ${result.message}`);
  }
});
```

### cURL示例

```bash
# 1. 获取算法列表
curl -X GET http://localhost:8000/api/algorithms

# 2. 规划路径
curl -X POST http://localhost:8000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "map_config": {
      "width": 50,
      "height": 50,
      "obstacles": [[10,10], [10,11]],
      "start": [5, 5],
      "goal": [45, 45]
    },
    "algorithm": "astar"
  }'

# 3. 获取场景列表
curl -X GET http://localhost:8000/api/scenarios

# 4. 获取场景详情
curl -X GET http://localhost:8000/api/scenarios/simple_maze

# 5. 格式化输出（使用jq）
curl -s http://localhost:8000/api/algorithms | jq .
```

---

## 性能考虑

### 请求限制
当前版本没有请求频率限制，但建议：
- 避免并发大量请求
- 复杂地图可能需要较长计算时间
- 采样算法（RRT等）耗时较长

### 超时设置
建议设置合理的超时时间：
- 简单地图: 1-5秒
- 复杂地图: 5-30秒
- 采样算法: 10-60秒

### 最佳实践
1. 先测试小地图
2. 逐步增加复杂度
3. 选择合适的算法
4. 缓存常用配置

---

## 版本信息

- **API版本**: 1.0
- **最后更新**: 2026-01-27
- **维护状态**: 活跃开发中

---

## 更新日志

### v1.0 (2026-01-27)
- 初始版本发布
- 支持10种路径规划算法
- 提供场景管理功能
- 实时性能统计

---

**完整的交互式文档请访问**: http://localhost:8000/docs 🚀
