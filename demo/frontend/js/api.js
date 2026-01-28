// API通信模块
class PlanningAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || CONFIG.API_BASE_URL;
    }

    async getAlgorithms() {
        try {
            const response = await fetch(`${this.baseUrl}/algorithms`);
            if (!response.ok) throw new Error('获取算法列表失败');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async planPath(mapConfig, algorithm, params = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    map_config: mapConfig,
                    algorithm: algorithm,
                    params: params
                })
            });

            if (!response.ok) throw new Error('路径规划失败');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getScenarios() {
        try {
            const response = await fetch(`${this.baseUrl}/scenarios`);
            if (!response.ok) throw new Error('获取场景列表失败');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { scenarios: [] };
        }
    }

    async getScenario(scenarioId) {
        try {
            const response = await fetch(`${this.baseUrl}/scenarios/${scenarioId}`);
            if (!response.ok) throw new Error('获取场景失败');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async saveScenario(scenarioData) {
        try {
            const response = await fetch(`${this.baseUrl}/scenarios/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scenarioData)
            });

            if (!response.ok) throw new Error('保存场景失败');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}
