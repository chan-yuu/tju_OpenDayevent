// API配置
const API_BASE = 'http://localhost:5000/api';

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// 全局状态
let state = {
    mode: 'node',
    backgroundImage: null,
    nodes: [],
    edges: [],
    vehicles: [],
    tasks: [],
    selectedNode: null,
    edgeInProgress: null,
    hoveredNode: null,
    mapId: null,
    mapName: '',
    isSimulating: false,
    simulationSpeed: 1,
    simulationTime: 0, // 仿真时间（秒）
    completedTasks: 0,
    schedulingAlgorithm: 'intelligent', // intelligent, nearest, balanced
    stats: {
        totalDistance: 0,
        totalTime: 0,
        avgWaitTime: 0,
        batteryUsed: 0,
        totalBatteryConsumed: 0,
        taskStartTime: 0,
        vehicleBusyTime: {}, // 记录每辆车的忙碌时间
        emptyDistance: 0, // 空驶距离（去接货的距离）
        totalTasks: 0 // 总任务数
    }
};

// 用于保存初始状态和对比结果
let initialState = null;
let comparisonResults = {};

// 节点颜色
const nodeColors = {
    '宿舍': '#FF6B6B',
    '大门': '#4ECDC4',
    '教学楼': '#45B7D1',
    '图书馆': '#96CEB4',
    '实验楼': '#FFEAA7',
    '工程馆': '#DFE6E9',
    '食堂': '#FD79A8',
    '充电站': '#00B894'
};

// 初始化
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    document.getElementById('bgImage')?.addEventListener('change', handleImageUpload);
    document.getElementById('saveMap')?.addEventListener('click', saveMap);

    loadDefaultMap();
    loadMapList(); // 加载地图列表
    loadVehiclesList(); // 加载车辆配置列表
    loadTasksList(); // 加载任务配置列表
    render();
    setInterval(updateSimulation, 50);
}

// 调整画布大小
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
}

// 默认加载map.png
function loadDefaultMap() {
    const img = new Image();
    img.onload = function () {
        state.backgroundImage = img;
        render();
    };
    img.onerror = function () {
        console.log('map.png not found');
    };
    img.src = 'map.png';
}

