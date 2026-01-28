from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 数据存储目录
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MAPS_DIR = os.path.join(DATA_DIR, 'maps')
UPLOAD_DIR = os.path.join(DATA_DIR, 'uploads')

# 确保目录存在
os.makedirs(MAPS_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 节点类型定义
NODE_TYPES = [
    '宿舍', '大门', '教学楼', '图书馆', '实验楼', 
    '工程馆', '食堂', '操场', '体育馆', '充电站'
]


@app.route('/api/node-types', methods=['GET'])
def get_node_types():
    """获取所有节点类型"""
    return jsonify({'types': NODE_TYPES})


@app.route('/api/maps', methods=['GET'])
def get_maps():
    """获取所有保存的地图列表"""
    maps = []
    if os.path.exists(MAPS_DIR):
        for filename in os.listdir(MAPS_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(MAPS_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        maps.append({
                            'id': filename[:-5],
                            'name': data.get('name', filename[:-5]),
                            'created_at': data.get('created_at', ''),
                            'node_count': len(data.get('nodes', [])),
                            'edge_count': len(data.get('edges', []))
                        })
                except Exception as e:
                    print(f"Error loading map {filename}: {e}")
                    continue
    
    print(f"Found {len(maps)} maps")
    return jsonify({'success': True, 'maps': maps})


@app.route('/api/map/<map_id>', methods=['GET'])
def get_map(map_id):
    """获取指定地图的完整数据"""
    filepath = os.path.join(MAPS_DIR, f'{map_id}.json')
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'error': '地图不存在'}), 404
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify({'success': True, 'map': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/map', methods=['POST'])
def save_map():
    """保存地图数据"""
    data = request.json
    
    # 验证必要字段
    if not data.get('name'):
        return jsonify({'error': '地图名称不能为空'}), 400
    
    # 生成地图ID
    map_id = data.get('id') or f"map_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # 添加元数据
    map_data = {
        'id': map_id,
        'name': data['name'],
        'background_image': data.get('background_image', ''),
        'nodes': data.get('nodes', []),
        'edges': data.get('edges', []),
        'vehicles': data.get('vehicles', []),
        'tasks': data.get('tasks', []),
        'created_at': data.get('created_at') or datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    # 保存到文件
    filepath = os.path.join(MAPS_DIR, f'{map_id}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(map_data, f, ensure_ascii=False, indent=2)
    
    return jsonify({'success': True, 'map_id': map_id, 'message': '地图保存成功'})


@app.route('/api/map/<map_id>', methods=['DELETE'])
def delete_map(map_id):
    """删除地图"""
    filepath = os.path.join(MAPS_DIR, f'{map_id}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': '地图不存在'}), 404
    
    os.remove(filepath)
    return jsonify({'success': True, 'message': '地图删除成功'})


@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """上传背景图片"""
    if 'image' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '文件名为空'}), 400
    
    # 保存文件
    filename = f"bg_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)
    
    return jsonify({
        'success': True,
        'filename': filename,
        'url': f'/api/images/{filename}'
    })


@app.route('/api/images/<filename>', methods=['GET'])
def get_image(filename):
    """获取上传的图片"""
    return send_from_directory(UPLOAD_DIR, filename)


if __name__ == '__main__':
    print("=" * 60)
    print("校园智能调度系统 - 后端服务")
    print("=" * 60)
    print(f"数据目录: {DATA_DIR}")
    print(f"地图存储: {MAPS_DIR}")
    print(f"图片存储: {UPLOAD_DIR}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
