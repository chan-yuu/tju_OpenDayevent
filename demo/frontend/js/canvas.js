// Canvas绘图模块
class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = CONFIG.CELL_SIZE;
        this.mapWidth = CONFIG.DEFAULT_MAP_WIDTH;
        this.mapHeight = CONFIG.DEFAULT_MAP_HEIGHT;

        // 数据
        this.obstacles = new Set();
        this.start = null;
        this.goal = null;
        this.path = [];
        this.expandedNodes = [];
        this.vehicle = null;  // 车辆状态 {x, y, theta}
        this.vehicleType = 'diff_drive';
        this.controlTrajectory = []; // 控制过程中的实时轨迹

        // 显示选项
        this.showGrid = true;
        this.showExpanded = true;
        this.showPath = true;
        this.showVehicle = true;
        this.showControlTrajectory = true;

        this.initCanvas();
    }

    initCanvas() {
        this.canvas.width = this.mapWidth * this.cellSize;
        this.canvas.height = this.mapHeight * this.cellSize;
        this.render();
    }

    setMapSize(width, height) {
        this.mapWidth = width;
        this.mapHeight = height;
        this.canvas.width = width * this.cellSize;
        this.canvas.height = height * this.cellSize;
        this.clear();
    }

    clear() {
        this.obstacles.clear();
        this.start = null;
        this.goal = null;
        this.path = [];
        this.expandedNodes = [];
        this.controlTrajectory = [];
        this.render();
    }

    clearPath() {
        this.path = [];
        this.expandedNodes = [];
        this.render();
    }

    addObstacle(x, y) {
        if (this.isValid(x, y)) {
            this.obstacles.add(`${x},${y}`);
            this.render();
        }
    }

    removeObstacle(x, y) {
        this.obstacles.delete(`${x},${y}`);
        this.render();
    }

    hasObstacle(x, y) {
        return this.obstacles.has(`${x},${y}`);
    }

    setStart(x, y) {
        if (this.isValid(x, y) && !this.hasObstacle(x, y)) {
            this.start = { x, y };
            this.render();
            return true;
        }
        return false;
    }

    setGoal(x, y) {
        if (this.isValid(x, y) && !this.hasObstacle(x, y)) {
            this.goal = { x, y };
            this.render();
            return true;
        }
        return false;
    }

    setPath(path) {
        this.path = path;
        this.render();
    }

    setExpandedNodes(nodes) {
        this.expandedNodes = nodes;
        this.render();
    }

    isValid(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }

    screenToGrid(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((screenX - rect.left) / this.cellSize);
        const y = Math.floor((screenY - rect.top) / this.cellSize);
        return { x, y };
    }

    drawGrid() {
        this.ctx.strokeStyle = CONFIG.COLORS.GRID;
        this.ctx.lineWidth = 1;

        // 垂直线
        for (let x = 0; x <= this.mapWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        // 水平线
        for (let y = 0; y <= this.mapHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawObstacles() {
        this.ctx.fillStyle = CONFIG.COLORS.OBSTACLE;
        this.obstacles.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            this.ctx.fillRect(
                x * this.cellSize + 1,
                y * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2
            );
        });
    }

    drawStart() {
        this.ctx.fillStyle = CONFIG.COLORS.START;
        this.ctx.beginPath();
        this.ctx.arc(
            this.start.x * this.cellSize + this.cellSize / 2,
            this.start.y * this.cellSize + this.cellSize / 2,
            this.cellSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 绘制文字
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            'S',
            this.start.x * this.cellSize + this.cellSize / 2,
            this.start.y * this.cellSize + this.cellSize / 2
        );
    }

    drawGoal() {
        this.ctx.fillStyle = CONFIG.COLORS.GOAL;
        this.ctx.beginPath();
        this.ctx.arc(
            this.goal.x * this.cellSize + this.cellSize / 2,
            this.goal.y * this.cellSize + this.cellSize / 2,
            this.cellSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 绘制文字
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            'G',
            this.goal.x * this.cellSize + this.cellSize / 2,
            this.goal.y * this.cellSize + this.cellSize / 2
        );
    }

    drawExpandedNodes() {
        this.ctx.fillStyle = CONFIG.COLORS.EXPANDED + '40'; // 半透明
        this.expandedNodes.forEach(node => {
            const [x, y] = node;
            if (!this.start || (x !== this.start.x || y !== this.start.y)) {
                if (!this.goal || (x !== this.goal.x || y !== this.goal.y)) {
                    this.ctx.fillRect(
                        x * this.cellSize + 2,
                        y * this.cellSize + 2,
                        this.cellSize - 4,
                        this.cellSize - 4
                    );
                }
            }
        });
    }

    drawPath() {
        if (this.path.length < 2) return;

        // 绘制路径线
        this.ctx.strokeStyle = CONFIG.COLORS.PATH;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(
            this.path[0][0] * this.cellSize + this.cellSize / 2,
            this.path[0][1] * this.cellSize + this.cellSize / 2
        );

        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(
                this.path[i][0] * this.cellSize + this.cellSize / 2,
                this.path[i][1] * this.cellSize + this.cellSize / 2
            );
        }

        this.ctx.stroke();

        // 绘制路径点
        this.ctx.fillStyle = CONFIG.COLORS.PATH;
        this.path.forEach((node, idx) => {
            if (idx > 0 && idx < this.path.length - 1) {
                this.ctx.beginPath();
                this.ctx.arc(
                    node[0] * this.cellSize + this.cellSize / 2,
                    node[1] * this.cellSize + this.cellSize / 2,
                    3,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });
    }

    // 动画绘制扩展过程
    animateExpansion(nodes, callback) {
        let index = 0;
        const interval = setInterval(() => {
            if (index < nodes.length) {
                this.expandedNodes.push(nodes[index]);
                this.render();
                index++;
            } else {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 1000 / CONFIG.ANIMATION_FPS);

        return interval;
    }

    // 导出地图数据
    exportMapData() {
        const obstaclesList = Array.from(this.obstacles).map(key => {
            const [x, y] = key.split(',').map(Number);
            return [x, y];
        });

        return {
            width: this.mapWidth,
            height: this.mapHeight,
            obstacles: obstaclesList,
            start: this.start ? [this.start.x, this.start.y] : null,
            goal: this.goal ? [this.goal.x, this.goal.y] : null
        };
    }

    // 导入地图数据
    importMapData(data) {
        this.mapWidth = data.width;
        this.mapHeight = data.height;
        this.canvas.width = data.width * this.cellSize;
        this.canvas.height = data.height * this.cellSize;

        this.obstacles.clear();
        data.obstacles.forEach(obs => {
            this.obstacles.add(`${obs[0]},${obs[1]}`);
        });

        if (data.start) {
            this.start = { x: data.start[0], y: data.start[1] };
        }

        if (data.goal) {
            this.goal = { x: data.goal[0], y: data.goal[1] };
        }

        this.render();
    }

    // 设置车辆位置和方向
    setVehicle(x, y, theta = 0) {
        this.vehicle = { x, y, theta };
        this.render();
    }

    // 设置车辆类型
    setVehicleType(type) {
        this.vehicleType = type;
    }

    // 绘制控制实时轨迹
    drawControlTrajectory() {
        if (!this.showControlTrajectory || this.controlTrajectory.length < 2) return;

        // 绘制实时轨迹线
        this.ctx.strokeStyle = '#00ff88'; // 绿色轨迹
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        const first = this.controlTrajectory[0];
        this.ctx.moveTo(
            first[0] * this.cellSize + this.cellSize / 2,
            first[1] * this.cellSize + this.cellSize / 2
        );

        for (let i = 1; i < this.controlTrajectory.length; i++) {
            const pos = this.controlTrajectory[i];
            this.ctx.lineTo(
                pos[0] * this.cellSize + this.cellSize / 2,
                pos[1] * this.cellSize + this.cellSize / 2
            );
        }

        this.ctx.stroke();

        // 绘制轨迹点（稀疏显示）
        this.ctx.fillStyle = '#00ff88';
        for (let i = 0; i < this.controlTrajectory.length; i += 5) {
            const pos = this.controlTrajectory[i];
            this.ctx.beginPath();
            this.ctx.arc(
                pos[0] * this.cellSize + this.cellSize / 2,
                pos[1] * this.cellSize + this.cellSize / 2,
                2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    // 绘制车辆
    drawVehicle() {
        if (!this.vehicle || !this.showVehicle) return;

        const x = this.vehicle.x * this.cellSize + this.cellSize / 2;
        const y = this.vehicle.y * this.cellSize + this.cellSize / 2;
        const theta = this.vehicle.theta;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(theta);

        if (this.vehicleType === 'diff_drive') {
            // 车辆参数（车身长宽）
            const length = this.cellSize * 1.2; // 车长
            const width = this.cellSize * 0.7;   // 车宽

            // 车身主体（矩形）
            this.ctx.fillStyle = CONFIG.COLORS.VEHICLE;
            this.ctx.fillRect(-length / 4, -width / 2, length, width);

            // 车头（三角形指示方向）
            this.ctx.fillStyle = '#FFA500'; // 橙色车头
            this.ctx.beginPath();
            this.ctx.moveTo(length * 0.75, 0);
            this.ctx.lineTo(length * 0.5, -width / 2);
            this.ctx.lineTo(length * 0.5, width / 2);
            this.ctx.closePath();
            this.ctx.fill();

            // 车轮
            const wheelWidth = width * 0.15;
            const wheelLength = length * 0.25;
            this.ctx.fillStyle = '#333';
            // 左轮
            this.ctx.fillRect(-wheelLength / 2, width / 2 - wheelWidth, wheelLength, wheelWidth);
            // 右轮
            this.ctx.fillRect(-wheelLength / 2, -width / 2, wheelLength, wheelWidth);

            // 车身轮廓
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-length / 4, -width / 2, length, width);
        } else {
            // 类车模型 - 矩形车辆
            const carWidth = this.cellSize * 0.8;
            const carLength = this.cellSize * 1.2;

            this.ctx.fillStyle = CONFIG.COLORS.VEHICLE;
            this.ctx.fillRect(-carLength / 2, -carWidth / 2, carLength, carWidth);

            // 车头三角形
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.moveTo(carLength / 2, 0);
            this.ctx.lineTo(carLength / 3, -carWidth / 4);
            this.ctx.lineTo(carLength / 3, carWidth / 4);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    // 更新render方法以包含车辆绘制
    render() {
        // 清空画布
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        if (this.showGrid) {
            this.drawGrid();
        }

        // 绘制扩展节点
        if (this.showExpanded && this.expandedNodes.length > 0) {
            this.drawExpandedNodes();
        }

        // 绘制规划路径
        if (this.showPath && this.path.length > 0) {
            this.drawPath();
        }

        // 绘制控制实时轨迹
        if (this.controlTrajectory.length > 0) {
            this.drawControlTrajectory();
        }

        // 绘制障碍物
        this.drawObstacles();

        // 绘制起点和终点
        if (this.start) {
            this.drawStart();
        }
        if (this.goal) {
            this.drawGoal();
        }

        // 绘制车辆
        if (this.vehicle) {
            this.drawVehicle();
        }
    }
}
