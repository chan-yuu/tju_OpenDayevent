from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import shutil
import os
import io
import json
import subprocess
import threading
import glob
from PIL import Image
import numpy as np

# Try importing ultralytics, handle if not installed
try:
    from ultralytics import YOLO
    # Try to load custom trained model if exists, otherwise use pretrained
    custom_model_path = "runs/detect/custom_model/weights/best.pt"
    initial_model_name = "YOLOv8s"
    if os.path.exists(custom_model_path):
        model = YOLO(custom_model_path)
        initial_model_name = "custom_model (自定义训练模型)"
        print(f"Loaded custom trained model from {custom_model_path}")
    else:
        model = YOLO("yolov8s.pt")
        print("Loaded pretrained YOLOv8s model")
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False
    initial_model_name = "YOLOv8s"
    print("Warning: Ultralytics not found. Install it to use the model.")

app = FastAPI()

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BoundingBox(BaseModel):
    label: str
    confidence: float = 0.0
    box_2d: List[float] # [ymin, xmin, ymax, xmax] normalized

class TrainingProgress(BaseModel):
    epoch: int
    total_epochs: int
    loss: float = 0.0
    status: str

# Global training progress tracker
training_progress = {
    "epoch": 0,
    "total_epochs": 0,
    "loss": 0.0,
    "status": "idle"
}

# Track current model info
current_model_info = {
    "path": custom_model_path if os.path.exists(custom_model_path) else "yolov8n.pt",
    "name": initial_model_name
}

# Global webcam instance to avoid repeated open/close
webcam_instance = None

def get_webcam(camera_index: int = 0):
    """Get or create webcam instance"""
    global webcam_instance
    import cv2
    
    if webcam_instance is None or not webcam_instance.isOpened():
        webcam_instance = cv2.VideoCapture(camera_index)
        if not webcam_instance.isOpened():
            return None
        # Set camera properties for better performance
        webcam_instance.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        webcam_instance.set(cv2.CAP_PROP_FPS, 30)
    return webcam_instance

def release_webcam():
    """Release webcam instance"""
    global webcam_instance
    if webcam_instance is not None:
        webcam_instance.release()
        webcam_instance = None

@app.get("/")
def read_root():
    return {"status": "online", "has_gpu": False, "has_yolo": HAS_YOLO}

@app.get("/models")
def get_available_models():
    """Get list of available models"""
    models = []
    
    # Check for pretrained model
    if os.path.exists("yolov8s.pt"):
        models.append({"name": "yolov8s (预训练模型)", "path": "yolov8s.pt", "type": "pretrained"})
    
    # Check for custom trained models - scan all runs/detect/*/weights/best.pt
    if os.path.exists("runs/detect"):
        for model_dir in sorted(glob.glob("runs/detect/*/weights/best.pt"), reverse=True):
            model_name = model_dir.split("/")[2]  # Extract folder name like 'custom_model3'
            models.append({
                "name": f"{model_name} (自定义训练模型)",
                "path": model_dir,
                "type": "custom"
            })
    
    # Determine current model
    current = "yolov8s.pt"
    if models:
        # Use the most recent custom model if available
        custom_models = [m for m in models if m["type"] == "custom"]
        if custom_models:
            current = custom_models[0]["path"]
    
    return {"models": models, "current": current}