// 切换面板
function switchPanel(panelName) {
    document.querySelectorAll('.panel-section').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${panelName}`).classList.add('active');

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}

// 设置模式
function setMode(mode) {
    state.mode = mode;
    const modeText = {
        'node': '创建节点',
        'edge': '创建边',
        'delete': '删除',
        'view': '查看'
    }[mode];
    showToast(`模式: ${modeText}`);
}

// 处理画布点击
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = findNodeAt(x, y);

    if (state.mode === 'node') {
        createNode(x, y);
    } else if (state.mode === 'edge') {
        handleEdgeClick(x, y, clickedNode);
    } else if (state.mode === 'delete') {
        deleteAt(x, y, clickedNode);
    }
}

// 处理鼠标移动
function handleCanvasMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNode = findNodeAt(x, y);
    if (hoveredNode !== state.hoveredNode) {
        state.hoveredNode = hoveredNode;
        render();
    }
}

// 创建节点
function createNode(x, y) {
    const name = document.getElementById('nodeName')?.value.trim();
    const type = document.getElementById('nodeType')?.value;

    if (!name) {
        showToast('请输入节点名称', 'error');
        return;
    }

    const node = {
        id: Date.now(),
        name: name,
        type: type || '宿舍',
        x: x,
        y: y
    };

    state.nodes.push(node);
    updateNodeList();
    render();
    showToast(`节点"${name}"创建成功`);
    document.getElementById('nodeName').value = '';
}

// 处理边创建
function handleEdgeClick(x, y, clickedNode) {
    if (!state.edgeInProgress) {
        if (clickedNode) {
            state.edgeInProgress = {
                startNode: clickedNode,
                waypoints: []
            };
            showToast(`边起点: ${clickedNode.name}`);
        }
    } else {
        if (clickedNode) {
            if (clickedNode.id !== state.edgeInProgress.startNode.id) {
                createEdge(state.edgeInProgress.startNode, clickedNode, state.edgeInProgress.waypoints);
                state.edgeInProgress = null;
            }
        } else {
            state.edgeInProgress.waypoints.push({ x, y });
            showToast(`折点 ${state.edgeInProgress.waypoints.length}`);
        }
    }
    render();
}

// 创建边
function createEdge(startNode, endNode, waypoints) {
    let length = 0;
    let points = [
        { x: startNode.x, y: startNode.y },
        ...waypoints,
        { x: endNode.x, y: endNode.y }
    ];

    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        length += Math.sqrt(dx * dx + dy * dy);
    }

    const edge = {
        id: Date.now(),
        startNodeId: startNode.id,
        endNodeId: endNode.id,
        waypoints: waypoints,
        length: Math.round(length)
    };

    state.edges.push(edge);
    render();
    showToast(`边创建成功，长度: ${edge.length}px`);
}

// 查找节点
function findNodeAt(x, y) {
    const nodeRadius = 8;
    for (let node of state.nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy <= nodeRadius * nodeRadius) {
            return node;
        }
    }
    return null;
}

// 删除
function deleteAt(x, y, clickedNode) {
    if (clickedNode) {
        state.nodes = state.nodes.filter(n => n.id !== clickedNode.id);
        state.edges = state.edges.filter(e =>
            e.startNodeId !== clickedNode.id && e.endNodeId !== clickedNode.id
        );
        updateNodeList();
        render();
        showToast(`节点"${clickedNode.name}"已删除`);
    }
}

// 更新节点列表
function updateNodeList() {
    const container = document.getElementById('nodeList');
    if (!container) return;

    document.getElementById('nodeCount').textContent = state.nodes.length;

    if (state.nodes.length === 0) {
        container.innerHTML = '<div style="color: rgba(255,255,255,0.6);">暂无节点</div>';
        return;
    }

    container.innerHTML = state.nodes.map(node => `
        <div class="list-item">
            <strong>${node.name}</strong><br>
            <small>${node.type} • (${Math.round(node.x)}, ${Math.round(node.y)})</small>
        </div>
    `).join('');
}

// 渲染画布
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    if (state.backgroundImage) {
        const scale = Math.min(
            canvas.width / state.backgroundImage.width,
            canvas.height / state.backgroundImage.height
        );
        const x = (canvas.width - state.backgroundImage.width * scale) / 2;
        const y = (canvas.height - state.backgroundImage.height * scale) / 2;
        ctx.drawImage(
            state.backgroundImage,
            x, y,
            state.backgroundImage.width * scale,
            state.backgroundImage.height * scale
        );
    }

    // 绘制边
    state.edges.forEach(edge => {
        const startNode = state.nodes.find(n => n.id === edge.startNodeId);
        const endNode = state.nodes.find(n => n.id === edge.endNodeId);

        if (!startNode || !endNode) return;

        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);

        edge.waypoints.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });

        ctx.lineTo(endNode.x, endNode.y);
        ctx.stroke();

        // 折点
        ctx.fillStyle = '#1976D2';
        edge.waypoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    // 绘制节点
    state.nodes.forEach(node => {
        const color = nodeColors[node.type] || '#999';
        const isHovered = state.hoveredNode && state.hoveredNode.id === node.id;
        const radius = isHovered ? 10 : 8;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isHovered ? '#fff' : '#333';
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.stroke();

        // 节点名称（白色加黑色描边）
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(node.name, node.x, node.y + radius + 4);
        ctx.fillStyle = '#fff';
        ctx.fillText(node.name, node.x, node.y + radius + 4);

        // 节点类型
        ctx.font = '12px Arial';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(node.type, node.x, node.y + radius + 20);
        ctx.fillStyle = '#ddd';
        ctx.fillText(node.type, node.x, node.y + radius + 20);
    });

    // 绘制车辆
    state.vehicles.forEach(vehicle => {
        if (!vehicle.currentNode) return;

        const node = state.nodes.find(n => n.id === vehicle.currentNode);
        if (!node) return;

        let x = node.x;
        let y = node.y;

        if (vehicle.moving && vehicle.targetNode) {
            const progress = vehicle.moveProgress || 0;
            const target = state.nodes.find(n => n.id === vehicle.targetNode);
            if (target) {
                x = node.x + (target.x - node.x) * progress;
                y = node.y + (target.y - node.y) * progress;
            }
        }

        // 绘制车辆图标（更大）
        const vehicleSize = 35;
        ctx.fillStyle = vehicle.type === 'bus' ? '#FF9800' : '#4CAF50';
        ctx.beginPath();
        ctx.arc(x, y + 25, vehicleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 车辆符号（使用emoji风格的符号）
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const vehicleIcon = vehicle.type === 'bus' ? '🚌' : '🚚';
        ctx.fillText(vehicleIcon, x, y + 25);

        // 车辆ID
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('#' + vehicle.id, x, y + 48);

        // 电量条（更大更清晰）
        const barWidth = 50;
        const barHeight = 8;
        const barX = x - barWidth / 2;
        const barY = y + 60;

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const batteryPercent = vehicle.battery / vehicle.maxBattery;
        ctx.fillStyle = batteryPercent > 0.5 ? '#4CAF50' : batteryPercent > 0.3 ? '#FF9800' : '#F44336';
        ctx.fillRect(barX, barY, barWidth * batteryPercent, barHeight);

        // 电量百分比文字（白色）
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(Math.round(batteryPercent * 100) + '%', x, y + 70);
        ctx.fillText(Math.round(batteryPercent * 100) + '%', x, y + 70);
    });

    // 更新统计
    document.getElementById('statsNodes').textContent = state.nodes.length;
    document.getElementById('statsEdges').textContent = state.edges.length;
    document.getElementById('statsVehicles').textContent = state.vehicles.length;
    document.getElementById('statsTasks').textContent = state.tasks.length;
    document.getElementById('statsCompleted').textContent = state.completedTasks;
}

// 车辆管理
function createVehicle(type, startNodeId) {
    const vehicle = {
        id: state.vehicles.length + 1,
        type: type,
        currentNode: startNodeId,
        targetNode: null,
        battery: type === 'bus' ? 600 : 800,
        maxBattery: type === 'bus' ? 600 : 800,
        batteryConsumption: type === 'bus' ? 0.8 : 0.6,
        speed: type === 'bus' ? 2 : 1.5,
        moving: false,
        moveProgress: 0,
        path: [],
        currentTask: null,
        status: 'idle'
    };
    state.vehicles.push(vehicle);
    updateVehicleList();
    render();
    return vehicle;
}

function addVehicleAtRandom(type) {
    if (state.nodes.length === 0) {
        showToast('请先创建节点', 'error');
        return;
    }

    const randomNode = state.nodes[Math.floor(Math.random() * state.nodes.length)];
    createVehicle(type, randomNode.id);
    showToast(`车辆${state.vehicles[state.vehicles.length - 1].id}已添加`);
}

function updateVehicleList() {
    const container = document.getElementById('vehicleList');
    if (!container) return;

    document.getElementById('vehicleCount').textContent = state.vehicles.length;

    if (state.vehicles.length === 0) {
        container.innerHTML = '<div style="color: rgba(255,255,255,0.6);">暂无车辆</div>';
        return;
    }

    container.innerHTML = state.vehicles.map(v => {
        const batteryPercent = Math.round((v.battery / v.maxBattery) * 100);
        const node = state.nodes.find(n => n.id === v.currentNode);
        let statusText = '🔴 空闲';
        if (v.status === 'moving') statusText = '🚗 行驶中';
        else if (v.status === 'charging') statusText = '⚡ 充电中';
        else if (v.status === 'going_to_charge') statusText = '🔋 前往充电';
        else if (v.status !== 'idle') statusText = '🟢 忙碌';

        const batteryColor = batteryPercent > 50 ? '#4CAF50' : batteryPercent > 20 ? '#FF9800' : '#f44336';
        const canDelete = v.status === 'idle' && !v.currentTask;

        return `
            <div class="list-item" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <strong>车辆${v.id} (${v.type === 'bus' ? '🚌 接驳' : '🚚 物流'})</strong><br>
                    <small>位置: ${node ? node.name : '未知'} | <span style="color: ${batteryColor}; font-weight: bold;">电量: ${batteryPercent}%</span> | ${statusText}</small>
                </div>
                ${canDelete ? `<button onclick="deleteVehicle(${v.id})" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">✖</button>` : ''}
            </div>
        `;
    }).join('');
}

// 任务管理
// 删除车辆
function deleteVehicle(vehicleId) {
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // 检查车辆是否有任务
    if (vehicle.currentTask) {
        showToast('车辆正在执行任务，无法删除！', 'error');
        return;
    }

    state.vehicles = state.vehicles.filter(v => v.id !== vehicleId);
    updateVehicleList();
    render();
    showToast(`车辆 #${vehicleId} 已删除`);
}

// 删除任务
function deleteTask(taskId) {
    // 转换为数字（因为可能是字符串形式的浮点数）
    const numericTaskId = typeof taskId === 'string' ? parseFloat(taskId) : taskId;
    const task = state.tasks.find(t => t.id === numericTaskId);
    if (!task) return;

    if (task.status !== 'pending') {
        showToast('只能删除待分配的任务！', 'error');
        return;
    }

    state.tasks = state.tasks.filter(t => t.id !== numericTaskId);
    updateTaskList();
    render();
    showToast(`任务已删除`);
}

// 添加随机车辆
function addRandomVehicle() {
    if (state.nodes.length === 0) {
        alert('请先创建节点！');
        return;
    }

    const type = Math.random() > 0.5 ? 'bus' : 'truck';
    const randomNode = state.nodes[Math.floor(Math.random() * state.nodes.length)];
    createVehicle(type, randomNode.id);
    updateVehicleList();
    render();
    showToast(`已添加随机车辆 (${type === 'bus' ? '接驳车' : '物流车'})`);
}

