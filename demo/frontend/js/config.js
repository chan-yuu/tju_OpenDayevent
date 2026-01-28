// 配置文件
const CONFIG = {
    // API配置
    API_BASE_URL: 'http://localhost:8000/api',

    // 画布配置
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 800,
    CELL_SIZE: 16,

    // 颜色配置
    COLORS: {
        BACKGROUND: '#0a0e27',
        GRID: '#1a2347',
        OBSTACLE: '#ff3366',
        START: '#00ff88',
        GOAL: '#ff3366',
        PATH: '#00d9ff',
        EXPANDED: '#8892b0',
        VEHICLE: '#ffaa00',
    },

    // 地图配置
    DEFAULT_MAP_WIDTH: 50,
    DEFAULT_MAP_HEIGHT: 50,

    // 动画配置
    ANIMATION_FPS: 60,
    DEFAULT_SPEED: 1.0,

    // 算法信息
    ALGORITHM_INFO: {
        'astar': {
            name: 'A*算法',
            description: 'A*算法是一种启发式搜索算法，结合了Dijkstra算法和贪婪最佳优先搜索的优点。使用启发函数评估节点的优先级。',
            complexity: '时间复杂度: O(b^d), b为分支因子，d为深度',
            advantages: ['保证找到最优路径', '效率较高', '广泛应用'],
            disadvantages: ['需要合适的启发函数', '内存消耗较大']
        },
        'dijkstra': {
            name: 'Dijkstra算法',
            description: 'Dijkstra算法是一种经典的图搜索算法，通过逐步扩展最短路径来找到从起点到终点的最优路径。',
            complexity: '时间复杂度: O((V+E)logV)',
            advantages: ['保证最优解', '算法稳定', '不需要启发函数'],
            disadvantages: ['搜索效率较低', '对大规模地图效率不高']
        },
        'gbfs': {
            name: '贪婪最佳优先搜索',
            description: 'GBFS是一种启发式搜索算法，完全依赖启发函数来选择下一个扩展的节点，优先选择最接近目标的节点。',
            complexity: '时间复杂度: O(b^m), m为最大深度',
            advantages: ['搜索速度快', '内存占用少'],
            disadvantages: ['不保证最优解', '可能陷入局部最优']
        },
        'jps': {
            name: 'Jump Point Search',
            description: 'JPS是A*算法的优化版本，通过跳跃点技术减少搜索的节点数，特别适合规则网格地图。',
            complexity: '时间复杂度: 优于标准A*',
            advantages: ['大幅提高搜索效率', '减少内存使用', '保证最优性'],
            disadvantages: ['仅适用于规则网格', '实现相对复杂']
        },
        'theta_star': {
            name: 'Theta*算法',
            description: 'Theta*是A*的变体，允许任意角度路径，生成的路径更加平滑和自然，接近真实的最短路径。',
            complexity: '时间复杂度: 类似A*',
            advantages: ['生成平滑路径', '路径更短', '减少转弯次数'],
            disadvantages: ['计算量稍大', '需要视线检测']
        },
        'lazy_theta_star': {
            name: 'Lazy Theta*',
            description: 'Lazy Theta*是Theta*的延迟版本，推迟视线检测直到节点被扩展时才执行，提高了效率。',
            complexity: '时间复杂度: 优于标准Theta*',
            advantages: ['效率更高', '生成平滑路径', '减少视线检测次数'],
            disadvantages: ['实现复杂度较高']
        },
        'rrt': {
            name: 'RRT算法',
            description: '快速扩展随机树（RRT）是一种基于采样的路径规划算法，通过随机采样和树的增量构建来探索空间。',
            complexity: '时间复杂度: 概率完备',
            advantages: ['适合高维空间', '快速探索', '处理复杂约束'],
            disadvantages: ['路径不是最优的', '路径较曲折']
        },
        'rrt_star': {
            name: 'RRT*算法',
            description: 'RRT*是RRT的改进版本，通过重新连接操作逐步优化路径，渐近最优。',
            complexity: '时间复杂度: 渐近最优',
            advantages: ['渐近最优性', '适合复杂环境', '路径质量好'],
            disadvantages: ['收敛速度较慢', '计算开销大']
        },
        'rrt_connect': {
            name: 'RRT-Connect',
            description: 'RRT-Connect通过从起点和终点同时生长两棵树，加快了路径搜索速度。',
            complexity: '时间复杂度: 快于标准RRT',
            advantages: ['搜索速度快', '双向搜索', '成功率高'],
            disadvantages: ['路径质量一般', '不保证最优']
        },
        'voronoi': {
            name: 'Voronoi规划器',
            description: 'Voronoi规划器基于Voronoi图，生成距离障碍物尽可能远的路径，提高安全性。',
            complexity: '时间复杂度: O(n log n)',
            advantages: ['路径安全性高', '远离障碍物', '适合导航'],
            disadvantages: ['路径可能较长', '预处理开销']
        }
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
