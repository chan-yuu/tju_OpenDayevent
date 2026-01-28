#!/bin/bash

echo "=== 系统诊断 ==="
echo ""

echo "1. 检查后端服务..."
if curl -s http://localhost:8000/api/scenarios > /dev/null; then
    echo "✓ 后端服务正常"
    SCENARIOS=$(curl -s http://localhost:8000/api/scenarios | grep -o '"id"' | wc -l)
    echo "  场景数量: $SCENARIOS"
else
    echo "✗ 后端服务无法访问"
fi

echo ""
echo "2. 检查场景文件..."
cd /home/cyun/Documents/tju-planner-lab/demo/scenarios
SCENE_FILES=$(ls -1 *.json 2>/dev/null | wc -l)
echo "  场景文件数: $SCENE_FILES"
ls -1 *.json 2>/dev/null | sed 's/^/  - /'

echo ""
echo "3. 检查前端文件..."
cd /home/cyun/Documents/tju-planner-lab/demo/frontend
for file in index.html js/config.js js/api.js js/canvas.js js/app.js; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (缺失)"
    fi
done

echo ""
echo "4. 测试API端点..."
curl -s http://localhost:8000/api/controllers | python3 -m json.tool | head -10

