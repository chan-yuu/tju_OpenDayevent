// 主应用类
class MotionPlanningApp {
    constructor() {
        this.canvas = new CanvasRenderer('main-canvas');
        this.api = new PlanningAPI();

        this.editMode = 'obstacle';
        this.isDrawing = false;
        this.currentAlgorithm = 'astar';
        this.playSpeed = 1.0;
        this.comparisonResults = [];

        // 控制相关状态
        this.controlRunning = false;
        this.controlInterval = null;
        this.vehicleState = null;
        this.pidController = null;
        this.controlData = null;
        this.controlStartTime = 0;
        this.controlStep = 0;

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadScenarios();
        this.updateAlgorithmInfo();
        this.showStatus('就绪', 'success');
    }

    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = btn.dataset.tab;

                // 更新标签按钮状态
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 更新标签内容显示
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });

        // 地图尺寸控制
        document.getElementById('map-width').addEventListener('change', (e) => {
            const width = parseInt(e.target.value);
            const height = parseInt(document.getElementById('map-height').value);
            this.canvas.setMapSize(width, height);
        });

        document.getElementById('map-height').addEventListener('change', (e) => {
            const width = parseInt(document.getElementById('map-width').value);
            const height = parseInt(e.target.value);
            this.canvas.setMapSize(width, height);
        });

        // 重置地图
        document.getElementById('btn-reset-map').addEventListener('click', () => {
            this.canvas.clear();
            this.clearStats();
            this.showStatus('地图已重置', 'success');
        });

        // 编辑模式按钮
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.editMode = btn.dataset.mode;
                document.getElementById('current-mode').textContent = btn.textContent.trim();
            });
        });

        // Canvas交互
        const canvas = document.getElementById('main-canvas');

        canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            this.handleCanvasClick(e);
        });

        canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
            if (this.isDrawing && this.editMode === 'obstacle') {
                this.handleCanvasClick(e);
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
            document.getElementById('mouse-pos').textContent = '-';
        });

        // 算法选择
        document.getElementById('algorithm-select').addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
            this.updateAlgorithmInfo();
        });

        // 规划按钮
        document.getElementById('btn-plan').addEventListener('click', () => {
            this.planPath();
        });

        document.getElementById('btn-clear-path').addEventListener('click', () => {
            this.canvas.clearPath();
            this.clearStats();
        });

        // 显示选项
        document.getElementById('show-grid').addEventListener('change', (e) => {
            this.canvas.showGrid = e.target.checked;
            this.canvas.render();
        });

        document.getElementById('show-expanded').addEventListener('change', (e) => {
            this.canvas.showExpanded = e.target.checked;
            this.canvas.render();
        });

        document.getElementById('show-path').addEventListener('change', (e) => {
            this.canvas.showPath = e.target.checked;
            this.canvas.render();
        });

        // 对比功能
        document.getElementById('btn-add-comparison').addEventListener('click', () => {
            this.addComparison();
        });

        // 场景选择
        document.getElementById('scenario-select').addEventListener('change', async (e) => {
            if (e.target.value) {
                await this.loadScenario(e.target.value);
            }
        });

        // 保存地图按钮
        document.getElementById('btn-save-map').addEventListener('click', () => {
            this.showSaveMapDialog();
        });

        // 保存地图对话框
        const saveMapModal = document.getElementById('save-map-modal');
        const saveMapClose = saveMapModal.querySelector('.modal-close');

        saveMapClose.addEventListener('click', () => {
            saveMapModal.style.display = 'none';
        });

        document.getElementById('btn-cancel-save').addEventListener('click', () => {
            saveMapModal.style.display = 'none';
        });

        document.getElementById('btn-confirm-save').addEventListener('click', async () => {
            await this.saveCurrentMap();
        });

        window.addEventListener('click', (e) => {
            if (e.target === saveMapModal) {
                saveMapModal.style.display = 'none';
            }
        });

        // 关于对话框
        const aboutBtn = document.getElementById('btn-about');
        const modal = document.getElementById('about-modal');
        const closeBtn = modal.querySelector('.modal-close');

        aboutBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // ========== 控制相关事件 ==========

        // PID参数调节
        document.getElementById('param-kp').addEventListener('input', (e) => {
            document.getElementById('param-kp-value').textContent = e.target.value;
        });

        document.getElementById('param-ki').addEventListener('input', (e) => {
            document.getElementById('param-ki-value').textContent = e.target.value;
        });

        document.getElementById('param-kd').addEventListener('input', (e) => {
            document.getElementById('param-kd-value').textContent = e.target.value;
        });

        document.getElementById('param-speed').addEventListener('input', (e) => {
            document.getElementById('param-speed-value').textContent = e.target.value;
        });

        // 开始控制按钮
        document.getElementById('btn-start-control').addEventListener('click', () => {
            this.startControl();
        });

        // 停止控制按钮
        const stopBtn = document.getElementById('btn-stop-control');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopControl();
            });
        }

        // 暂停控制按钮
        const pauseBtn = document.getElementById('btn-pause-control');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pauseControl();
            });
        }

        // 恢复控制按钮
        const resumeBtn = document.getElementById('btn-resume-control');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.resumeControl();
            });
        }

        // PID参数对比按钮
        const comparePidBtn = document.getElementById('btn-compare-pid');
        if (comparePidBtn) {
            comparePidBtn.addEventListener('click', () => {
                this.comparePIDParameters();
            });
        }

        // 显示车辆选项
        document.getElementById('show-vehicle').addEventListener('change', (e) => {
            this.canvas.showVehicle = e.target.checked;
            this.canvas.render();
        });

        // 显示实时轨迹选项
        const showControlTraj = document.getElementById('show-control-trajectory');
        if (showControlTraj) {
            showControlTraj.addEventListener('change', (e) => {
                this.canvas.showControlTrajectory = e.target.checked;
                this.canvas.render();
            });
        }
    }

    handleCanvasClick(e) {
        const pos = this.canvas.screenToGrid(e.clientX, e.clientY);

        if (!this.canvas.isValid(pos.x, pos.y)) return;

        switch (this.editMode) {
            case 'obstacle':
                this.canvas.addObstacle(pos.x, pos.y);
                break;
            case 'erase':
                this.canvas.removeObstacle(pos.x, pos.y);
                break;
            case 'start':
                if (this.canvas.setStart(pos.x, pos.y)) {
                    this.showStatus(`起点设置在 (${pos.x}, ${pos.y})`, 'success');
                }
                break;
            case 'goal':
                if (this.canvas.setGoal(pos.x, pos.y)) {
                    this.showStatus(`终点设置在 (${pos.x}, ${pos.y})`, 'success');
                }
                break;
        }
    }

    updateMousePosition(e) {
        const pos = this.canvas.screenToGrid(e.clientX, e.clientY);
        if (this.canvas.isValid(pos.x, pos.y)) {
            document.getElementById('mouse-pos').textContent = `(${pos.x}, ${pos.y})`;
        }
    }

    async planPath() {
        // 验证起点和终点
        if (!this.canvas.start) {
            this.showStatus('请设置起点', 'error');
            return;
        }

        if (!this.canvas.goal) {
            this.showStatus('请设置终点', 'error');
            return;
        }

        // 准备地图配置
        const mapData = this.canvas.exportMapData();
        const mapConfig = {
            width: mapData.width,
            height: mapData.height,
            obstacles: mapData.obstacles,
            start: mapData.start,
            goal: mapData.goal
        };

        try {
            this.showStatus('规划中...', 'info');
            document.getElementById('btn-plan').disabled = true;

            // 调用API
            const result = await this.api.planPath(mapConfig, this.currentAlgorithm);

            if (result.success) {
                // 显示结果
                this.canvas.setExpandedNodes(result.expanded_nodes);
                this.canvas.setPath(result.path);

                // 更新统计
                this.updateStats(result);
                this.showStatus('规划成功', 'success');

                // 添加到对比列表
                this.addToComparison(result);
            } else {
                this.showStatus(result.message || '规划失败', 'error');
            }
        } catch (error) {
            this.showStatus('规划失败: ' + error.message, 'error');
        } finally {
            document.getElementById('btn-plan').disabled = false;
        }
    }

    updateStats(result) {
        document.getElementById('stat-time').textContent =
            `${(result.computation_time * 1000).toFixed(2)} ms`;
        document.getElementById('stat-length').textContent =
            result.path_length.toFixed(2);
        document.getElementById('stat-nodes').textContent =
            result.nodes_explored;
        document.getElementById('stat-status').textContent =
            result.success ? '成功' : '失败';
    }

    clearStats() {
        document.getElementById('stat-time').textContent = '-';
        document.getElementById('stat-length').textContent = '-';
        document.getElementById('stat-nodes').textContent = '-';
        document.getElementById('stat-status').textContent = '就绪';
    }

    addToComparison(result) {
        const algorithmName = CONFIG.ALGORITHM_INFO[this.currentAlgorithm]?.name || this.currentAlgorithm;

        this.comparisonResults.push({
            algorithm: algorithmName,
            time: result.computation_time,
            length: result.path_length,
            nodes: result.nodes_explored,
            timestamp: new Date()
        });

        this.updateComparisonList();
    }

    updateComparisonList() {
        const listDiv = document.getElementById('comparison-list');

        if (this.comparisonResults.length === 0) {
            listDiv.innerHTML = '<p class="hint-text">运行多个算法进行对比</p>';
            return;
        }

        listDiv.innerHTML = '';

        this.comparisonResults.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'comparison-item';
            item.innerHTML = `
                <h4>${result.algorithm}</h4>
                <div class="metric">时间: ${(result.time * 1000).toFixed(2)} ms</div>
                <div class="metric">长度: ${result.length.toFixed(2)}</div>
                <div class="metric">节点: ${result.nodes}</div>
            `;
            listDiv.appendChild(item);
        });
    }

    addComparison() {
        if (!this.canvas.start || !this.canvas.goal) {
            this.showStatus('请先设置起点和终点', 'error');
            return;
        }
        this.showStatus('请选择算法并点击规划按钮', 'info');
    }

    // updateAlgorithmInfo() {
    //     const info = CONFIG.ALGORITHM_INFO[this.currentAlgorithm];
    //     const infoDiv = document.getElementById('algorithm-info');

    //     if (!info) {
    //         infoDiv.innerHTML = '<p class="hint-text">暂无算法信息</p>';
    //         return;
    //     }

    //     infoDiv.innerHTML = `
    //         <h4>${info.name}</h4>
    //         <p>${info.description}</p>
    //         <p><strong>复杂度:</strong> ${info.complexity}</p>
    //         <p><strong>优点:</strong></p>
    //         <ul>
    //             ${info.advantages.map(adv => `<li>${adv}</li>`).join('')}
    //         </ul>
    //         <p><strong>缺点:</strong></p>
    //         <ul>
    //             ${info.disadvantages.map(dis => `<li>${dis}</li>`).join('')}
    //         </ul>
    //     `;
    // }
    updateAlgorithmInfo() {
        const info = CONFIG.ALGORITHM_INFO[this.currentAlgorithm];
        const infoDiv = document.getElementById('algorithm-info');

        if (!info) {
            infoDiv.innerHTML = '<p class="hint-text" style="font-size: 16px; color: #666;">暂无算法信息</p>';
            return;
        }

        // 核心修改：给每个标签添加 style 属性设置字体大小
        infoDiv.innerHTML = `
            <h4 style="font-size: 20px; color: var(--primary-color); margin: 0 0 12px 0; font-weight: bold;">${info.name}</h4>
            <p style="font-size: 16px; color: #ffffffff; line-height: 1.6; margin: 0 0 8px 0;">${info.description}</p>
            <p style="font-size: 15px; color: #c3c3c3ff; margin: 0 0 8px 0;"><strong style="color: #ef8080ff;">复杂度:</strong> ${info.complexity}</p>
            <p style="font-size: 15px; color: #27ae60; font-weight: 600; margin: 10px 0 4px 0;"><strong>优点:</strong></p>
            <ul style="margin: 0 0 10px 20px; padding: 0;">
                ${info.advantages.map(adv => `<li style="font-size: 14px; color: #baa7a7ff; margin: 4px 0;">${adv}</li>`).join('')}
            </ul>
            <p style="font-size: 15px; color: #e74c3c; font-weight: 600; margin: 10px 0 4px 0;"><strong>缺点:</strong></p>
            <ul style="margin: 0 0 0 20px; padding: 0;">
                ${info.disadvantages.map(dis => `<li style="font-size: 14px; color: #baa7a7ff; margin: 4px 0;">${dis}</li>`).join('')}
            </ul>
        `;
    }

    async loadScenarios() {
        try {
            const data = await this.api.getScenarios();
            const select = document.getElementById('scenario-select');

            // 清空现有选项（保留"自定义"）
            while (select.options.length > 1) {
                select.remove(1);
            }

            // 添加所有场景
            data.scenarios.forEach(scenario => {
                const option = document.createElement('option');
                option.value = scenario.id;
                option.textContent = scenario.name;
                select.appendChild(option);
            });

            console.log(`已加载 ${data.scenarios.length} 个场景`);
        } catch (error) {
            console.error('加载场景失败:', error);
        }
    }

    async loadScenario(scenarioId) {
        try {
            const scenario = await this.api.getScenario(scenarioId);

            // 重新初始化地图
            this.canvas.setMapSize(scenario.width, scenario.height);
            this.canvas.clear();

            // 设置起点和终点
            if (scenario.start) {
                this.canvas.setStart(scenario.start[0], scenario.start[1]);
            }
            if (scenario.goal) {
                this.canvas.setGoal(scenario.goal[0], scenario.goal[1]);
            }

            // 添加障碍物
            if (scenario.obstacles) {
                scenario.obstacles.forEach(obs => {
                    this.canvas.addObstacle(obs[0], obs[1]);
                });
            }

            this.showStatus(`场景 "${scenario.name}" 已加载`, 'success');
        } catch (error) {
            this.showStatus('加载场景失败: ' + error.message, 'error');
        }
    }

    showSaveMapDialog() {
        // 验证地图
        if (!this.canvas.start) {
            this.showStatus('请先设置起点', 'error');
            return;
        }
        if (!this.canvas.goal) {
            this.showStatus('请先设置终点', 'error');
            return;
        }

        // 清空输入框
        document.getElementById('save-map-name').value = '';
        document.getElementById('save-map-description').value = '';

        // 显示对话框
        document.getElementById('save-map-modal').style.display = 'block';
    }

    async saveCurrentMap() {
        const name = document.getElementById('save-map-name').value.trim();
        const description = document.getElementById('save-map-description').value.trim();

        if (!name) {
            this.showStatus('请输入地图名称', 'error');
            return;
        }

        try {
            const mapData = this.canvas.exportMapData();
            const scenarioData = {
                name: name,
                description: description || '自定义地图',
                width: mapData.width,
                height: mapData.height,
                start: mapData.start,
                goal: mapData.goal,
                obstacles: mapData.obstacles
            };

            const result = await this.api.saveScenario(scenarioData);

            if (result.success) {
                this.showStatus(`地图已保存: ${name}`, 'success');
                document.getElementById('save-map-modal').style.display = 'none';

                // 重新加载场景列表
                await this.loadScenarios();
            } else {
                this.showStatus('保存失败: ' + result.message, 'error');
            }
        } catch (error) {
            this.showStatus('保存失败: ' + error.message, 'error');
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('stat-status');
        statusEl.textContent = message;

        // 简单的颜色指示
        switch (type) {
            case 'success':
                statusEl.style.color = CONFIG.COLORS.START;
                break;
            case 'error':
                statusEl.style.color = CONFIG.COLORS.GOAL;
                break;
            case 'info':
                statusEl.style.color = CONFIG.COLORS.PATH;
                break;
            default:
                statusEl.style.color = CONFIG.COLORS.PATH;
        }

        // 3秒后恢复
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '就绪';
                statusEl.style.color = CONFIG.COLORS.PATH;
            }
        }, 3000);
    }

    // ========== 控制相关方法 ==========

    async startControl() {
        console.log('[startControl] 开始实时PID闭环控制');

        if (!this.canvas.path || this.canvas.path.length === 0) {
            this.showStatus('请先规划路径', 'error');
            return;
        }

        if (this.controlRunning) {
            this.showStatus('控制正在运行中', 'warning');
            return;
        }

        // 获取PID参数
        const kp = parseFloat(document.getElementById('param-kp').value);
        const ki = parseFloat(document.getElementById('param-ki').value);
        const kd = parseFloat(document.getElementById('param-kd').value);
        const targetSpeed = parseFloat(document.getElementById('param-speed').value);

        console.log('[startControl] PID参数:', { kp, ki, kd, targetSpeed });

        // 设置预设参数选择器事件（仅设置一次）
        const presetSelect = document.getElementById('pid-preset');
        if (presetSelect && !presetSelect._handlerAttached) {
            presetSelect.addEventListener('change', (e) => {
                const presets = {
                    'conservative': { kp: 0.6, ki: 0.01, kd: 0.4, speed: 0.6 },  // 最稳定
                    'balanced': { kp: 1.0, ki: 0.03, kd: 0.5, speed: 0.8 },      // 平衡
                    'aggressive': { kp: 1.5, ki: 0.05, kd: 0.3, speed: 1.0 },    // 响应快
                    'slow': { kp: 0.8, ki: 0.02, kd: 0.6, speed: 0.4 }           // 低速精确
                };

                const preset = presets[e.target.value];
                if (preset) {
                    document.getElementById('param-kp').value = preset.kp;
                    document.getElementById('param-kp-value').textContent = preset.kp;
                    document.getElementById('param-ki').value = preset.ki;
                    document.getElementById('param-ki-value').textContent = preset.ki;
                    document.getElementById('param-kd').value = preset.kd;
                    document.getElementById('param-kd-value').textContent = preset.kd;
                    document.getElementById('param-speed').value = preset.speed;
                    document.getElementById('param-speed-value').textContent = preset.speed;
                    console.log(`已切换到预设: ${e.target.value}`, preset);
                } else {
                    console.log('切换到自定义模式');
                }
            });
            presetSelect._handlerAttached = true;
        }

        // 初始化车辆状态（在路径起点）
        const startPos = this.canvas.path[0];
        this.vehicleState = {
            x: startPos[0],
            y: startPos[1],
            theta: this.calculateInitialHeading(0),
            v: 0,
            pathIndex: 0
        };

        console.log('[startControl] 车辆初始状态:', this.vehicleState);

        // 设置Canvas车辆显示
        this.canvas.vehicle = {
            x: this.vehicleState.x,
            y: this.vehicleState.y,
            theta: this.vehicleState.theta
        };
        this.canvas.showVehicle = true;
        this.canvas.render();

        console.log('[startControl] Canvas车辆已设置并渲染');

        // 初始化PID控制器
        this.pidController = {
            kp: kp,
            ki: ki,
            kd: kd,
            integral: 0,
            prevError: 0,
            targetSpeed: targetSpeed
        };

        // 初始化数据记录
        this.controlData = {
            cte: [],      // 横向误差
            heading: [],  // 航向误差
            time: [],     // 时间
            positions: [] // 实际位置
        };

        this.controlRunning = true;
        this.controlStartTime = Date.now();
        this.controlStep = 0;

        // 清空上次的实时轨迹
        this.canvas.controlTrajectory = [];

        // 显示控制统计面板
        const statsPanel = document.getElementById('control-stats-panel');
        if (statsPanel) {
            statsPanel.style.display = 'block';
            console.log('[startControl] 控制统计面板已显示');
        } else {
            console.error('[startControl] 找不到control-stats-panel元素');
        }

        document.getElementById('btn-start-control').style.display = 'none';
        document.getElementById('btn-stop-control').style.display = 'block';
        document.getElementById('btn-pause-control').style.display = 'inline-block';
        document.getElementById('btn-resume-control').style.display = 'none';

        this.showStatus('PID闭环控制运行中...', 'info');

        console.log('[startControl] 开始控制循环');

        // 启动实时控制循环
        this.runControlLoop();
    }

    pauseControl() {
        console.log('[pauseControl] 暂停控制');
        this.controlRunning = false;
        if (this.controlInterval) {
            clearInterval(this.controlInterval);
            this.controlInterval = null;
        }
        document.getElementById('btn-pause-control').style.display = 'none';
        document.getElementById('btn-resume-control').style.display = 'inline-block';
        this.showStatus('控制已暂停', 'warning');
    }

    resumeControl() {
        console.log('[resumeControl] 恢复控制');
        if (!this.vehicleState || !this.pidController) {
            this.showStatus('无法恢复：请先开始控制', 'error');
            return;
        }
        this.controlRunning = true;
        document.getElementById('btn-pause-control').style.display = 'inline-block';
        document.getElementById('btn-resume-control').style.display = 'none';
        this.showStatus('控制已恢复', 'info');
        this.runControlLoop();
    }

    stopControl() {
        console.log('[stopControl] 停止控制');
        this.controlRunning = false;
        if (this.controlInterval) {
            clearInterval(this.controlInterval);
            this.controlInterval = null;
        }
        document.getElementById('btn-start-control').style.display = 'block';
        document.getElementById('btn-stop-control').style.display = 'none';
        document.getElementById('btn-pause-control').style.display = 'none';
        document.getElementById('btn-resume-control').style.display = 'none';
        this.showStatus('控制已停止', 'success');
    }

    calculateInitialHeading(pathIndex) {
        if (pathIndex + 1 >= this.canvas.path.length) {
            return 0;
        }
        const p1 = this.canvas.path[pathIndex];
        const p2 = this.canvas.path[pathIndex + 1];
        return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    }

    runControlLoop() {
        const dt = 0.05; // 50ms 控制周期

        this.controlInterval = setInterval(() => {
            if (!this.controlRunning) {
                clearInterval(this.controlInterval);
                this.controlInterval = null;
                return;
            }

            try {
                // 计算当前误差
                const errors = this.calculateErrors();

                if (errors.reachedGoal) {
                    console.log('[Control] 到达目标点');
                    this.stopControl();
                    this.displayFinalStats();
                    return;
                }

                // PID控制计算
                const control = this.computePIDControl(errors.cte, errors.headingError, dt);

                // 更新车辆状态
                this.updateVehicleState(control, dt);

                // 记录数据
                this.recordControlData(errors.cte, errors.headingError);

                // 实时更新显示
                this.updateRealtimeDisplay();

                this.controlStep++;
            } catch (error) {
                console.error('[Control Loop Error]', error);
                this.stopControl();
                this.showStatus('⚠️ 控制出错: ' + error.message, 'error');
            }
        }, dt * 1000);
    }

    calculateErrors() {
        const vehicle = this.vehicleState;
        const path = this.canvas.path;

        // 找到最近的路径点
        let minDist = Infinity;
        let closestIndex = vehicle.pathIndex;

        for (let i = Math.max(0, vehicle.pathIndex - 5);
            i < Math.min(path.length, vehicle.pathIndex + 20); i++) {
            const dx = path[i][0] - vehicle.x;
            const dy = path[i][1] - vehicle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        }

        vehicle.pathIndex = closestIndex;

        // 使用前视距离选择目标点（Pure Pursuit思想）
        const lookahead = 3.0; // 前视距离
        let targetIndex = closestIndex;
        let accumulatedDist = 0;

        for (let i = closestIndex; i < path.length - 1; i++) {
            const dx = path[i + 1][0] - path[i][0];
            const dy = path[i + 1][1] - path[i][1];
            accumulatedDist += Math.sqrt(dx * dx + dy * dy);
            if (accumulatedDist >= lookahead) {
                targetIndex = i + 1;
                break;
            }
        }

        // 如果接近终点，使用终点
        if (targetIndex >= path.length - 1) {
            targetIndex = path.length - 1;
        }

        const targetPoint = path[targetIndex];
        const dx = targetPoint[0] - vehicle.x;
        const dy = targetPoint[1] - vehicle.y;

        // 计算目标航向（指向目标点）
        const targetHeading = Math.atan2(dy, dx);

        // CTE: 横向偏差 - 使用路径方向的垂直距离
        // 获取路径切线方向（从当前最近点到目标点）
        const pathDx = targetPoint[0] - path[closestIndex][0];
        const pathDy = targetPoint[1] - path[closestIndex][1];
        const pathLen = Math.sqrt(pathDx * pathDx + pathDy * pathDy);

        let cte = 0;
        if (pathLen > 0.01) {
            // 路径切线单位向量
            const pathTx = pathDx / pathLen;
            const pathTy = pathDy / pathLen;

            // 车辆到最近路径点的向量
            const vehToDx = vehicle.x - path[closestIndex][0];
            const vehToDy = vehicle.y - path[closestIndex][1];

            // CTE = 向量在路径法向上的投影（叉积）
            // 路径左侧为负，右侧为正
            cte = -(vehToDx * pathTy - vehToDy * pathTx);
        }

        // 航向误差（目标航向 - 当前航向）
        let headingError = targetHeading - vehicle.theta;
        // 归一化到 [-π, π]
        while (headingError > Math.PI) headingError -= 2 * Math.PI;
        while (headingError < -Math.PI) headingError += 2 * Math.PI;

        // 检查是否到达目标
        const goalPoint = path[path.length - 1];
        const goalDx = goalPoint[0] - vehicle.x;
        const goalDy = goalPoint[1] - vehicle.y;
        const goalDist = Math.sqrt(goalDx * goalDx + goalDy * goalDy);
        const reachedGoal = goalDist < 1.5;

        return { cte, headingError, reachedGoal };
    }

    computePIDControl(cte, headingError, dt) {
        const pid = this.pidController;

        // PID控制横向误差
        pid.integral += cte * dt;

        // 积分饱和限制
        const integralLimit = 5.0;
        pid.integral = Math.max(-integralLimit, Math.min(integralLimit, pid.integral));

        const derivative = (cte - pid.prevError) / dt;
        pid.prevError = cte;

        // 控制输出：转向角速度（rad/s）
        // CTE控制：右偏(正CTE)需要左转(负omega)，所以用负号
        const steeringControl = -(pid.kp * cte + pid.ki * pid.integral + pid.kd * derivative);

        // 航向控制：需要右转(正headingError)输出正omega
        const headingGain = 0.8;
        const headingControl = headingGain * headingError;

        // 总角速度（逆时针为正）
        let omega = steeringControl + headingControl;

        // 限制角速度
        const maxOmega = 2.5; // rad/s (≈143°/s)
        omega = Math.max(-maxOmega, Math.min(maxOmega, omega));

        console.log(`控制: CTE=${cte.toFixed(2)}m (右+/左-), 航向误差=${(headingError * 180 / Math.PI).toFixed(1)}°, 角速度=${(omega * 180 / Math.PI).toFixed(1)}°/s`);

        return {
            v: pid.targetSpeed,
            omega: omega
        };
    }

    updateVehicleState(control, dt) {
        const vehicle = this.vehicleState;

        // 更新位置和姿态（自行车运动学模型）
        vehicle.theta += control.omega * dt;

        // 归一化角度到 [-π, π]
        while (vehicle.theta > Math.PI) vehicle.theta -= 2 * Math.PI;
        while (vehicle.theta < -Math.PI) vehicle.theta += 2 * Math.PI;

        vehicle.x += control.v * Math.cos(vehicle.theta) * dt;
        vehicle.y += control.v * Math.sin(vehicle.theta) * dt;
        vehicle.v = control.v;

        // 碰撞检测（已禁用：规划算法未考虑车辆形状）
        // if (this.checkCollision(vehicle.x, vehicle.y)) {
        //     this.stopControl();
        //     this.showStatus('⚠️ 车辆碰撞！控制已停止', 'error');
        //     console.error('[Collision] 车辆位置:', vehicle.x.toFixed(2), vehicle.y.toFixed(2));
        //     return;
        // }

        // 记录实时轨迹到Canvas
        this.canvas.controlTrajectory.push([vehicle.x, vehicle.y]);

        // 更新Canvas显示
        this.canvas.vehicle = {
            x: vehicle.x,
            y: vehicle.y,
            theta: vehicle.theta
        };
        this.canvas.render();
    }

    checkCollision(x, y) {
        // 检查是否超出地图边界
        if (x < 0 || x >= this.canvas.mapWidth ||
            y < 0 || y >= this.canvas.mapHeight) {
            return true;
        }

        // 检查是否碰到障碍物（检查车辆周围的网格点）
        const checkRadius = 0.5; // 检查半径
        for (let dx = -checkRadius; dx <= checkRadius; dx += 0.25) {
            for (let dy = -checkRadius; dy <= checkRadius; dy += 0.25) {
                const checkX = Math.round(x + dx);
                const checkY = Math.round(y + dy);
                if (this.canvas.hasObstacle(checkX, checkY)) {
                    return true;
                }
            }
        }

        return false;
    }

    recordControlData(cte, headingError) {
        const currentTime = (Date.now() - this.controlStartTime) / 1000;

        this.controlData.cte.push(cte);
        this.controlData.heading.push(headingError);
        this.controlData.time.push(currentTime);
        this.controlData.positions.push([this.vehicleState.x, this.vehicleState.y]);

        // 限制数据长度
        const maxDataPoints = 500;
        if (this.controlData.cte.length > maxDataPoints) {
            this.controlData.cte.shift();
            this.controlData.heading.shift();
            this.controlData.time.shift();
            this.controlData.positions.shift();
        }
    }

    updateRealtimeDisplay() {
        // 实时更新偏差图表
        if (this.controlStep % 5 === 0) { // 每5步更新一次图表
            this.drawErrorChart({
                cte: this.controlData.cte,
                heading: this.controlData.heading
            });
        }

        // 更新统计数据
        const cteData = this.controlData.cte;
        const headingData = this.controlData.heading;

        if (cteData.length > 0) {
            const avgCte = cteData.reduce((a, b) => a + Math.abs(b), 0) / cteData.length;
            const maxCte = Math.max(...cteData.map(Math.abs));
            const avgHeading = headingData.reduce((a, b) => a + Math.abs(b), 0) / headingData.length;
            const currentCte = cteData[cteData.length - 1];
            const currentHeading = headingData[headingData.length - 1];

            document.getElementById('stat-avg-cte').textContent = avgCte.toFixed(4) + ' m';
            document.getElementById('stat-max-cte').textContent = maxCte.toFixed(4) + ' m';
            document.getElementById('stat-avg-heading').textContent = (avgHeading * 180 / Math.PI).toFixed(2) + '°';
            document.getElementById('stat-control-steps').textContent =
                `${this.controlStep} | CTE:${currentCte.toFixed(2)}m | θ:${(currentHeading * 180 / Math.PI).toFixed(1)}°`;
        }
    }

    displayFinalStats() {
        const cteData = this.controlData.cte;
        const headingData = this.controlData.heading;

        if (cteData.length > 0) {
            const avgCte = cteData.reduce((a, b) => a + Math.abs(b), 0) / cteData.length;
            const maxCte = Math.max(...cteData.map(Math.abs));
            const avgHeading = headingData.reduce((a, b) => a + Math.abs(b), 0) / headingData.length;

            console.log('[Control] 最终统计:');
            console.log(`  平均CTE: ${avgCte.toFixed(4)} m`);
            console.log(`  最大CTE: ${maxCte.toFixed(4)} m`);
            console.log(`  平均航向误差: ${(avgHeading * 180 / Math.PI).toFixed(2)}°`);
            console.log(`  控制步数: ${this.controlStep}`);

            this.showStatus(`控制完成 | 平均CTE: ${avgCte.toFixed(3)}m | 步数: ${this.controlStep}`, 'success');
        }

        // 绘制最终偏差图表
        this.drawErrorChart({
            cte: this.controlData.cte,
            heading: this.controlData.heading
        });
    }

    drawErrorChart(errors) {
        const canvas = document.getElementById('error-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;

        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const plotWidth = width - 2 * padding;
        const plotHeight = height - 2 * padding;

        // 清空
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, width, height);

        if (!errors.cte || errors.cte.length === 0) return;

        const cteData = errors.cte;
        const headingData = errors.heading;
        const maxCTE = Math.max(...cteData.map(Math.abs), 0.1);
        const maxHeading = Math.max(...headingData.map(Math.abs), 0.1);
        const maxValue = Math.max(maxCTE, maxHeading);

        // 坐标轴
        ctx.strokeStyle = '#2a3f5f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // 零线
        ctx.strokeStyle = '#4a5f7f';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const zeroY = padding + plotHeight / 2;
        ctx.moveTo(padding, zeroY);
        ctx.lineTo(width - padding, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        // CTE曲线（青色）
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        cteData.forEach((cte, i) => {
            const x = padding + (i / (cteData.length - 1)) * plotWidth;
            const y = zeroY - (cte / maxValue) * (plotHeight / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 航向误差曲线（绿色）
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        headingData.forEach((heading, i) => {
            const x = padding + (i / (headingData.length - 1)) * plotWidth;
            const y = zeroY - (heading / maxValue) * (plotHeight / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 图例
        ctx.fillStyle = '#00d4ff';
        ctx.font = '12px Arial';
        ctx.fillText('CTE', width - padding - 80, 20);
        ctx.fillStyle = '#00ff88';
        ctx.fillText('Heading Error', width - padding - 80, 35);

        // Y轴标签
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(maxValue.toFixed(2), 5, padding);
        ctx.fillText('0', 5, zeroY);
        ctx.fillText((-maxValue).toFixed(2), 5, height - padding);
    }

    async comparePIDParameters() {
        if (!this.canvas.path || this.canvas.path.length === 0) {
            this.showStatus('请先规划路径', 'error');
            return;
        }

        console.log('PID对比 - 原始数据:');
        console.log('  path:', this.canvas.path.slice(0, 3));
        console.log('  start:', this.canvas.start);
        console.log('  goal:', this.canvas.goal);

        // 转换start和goal从{x,y}格式到[x,y]格式
        const requestData = {
            path: this.canvas.path,
            start: this.canvas.start ? [this.canvas.start.x, this.canvas.start.y] : null,
            goal: this.canvas.goal ? [this.canvas.goal.x, this.canvas.goal.y] : null
        };

        console.log('  转换后的请求数据:', JSON.stringify(requestData, null, 2));

        this.showStatus('正在对比PID参数...', 'info');
        document.getElementById('btn-compare-pid').disabled = true;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/control/compare-pid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            console.log('响应状态码:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('响应错误:', errorText);
                throw new Error(`服务器响应错误: ${response.status}`);
            }

            const data = await response.json();

            if (!data) {
                throw new Error('服务器返回空数据');
            }

            if (data.success) {
                // 清空画布，保留路径
                this.canvas.controlTrajectory = [];
                this.canvas.vehicle = null;

                // 绘制所有对比轨迹
                const ctx = this.canvas.ctx;

                // 定义颜色
                const colors = {
                    conservative: '#00d4ff',
                    balanced: '#00ff88',
                    aggressive: '#ff4444',
                    slow: '#ffaa00'
                };

                // 绘制每条轨迹
                Object.keys(data.results).forEach(name => {
                    const result = data.results[name];
                    const trajectory = result.trajectory;
                    const color = colors[name];

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();

                    trajectory.forEach((point, index) => {
                        const x = point[0] * this.canvas.cellSize + this.canvas.cellSize / 2;
                        const y = point[1] * this.canvas.cellSize + this.canvas.cellSize / 2;
                        if (index === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    });
                    ctx.stroke();
                });

                // 显示对比统计
                this.displayComparisonStats(data.results);
                document.getElementById('comparison-info').style.display = 'block';

                this.showStatus('✅ PID参数对比完成', 'success');
            } else {
                this.showStatus('对比失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('PID对比错误:', error);
            const errorMsg = error.message || error.toString() || '未知错误';
            this.showStatus('❌ PID对比失败: ' + errorMsg, 'error');
        } finally {
            document.getElementById('btn-compare-pid').disabled = false;
        }
    }

    displayComparisonStats(results) {
        const names = {
            conservative: '保守型',
            balanced: '平衡型',
            aggressive: '激进型',
            slow: '缓慢型'
        };

        let html = '<h4>📊 参数对比统计</h4><table style="width:100%; font-size:12px; color:#fff;">';
        html += '<tr style="border-bottom:1px solid rgba(0,212,255,0.3);">';
        html += '<th>参数组</th><th>平均CTE</th><th>最大CTE</th><th>平均航向误差</th></tr>';

        Object.keys(results).forEach(key => {
            const result = results[key];
            const stats = result.stats;
            const color = result.config.color;

            html += `<tr style="border-bottom:1px solid rgba(0,212,255,0.1);">`;
            html += `<td style="color:${color}; font-weight:bold;">${names[key]}</td>`;
            html += `<td>${stats.avg_cte.toFixed(3)}m</td>`;
            html += `<td>${stats.max_cte.toFixed(3)}m</td>`;
            html += `<td>${stats.avg_heading_deg.toFixed(1)}°</td>`;
            html += `</tr>`;
        });

        html += '</table>';

        // 更新算法信息面板
        document.getElementById('algorithm-info').innerHTML = html;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MotionPlanningApp();
});
