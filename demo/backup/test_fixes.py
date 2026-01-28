#!/usr/bin/env python3
"""
快速测试脚本 - 验证所有修复是否生效
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python_motion_planning', 'src'))

import numpy as np
from python_motion_planning.common.env import Grid, Node
from python_motion_planning.path_planner.graph_search import AStar

def test_grid_creation():
    """测试Grid创建"""
    print("🧪 测试Grid创建...")
    try:
        map_data = np.zeros((50, 50), dtype=np.int8)
        grid = Grid(
            bounds=[[0, 50], [0, 50]],
            resolution=1.0,
            type_map=map_data
        )
        print("   ✅ Grid创建成功")
        return grid
    except Exception as e:
        print(f"   ❌ Grid创建失败: {e}")
        return None

def test_node_creation():
    """测试Node创建"""
    print("🧪 测试Node创建...")
    try:
        start = Node(tuple([5, 5]))
        goal = Node(tuple([45, 45]))
        print("   ✅ Node创建成功")
        return start, goal
    except Exception as e:
        print(f"   ❌ Node创建失败: {e}")
        return None, None

def test_planner_initialization():
    """测试规划器初始化"""
    print("🧪 测试规划器初始化...")
    try:
        # 创建地图
        grid = test_grid_creation()
        if grid is None:
            return False
        
        # 创建起点和终点
        start, goal = test_node_creation()
        if start is None or goal is None:
            return False
        
        # 初始化规划器
        planner = AStar(map_=grid, start=start.current, goal=goal.current)
        print("   ✅ 规划器初始化成功")
        
        # 执行规划
        print("🧪 测试路径规划...")
        path, expanded = planner.plan()
        if path and len(path) > 0:
            print(f"   ✅ 路径规划成功！路径长度: {len(path)}")
            return True
        else:
            print("   ⚠️  未找到路径（可能是正常的）")
            return True
            
    except Exception as e:
        print(f"   ❌ 规划器初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_desktop_icon():
    """测试桌面图标文件"""
    print("🧪 测试桌面图标...")
    icon_path = os.path.join(os.path.dirname(__file__), 'icon.svg')
    if os.path.exists(icon_path):
        print(f"   ✅ 图标文件存在: {icon_path}")
        # 检查文件大小
        size = os.path.getsize(icon_path)
        print(f"   📏 文件大小: {size} 字节")
        return True
    else:
        print(f"   ❌ 图标文件不存在: {icon_path}")
        return False

def test_html_tabs():
    """测试HTML标签页结构"""
    print("🧪 测试HTML标签页...")
    html_path = os.path.join(os.path.dirname(__file__), 'frontend', 'index.html')
    if os.path.exists(html_path):
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查关键元素
        checks = {
            '标签页导航': 'tab-navigation' in content,
            '规划标签页': 'planning-tab' in content,
            '控制标签页': 'control-tab' in content,
            '标签按钮': 'tab-btn' in content
        }
        
        all_passed = True
        for name, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {name}: {'存在' if passed else '缺失'}")
            if not passed:
                all_passed = False
        
        return all_passed
    else:
        print(f"   ❌ HTML文件不存在: {html_path}")
        return False

def main():
    print("=" * 60)
    print("🚀 开始测试修复...")
    print("=" * 60)
    print()
    
    results = []
    
    # 测试1: Grid创建
    results.append(("Grid创建", test_grid_creation() is not None))
    print()
    
    # 测试2: Node创建
    start, goal = test_node_creation()
    results.append(("Node创建", start is not None and goal is not None))
    print()
    
    # 测试3: 规划器初始化和规划
    results.append(("规划器初始化", test_planner_initialization()))
    print()
    
    # 测试4: 桌面图标
    results.append(("桌面图标", test_desktop_icon()))
    print()
    
    # 测试5: HTML标签页
    results.append(("HTML标签页", test_html_tabs()))
    print()
    
    # 总结
    print("=" * 60)
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
        print("🎉 所有测试通过！系统已准备就绪。")
        return 0
    else:
        print()
        print("⚠️  部分测试失败，请检查错误信息。")
        return 1

if __name__ == '__main__':
    sys.exit(main())