// 添加自定义车辆
function addCustomVehicle() {
    if (state.nodes.length === 0) {
        alert('请先创建节点！');
        return;
    }

    // 创建对话框
    const nodeOptions = state.nodes.map(n => `<option value="${n.id}">${n.name} (节点${n.id})</option>`).join('');

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 400px;
    `;

    dialog.innerHTML = `
        <h3 style="margin-top: 0; color: #6a1b9a;">🚗 添加自定义车辆</h3>
        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">车辆类型：</label>
            <select id="vehicleType" style="width: 100%; padding: 8px; border-radius: 5px; border: 2px solid #6a1b9a;">
                <option value="bus">🚌 接驳车 (电量: 600, 速度: 2)</option>
                <option value="truck">🚚 物流车 (电量: 800, 速度: 1.5)</option>
            </select>
        </div>
        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">起始节点：</label>
            <select id="vehicleNode" style="width: 100%; padding: 8px; border-radius: 5px; border: 2px solid #6a1b9a;">
                ${nodeOptions}
            </select>
        </div>
        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">初始电量：<span id="batteryValue">100</span>%</label>
            <input type="range" id="vehicleBattery" min="10" max="100" value="100" 
                style="width: 100%;" 
                oninput="document.getElementById('batteryValue').textContent = this.value">
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="confirmBtn" style="flex: 1; padding: 10px; background: #6a1b9a; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">✔ 确定</button>
            <button id="cancelBtn" style="flex: 1; padding: 10px; background: #999; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">✖ 取消</button>
        </div>
    `;

    document.body.appendChild(dialog);

    document.getElementById('confirmBtn').onclick = () => {
        const type = document.getElementById('vehicleType').value;
        const nodeId = parseInt(document.getElementById('vehicleNode').value);
        const batteryPercent = parseInt(document.getElementById('vehicleBattery').value);

        const vehicle = {
            id: state.vehicles.length + 1,
            type: type,
            currentNode: nodeId,
            targetNode: null,
            battery: (type === 'bus' ? 600 : 800) * batteryPercent / 100,
            maxBattery: type === 'bus' ? 600 : 800,
            batteryConsumption: type === 'bus' ? 0.8 : 0.6,
            speed: type === 'bus' ? 2 : 1.5,
            moving: false,
            moveProgress: 0,
            path: [],
            currentTask: null,
            status: 'idle'
        };

        state.vehicles.push(vehicle);
        updateVehicleList();
        render();
        document.body.removeChild(dialog);
        showToast(`已添加车辆 #${vehicle.id}`);
    };

    document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(dialog);
    };
}

// 添加随机任务
function addRandomTask() {
    if (state.nodes.length < 2) {
        alert('请先创建至少 2 个节点！');
        return;
    }

    const nodes = state.nodes.map(n => n.id);
    let pickupNodeId, deliveryNodeId;
    do {
        pickupNodeId = nodes[Math.floor(Math.random() * nodes.length)];
        deliveryNodeId = nodes[Math.floor(Math.random() * nodes.length)];
    } while (pickupNodeId === deliveryNodeId);

    const task = {
        id: state.tasks.length + 1,
        pickupNodeId: pickupNodeId,
        deliveryNodeId: deliveryNodeId,
        priority: Math.floor(Math.random() * 5) + 1,
        status: 'pending',
        assignedVehicle: null
    };

    state.tasks.push(task);
    updateTaskList();
    render();
    showToast(`已添加随机任务 #${task.id}`);
}

// 添加自定义任务
function addCustomTask() {
    if (state.nodes.length < 2) {
        alert('请先创建至少 2 个节点！');
        return;
    }

    const nodeOptions = state.nodes.map(n => `<option value="${n.id}">${n.name} (节点${n.id})</option>`).join('');

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 400px;
    `;

    dialog.innerHTML = `
        <h3 style="margin-top: 0; color: #6a1b9a;">📝 添加自定义任务</h3>
        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">取货节点：</label>
            <select id="pickupNode" style="width: 100%; padding: 8px; border-radius: 5px; border: 2px solid #6a1b9a;">
                ${nodeOptions}
            </select>
        </div>
        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">送货节点：</label>
            <select id="deliveryNode" style="width: 100%; padding: 8px; border-radius: 5px; border: 2px solid #6a1b9a;">
                ${nodeOptions}
            </select>
        </div>
        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">优先级：<span id="priorityValue">3</span></label>
            <input type="range" id="taskPriority" min="1" max="5" value="3" 
                style="width: 100%;" 
                oninput="document.getElementById('priorityValue').textContent = this.value">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                <span>1 (低)</span>
                <span>3 (中)</span>
                <span>5 (高)</span>
            </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="confirmBtn" style="flex: 1; padding: 10px; background: #6a1b9a; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">✔ 确定</button>
            <button id="cancelBtn" style="flex: 1; padding: 10px; background: #999; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">✖ 取消</button>
        </div>
    `;

    document.body.appendChild(dialog);

    document.getElementById('confirmBtn').onclick = () => {
        const pickup = parseInt(document.getElementById('pickupNode').value);
        const delivery = parseInt(document.getElementById('deliveryNode').value);
        const priority = parseInt(document.getElementById('taskPriority').value);

        if (pickup === delivery) {
            alert('取货节点和送货节点不能相同！');
            return;
        }

        const task = {
            id: state.tasks.length + 1,
            pickupNodeId: pickup,
            deliveryNodeId: delivery,
            priority: priority,
            status: 'pending',
            assignedVehicle: null
        };

        state.tasks.push(task);
        updateTaskList();
        render();
        document.body.removeChild(dialog);
        showToast(`已添加任务 #${task.id}`);
    };

    document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(dialog);
    };
}

function generateRandomTask() {
    if (state.nodes.length < 2) {
        showToast('至少需要2个节点', 'error');
        return;
    }

    const pickupNode = state.nodes[Math.floor(Math.random() * state.nodes.length)];
    let deliveryNode;
    do {
        deliveryNode = state.nodes[Math.floor(Math.random() * state.nodes.length)];
    } while (deliveryNode.id === pickupNode.id);

    const task = {
        id: Date.now() + Math.random(),
        pickupNodeId: pickupNode.id,
        deliveryNodeId: deliveryNode.id,
        assignedVehicle: null,
        status: 'pending',
        priority: Math.floor(Math.random() * 3) + 1,
        createdAt: Date.now(),
        assignedTime: null
    };

    state.tasks.push(task);
    updateTaskList();

    // 如果调度系统运行中，立即尝试调度新任务
    if (state.isSimulating) {
        scheduleAllPendingTasks();
    }

    return task;
}

function generateMultipleTasks(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => generateRandomTask(), i * 100);
    }
    showToast(`生成${count}个任务`);
}