@app.post("/select-model")
def select_model(model_path: str = Query(...)):
    """Switch to a different model"""
    global model, current_model_info
    if not HAS_YOLO:
        raise HTTPException(status_code=503, detail="YOLO not installed")
    
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail=f"Model not found: {model_path}")
    
    try:
        model = YOLO(model_path)
        # Extract model name from path
        if "custom_model" in model_path or "/detect/" in model_path:
            # Custom trained model
            parts = model_path.split("/")
            for i, part in enumerate(parts):
                if part == "detect" and i + 1 < len(parts):
                    model_name = f"{parts[i + 1]} (自定义训练模型)"
                    break
            else:
                model_name = os.path.basename(model_path).replace(".pt", "")
        else:
            # Pretrained model like yolov8n.pt
            base_name = os.path.basename(model_path).replace(".pt", "")
            # Capitalize and format nicely
            model_name = base_name.upper() if len(base_name) <= 10 else base_name
        
        current_model_info["path"] = model_path
        current_model_info["name"] = model_name
        
        return {"status": "success", "message": f"Switched to model: {model_name}", "model_name": model_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

@app.get("/training-progress")
def get_training_progress():
    """Get current training progress"""
    return training_progress

@app.get("/current-model")
def get_current_model():
    """Get current model information"""
    return current_model_info

@app.post("/detect", response_model=List[BoundingBox])
async def detect(file: UploadFile = File(...)):
    if not HAS_YOLO:
        raise HTTPException(status_code=503, detail="YOLO library not installed on server")
    
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    width, height = image.size
    
    # Get valid classes from dataset (if using custom model)
    valid_classes = None
    is_custom_model = False
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    dataset_yaml = os.path.join(project_root, "dataset", "data.yaml")
    
    # Check if current model is a custom trained model
    model_path = current_model_info.get("path", "")
    if "/detect/" in model_path or "custom_model" in model_path or model_path.startswith("runs/"):
        is_custom_model = True
        # Load valid classes from dataset yaml
        if os.path.exists(dataset_yaml):
            import yaml
            with open(dataset_yaml, 'r') as f:
                data_config = yaml.safe_load(f)
                if 'names' in data_config:
                    valid_classes = set(data_config['names'])
    
    # Run inference
    results = model(image)
    
    # Process results
    detections = []
    for result in results:
        for box in result.boxes:
            # YOLO returns [x1, y1, x2, y2] absolute coordinates
            coords = box.xyxy[0].tolist() 
            x1, y1, x2, y2 = coords
            
            # Normalize to 0-1
            ymin = y1 / height
            xmin = x1 / width
            ymax = y2 / height
            xmax = x2 / width
            
            # Get class name and confidence
            cls_id = int(box.cls[0])
            label = result.names[cls_id]
            confidence = float(box.conf[0])
            
            # STRICT FILTER: Only return classes that exist in training dataset
            if is_custom_model:
                # This is a custom trained model - ONLY detect trained classes
                if valid_classes is None:
                    # No valid classes found - this shouldn't happen, but allow all detections
                    print(f"Warning: Custom model but no valid_classes found. Allowing detection: {label}")
                elif label not in valid_classes:
                    # Class not in training dataset - skip
                    continue
            
            detections.append(BoundingBox(
                label=label,
                confidence=confidence,
                box_2d=[ymin, xmin, ymax, xmax]
            ))
            
    return detections

@app.post("/detect-video")
async def detect_video(file: UploadFile = File(...)):
    """Detect objects in a video file"""
    if not HAS_YOLO:
        raise HTTPException(status_code=503, detail="YOLO library not installed on server")
    
    # Save uploaded video temporarily
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    temp_video_path = os.path.join(backend_dir, "temp_video.mp4")
    output_video_path = os.path.join(backend_dir, "output_video.mp4")
    
    try:
        # Save uploaded video
        with open(temp_video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get valid classes from dataset (if using custom model)
        valid_classes = None
        is_custom_model = False
        project_root = os.path.dirname(backend_dir)
        dataset_yaml = os.path.join(project_root, "dataset", "data.yaml")
        
        model_path = current_model_info.get("path", "")
        if "/detect/" in model_path or "custom_model" in model_path or model_path.startswith("runs/"):
            is_custom_model = True
            if os.path.exists(dataset_yaml):
                import yaml
                with open(dataset_yaml, 'r') as f:
                    data_config = yaml.safe_load(f)
                    if 'names' in data_config:
                        valid_classes = set(data_config['names'])
        
        # Process video with YOLO
        import cv2
        cap = cv2.VideoCapture(temp_video_path)
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        frame_count = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Progress file for real-time updates
        progress_file = os.path.join(backend_dir, "video_progress.txt")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Run inference
            results = model(frame)
            
            # Draw results on frame
            for result in results:
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    label = result.names[cls_id]
                    confidence = float(box.conf[0])
                    
                    # Filter by valid classes if custom model
                    if is_custom_model and valid_classes is not None and label not in valid_classes:
                        continue
                    
                    # Get box coordinates
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    
                    # Draw bounding box (thicker, more visible)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
                    
                    # Draw label background for better visibility
                    text = f"{label} {confidence:.2f}"
                    text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                    cv2.rectangle(frame, (x1, y1 - text_size[1] - 8), 
                                 (x1 + text_size[0] + 4, y1), (0, 255, 0), -1)
                    cv2.putText(frame, text, (x1 + 2, y1 - 4), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
            
            out.write(frame)
            frame_count += 1
            
            # Update progress every frame for smoother display
            progress = int((frame_count / total_frames) * 100)
            with open(progress_file, 'w') as f:
                f.write(str(progress))
            
            if frame_count % 30 == 0:
                print(f"Processing: {frame_count}/{total_frames} frames ({progress}%)")
        
        cap.release()
        out.release()
        
        # Set progress to 100%
        with open(progress_file, 'w') as f:
            f.write('100')
        
        # Read processed video
        with open(output_video_path, "rb") as f:
            video_bytes = f.read()
        
        # Clean up
        os.remove(temp_video_path)
        if os.path.exists(progress_file):
            os.remove(progress_file)
        
        from fastapi.responses import Response
        return Response(
            content=video_bytes,
            media_type="video/mp4",
            headers={
                "Content-Disposition": f"attachment; filename=detected_video.mp4"
            }
        )
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        if os.path.exists(output_video_path):
            os.remove(output_video_path)
        raise HTTPException(status_code=500, detail=f"Video processing failed: {str(e)}")

@app.get("/detect-webcam-frame")
async def detect_webcam_frame(camera_index: int = Query(default=0)):
    """Capture and detect objects in a single webcam frame"""
    if not HAS_YOLO:
        raise HTTPException(status_code=503, detail="YOLO library not installed on server")
    
    try:
        import cv2
        
        # Get persistent webcam instance
        cap = get_webcam(camera_index)
        if cap is None:
            raise HTTPException(status_code=404, detail=f"Cannot open camera {camera_index}")
        
        # Read frame
        ret, frame = cap.read()
        
        if not ret:
            # Try to reinitialize camera
            release_webcam()
            cap = get_webcam(camera_index)
            if cap is None:
                raise HTTPException(status_code=500, detail="Failed to capture frame")
            ret, frame = cap.read()
            if not ret:
                raise HTTPException(status_code=500, detail="Failed to capture frame")
        
        height, width = frame.shape[:2]
        
        # Get valid classes from dataset (if using custom model)
        valid_classes = None
        is_custom_model = False
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        dataset_yaml = os.path.join(project_root, "dataset", "data.yaml")
        
        model_path = current_model_info.get("path", "")
        if "/detect/" in model_path or "custom_model" in model_path or model_path.startswith("runs/"):
            is_custom_model = True
            if os.path.exists(dataset_yaml):
                import yaml
                with open(dataset_yaml, 'r') as f:
                    data_config = yaml.safe_load(f)
                    if 'names' in data_config:
                        valid_classes = set(data_config['names'])
        
        # Run inference
        results = model(frame)
        
        # Process results and draw on frame
        detections = []
        for result in results:
            for box in result.boxes:
                coords = box.xyxy[0].tolist()
                x1, y1, x2, y2 = coords
                
                # Normalize to 0-1
                ymin = y1 / height
                xmin = x1 / width
                ymax = y2 / height
                xmax = x2 / width
                
                # Get class name and confidence
                cls_id = int(box.cls[0])
                label = result.names[cls_id]
                confidence = float(box.conf[0])
                
                # Filter by valid classes if custom model
                if is_custom_model:
                    if valid_classes is None:
                        print(f"Warning: Custom model but no valid_classes found. Allowing detection: {label}")
                    elif label not in valid_classes:
                        continue
                
                # Draw bounding box on frame
                x1_int, y1_int, x2_int, y2_int = int(x1), int(y1), int(x2), int(y2)
                cv2.rectangle(frame, (x1_int, y1_int), (x2_int, y2_int), (0, 255, 0), 3)
                
                # Draw label with background
                text = f"{label} {confidence:.2f}"
                text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                cv2.rectangle(frame, (x1_int, y1_int - text_size[1] - 8), 
                             (x1_int + text_size[0] + 4, y1_int), (0, 255, 0), -1)
                cv2.putText(frame, text, (x1_int + 2, y1_int - 4), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
                
                detections.append(BoundingBox(
                    label=label,
                    confidence=confidence,
                    box_2d=[ymin, xmin, ymax, xmax]
                ))
        
        # Encode frame as JPEG with higher quality
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_bytes = buffer.tobytes()
        
        import base64
        frame_base64 = base64.b64encode(frame_bytes).decode('utf-8')
        
        return {
            "detections": detections,
            "frame": frame_base64,
            "width": width,
            "height": height
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webcam detection failed: {str(e)}")

@app.get("/list-cameras")
async def list_cameras():
    """List available camera devices"""
    try:
        import cv2
        available_cameras = []
        
        # Try to open cameras 0-4
        for i in range(5):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                available_cameras.append({
                    "index": i,
                    "name": f"Camera {i}"
                })
                cap.release()
        
        return {"cameras": available_cameras}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list cameras: {str(e)}")

@app.post("/stop-webcam")
def stop_webcam():
    """Stop and release webcam"""
    release_webcam()
    return {"status": "success", "message": "Webcam released"}

@app.post("/generate-dataset-yaml")
def generate_dataset_yaml():
    """自动生成data.yaml配置文件"""
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        dataset_dir = os.path.join(project_root, "dataset")
        labels_dir = os.path.join(dataset_dir, "labels")
        images_dir = os.path.join(dataset_dir, "images")
        
        # 读取 predefined_classes.txt 作为标准类别列表
        predefined_file = os.path.join(dataset_dir, "predefined_classes.txt")
        all_class_names = []
        if os.path.exists(predefined_file):
            with open(predefined_file, 'r', encoding='utf-8') as f:
                # 按行读取,保持顺序
                all_class_names = [line.strip() for line in f if line.strip()]
        else:
            # 如果没有predefined_classes.txt,使用默认类别
            all_class_names = ['dog', 'cat', 'person', 'car', 'bicycle', 'motorcycle', 'bus', 'truck',
                          'traffic_light', 'stop_sign', 'fire_hydrant', 'parking_meter',
                          'pedestrian', 'traffic_cone', 'barrier']
        
        # 扫描 labels 目录获取实际使用的类别ID
        used_class_ids = set()
        if os.path.exists(labels_dir):
            for label_file in os.listdir(labels_dir):
                if label_file.endswith('.txt') and label_file not in ['classes.txt', 'classes.txt.backup', 'predefined_classes.txt']:
                    label_path = os.path.join(labels_dir, label_file)
                    try:
                        with open(label_path, 'r') as f:
                            for line in f:
                                parts = line.strip().split()
                                if parts:
                                    try:
                                        class_id = int(parts[0])
                                        used_class_ids.add(class_id)
                                    except ValueError:
                                        pass
                    except Exception as e:
                        print(f"Warning: Failed to read {label_file}: {e}")
        
        # 如果没有找到任何标注,使用默认的dog和cat
        if not used_class_ids:
            used_class_ids = {0, 1}  # 默认dog和cat
        
        # 根据实际使用的class_id生成类别名称列表
        sorted_class_ids = sorted(used_class_ids)
        class_names = []
        for class_id in sorted_class_ids:
            if class_id < len(all_class_names):
                class_names.append(all_class_names[class_id])
            else:
                class_names.append(f"class{class_id}")
        
        nc = len(class_names)
        
        # 生成 YAML 配置
        import yaml
        config = {
            'path': dataset_dir,
            'train': 'images',
            'val': 'images',
            'nc': nc,
            'names': class_names
        }
        
        # 写入 data.yaml
        data_yaml_path = os.path.join(dataset_dir, "data.yaml")
        with open(data_yaml_path, 'w', encoding='utf-8') as f:
            f.write("# YOLO 数据集配置文件 - 自动生成\n")
            f.write(f"# 生成时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            yaml.dump(config, f, allow_unicode=True, default_flow_style=False, width=1000, sort_keys=False)
        
        # 计数图片和标注
        image_count = 0
        label_count = 0
        if os.path.exists(images_dir):
            image_count = len([f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        if os.path.exists(labels_dir):
            label_count = len([f for f in os.listdir(labels_dir) if f.endswith('.txt') and f not in ['classes.txt.backup', 'predefined_classes.txt']])
        
        return {
            "status": "success",
            "message": f"✓ 配置文件已生成！\n\n📁 文件: {data_yaml_path}\n📊 类别数: {nc}\n🏷️ 类别: {', '.join(class_names)}\n🖼️ 图片: {image_count}\n📝 标注: {label_count}",
            "config": config,
            "image_count": image_count,
            "label_count": label_count
        }
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate data.yaml: {str(e)}\n{error_detail}")

@app.get("/dataset-stats")
def get_dataset_stats():
    """获取数据集统计信息"""
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        dataset_dir = os.path.join(project_root, "dataset")
        labels_dir = os.path.join(dataset_dir, "labels")
        images_dir = os.path.join(dataset_dir, "images")
        
        # 统计图片
        image_files = []
        if os.path.exists(images_dir):
            image_files = [f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        # 统计标注
        label_files = []
        class_counts = {}
        total_boxes = 0
        if os.path.exists(labels_dir):
            for label_file in os.listdir(labels_dir):
                if label_file.endswith('.txt') and label_file not in ['classes.txt', 'classes.txt.backup', 'predefined_classes.txt']:
                    label_files.append(label_file)
                    label_path = os.path.join(labels_dir, label_file)
                    try:
                        with open(label_path, 'r') as f:
                            for line in f:
                                parts = line.strip().split()
                                if parts:
                                    try:
                                        class_id = int(parts[0])
                                        class_counts[class_id] = class_counts.get(class_id, 0) + 1
                                        total_boxes += 1
                                    except ValueError:
                                        pass
                    except Exception as e:
                        print(f"Warning: Failed to read {label_file}: {e}")
        
        # 读取类别名称
        predefined_file = os.path.join(dataset_dir, "predefined_classes.txt")
        class_names = []
        if os.path.exists(predefined_file):
            with open(predefined_file, 'r', encoding='utf-8') as f:
                class_names = [line.strip() for line in f if line.strip()]
        
        # 转换class_counts为带名称的格式
        class_distribution = []
        for class_id, count in sorted(class_counts.items()):
            class_name = class_names[class_id] if class_id < len(class_names) else f"class{class_id}"
            class_distribution.append({
                "id": class_id,
                "name": class_name,
                "count": count
            })
        
        # 计算标注进度
        annotated = len([f for f in image_files if f.replace('.jpg', '.txt').replace('.png', '.txt').replace('.jpeg', '.txt') in label_files])
        progress = (annotated / len(image_files) * 100) if len(image_files) > 0 else 0
        
        return {
            "status": "success",
            "total_images": len(image_files),
            "annotated_images": annotated,
            "unannotated_images": len(image_files) - annotated,
            "progress": round(progress, 1),
            "total_boxes": total_boxes,
            "class_distribution": class_distribution,
            "recent_labels": sorted(label_files, key=lambda x: os.path.getmtime(os.path.join(labels_dir, x)), reverse=True)[:5]
        }
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "detail": traceback.format_exc()}


@app.get("/get-leaderboard")
def get_leaderboard():
    """获取排行榜数据"""
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        leaderboard_file = os.path.join(project_root, "leaderboard.json")
        
        if os.path.exists(leaderboard_file):
            with open(leaderboard_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {"status": "success", "leaderboard": data.get("leaderboard", [])}
        else:
            return {"status": "success", "leaderboard": []}
    except Exception as e:
        return {"status": "error", "message": str(e), "leaderboard": []}

@app.post("/save-leaderboard")
def save_leaderboard(request: dict):
    """保存排行榜数据到JSON文件"""
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        leaderboard_file = os.path.join(project_root, "leaderboard.json")
        
        # 读取现有数据
        leaderboard = []
        if os.path.exists(leaderboard_file):
            try:
                with open(leaderboard_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:  # 只有文件不为空才解析
                        data = json.loads(content)
                        leaderboard = data.get("leaderboard", [])
            except (json.JSONDecodeError, ValueError):
                # 文件损坏,重新开始
                leaderboard = []
        
        # 添加新分数
        new_score = request.get("score")
        if new_score:
            leaderboard.append(new_score)
            # 排序并保留前10名
            leaderboard = sorted(leaderboard, key=lambda x: x['score'], reverse=True)[:10]
        
        # 保存到文件
        with open(leaderboard_file, 'w', encoding='utf-8') as f:
            json.dump({
                "leaderboard": leaderboard,
                "last_updated": __import__('datetime').datetime.now().isoformat()
            }, f, ensure_ascii=False, indent=2)
        
        return {"status": "success", "leaderboard": leaderboard}
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save leaderboard: {str(e)}\n{error_detail}")


def train_in_background(epochs: int, temp_yaml: str, backend_dir: str):
    """Background training function"""
    global training_progress, model
    
    try:
        # Validate dataset before training
        import yaml
        with open(temp_yaml, 'r') as f:
            data_config = yaml.safe_load(f)
        
        nc = data_config.get('nc', 0)
        names = data_config.get('names', [])
        print(f"Dataset validation: nc={nc}, classes={names}")
        
        # Check labels directory
        project_root = os.path.dirname(backend_dir)
        labels_dir = os.path.join(project_root, "dataset", "labels")
        if os.path.exists(labels_dir):
            # Count valid label files
            label_files = [f for f in os.listdir(labels_dir) if f.endswith('.txt') and f not in ['classes.txt', 'predefined_classes.txt']]
            print(f"Found {len(label_files)} label files")
            
            # Validate class IDs in label files
            invalid_labels = []
            for label_file in label_files[:10]:  # Check first 10 files
                label_path = os.path.join(labels_dir, label_file)
                with open(label_path, 'r') as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts:
                            try:
                                class_id = int(parts[0])
                                if class_id >= nc:
                                    invalid_labels.append(f"{label_file}: class_id={class_id} >= nc={nc}")
                            except ValueError:
                                invalid_labels.append(f"{label_file}: invalid class_id={parts[0]}")
            
            if invalid_labels:
                error_msg = "Invalid labels found:\n" + "\n".join(invalid_labels[:5])
                print(error_msg)
                training_progress["status"] = "error"
                training_progress["error"] = error_msg
                return
        
        # Load pretrained YOLOv8s model for transfer learning
        # This uses pretrained weights but will be fine-tuned on custom dataset
        training_progress["status"] = "loading_model"
        train_model = YOLO("yolov8s.pt")  # Use YOLOv8s pretrained weights
        
        training_progress["status"] = "training"
        
        # Custom callback to update progress
        def on_train_epoch_end(trainer):
            global training_progress
            epoch = trainer.epoch + 1
            training_progress["epoch"] = epoch
            training_progress["status"] = "training"
            print(f"Progress update: Epoch {epoch}/{trainer.epochs}")
        
        # Add callback
        train_model.add_callback("on_train_epoch_end", on_train_epoch_end)
        
        # Start training with transfer learning
        # 关键修复: 使用单类别标志避免CUDA类别索引问题
        results = train_model.train(
            data=temp_yaml,
            epochs=epochs,
            imgsz=640,
            batch=16,  # 减小batch size提高稳定性
            verbose=True,
            pretrained=True,  # Use pretrained weights for transfer learning
            device=0,  # 使用GPU
            cache=False,  # 不使用缓存,确保数据正确加载
            # patience=50,  # 早停耐心值
            # amp=False,  # 禁用混合精度,提高稳定性
        )
        
        # Find the latest model (it might be custom_model, custom_model2, etc.)
        latest_model = None
        if os.path.exists("runs/detect"):
            model_paths = sorted(glob.glob("runs/detect/*/weights/best.pt"), 
                               key=os.path.getmtime, reverse=True)
            if model_paths:
                latest_model = model_paths[0]
        
        training_progress["status"] = "completed"
        training_progress["epoch"] = epochs
        training_progress["model_path"] = latest_model
        
        # Store the training results folder path
        if latest_model:
            # Extract the training folder (e.g., runs/detect/train)
            training_folder = os.path.dirname(os.path.dirname(latest_model))
            training_progress["results_folder"] = training_folder
        
        # Reload the model to use the newly trained one
        if latest_model and os.path.exists(latest_model):
            model = YOLO(latest_model)
            print(f"Reloaded newly trained model from {latest_model}")
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Training error: {error_detail}")
        training_progress["status"] = "error"
        training_progress["error"] = str(e)

@app.post("/train")
async def train_model(epochs: int = Query(default=10)):
    global training_progress
    
    if not HAS_YOLO:
        raise HTTPException(status_code=503, detail="YOLO not installed")
    
    # Check if already training
    if training_progress["status"] == "training":
        raise HTTPException(status_code=400, detail="Training already in progress")
    
    # Check if dataset exists - use absolute path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    dataset_yaml = os.path.join(project_root, "dataset", "data.yaml")
    
    if not os.path.exists(dataset_yaml):
        raise HTTPException(
            status_code=400, 
            detail=f"Dataset not found at {dataset_yaml}. Please create dataset/data.yaml and add your training images and labels."
        )
    
    try:
        # Initialize training progress
        training_progress = {
            "epoch": 0,
            "total_epochs": epochs,
            "loss": 0.0,
            "status": "initializing"
        }
        
        # Update data.yaml with absolute paths and correct format
        import yaml
        with open(dataset_yaml, 'r', encoding='utf-8') as f:
            data_config = yaml.safe_load(f)
        
        # Ensure correct format
        data_config['path'] = os.path.join(project_root, 'dataset')
        data_config['train'] = 'images'
        data_config['val'] = 'images'
        data_config['nc'] = 2
        
        # CRITICAL: names must be a list, not a dict!
        if isinstance(data_config.get('names'), dict):
            # Convert dict to list
            names_dict = data_config['names']
            data_config['names'] = [names_dict.get(i, f'class{i}') for i in range(data_config['nc'])]
        elif not isinstance(data_config.get('names'), list):
            # Default names if not specified
            data_config['names'] = ['dog', 'cat']
        
        print(f"Training config: nc={data_config['nc']}, names={data_config['names']}")
        
        # Write temporary config with absolute paths
        temp_yaml = os.path.join(backend_dir, 'temp_data.yaml')
        with open(temp_yaml, 'w', encoding='utf-8') as f:
            yaml.dump(data_config, f, allow_unicode=True, default_flow_style=False, width=1000)
        
        # Start training in background thread
        thread = threading.Thread(
            target=train_in_background,
            args=(epochs, temp_yaml, backend_dir),
            daemon=True
        )
        thread.start()
        
        return {
            "status": "started",
            "message": f"✓ 训练已开始，共 {epochs} 轮",
            "epochs": epochs
        }
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Training start error: {error_detail}")
        training_progress["status"] = "error"
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")

@app.post("/start-labelimg")
async def start_labelimg():
    try:
        # Get the absolute path to dataset directories (parent of backend)
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        images_dir = os.path.join(project_root, "dataset", "images")
        labels_dir = os.path.join(project_root, "dataset", "labels")
        
        # Create directories if they don't exist
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(labels_dir, exist_ok=True)
        
        # Check if there are any images
        image_files = []
        if os.path.exists(images_dir):
            image_files = [f for f in os.listdir(images_dir) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif'))]
        
        if len(image_files) == 0:
            return {
                "status": "warning",
                "message": f"⚠️ No images found in dataset/images/\n\nPlease add some images to:\n{images_dir}\n\nThen try again.",
                "images_count": 0
            }
        
        # Start labelimg using Python module
        # Note: labelImg doesn't have __main__.py, so we need to run labelImg.labelImg module
        import sys
        
        # Try multiple methods to start labelImg
        process = None
        error_msg = None
        
        try:
            # 查找 labelImg 命令
            home_dir = os.path.expanduser("~")
            labelimg_cmd = os.path.join(home_dir, ".local", "bin", "labelImg")
            
            if not os.path.exists(labelimg_cmd):
                # 尝试全局安装
                labelimg_cmd = "labelImg"
            
            # 创建预定义类别文件
            classes_file = os.path.join(project_root, "dataset", "predefined_classes.txt")
            if not os.path.exists(classes_file):
                with open(classes_file, 'w') as f:
                    f.write("dog\ncat\nperson\ncar\nbicycle\nmotorcycle\nbus\ntruck\n")
                    f.write("traffic_light\nstop_sign\nfire_hydrant\nparking_meter\n")
                    f.write("pedestrian\ntraffic_cone\nbarrier\n")
            
            # 在labels目录创建classes.txt (LabelImg需要)
            labels_classes_file = os.path.join(labels_dir, "classes.txt")
            # 总是从predefined_classes.txt同步更新
            if os.path.exists(classes_file):
                import shutil
                shutil.copy(classes_file, labels_classes_file)
            else:
                with open(labels_classes_file, 'w') as f:
                    f.write("dog\ncat\nperson\ncar\nbicycle\nmotorcycle\nbus\ntruck\n")
                    f.write("traffic_light\nstop_sign\nfire_hydrant\nparking_meter\n")
                    f.write("pedestrian\ntraffic_cone\nbarrier\n")
            
            # 创建启动脚本
            launch_script = os.path.join(project_root, "launch_labelimg.sh")
            with open(launch_script, 'w') as f:
                f.write("#!/bin/bash\n")
                f.write(f"cd '{project_root}'\n")
                f.write(f"export DISPLAY={os.environ.get('DISPLAY', ':0')}\n")
                f.write(f"nohup {labelimg_cmd} '{images_dir}' '{classes_file}' '{labels_dir}' > /tmp/labelimg.log 2>&1 &\n")
                f.write("echo $!\n")
            
            os.chmod(launch_script, 0o755)
            
            # 执行脚本
            result = subprocess.run(
                ["/bin/bash", launch_script],
                capture_output=True,
                text=True,
                cwd=project_root
            )
            
            if result.returncode == 0:
                pid = result.stdout.strip()
                return {
                    "status": "success",
                    "message": f"✓ 标注工具已在后台启动 (PID: {pid})\n\n📁 图片目录: {images_dir}\n📁 标注目录: {labels_dir}\n📊 找到 {len(image_files)} 张图片\n\n💡 如果未看到窗口,请检查:\n1. 图片目录是否有图片\n2. 终端日志: /tmp/labelimg.log",
                    "images_count": len(image_files),
                    "pid": pid
                }
            else:
                raise Exception(f"Script execution failed: {result.stderr}")
            
        except Exception as e:
            raise Exception(f"Failed to start LabelImg: {str(e)}")
    except FileNotFoundError as e:
        return {
            "status": "error",
            "message": "❌ LabelImg not found. Install with:\npip install labelimg"
        }
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        return {
            "status": "error",
            "message": f"❌ Failed to start LabelImg:\n{str(e)}\n\nDetails:\n{error_detail}"
        }

@app.post("/open-results-folder")
def open_results_folder():
    """Open the training results folder in file manager"""
    global training_progress
    
    # Check if training has completed and we have a results folder
    if training_progress.get("status") != "completed":
        raise HTTPException(status_code=400, detail="No completed training found")
    
    results_folder = training_progress.get("results_folder")
    if not results_folder or not os.path.exists(results_folder):
        raise HTTPException(status_code=404, detail="Results folder not found")
    
    try:
        # Get absolute path
        abs_folder = os.path.abspath(results_folder)
        
        # Open file manager based on the system
        if os.name == 'posix':  # Linux/Unix
            subprocess.Popen(['xdg-open', abs_folder])
        elif os.name == 'nt':  # Windows
            os.startfile(abs_folder)
        elif os.name == 'darwin':  # macOS
            subprocess.Popen(['open', abs_folder])
        
        return {
            "status": "success",
            "message": f"✓ 已打开文件夹: {abs_folder}",
            "path": abs_folder
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open folder: {str(e)}")
