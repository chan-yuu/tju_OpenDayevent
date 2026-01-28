"""
智能车路径规划与控制Demo - 后端API服务
使用FastAPI框架，集成python_motion_planning库
"""
import sys
import os
from pathlib import Path

# 添加python_motion_planning路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python_motion_planning" / "src"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Tuple
import time
import json
import numpy as np

# 导入规划算法
from python_motion_planning.path_planner.graph_search import (
    AStar, Dijkstra, GBFS, JPS, ThetaStar, LazyThetaStar
)
from python_motion_planning.path_planner.sample_search import (
    RRT, RRTStar, RRTConnect
)
from python_motion_planning.path_planner.hybrid_search import VoronoiPlanner
from python_motion_planning.common.env.map import Grid
from python_motion_planning.common.env.node import Node

# 导入控制算法
from python_motion_planning.controller.path_tracker import (
    PID, PurePursuit, DWA
)
from python_motion_planning.common.env.robot import DiffDriveRobot
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="智能车路径规划与控制系统 API")

# 添加422错误处理器
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"422 验证错误:")
    print(f"  URL: {request.url}")
    print(f"  错误详情: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件
frontend_path = Path(__file__).resolve().parent.parent / "frontend"
leaderboard_file = Path(__file__).resolve().parent / "leaderboard.json"

# 存储排行榜数据
leaderboard_data = []

# 从文件加载排行榜数据
def load_leaderboard():
    global leaderboard_data
    if leaderboard_file.exists():
        try:
            with open(leaderboard_file, 'r', encoding='utf-8') as f:
                leaderboard_data = json.load(f)
            print(f"✓ 已加载 {len(leaderboard_data)} 条排行榜记录")
        except Exception as e:
            print(f"加载排行榜失败: {e}")
            leaderboard_data = []
    else:
        print("排行榜文件不存在，将创建新文件")

# 保存排行榜数据到文件
def save_leaderboard():
    try:
        with open(leaderboard_file, 'w', encoding='utf-8') as f:
            json.dump(leaderboard_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存排行榜失败: {e}")

# 启动时加载排行榜
load_leaderboard()

if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")
else:
    print(f"Warning: Frontend directory not found at {frontend_path}")

# 数据模型
class MapConfig(BaseModel):
    width: int
    height: int
    obstacles: List[List[int]]
    start: List[int]
    goal: List[int]

class PlanRequest(BaseModel):
    map_config: MapConfig
    algorithm: str
    params: Optional[Dict[str, Any]] = {}

class PlanResponse(BaseModel):
    success: bool
    path: List[List[int]]
    expanded_nodes: List[List[int]]
    computation_time: float
    path_length: float
    nodes_explored: int
    message: str = ""

# 算法映射
ALGORITHM_MAP = {
    "astar": AStar,
    "dijkstra": Dijkstra,
    "gbfs": GBFS,
    "jps": JPS,
    "theta_star": ThetaStar,
    "lazy_theta_star": LazyThetaStar,
    "rrt": RRT,
    "rrt_star": RRTStar,
    "rrt_connect": RRTConnect,
    "voronoi": VoronoiPlanner,
}

def create_grid_map(map_config: MapConfig) -> Tuple[Grid, Node, Node]:
    """创建地图对象"""
    # 创建地图数据 (注意：Grid使用(width, height)顺序)
    map_data = np.zeros((map_config.width, map_config.height), dtype=np.int8)
    for obs in map_config.obstacles:
        x, y = obs
        if 0 <= x < map_config.width and 0 <= y < map_config.height:
            map_data[x][y] = 1
    
    # 创建Grid对象 (bounds格式: [[x_min, x_max], [y_min, y_max]])
    grid = Grid(
        bounds=[[0, map_config.width], [0, map_config.height]],
        resolution=1.0,
        type_map=map_data
    )
    
    # 创建起点和终点 (Node接受tuple作为current参数)
    start = Node(tuple(map_config.start))
    goal = Node(tuple(map_config.goal))
    
    return grid, start, goal

def calculate_path_length(path: List[Tuple[int, int]]) -> float:
    """计算路径长度"""
    if len(path) < 2:
        return 0.0
    
    length = 0.0
    for i in range(len(path) - 1):
        dx = path[i+1][0] - path[i][0]
        dy = path[i+1][1] - path[i][1]
        length += np.sqrt(dx**2 + dy**2)
    return length

@app.get("/")
async def root():
    """根路径重定向到前端页面"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/static/index.html")

@app.get("/api/algorithms")
async def get_algorithms():
    """获取所有可用的算法列表"""
    return {
        "algorithms": [
            {"id": "astar", "name": "A*", "category": "graph_search"},
            {"id": "dijkstra", "name": "Dijkstra", "category": "graph_search"},
            {"id": "gbfs", "name": "GBFS", "category": "graph_search"},
            {"id": "jps", "name": "JPS", "category": "graph_search"},
            {"id": "theta_star", "name": "Theta*", "category": "graph_search"},
            {"id": "lazy_theta_star", "name": "Lazy Theta*", "category": "graph_search"},
            {"id": "rrt", "name": "RRT", "category": "sample_search"},
            {"id": "rrt_star", "name": "RRT*", "category": "sample_search"},
            {"id": "rrt_connect", "name": "RRT-Connect", "category": "sample_search"},
            {"id": "voronoi", "name": "Voronoi Planner", "category": "hybrid_search"},
        ]
    }

@app.get("/api/scenarios")
async def get_scenarios():
    """获取所有预设场景列表"""
    scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
    scenarios = []
    
    if scenarios_dir.exists():
        for scenario_file in scenarios_dir.glob("*.json"):
            try:
                with open(scenario_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    scenarios.append({
                        "id": scenario_file.stem,
                        "name": data.get("name", scenario_file.stem),
                        "description": data.get("description", "")
                    })
            except Exception as e:
                print(f"Error loading scenario {scenario_file}: {e}")
    
    return {"scenarios": scenarios}

@app.get("/api/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    """获取指定场景的详细数据"""
    scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
    scenario_file = scenarios_dir / f"{scenario_id}.json"
    
    if not scenario_file.exists():
        raise HTTPException(status_code=404, detail=f"场景未找到: {scenario_id}")
    
    try:
        with open(scenario_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"加载场景失败: {str(e)}")

@app.post("/api/plan", response_model=PlanResponse)
async def plan_path(request: PlanRequest):
    """执行路径规划"""
    try:
        # 获取算法类
        algorithm_name = request.algorithm.lower()
        if algorithm_name not in ALGORITHM_MAP:
            raise HTTPException(status_code=400, detail=f"未知算法: {request.algorithm}")
        
        AlgorithmClass = ALGORITHM_MAP[algorithm_name]
        
        # 创建地图
        grid, start, goal = create_grid_map(request.map_config)
        
        # 创建规划器实例 (参数顺序: map_, start, goal)
        planner = AlgorithmClass(map_=grid, start=start.current, goal=goal.current)
        
        # 执行规划
        start_time = time.time()
        result = planner.plan()
        computation_time = time.time() - start_time
        
        # 解析返回结果 (path, path_info)
        if isinstance(result, tuple) and len(result) == 2:
            path, path_info = result
            expanded = path_info.get("expand", {})
        else:
            path = result if isinstance(result, list) else []
            expanded = {}
        
        # 转换路径格式 - 确保节点是tuple或list类型
        path_list = []
        if path:
            for node in path:
                if isinstance(node, (tuple, list)) and len(node) >= 2:
                    path_list.append([int(node[0]), int(node[1])])
        
        # 转换扩展节点格式 - expanded是字典 {tuple: Node}
        expanded_list = []
        if expanded:
            if isinstance(expanded, dict):
                # expanded是字典，键是tuple
                for node_tuple in expanded.keys():
                    if isinstance(node_tuple, (tuple, list)) and len(node_tuple) >= 2:
                        expanded_list.append([int(node_tuple[0]), int(node_tuple[1])])
            elif isinstance(expanded, list):
                # expanded是列表
                for node in expanded:
                    if isinstance(node, (tuple, list)) and len(node) >= 2:
                        expanded_list.append([int(node[0]), int(node[1])])
        
        # 计算路径长度
        path_length = calculate_path_length(path) if path else 0.0
        
        success = len(path_list) > 0
        
        return PlanResponse(
            success=success,
            path=path_list,
            expanded_nodes=expanded_list,
            computation_time=computation_time,
            path_length=path_length,
            nodes_explored=len(expanded_list),
            message="规划成功" if success else "未找到路径"
        )
        
    except Exception as e:
        return PlanResponse(
            success=False,
            path=[],
            expanded_nodes=[],
            computation_time=0.0,
            path_length=0.0,
            nodes_explored=0,
            message=f"规划失败: {str(e)}"
        )

@app.get("/api/scenarios")
async def get_scenarios():
    """获取预设场景列表"""
    scenarios_dir = Path(__file__).parent.parent / "scenarios"
    scenarios = []
    
    if scenarios_dir.exists():
        for file in scenarios_dir.glob("*.json"):
            with open(file, 'r', encoding='utf-8') as f:
                scenario = json.load(f)
                scenarios.append({
                    "id": file.stem,
                    "name": scenario.get("name", file.stem),
                    "description": scenario.get("description", ""),
                })
    
    return {"scenarios": scenarios}

@app.get("/api/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    """获取特定场景的配置"""
    scenario_file = Path(__file__).parent.parent / "scenarios" / f"{scenario_id}.json"
    
    if not scenario_file.exists():
        raise HTTPException(status_code=404, detail="场景不存在")
    
    with open(scenario_file, 'r', encoding='utf-8') as f:
        scenario = json.load(f)
    
    return scenario

class SaveScenarioRequest(BaseModel):
    """保存场景请求"""
    name: str
    description: str
    width: int
    height: int
    start: List[int]
    goal: List[int]
    obstacles: List[List[int]]

@app.post("/api/scenarios/save")
async def save_scenario(request: SaveScenarioRequest):
    """保存自定义场景"""
    # 生成文件名（使用name的拼音或英文，这里简化处理）
    import re
    filename = re.sub(r'[^\w\s-]', '', request.name).strip().replace(' ', '_').lower()
    if not filename:
        filename = f"custom_{int(time.time())}"
    
    # 保存到demo/scenarios目录（与backend、frontend同级）
    backend_dir = Path(__file__).parent  # backend目录
    demo_dir = backend_dir.parent  # demo目录
    scenarios_dir = demo_dir / "../scenarios"
    scenarios_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"保存场景到目录: {scenarios_dir.absolute()}")
    
    scenario_file = scenarios_dir / f"{filename}.json"
    
    # 检查文件是否已存在
    counter = 1
    original_filename = filename
    while scenario_file.exists():
        filename = f"{original_filename}_{counter}"
        scenario_file = scenarios_dir / f"{filename}.json"
        counter += 1
    
    # 保存场景数据
    scenario_data = {
        "name": request.name,
        "description": request.description,
        "width": request.width,
        "height": request.height,
        "start": request.start,
        "goal": request.goal,
        "obstacles": request.obstacles
    }
    
    with open(scenario_file, 'w', encoding='utf-8') as f:
        json.dump(scenario_data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ 场景已保存: {scenario_file.absolute()}")
    
    return {
        "success": True,
        "message": f"场景已保存为 {filename}",
        "scenario_id": filename
    }

# ==================== 控制相关API ====================

class ControlRequest(BaseModel):
    """控制请求"""
    path: List[List[float]]  # 路径点列表
    controller: str  # 控制器类型
    vehicle_type: str = "diff_drive"  # 车辆类型
    params: Optional[Dict[str, Any]] = {}  # 控制器参数

class PIDCompareRequest(BaseModel):
    """PID对比请求"""
    path: List[List[float]]  # 路径点列表
    start: Optional[List[float]] = None
    goal: Optional[List[float]] = None

class ControlResponse(BaseModel):
    """控制响应"""
    success: bool
    trajectory: List[Dict[str, float]]  # [{x, y, theta, v, omega}, ...]
    computation_time: float
    message: str = ""

# 控制器映射
CONTROLLER_MAP = {
    "pid": PID,
    "pure_pursuit": PurePursuit,
    "dwa": DWA,
}

@app.get("/api/controllers")
async def get_controllers():
    """获取所有可用的控制器"""
    return {
        "controllers": [
            {"id": "pid", "name": "PID控制器", "description": "经典PID控制，简单高效"},
            {"id": "pure_pursuit", "name": "Pure Pursuit", "description": "几何跟踪算法，平滑稳定"},
            {"id": "dwa", "name": "DWA动态窗口", "description": "考虑动力学约束的局部避障"},
        ],
        "vehicles": [
            {"id": "diff_drive", "name": "差速驱动", "icon": "🚗", "description": "两轮差速驱动机器人"},
            {"id": "car_like", "name": "类车模型", "icon": "🚙", "description": "阿克曼转向模型"},
        ]
    }

@app.post("/api/control", response_model=ControlResponse)
async def execute_control(request: ControlRequest):
    """执行轨迹跟踪控制"""
    try:
        # 获取控制器类
        controller_name = request.controller.lower()
        if controller_name not in CONTROLLER_MAP:
            raise HTTPException(status_code=400, detail=f"未知控制器: {request.controller}")
        
        # 简化版本：直接返回模拟数据
        # TODO: 实际调用控制器进行仿真
        
        start_time = time.time()
        
        # 模拟轨迹生成
        trajectory = []
        for i, point in enumerate(request.path):
            trajectory.append({
                "x": float(point[0]),
                "y": float(point[1]),
                "theta": 0.0,
                "v": 1.0,
                "omega": 0.0,
                "t": i * 0.1
            })
        
        computation_time = time.time() - start_time
        
        return ControlResponse(
            success=True,
            trajectory=trajectory,
            computation_time=computation_time,
            message="控制执行成功"
        )
        
    except Exception as e:
        return ControlResponse(
            success=False,
            trajectory=[],
            computation_time=0.0,
            message=f"控制失败: {str(e)}"
        )

@app.post("/api/control/compare-pid")
async def compare_pid(request: PIDCompareRequest):
    """
    对比不同PID参数的控制效果
    """
    try:
        print(f"收到PID对比请求:")
        print(f"  路径点数量: {len(request.path)}")
        print(f"  起点: {request.start}")
        print(f"  终点: {request.goal}")
        print(f"  路径前3点: {request.path[:3] if len(request.path) >= 3 else request.path}")
    except Exception as e:
        print(f"解析请求失败: {e}")
        raise
    
    try:
        # 定义4组对比参数
        pid_configs = {
            "conservative": {"kp": 0.6, "ki": 0.01, "kd": 0.4, "speed": 0.6, "color": "#00d4ff"},
            "balanced": {"kp": 1.0, "ki": 0.03, "kd": 0.5, "speed": 0.8, "color": "#00ff88"},
            "aggressive": {"kp": 1.5, "ki": 0.05, "kd": 0.3, "speed": 1.0, "color": "#ff4444"},
            "slow": {"kp": 0.8, "ki": 0.02, "kd": 0.6, "speed": 0.4, "color": "#ffaa00"}
        }
        
        results = {}
        
        # 对每组参数进行模拟
        for name, config in pid_configs.items():
            trajectory = []
            cte_list = []
            heading_error_list = []
            
            # 初始化车辆状态
            x, y = request.path[0]
            theta = 0.0
            v = config["speed"]
            path_index = 0
            
            # PID控制器状态
            integral = 0.0
            prev_error = 0.0
            
            dt = 0.05  # 50ms
            max_steps = 2000
            
            for step in range(max_steps):
                # 找最近路径点
                min_dist = float('inf')
                closest_idx = path_index
                for i in range(max(0, path_index-5), min(len(request.path), path_index+20)):
                    dx = request.path[i][0] - x
                    dy = request.path[i][1] - y
                    dist = (dx**2 + dy**2)**0.5
                    if dist < min_dist:
                        min_dist = dist
                        closest_idx = i
                
                path_index = closest_idx
                
                # 前视点
                lookahead = 3.0
                target_idx = closest_idx
                acc_dist = 0
                for i in range(closest_idx, len(request.path)-1):
                    dx = request.path[i+1][0] - request.path[i][0]
                    dy = request.path[i+1][1] - request.path[i][1]
                    acc_dist += (dx**2 + dy**2)**0.5
                    if acc_dist >= lookahead:
                        target_idx = i + 1
                        break
                
                if target_idx >= len(request.path) - 1:
                    target_idx = len(request.path) - 1
                
                # 计算CTE
                target_x, target_y = request.path[target_idx]
                dx = target_x - x
                dy = target_y - y
                target_heading = np.arctan2(dy, dx)
                
                # 使用路径切线计算CTE
                path_dx = request.path[target_idx][0] - request.path[closest_idx][0]
                path_dy = request.path[target_idx][1] - request.path[closest_idx][1]
                path_len = (path_dx**2 + path_dy**2)**0.5
                
                if path_len > 0.01:
                    path_tx = path_dx / path_len
                    path_ty = path_dy / path_len
                    veh_dx = x - request.path[closest_idx][0]
                    veh_dy = y - request.path[closest_idx][1]
                    cte = -(veh_dx * path_ty - veh_dy * path_tx)
                else:
                    cte = 0.0
                
                # 航向误差
                heading_error = target_heading - theta
                while heading_error > np.pi:
                    heading_error -= 2 * np.pi
                while heading_error < -np.pi:
                    heading_error += 2 * np.pi
                
                # 检查是否到达终点
                goal_x, goal_y = request.path[-1]
                goal_dist = ((goal_x - x)**2 + (goal_y - y)**2)**0.5
                if goal_dist < 1.5:
                    break
                
                # PID控制
                integral += cte * dt
                integral = max(-5.0, min(5.0, integral))
                derivative = (cte - prev_error) / dt
                prev_error = cte
                
                steering = -(config["kp"] * cte + config["ki"] * integral + config["kd"] * derivative)
                heading_control = 0.8 * heading_error
                omega = steering + heading_control
                omega = max(-2.5, min(2.5, omega))
                
                # 更新状态
                theta += omega * dt
                while theta > np.pi:
                    theta -= 2 * np.pi
                while theta < -np.pi:
                    theta += 2 * np.pi
                
                x += v * np.cos(theta) * dt
                y += v * np.sin(theta) * dt
                
                trajectory.append([float(x), float(y)])
                cte_list.append(float(cte))
                heading_error_list.append(float(heading_error))
            
            # 计算统计数据
            avg_cte = sum(abs(c) for c in cte_list) / len(cte_list) if cte_list else 0
            max_cte = max(abs(c) for c in cte_list) if cte_list else 0
            avg_heading = sum(abs(h) for h in heading_error_list) / len(heading_error_list) if heading_error_list else 0
            
            results[name] = {
                "trajectory": trajectory,
                "stats": {
                    "avg_cte": round(avg_cte, 4),
                    "max_cte": round(max_cte, 4),
                    "avg_heading_deg": round(avg_heading * 180 / np.pi, 2),
                    "steps": len(trajectory)
                },
                "config": config,
                "cte_data": cte_list,
                "heading_data": heading_error_list
            }
        
        return {
            "success": True,
            "results": results,
            "message": "PID参数对比完成"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"对比失败: {str(e)}")

# 排行榜相关API
class QuizScore(BaseModel):
    username: str
    score: int
    total: int
    time_spent: float
    timestamp: str

@app.post("/api/quiz/submit")
async def submit_quiz_score(score_data: QuizScore):
    """提交答题成绩"""
    leaderboard_data.append(score_data.dict())
    # 按分数降序，时间升序排序
    leaderboard_data.sort(key=lambda x: (-x['score'], x['time_spent']))
    # 保存到文件
    save_leaderboard()
    return {"success": True, "rank": leaderboard_data.index(score_data.dict()) + 1}

@app.get("/api/quiz/leaderboard")
async def get_leaderboard():
    """获取排行榜"""
    return {"success": True, "data": leaderboard_data[:50]}  # 返回前50名

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