function updateTaskList() {
    const container = document.getElementById('taskList');
    if (!container) return;

    document.getElementById('taskCount').textContent = state.tasks.length;

    if (state.tasks.length === 0) {
        container.innerHTML = '<div style="color: rgba(255,255,255,0.6);">暂无任务</div>';
        return;
    }

    container.innerHTML = state.tasks.map(t => {
        const pickup = state.nodes.find(n => n.id === t.pickupNodeId);
        const delivery = state.nodes.find(n => n.id === t.deliveryNodeId);
        const statusText = {
            'pending': '⏳待分配',
            'assigned': '🚗已分配',
            'in_progress': '🚚执行中',
            'completed': '✅已完成'
        }[t.status];

        let vehicleInfo = '';
        if (t.assignedVehicle) {
            const vehicle = state.vehicles.find(v => v.id === t.assignedVehicle);
            if (vehicle) {
                const progress = vehicle.currentTask === t.id ?
                    Math.round((vehicle.moveProgress || 0) * 100) : 0;
                vehicleInfo = ` | 车辆#${t.assignedVehicle}`;
                if (progress > 0 && t.status !== 'completed') {
                    vehicleInfo += ` (${progress}%)`;
                }
            }
        }

        return `
            <div class="list-item" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <strong>${pickup?.name} → ${delivery?.name}</strong><br>
                    <small>${statusText} | 优先级: ${t.priority}${vehicleInfo}</small>
                </div>
                ${t.status === 'pending' ? `<button class="delete-btn" data-task-id="${t.id}" onclick="deleteTask('${t.id}')" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">✖</button>` : ''}
            </div>
        `;
    }).join('');
}

// 调度算法
function findPath(startNodeId, endNodeId) {
    if (startNodeId === endNodeId) return [startNodeId];

    const distances = {};
    const previous = {};
    const unvisited = new Set();

    state.nodes.forEach(node => {
        distances[node.id] = Infinity;
        previous[node.id] = null;
        unvisited.add(node.id);
    });

    distances[startNodeId] = 0;

    while (unvisited.size > 0) {
        let currentNode = null;
        let minDistance = Infinity;

        unvisited.forEach(nodeId => {
            if (distances[nodeId] < minDistance) {
                minDistance = distances[nodeId];
                currentNode = nodeId;
            }
        });

        if (currentNode === null || currentNode === endNodeId) break;
        unvisited.delete(currentNode);

        state.edges.forEach(edge => {
            let neighborId = null;
            if (edge.startNodeId === currentNode) neighborId = edge.endNodeId;
            if (edge.endNodeId === currentNode) neighborId = edge.startNodeId;

            if (neighborId && unvisited.has(neighborId)) {
                const alt = distances[currentNode] + edge.length;
                if (alt < distances[neighborId]) {
                    distances[neighborId] = alt;
                    previous[neighborId] = currentNode;
                }
            }
        });
    }

    const path = [];
    let current = endNodeId;
    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }

    return path.length > 0 && path[0] === startNodeId ? path : [startNodeId];
}

function calculateDistance(nodeId1, nodeId2) {
    const path = findPath(nodeId1, nodeId2);
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const edge = state.edges.find(e =>
            (e.startNodeId === path[i] && e.endNodeId === path[i + 1]) ||
            (e.startNodeId === path[i + 1] && e.endNodeId === path[i])
        );
        if (edge) distance += edge.length;
    }
    return distance;
}

function scheduleTask(task) {
    console.log('[DEBUG] scheduleTask called for task:', task.id);
    console.log('[DEBUG] All vehicles:', state.vehicles);

    const availableVehicles = state.vehicles.filter(v =>
        v.status === 'idle' && v.battery > 30
    );

    console.log('[DEBUG] Available vehicles:', availableVehicles.length);
    console.log('[DEBUG] Available vehicles details:', availableVehicles);

    if (availableVehicles.length === 0) {
        console.log('[DEBUG] No available vehicles!');
        return false;
    }

    let bestVehicle = null;
    console.log('[DEBUG] Using algorithm:', state.schedulingAlgorithm);

    switch (state.schedulingAlgorithm) {
        case 'intelligent':
            bestVehicle = intelligentSchedule(task, availableVehicles);
            break;
        case 'nearest':
            bestVehicle = nearestSchedule(task, availableVehicles);
            break;
        case 'balanced':
            bestVehicle = balancedSchedule(task, availableVehicles);
            break;
        default:
            bestVehicle = intelligentSchedule(task, availableVehicles);
    }

    console.log('[DEBUG] Best vehicle selected:', bestVehicle?.id);

    if (bestVehicle) {
        console.log('[DEBUG] Assigning task to vehicle:', bestVehicle.id);
        assignTaskToVehicle(task, bestVehicle);
        return true;
    }
    console.log('[DEBUG] No suitable vehicle found');
    return false;
}

// 智能调度：综合考虑距离、电量和优先级
function intelligentSchedule(task, availableVehicles) {
    console.log('[DEBUG] intelligentSchedule called');
    let bestVehicle = null;
    let minCost = Infinity;

    availableVehicles.forEach(vehicle => {
        console.log('[DEBUG] Checking vehicle:', vehicle.id);
        console.log('[DEBUG] Vehicle current node:', vehicle.currentNode);
        console.log('[DEBUG] Task pickup node:', task.pickupNodeId);

        // 计算路径中的边数（节点数-1）
        const pickupPath = findPath(vehicle.currentNode, task.pickupNodeId);
        const deliveryPath = findPath(task.pickupNodeId, task.deliveryNodeId);
        const totalEdges = (pickupPath.length - 1) + (deliveryPath.length - 1);

        console.log('[DEBUG] Pickup path edges:', pickupPath.length - 1);
        console.log('[DEBUG] Delivery path edges:', deliveryPath.length - 1);
        console.log('[DEBUG] Total edges:', totalEdges);

        // 每条边需要的步数：1 / (0.02 * speed)
        // 每步消耗：batteryConsumption * 0.5
        const stepsPerEdge = 1 / (0.02 * vehicle.speed);
        const batteryPerStep = vehicle.batteryConsumption * 0.5;
        const requiredBattery = totalEdges * stepsPerEdge * batteryPerStep + 50; // 留50电量余量

        console.log('[DEBUG] Required battery:', requiredBattery);
        console.log('[DEBUG] Vehicle battery:', vehicle.battery);
        console.log('[DEBUG] Battery sufficient?', vehicle.battery > requiredBattery);

        if (vehicle.battery > requiredBattery) {
            const distance = calculateDistance(vehicle.currentNode, task.pickupNodeId);
            const cost = distance / task.priority - (vehicle.battery / vehicle.maxBattery) * 10;
            console.log('[DEBUG] Cost:', cost);
            if (cost < minCost) {
                minCost = cost;
                bestVehicle = vehicle;
                console.log('[DEBUG] New best vehicle:', vehicle.id);
            }
        } else {
            console.log('[DEBUG] Vehicle', vehicle.id, 'rejected: insufficient battery');
        }
    });

    console.log('[DEBUG] intelligentSchedule result:', bestVehicle?.id);
    return bestVehicle;
}

// 最近优先调度：贪心算法
function nearestSchedule(task, availableVehicles) {
    let bestVehicle = null;
    let minDistance = Infinity;

    availableVehicles.forEach(vehicle => {
        const pickupPath = findPath(vehicle.currentNode, task.pickupNodeId);
        const deliveryPath = findPath(task.pickupNodeId, task.deliveryNodeId);
        const totalEdges = (pickupPath.length - 1) + (deliveryPath.length - 1);
        const stepsPerEdge = 1 / (0.02 * vehicle.speed);
        const batteryPerStep = vehicle.batteryConsumption * 0.5;
        const requiredBattery = totalEdges * stepsPerEdge * batteryPerStep + 50;

        const distance = calculateDistance(vehicle.currentNode, task.pickupNodeId);
        if (vehicle.battery > requiredBattery && distance < minDistance) {
            minDistance = distance;
            bestVehicle = vehicle;
        }
    });

    return bestVehicle;
}

// 负载均衡调度：选择任务最少的车辆
function balancedSchedule(task, availableVehicles) {
    let bestVehicle = null;
    let minTasks = Infinity;

    availableVehicles.forEach(vehicle => {
        const pickupPath = findPath(vehicle.currentNode, task.pickupNodeId);
        const deliveryPath = findPath(task.pickupNodeId, task.deliveryNodeId);
        const totalEdges = (pickupPath.length - 1) + (deliveryPath.length - 1);
        const stepsPerEdge = 1 / (0.02 * vehicle.speed);
        const batteryPerStep = vehicle.batteryConsumption * 0.5;
        const requiredBattery = totalEdges * stepsPerEdge * batteryPerStep + 50;

        if (vehicle.battery > requiredBattery) {
            const completedTasks = state.tasks.filter(t =>
                t.assignedVehicle === vehicle.id && t.status === 'completed'
            ).length;

            if (completedTasks < minTasks) {
                minTasks = completedTasks;
                bestVehicle = vehicle;
            }
        }
    });

    return bestVehicle;
}

// 持续调度所有待处理任务
function scheduleAllPendingTasks() {
    console.log('[DEBUG] scheduleAllPendingTasks called');
    console.log('[DEBUG] All tasks:', state.tasks);

    const pendingTasks = state.tasks.filter(t => t.status === 'pending')
        .sort((a, b) => b.priority - a.priority); // 按优先级排序

    console.log('[DEBUG] Pending tasks count:', pendingTasks.length);
    console.log('[DEBUG] Pending tasks:', pendingTasks);

    let scheduled = 0;
    for (let task of pendingTasks) {
        console.log('[DEBUG] Trying to schedule task:', task.id);
        if (scheduleTask(task)) {
            scheduled++;
            console.log('[DEBUG] Task scheduled successfully:', task.id);
        } else {
            console.log('[DEBUG] Task scheduling failed:', task.id);
        }
    }

    console.log('[DEBUG] Total scheduled:', scheduled);
    if (scheduled > 0) {
        showToast(`已调度 ${scheduled} 个任务`);
    }
}

function assignTaskToVehicle(task, vehicle) {
    console.log('[DEBUG] assignTaskToVehicle called');
    console.log('[DEBUG] Task:', task.id, 'Vehicle:', vehicle.id);
    console.log('[DEBUG] Vehicle current node:', vehicle.currentNode);
    console.log('[DEBUG] Task pickup node:', task.pickupNodeId);
    console.log('[DEBUG] Task delivery node:', task.deliveryNodeId);

    task.status = 'assigned';
    task.assignedVehicle = vehicle.id;
    task.assignedTime = Date.now();
    vehicle.currentTask = task.id;
    vehicle.status = 'moving';
    vehicle.moving = true;
    vehicle.moveProgress = 0;

    const path1 = findPath(vehicle.currentNode, task.pickupNodeId);
    const path2 = findPath(task.pickupNodeId, task.deliveryNodeId);

    console.log('[DEBUG] Path to pickup:', path1);
    console.log('[DEBUG] Path to delivery:', path2);

    vehicle.path = [...path1, ...path2.slice(1)];
    vehicle.pathIndex = 0;

    console.log('[DEBUG] Full vehicle path:', vehicle.path);

    if (vehicle.path.length > 1) {
        vehicle.targetNode = vehicle.path[1];
        vehicle.moving = true;
        console.log('[DEBUG] Target node set to:', vehicle.targetNode);
        console.log('[DEBUG] Vehicle status:', vehicle.status, 'moving:', vehicle.moving);
    } else {
        console.log('[DEBUG] WARNING: Path too short!');
        vehicle.status = 'idle';
        vehicle.moving = false;
    }

    // 更新统计
    const emptyDist = calculateDistance(vehicle.currentNode, task.pickupNodeId);
    const loadedDist = calculateDistance(task.pickupNodeId, task.deliveryNodeId);
    const totalDist = emptyDist + loadedDist;

    state.stats.totalDistance += totalDist;
    state.stats.emptyDistance += emptyDist; // 记录空驶距离

    updateTaskList();
    updateVehicleList();
}

// 模拟更新
function updateSimulation() {
    if (!state.isSimulating) return;

    // 更新仿真时间（每次循环50ms，按速度递增）
    state.simulationTime += 0.05 * state.simulationSpeed;

    state.vehicles.forEach(vehicle => {
        // 移动逻辑：处理moving和going_to_charge状态
        if ((vehicle.status === 'moving' || vehicle.status === 'going_to_charge') && vehicle.targetNode) {
            vehicle.moveProgress = (vehicle.moveProgress || 0) + 0.02 * vehicle.speed * state.simulationSpeed;
            // 加大电量消耗，每次移动消耗更多
            const batteryConsumed = vehicle.batteryConsumption * 0.5 * state.simulationSpeed;
            vehicle.battery -= batteryConsumed;
            state.stats.totalBatteryConsumed += batteryConsumed;

            if (vehicle.battery < 0) vehicle.battery = 0;

            if (vehicle.moveProgress >= 1) {
                vehicle.currentNode = vehicle.targetNode;
                vehicle.moveProgress = 0;

                if (vehicle.path && vehicle.pathIndex < vehicle.path.length - 1) {
                    vehicle.pathIndex++;
                    vehicle.targetNode = vehicle.path[vehicle.pathIndex];
                    vehicle.moving = true;
                } else {
                    vehicle.targetNode = null;
                    vehicle.path = [];
                    vehicle.pathIndex = 0;

                    // 如果是任务完成
                    if (vehicle.currentTask) {
                        const task = state.tasks.find(t => t.id === vehicle.currentTask);
                        if (task && vehicle.currentNode === task.deliveryNodeId) {
                            task.status = 'completed';
                            vehicle.currentTask = null;
                            state.completedTasks++;
                            showToast(`✓ 任务完成`);
                        }
                    }

                    // 如果是前往充电站到达了
                    const batteryPercent = (vehicle.battery / vehicle.maxBattery) * 100;
                    if (vehicle.status === 'going_to_charge') {
                        const chargingStation = state.nodes.find(n => n.type === '充电站');
                        if (chargingStation && vehicle.currentNode === chargingStation.id) {
                            vehicle.status = 'charging';
                            showToast(`⚡ 车辆#${vehicle.id} 开始充电`);
                        } else {
                            vehicle.status = 'idle';
                        }
                    } else {
                        vehicle.status = 'idle';

                        // 检查是否需要充电（电量低于20%）
                        if (batteryPercent < 20) {
                            const chargingStation = state.nodes.find(n => n.type === '充电站');
                            if (chargingStation && vehicle.currentNode !== chargingStation.id) {
                                const path = findPath(vehicle.currentNode, chargingStation.id);
                                if (path.length > 1) {
                                    vehicle.path = path;
                                    vehicle.pathIndex = 0;
                                    vehicle.targetNode = path[1];
                                    vehicle.moving = true;
                                    vehicle.status = 'going_to_charge';
                                    showToast(`🔋 车辆#${vehicle.id} 电量不足，前往充电站`);
                                }
                            } else if (chargingStation && vehicle.currentNode === chargingStation.id) {
                                vehicle.status = 'charging';
                                showToast(`⚡ 车辆#${vehicle.id} 开始充电`);
                            }
                        } else {
                            // 电量足够，延迟调度避免死循环
                            setTimeout(() => scheduleAllPendingTasks(), 100);
                        }
                    }
                }
            }
        } else if (vehicle.status === 'charging') {
            // 充电速度：每周期充2%，速度受simulationSpeed影响
            vehicle.battery += vehicle.maxBattery * 0.02 * state.simulationSpeed;
            if (vehicle.battery >= vehicle.maxBattery) {
                vehicle.battery = vehicle.maxBattery;
                vehicle.status = 'idle';
                showToast(`✅ 车辆#${vehicle.id} 充电完成`);

                // 充电完成后延迟调度任务
                setTimeout(() => scheduleAllPendingTasks(), 100);
            }
        } else if (vehicle.status === 'going_to_charge') {
            // 前往充电站的状态，由moving逻辑处理
        }
    });

    updateVehicleList();
    updateTaskList();
    updateStats();
    render();
}

