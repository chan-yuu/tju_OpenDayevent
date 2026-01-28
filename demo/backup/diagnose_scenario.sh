#!/bin/bash

echo "==================== 场景加载问题诊断 ===================="
echo ""
echo "1. 检查后端服务器状态..."
if curl -s http://localhost:8000/api/scenarios > /dev/null 2>&1; then
    echo "   ✓ 后端服务器正常运行"
else
    echo "   ✗ 后端服务器未响应"
    exit 1
fi

echo ""
echo "2. 检查场景API..."
SCENARIO_COUNT=$(curl -s http://localhost:8000/api/scenarios | python3 -c "import json, sys; data=json.load(sys.stdin); print(len(data['scenarios']))")
echo "   ✓ 场景列表API返回 $SCENARIO_COUNT 个场景"

echo ""
echo "3. 测试加载单个场景 (maze)..."
curl -s http://localhost:8000/api/scenarios/maze | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'   场景名称: {data[\"name\"]}')
print(f'   地图尺寸: {data[\"width\"]}x{data[\"height\"]}')
print(f'   起点: {data[\"start\"]}')
print(f'   终点: {data[\"goal\"]}')
print(f'   障碍物数量: {len(data[\"obstacles\"])}')
"

echo ""
echo "4. 检查前端文件..."
FILES=(
    "demo/frontend/index.html"
    "demo/frontend/js/app.js"
    "demo/frontend/js/api.js"
    "demo/frontend/js/canvas.js"
    "demo/frontend/js/config.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file 存在"
    else
        echo "   ✗ $file 缺失"
    fi
done

echo ""
echo "5. 关键代码检查..."
echo "   检查场景选择事件绑定..."
if grep -q "scenario-select.*addEventListener.*change" demo/frontend/js/app.js; then
    echo "   ✓ 场景选择事件已绑定"
else
    echo "   ✗ 场景选择事件未绑定"
fi

echo "   检查loadScenario方法..."
if grep -q "async loadScenario" demo/frontend/js/app.js; then
    echo "   ✓ loadScenario方法存在"
else
    echo "   ✗ loadScenario方法缺失"
fi

echo "   检查addObstacles批量方法..."
if grep -q "addObstacles" demo/frontend/js/canvas.js; then
    echo "   ✓ addObstacles批量方法存在"
else
    echo "   ✗ addObstacles批量方法缺失"
fi

echo ""
echo "==================== 诊断完成 ===================="
echo ""
echo "请执行以下步骤测试："
echo "1. 打开浏览器访问: http://localhost:8000"
echo "2. 按F12打开开发者工具控制台"
echo "3. 在场景选择下拉框中选择'迷宫场景'"
echo "4. 观察控制台输出和地图变化"
echo ""
echo "预期看到的控制台输出："
echo "  [scenario-select] 选择场景: maze"
echo "  [loadScenario] 开始加载场景: maze"
echo "  [API] 请求场景: maze"
echo "  [loadScenario] 场景数据: {...}"
echo "  [loadScenario] 添加障碍物数量: 101"
echo "  [loadScenario] 场景加载完成"
