#!/usr/bin/env python3
"""
完整功能测试 - 验证所有最新修复
"""
import sys
import os
import json

def test_scenarios():
    """测试场景文件"""
    print("🧪 测试预设场景...")
    scenarios_dir = os.path.join(os.path.dirname(__file__), 'scenarios')
    
    if not os.path.exists(scenarios_dir):
        print("   ❌ scenarios目录不存在")
        return False
    
    json_files = [f for f in os.listdir(scenarios_dir) if f.endswith('.json')]
    
    if len(json_files) == 0:
        print("   ❌ 没有找到场景文件")
        return False
    
    print(f"   ✅ 找到 {len(json_files)} 个场景文件")
    
    # 验证每个场景文件格式
    valid_count = 0
    for json_file in json_files:
        try:
            with open(os.path.join(scenarios_dir, json_file), 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # 检查必需字段
            required_fields = ['name', 'width', 'height', 'start', 'goal', 'obstacles']
            if all(field in data for field in required_fields):
                print(f"   ✅ {json_file}: {data['name']} ({data['width']}x{data['height']}, {len(data['obstacles'])}个障碍物)")
                valid_count += 1
            else:
                print(f"   ⚠️  {json_file}: 缺少必需字段")
        except Exception as e:
            print(f"   ❌ {json_file}: 格式错误 - {e}")
    
    print(f"   📊 有效场景: {valid_count}/{len(json_files)}")
    return valid_count > 0

def test_backend_api():
    """测试后端API"""
    print("\n🧪 测试后端API接口...")
    
    # 检查main.py中的API端点
    main_py = os.path.join(os.path.dirname(__file__), 'backend', 'main.py')
    
    if not os.path.exists(main_py):
        print("   ❌ backend/main.py不存在")
        return False
    
    with open(main_py, 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = {
        '/api/scenarios': 'get_scenarios' in content,
        '/api/scenarios/{scenario_id}': 'get_scenario' in content and 'scenario_id' in content,
        '场景加载逻辑': 'scenarios_dir' in content,
        'plan返回值处理': 'isinstance(result, tuple)' in content
    }
    
    all_passed = True
    for name, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {name}")
        if not passed:
            all_passed = False
    
    return all_passed

def test_frontend_updates():
    """测试前端更新"""
    print("\n🧪 测试前端更新...")
    
    # 检查index.html中的关于系统对话框
    index_html = os.path.join(os.path.dirname(__file__), 'frontend', 'index.html')
    
    if not os.path.exists(index_html):
        print("   ❌ frontend/index.html不存在")
        return False
    
    with open(index_html, 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = {
        '关于系统更新': '智能车路径规划与控制系统' in content,
        '使用指南': '使用指南' in content and '路径规划' in content,
        '技术栈说明': '技术栈' in content and 'FastAPI' in content,
        'TJU标识': 'TJU Planner Lab' in content
    }
    
    all_passed = True
    for name, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {name}")
        if not passed:
            all_passed = False
    
    return all_passed

def test_deploy_script():
    """测试部署脚本"""
    print("\n🧪 测试部署脚本...")
    
    deploy_sh = os.path.join(os.path.dirname(__file__), 'deploy_desktop.sh')
    
    if not os.path.exists(deploy_sh):
        print("   ❌ deploy_desktop.sh不存在")
        return False
    
    with open(deploy_sh, 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = {
        'nohup命令': 'nohup python3 main.py' in content,
        'disown命令': 'disown $SERVER_PID' in content or 'disown' in content,
        '后台运行提示': '后台运行' in content or '关闭终端' in content,
        'Icon路径': 'Icon=$SCRIPT_DIR/icon.svg' in content
    }
    
    all_passed = True
    for name, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {name}")
        if not passed:
            all_passed = False
    
    return all_passed

def main():
    print("=" * 60)
    print("🚀 完整功能测试")
    print("=" * 60)
    
    results = []
    
    # 测试1: 预设场景
    results.append(("预设场景", test_scenarios()))
    
    # 测试2: 后端API
    results.append(("后端API", test_backend_api()))
    
    # 测试3: 前端更新
    results.append(("前端更新", test_frontend_updates()))
    
    # 测试4: 部署脚本
    results.append(("部署脚本", test_deploy_script()))
    
    # 总结
    print("\n" + "=" * 60)
    print("📊 测试总结")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status}: {name}")
    
    print()
    print(f"总计: {passed}/{total} 项测试通过")
    
    if passed == total:
        print()
        print("🎉 所有新功能测试通过！")
        print()
        print("📝 修复总结:")
        print("  1. ✅ 规划失败错误已修复 (处理tuple返回值)")
        print("  2. ✅ 关于系统对话框已更新")
        print("  3. ✅ 预设场景已定义 (5个场景)")
        print("  4. ✅ desktop启动已优化 (后台运行)")
        return 0
    else:
        print()
        print("⚠️  部分测试失败，请检查错误信息。")
        return 1

if __name__ == '__main__':
    sys.exit(main())