// UI函数
function toggleSimulation() {
    console.log('[DEBUG] toggleSimulation called');
    console.log('[DEBUG] Current state.isSimulating:', state.isSimulating);
    console.log('[DEBUG] Tasks count:', state.tasks.length);
    console.log('[DEBUG] Vehicles count:', state.vehicles.length);

    state.isSimulating = !state.isSimulating;
    const btn = document.getElementById('startBtn');
    console.log('[DEBUG] Button found:', !!btn);

    if (state.isSimulating) {
        console.log('[DEBUG] Starting simulation...');
        btn.textContent = '⏸️ 暂停调度';
        btn.classList.add('btn-warning');
        btn.classList.remove('btn-success');
        showToast('调度系统已启动');

        // 启动时调度所有待处理任务
        console.log('[DEBUG] Calling scheduleAllPendingTasks...');
        scheduleAllPendingTasks();
    } else {
        btn.textContent = '▶️ 开始调度';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-success');
        showToast('调度系统已暂停');
    }
}

function updateSpeed(value) {
    state.simulationSpeed = parseFloat(value);
    document.getElementById('speedValue').textContent = state.simulationSpeed.toFixed(1);
}

function setSpeed(speed) {
    state.simulationSpeed = speed;
    document.getElementById('speedSlider').value = speed;
    document.getElementById('speedValue').textContent = speed.toFixed(1);
}

