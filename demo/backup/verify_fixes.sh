#!/bin/bash
# 一键验证所有修复

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🔧 验证所有最新修复 (2026-01-27)                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# 测试1: 规划功能
echo "1️⃣ 测试规划功能..."
python test_fixes.py > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ 规划功能正常"
else
    echo "   ❌ 规划功能异常"
fi

# 测试2: 预设场景
echo ""
echo "2️⃣ 测试预设场景..."
SCENARIO_COUNT=$(ls scenarios/*.json 2>/dev/null | wc -l)
if [ $SCENARIO_COUNT -ge 5 ]; then
    echo "   ✅ 找到 $SCENARIO_COUNT 个场景文件"
else
    echo "   ❌ 场景文件不足（需要至少5个）"
fi

# 测试3: 关于系统更新
echo ""
echo "3️⃣ 测试关于系统更新..."
if grep -q "智能车路径规划与控制系统" frontend/index.html && \
   grep -q "使用指南" frontend/index.html && \
   grep -q "TJU Planner Lab" frontend/index.html; then
    echo "   ✅ 关于系统已更新"
else
    echo "   ❌ 关于系统未更新"
fi

# 测试4: 后台运行配置
echo ""
echo "4️⃣ 测试后台运行配置..."
if grep -q "nohup python3 main.py" deploy_desktop.sh && \
   grep -q "disown" deploy_desktop.sh; then
    echo "   ✅ 后台运行已配置"
else
    echo "   ❌ 后台运行未配置"
fi

# 测试5: 场景API
echo ""
echo "5️⃣ 测试场景API..."
if grep -q "/api/scenarios" backend/main.py && \
   grep -q "get_scenarios" backend/main.py; then
    echo "   ✅ 场景API已添加"
else
    echo "   ❌ 场景API未添加"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 完整测试（可选）："
echo "   $ python test_new_features.py"
echo ""
echo "🚀 启动系统："
echo "   $ ./deploy_desktop.sh"
echo ""
echo "💡 提示: 现在可以关闭终端，服务会继续在后台运行"
echo ""