function changeAlgorithm(algorithm) {
    state.schedulingAlgorithm = algorithm;
    const algoInfo = {
        'intelligent': {
            name: '🧠 智能调度',
            desc: '综合考虑距离、电量、优先级，最优化整体效率'
        },
        'nearest': {
            name: '🎯 最近优先',
            desc: '选择离任务最近的车辆，减少空驶距离（贪心策略）'
        },
        'balanced': {
            name: '⚖️ 负载均衡',
            desc: '优先分配给任务最少的车辆，均衡负载'
        }
    };
    const info = algoInfo[algorithm];
    const descDiv = document.getElementById('algorithmDesc');
    if (descDiv) {
        descDiv.textContent = `${info.name}：${info.desc}`;
    }
    showToast(`切换算法: ${info.name}`);
}

function updateStats() {
    // 更新仿真时间显示
    const simulationTimeElement = document.getElementById('simulationTime');
    if (simulationTimeElement) {
        simulationTimeElement.textContent = state.simulationTime.toFixed(1);
    }

    // 1. 总行驶距离
    document.getElementById('statTotalDist').textContent = Math.round(state.stats.totalDistance);

    // 2. 总耗电量
    let totalBatteryUsed = 0;
    state.vehicles.forEach(v => {
        const used = v.maxBattery - v.battery;
        totalBatteryUsed += used;
    });
    totalBatteryUsed += state.stats.totalBatteryConsumed;
    document.getElementById('statTotalBattery').textContent = Math.round(totalBatteryUsed);

    // 3. 空驶距离
    document.getElementById('statEmptyDist').textContent = Math.round(state.stats.emptyDistance);

    // 4. 运营成本
    const distCost = state.stats.totalDistance * 0.5;
    const batteryCost = totalBatteryUsed * 0.1;
    const operationCost = Math.round(distCost + batteryCost);
    document.getElementById('statOperationCost').textContent = operationCost;
}

function saveMap() {
    const name = document.getElementById('mapName')?.value.trim();
    if (!name) {
        showToast('请输入地图名称', 'error');
        return;
    }

    const mapData = {
        id: state.mapId,
        name: name,
        background_image: state.backgroundImage ? state.backgroundImage.src : '',
        nodes: state.nodes,
        edges: state.edges
    };

    fetch(`${API_BASE}/map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapData)
    }).then(r => r.json()).then(data => {
        if (data.success) {
            state.mapId = data.map_id;
            showToast('地图保存成功');
        }
    }).catch(e => showToast('保存失败', 'error'));
}

// 保存车辆配置
function saveVehicles() {
    if (state.vehicles.length === 0) {
        showToast('没有车辆可保存', 'error');
        return;
    }

    const name = prompt('请输入车辆配置名称：');
    if (!name || !name.trim()) {
        showToast('已取消保存', 'error');
        return;
    }

    const configs = JSON.parse(localStorage.getItem('vehicle_configs') || '{}');
    configs[name.trim()] = {
        vehicles: state.vehicles,
        savedAt: new Date().toLocaleString()
    };
    localStorage.setItem('vehicle_configs', JSON.stringify(configs));
    showToast(`已保存车辆配置"${name.trim()}"（${state.vehicles.length}辆）`);
    loadVehiclesList();
}

// 加载车辆配置列表
function loadVehiclesList() {
    const configs = JSON.parse(localStorage.getItem('vehicle_configs') || '{}');
    const select = document.getElementById('vehicleConfigSelect');
    if (!select) return;

    select.innerHTML = '<option value="">选择车辆配置...</option>';
    Object.keys(configs).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (${configs[name].vehicles.length}辆) - ${configs[name].savedAt}`;
        select.appendChild(option);
    });
}

// 加载车辆配置
function loadVehicles() {
    const select = document.getElementById('vehicleConfigSelect');
    const configName = select?.value;

    if (!configName) {
        showToast('请选择一个车辆配置', 'error');
        return;
    }

    const configs = JSON.parse(localStorage.getItem('vehicle_configs') || '{}');
    const config = configs[configName];

    if (!config) {
        showToast('配置不存在', 'error');
        return;
    }

    try {
        state.vehicles = JSON.parse(JSON.stringify(config.vehicles));
        updateVehicleList();
        render();
        showToast(`已加载车辆配置"${configName}"（${state.vehicles.length}辆）`);
    } catch (e) {
        showToast('加载车辆配置失败', 'error');
    }
}

// 保存任务配置
function saveTasks() {
    if (state.tasks.length === 0) {
        showToast('没有任务可保存', 'error');
        return;
    }

    const name = prompt('请输入任务配置名称：');
    if (!name || !name.trim()) {
        showToast('已取消保存', 'error');
        return;
    }

    const configs = JSON.parse(localStorage.getItem('task_configs') || '{}');
    configs[name.trim()] = {
        tasks: state.tasks,
        savedAt: new Date().toLocaleString()
    };
    localStorage.setItem('task_configs', JSON.stringify(configs));
    showToast(`已保存任务配置"${name.trim()}"（${state.tasks.length}个）`);
    loadTasksList();
}

// 加载任务配置列表
function loadTasksList() {
    const configs = JSON.parse(localStorage.getItem('task_configs') || '{}');
    const select = document.getElementById('taskConfigSelect');
    if (!select) return;

    select.innerHTML = '<option value="">选择任务配置...</option>';
    Object.keys(configs).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (${configs[name].tasks.length}个) - ${configs[name].savedAt}`;
        select.appendChild(option);
    });
}

// 加载任务配置
function loadTasks() {
    const select = document.getElementById('taskConfigSelect');
    const configName = select?.value;

    if (!configName) {
        showToast('请选择一个任务配置', 'error');
        return;
    }

    const configs = JSON.parse(localStorage.getItem('task_configs') || '{}');
    const config = configs[configName];

    if (!config) {
        showToast('配置不存在', 'error');
        return;
    }

    try {
        state.tasks = JSON.parse(JSON.stringify(config.tasks));
        updateTaskList();
        render();
        showToast(`已加载任务配置"${configName}"（${state.tasks.length}个）`);
    } catch (e) {
        showToast('加载任务配置失败', 'error');
    }
}

// 加载地图列表
function loadMapList() {
    console.log('[DEBUG] Loading map list from:', `${API_BASE}/maps`);
    fetch(`${API_BASE}/maps`)
        .then(r => {
            console.log('[DEBUG] Map list response status:', r.status);
            return r.json();
        })
        .then(data => {
            console.log('[DEBUG] Map list data:', data);
            if (data.success && data.maps) {
                const select = document.getElementById('mapSelect');
                if (!select) {
                    console.error('[DEBUG] mapSelect element not found');
                    return;
                }

                console.log('[DEBUG] Found', data.maps.length, 'maps');
                select.innerHTML = '<option value="">选择地图...</option>' +
                    data.maps.map(map => `<option value="${map.id}">${map.name}</option>`).join('');
                showToast(`已加载 ${data.maps.length} 个地图`);
            } else {
                console.error('[DEBUG] Invalid map data:', data);
                showToast('暂无保存的地图', 'error');
            }
        })
        .catch(e => {
            console.error('[DEBUG] 加载地图列表失败:', e);
            showToast('加载地图列表失败', 'error');
        });
}

// 加载选中的地图
function loadSelectedMap() {
    const select = document.getElementById('mapSelect');
    const mapId = select?.value;

    if (!mapId) {
        showToast('请选择一个地图', 'error');
        return;
    }

    fetch(`${API_BASE}/map/${mapId}`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.map) {
                const map = data.map;
                state.mapId = map.id;
                state.nodes = map.nodes || [];
                state.edges = map.edges || [];
                // 不加载车辆和任务
                state.vehicles = [];
                state.tasks = [];

                document.getElementById('mapName').value = map.name || '';

                updateNodeList();
                updateVehicleList();
                updateTaskList();
                render();
                showToast(`地图"${map.name}"加载成功（仅节点和道路）`);
            }
        })
        .catch(e => showToast('加载地图失败', 'error'));
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            state.backgroundImage = img;
            render();
            showToast('背景图片加载成功');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 加载测试地图
function loadTestData() {
    console.log('[DEBUG] loadTestData called');
    // 清空现有数据
    state.nodes = [];
    state.edges = [];
    state.vehicles = [];
    state.tasks = [];
    state.completedTasks = 0;
    state.simulationTime = 0;
    console.log('[DEBUG] Cleared existing data');

    // 创建测试节点
    const testNodes = [
        { name: '南门', type: '大门', x: 150, y: 450 },
        { name: '北门', type: '大门', x: 750, y: 100 },
        { name: '主教学楼', type: '教学楼', x: 450, y: 250 },
        { name: '图书馆', type: '图书馆', x: 300, y: 250 },
        { name: '学生宿舍1', type: '宿舍', x: 200, y: 400 },
        { name: '学生宿舍2', type: '宿舍', x: 700, y: 400 },
        { name: '食堂A', type: '食堂', x: 350, y: 350 },
        { name: '食堂B', type: '食堂', x: 550, y: 350 },
        { name: '体育馆', type: '充电站', x: 600, y: 150 },
        { name: '实验楼', type: '实验楼', x: 250, y: 150 },
        { name: '工程馆', type: '工程馆', x: 500, y: 450 },
        { name: '充电站', type: '充电站', x: 800, y: 300 }
    ];

    testNodes.forEach((n, i) => {
        state.nodes.push({
            id: i + 1,
            name: n.name,
            type: n.type,
            x: n.x,
            y: n.y
        });
    });

    // 创建测试边
    const testEdges = [
        [1, 5, 120], [5, 7, 120], [7, 4, 110], [4, 3, 150],
        [3, 8, 140], [8, 6, 150], [6, 12, 120], [1, 10, 200],
        [10, 4, 110], [3, 9, 180], [9, 2, 150], [10, 2, 250],
        [11, 3, 180], [12, 9, 200]
    ];

    testEdges.forEach((e, i) => {
        const start = state.nodes[e[0] - 1];
        const end = state.nodes[e[1] - 1];
        state.edges.push({
            id: 100 + i,
            startNodeId: start.id,
            endNodeId: end.id,
            waypoints: [],
            length: e[2]
        });
    });

    // 添加测试车辆
    createVehicle('bus', state.nodes[0].id);
    createVehicle('truck', state.nodes[1].id);
    createVehicle('bus', state.nodes[3].id);

    // 生成初始任务
    for (let i = 0; i < 5; i++) {
        generateRandomTask();
    }

    console.log('[DEBUG] Test data loaded successfully');
    console.log('[DEBUG] Nodes:', state.nodes.length);
    console.log('[DEBUG] Edges:', state.edges.length);
    console.log('[DEBUG] Vehicles:', state.vehicles.length);
    console.log('[DEBUG] Tasks:', state.tasks.length);

    updateNodeList();
    updateVehicleList();
    updateTaskList();
    render();
    showToast('测试地图已加载（12节点、14条边、3辆车、5个任务）');
}

function addTestVehicles() {
    if (state.nodes.length === 0) {
        showToast('请先加载测试地图', 'error');
        return;
    }

    createVehicle('bus', state.nodes[0].id);
    createVehicle('truck', state.nodes[Math.floor(Math.random() * state.nodes.length)].id);
    showToast('已添加2辆测试车辆');
}

// 消息提示
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#a855f7';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============= 算法对比功能 =============

// 保存当前状态的快照
function saveStateSnapshot() {
    return {
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        edges: JSON.parse(JSON.stringify(state.edges)),
        vehicles: state.vehicles.map(v => ({
            id: v.id,
            type: v.type,
            nodeId: v.nodeId,
            x: v.x,
            y: v.y,
            battery: v.maxBattery, // 重置为满电
            maxBattery: v.maxBattery,
            batteryConsumptionRate: v.batteryConsumptionRate,
            status: 'idle',
            path: [],
            currentTask: null,
            completedTasks: 0,
            totalDistance: 0,
            speed: v.speed,
            batteryConsumption: v.batteryConsumption
        })),
        tasks: state.tasks.map(t => ({
            id: t.id,
            fromNodeId: t.fromNodeId,
            toNodeId: t.toNodeId,
            priority: t.priority,
            status: 'pending' // 重置为待处理
        })),
        algorithm: state.schedulingAlgorithm
    };
}

// 从快照恢复状态
function restoreStateSnapshot(snapshot) {
    state.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
    state.edges = JSON.parse(JSON.stringify(snapshot.edges));
    state.vehicles = snapshot.vehicles.map(v => ({
        ...v,
        path: [],
        currentTask: null,
        currentNode: v.nodeId,
        targetNode: null,
        pathIndex: 0,
        moveProgress: 0,
        moving: false
    }));
    state.tasks = snapshot.tasks.map(t => ({ ...t }));
    state.stats = {
        totalDistance: 0,
        totalTime: 0,
        avgWaitTime: 0,
        batteryUsed: 0,
        totalBatteryConsumed: 0,
        taskStartTime: 0,
        vehicleBusyTime: {},
        emptyDistance: 0,
        totalTasks: snapshot.tasks.length
    };
    state.simulationTime = 0;
    state.completedTasks = 0;
    state.isSimulating = false;
}

// 重置仿真状态
function resetSimulation() {
    if (state.isSimulating) {
        showToast('请先停止仿真再重置', 'error');
        return;
    }

    // 重置所有车辆状态
    state.vehicles.forEach(v => {
        v.battery = v.maxBattery;
        v.status = 'idle';
        v.path = [];
        v.currentTask = null;
        v.completedTasks = 0;
        v.totalDistance = 0;
        v.targetNode = null;
        v.pathIndex = 0;
        v.moveProgress = 0;
        v.moving = false;
    });

    // 重置所有任务状态
    state.tasks.forEach(t => {
        t.status = 'pending';
    });

    // 重置统计数据
    state.stats = {
        totalDistance: 0,
        totalTime: 0,
        avgWaitTime: 0,
        batteryUsed: 0,
        totalBatteryConsumed: 0,
        taskStartTime: 0,
        vehicleBusyTime: {},
        emptyDistance: 0,
        totalTasks: state.tasks.length
    };

    state.simulationTime = 0;
    state.completedTasks = 0;

    // 重置按钮状态
    const btn = document.getElementById('startBtn');
    if (btn) {
        btn.textContent = '▶️ 开始调度';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-success');
    }

    updateStats();
    updateVehicleList();
    updateTaskList();
    render();

    showToast('状态已重置');
}

// 保存当前算法的结果
function saveAlgorithmResult() {
    if (state.isSimulating) {
        showToast('请先停止仿真再保存结果', 'error');
        return;
    }

    if (state.tasks.length === 0) {
        showToast('没有任务数据可保存', 'error');
        return;
    }

    const allTasksCompleted = state.tasks.every(t => t.status === 'completed');
    if (!allTasksCompleted) {
        showToast('请等待所有任务完成后再保存结果', 'error');
        return;
    }

    const algorithmNames = {
        'intelligent': '智能调度',
        'nearest': '最近优先',
        'balanced': '负载均衡'
    };

    const totalBatteryUsed = calculateTotalBatteryUsed();
    const operationCost = Math.round(state.stats.totalDistance * 0.5 + totalBatteryUsed * 0.1);

    comparisonResults[state.schedulingAlgorithm] = {
        name: algorithmNames[state.schedulingAlgorithm] || state.schedulingAlgorithm,
        totalDistance: Math.round(state.stats.totalDistance),
        totalBattery: Math.round(totalBatteryUsed),
        emptyDistance: Math.round(state.stats.emptyDistance),
        operationCost: operationCost,
        completedTasks: state.completedTasks,
        simulationTime: state.simulationTime.toFixed(1)
    };

    showToast(`已保存 ${algorithmNames[state.schedulingAlgorithm]} 的结果`);

    // 自动显示对比结果
    displayComparisonResults();
}

// 计算总耗电量
function calculateTotalBatteryUsed() {
    let totalBatteryUsed = 0;
    state.vehicles.forEach(v => {
        const used = v.maxBattery - v.battery;
        totalBatteryUsed += used;
    });
    totalBatteryUsed += state.stats.totalBatteryConsumed;
    return totalBatteryUsed;
}

// 显示对比结果
function displayComparisonResults() {
    const panel = document.getElementById('comparisonPanel');
    const resultsDiv = document.getElementById('comparisonResults');

    if (!panel || !resultsDiv) return;

    const resultCount = Object.keys(comparisonResults).length;
    if (resultCount === 0) {
        panel.style.display = 'none';
        return;
    }

    // 找出每个指标的最优值
    const metrics = ['totalDistance', 'totalBattery', 'emptyDistance', 'operationCost'];
    const bestValues = {};

    metrics.forEach(metric => {
        bestValues[metric] = Math.min(...Object.values(comparisonResults).map(r => r[metric]));
    });

    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="border-bottom: 2px solid rgba(255,255,255,0.2);">
                        <th style="padding: 8px; text-align: left; color: #a78bfa;">算法</th>
                        <th style="padding: 8px; text-align: right; color: #60a5fa;">总距离(m)</th>
                        <th style="padding: 8px; text-align: right; color: #f59e0b;">总耗电</th>
                        <th style="padding: 8px; text-align: right; color: #f97316;">空驶(m)</th>
                        <th style="padding: 8px; text-align: right; color: #ec4899;">成本</th>
                        <th style="padding: 8px; text-align: right; color: #10b981;">完成数</th>
                        <th style="padding: 8px; text-align: right; color: #8b5cf6;">时间(s)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.entries(comparisonResults).forEach(([algoId, result]) => {
        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 8px; font-weight: bold; color: #fff;">${result.name}</td>
                <td style="padding: 8px; text-align: right; ${result.totalDistance === bestValues.totalDistance ? 'color: #4ade80; font-weight: bold;' : 'color: #fff;'}">
                    ${result.totalDistance}${result.totalDistance === bestValues.totalDistance ? ' ★' : ''}
                </td>
                <td style="padding: 8px; text-align: right; ${result.totalBattery === bestValues.totalBattery ? 'color: #4ade80; font-weight: bold;' : 'color: #fff;'}">
                    ${result.totalBattery}${result.totalBattery === bestValues.totalBattery ? ' ★' : ''}
                </td>
                <td style="padding: 8px; text-align: right; ${result.emptyDistance === bestValues.emptyDistance ? 'color: #4ade80; font-weight: bold;' : 'color: #fff;'}">
                    ${result.emptyDistance}${result.emptyDistance === bestValues.emptyDistance ? ' ★' : ''}
                </td>
                <td style="padding: 8px; text-align: right; ${result.operationCost === bestValues.operationCost ? 'color: #4ade80; font-weight: bold;' : 'color: #fff;'}">
                    ${result.operationCost}${result.operationCost === bestValues.operationCost ? ' ★' : ''}
                </td>
                <td style="padding: 8px; text-align: right; color: #fff;">${result.completedTasks}</td>
                <td style="padding: 8px; text-align: right; color: #fff;">${result.simulationTime}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="margin-top: 10px; padding: 8px; background: rgba(74, 222, 128, 0.1); border-radius: 5px; color: #4ade80; font-size: 10px; text-align: center;">
                ★ 标记表示该算法在此指标上表现最优 | 已保存 ${resultCount} 个算法结果
            </div>
        </div>
    `;

    resultsDiv.innerHTML = html;
    panel.style.display = 'block';
}

// 启动
init();
