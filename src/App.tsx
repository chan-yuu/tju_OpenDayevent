import React, { useState, useEffect, useRef } from 'react';
import { BoundingBox } from './types';
import { detectObjectsPython, checkBackendHealth, trainModel, startLabelImg, getTrainingProgress, getAvailableModels, selectModel, getCurrentModel, openResultsFolder, detectObjectsInVideo, detectWebcamFrame } from './services/pythonService';
import QuizSystem from './components/QuizSystem';
import {
  Scan,
  BrainCircuit,
  Tag,
  AlertCircle,
  Loader2,
  CheckCircle,
  Camera,
  Upload,
  Play,
  Square,
  Eye,
  Zap,
  Sparkles,
  Brain,
  Target,
  Layers,
  Database,
  BookOpen,
  FolderOpen,
  Video,
  Download
} from 'lucide-react';

type AppMode = 'ANNOTATE' | 'TRAIN' | 'INFERENCE' | 'QUIZ';
type InferenceMode = 'image' | 'video' | 'webcam';

const App = () => {
  const [mode, setMode] = useState<AppMode>('ANNOTATE');
  const [isBackendAlive, setIsBackendAlive] = useState(false);

  // Training State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [epochs, setEpochs] = useState(50);

  // Inference State
  const [inferenceMode, setInferenceMode] = useState<InferenceMode>('image');
  const [inferenceImage, setInferenceImage] = useState<File | null>(null);
  const [inferenceVideo, setInferenceVideo] = useState<File | null>(null);
  const [inferencePreviewUrl, setInferencePreviewUrl] = useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [inferenceResult, setInferenceResult] = useState<BoundingBox[]>([]);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isWebcamStreaming, setIsWebcamStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('default');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [currentModelName, setCurrentModelName] = useState<string>('智能视觉');
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Annotation State
  const [labelImgStatus, setLabelImgStatus] = useState<string>('');
  const [datasetStats, setDatasetStats] = useState<any>(null);

  // 加载数据集统计
  useEffect(() => {
    if (mode === 'ANNOTATE' && isBackendAlive) {
      loadDatasetStats();
    }
  }, [mode, isBackendAlive, labelImgStatus]);

  const loadDatasetStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/dataset-stats');
      const data = await response.json();
      if (data.status === 'success') {
        setDatasetStats(data);
      }
    } catch (e) {
      console.error('Failed to load dataset stats:', e);
    }
  };

  // Check backend health
  useEffect(() => {
    const check = async () => {
      const alive = await checkBackendHealth();
      setIsBackendAlive(alive);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load available models when switching to inference mode
  useEffect(() => {
    if (mode === 'INFERENCE' && isBackendAlive) {
      loadModels();
    }
  }, [mode, isBackendAlive]);

  const loadModels = async () => {
    try {
      const data = await getAvailableModels();
      setAvailableModels(data.models);
      setSelectedModel(data.current);

      try {
        const currentModel = await getCurrentModel();
        setCurrentModelName(currentModel.name || '智能视觉');
      } catch (e) {
        console.error('Failed to get current model:', e);
      }
    } catch (e) {
      console.error('Failed to load models:', e);
    }
  };

  // Poll training progress when training
  useEffect(() => {
    if (!isTraining) return;

    const pollProgress = async () => {
      try {
        const progress = await getTrainingProgress();

        if (progress.status === 'initializing') {
          setTrainingStatus('🔧 正在初始化训练环境...');
        } else if (progress.status === 'loading_model') {
          setTrainingStatus('📥 正在加载模型架构...');
        } else if (progress.status === 'training') {
          setTrainingStatus(`🚀 训练进行中... 第 ${progress.epoch}/${progress.total_epochs} 轮`);
        } else if (progress.status === 'completed') {
          setTrainingStatus(`✅ 训练完成！共训练 ${progress.total_epochs} 轮`);
          setIsTraining(false);
          await loadModels();
        } else if (progress.status === 'error') {
          setTrainingStatus(`❌ 训练出错: ${progress.error || '未知错误'}`);
          setIsTraining(false);
        } else if (progress.status === 'idle') {
          setTrainingStatus('⏳ 等待训练开始...');
        } else {
          setTrainingStatus(`📊 ${progress.status}...`);
        }
      } catch (e) {
        console.error('Failed to get progress:', e);
      }
    };

    pollProgress();
    const interval = setInterval(pollProgress, 2000);
    return () => clearInterval(interval);
  }, [isTraining]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartLabelImg = async () => {
    try {
      setLabelImgStatus('正在启动标注工具...');
      const result = await startLabelImg();
      setLabelImgStatus(result.status === 'success' ? '✓ 标注工具已启动' : result.message);
      setTimeout(() => setLabelImgStatus(''), 8000);
    } catch (e: any) {
      setLabelImgStatus('❌ 启动失败: ' + e.message);
    }
  };

  const handleGenerateYaml = async () => {
    try {
      setLabelImgStatus('正在生成配置文件...');
      const response = await fetch('http://localhost:8000/generate-dataset-yaml', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.status === 'success') {
        setLabelImgStatus(result.message);
        setTimeout(() => setLabelImgStatus(''), 10000);
      } else {
        setLabelImgStatus('❌ 生成失败');
      }
    } catch (e: any) {
      setLabelImgStatus('❌ 生成失败: ' + e.message);
    }
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingStatus('正在初始化训练...');
    try {
      const result = await trainModel(epochs);
      setTrainingStatus(`✓ ${result.message}`);
    } catch (e: any) {
      setTrainingStatus('训练失败: ' + e.message);
      setIsTraining(false);
    }
  };

  const handleModelChange = async (modelPath: string) => {
    try {
      const result = await selectModel(modelPath);
      setSelectedModel(modelPath);
      if (result.model_name) {
        setCurrentModelName(result.model_name);
      }
    } catch (e: any) {
      setInferenceError('切换模型失败: ' + e.message);
    }
  };

  const handleOpenResultsFolder = async () => {
    try {
      const result = await openResultsFolder();
      console.log(result.message);
    } catch (e: any) {
      setTrainingStatus('打开文件夹失败: ' + e.message);
    }
  };

  const handleInferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      
      if (fileType === 'video') {
        setInferenceVideo(file);
        setInferenceMode('video');
        setInferencePreviewUrl(URL.createObjectURL(file));
        setProcessedVideoUrl(null);
      } else {
        setInferenceImage(file);
        setInferenceMode('image');
        setInferencePreviewUrl(URL.createObjectURL(file));
      }
      
      setInferenceResult([]);
      setInferenceError(null);
      setUseCamera(false);
      setIsCameraActive(false);
      setIsWebcamStreaming(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setInferenceVideo(file);
      setInferenceMode('video');
      setInferencePreviewUrl(URL.createObjectURL(file));
      setProcessedVideoUrl(null);
      setInferenceResult([]);
      setInferenceError(null);
      setIsCameraActive(false);
      setIsWebcamStreaming(false);
    }
  };

  const processVideo = async () => {
    if (!inferenceVideo || !isBackendAlive) return;
    
    setIsInferencing(true);
    setVideoProgress(0);
    setInferenceError(null);
    setProcessedVideoUrl(null);

    try {
      const videoBlob = await detectObjectsInVideo(inferenceVideo, (progress) => {
        setVideoProgress(progress);
      });
      
      // Create URL for the processed video
      const url = URL.createObjectURL(videoBlob);
      setProcessedVideoUrl(url);
      setVideoProgress(100);
    } catch (e: any) {
      setInferenceError(e.message || "视频处理失败");
    } finally {
      setIsInferencing(false);
    }
  };

  const startWebcamStream = async () => {
    setInferenceMode('webcam');
    setIsWebcamStreaming(true);
    setInferenceError(null);
    setInferenceResult([]);
  };

  const stopWebcamStream = async () => {
    setIsWebcamStreaming(false);
    setInferenceResult([]);
    setInferencePreviewUrl(null);
    
    // Release webcam on backend
    try {
      await fetch(`http://localhost:8000/stop-webcam`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to release webcam:', e);
    }
  };

  // Continuous webcam detection loop
  useEffect(() => {
    if (!isWebcamStreaming) return;

    let isActive = true;

    const detectLoop = async () => {
      if (!isActive || !isWebcamStreaming) return;

      try {
        const result = await detectWebcamFrame(0);

        if (!isActive || !isWebcamStreaming) return;

        // Update preview image
        setInferencePreviewUrl(`data:image/jpeg;base64,${result.frame}`);

        // Update detections
        const boxes: BoundingBox[] = result.detections.map(res => ({
          id: crypto.randomUUID(),
          label: res.label,
          confidence: res.confidence,
          ymin: res.box_2d[0] / 1000,
          xmin: res.box_2d[1] / 1000,
          ymax: res.box_2d[2] / 1000,
          xmax: res.box_2d[3] / 1000,
        }));
        setInferenceResult(boxes);

        // Continue loop after delay
        if (isActive && isWebcamStreaming) {
          setTimeout(detectLoop, 100); // 10 FPS
        }
      } catch (e: any) {
        if (isActive) {
          setInferenceError(e.message || "摄像头检测失败");
          setIsWebcamStreaming(false);
        }
      }
    };

    detectLoop();

    return () => {
      isActive = false;
    };
  }, [isWebcamStreaming]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setInferenceResult([]);
        setInferenceError(null);
      }
    } catch (e: any) {
      setInferenceError('无法访问相机: ' + e.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setInferenceResult([]);
  };

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });

      setIsInferencing(true);
      setScanning(true);
      setInferenceError(null);

      try {
        const results = await detectObjectsPython(file);
        const boxes: BoundingBox[] = results.map(res => ({
          id: crypto.randomUUID(),
          label: res.label,
          confidence: res.confidence,
          ymin: res.box_2d[0] / 1000,
          xmin: res.box_2d[1] / 1000,
          ymax: res.box_2d[2] / 1000,
          xmax: res.box_2d[3] / 1000,
        }));
        setInferenceResult(boxes);
      } catch (e: any) {
        setInferenceError(e.message || "检测失败");
      } finally {
        setIsInferencing(false);
        setTimeout(() => setScanning(false), 500);
      }
    }, 'image/jpeg');
  };

  const runInference = async () => {
    if (!inferenceImage || !isBackendAlive) return;
    setIsInferencing(true);
    setScanning(true);
    setInferenceError(null);

    try {
      const results = await detectObjectsPython(inferenceImage);
      const boxes: BoundingBox[] = results.map(res => ({
        id: crypto.randomUUID(),
        label: res.label,
        confidence: res.confidence,
        ymin: res.box_2d[0] / 1000,
        xmin: res.box_2d[1] / 1000,
        ymax: res.box_2d[2] / 1000,
        xmax: res.box_2d[3] / 1000,
      }));
      setInferenceResult(boxes);
    } catch (e: any) {
      setInferenceError(e.message || "检测失败");
    } finally {
      setIsInferencing(false);
      setTimeout(() => setScanning(false), 500);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ top: '10%', left: '10%', animationDuration: '4s' }} />
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ bottom: '10%', right: '10%', animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ top: '50%', left: '50%', animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Sidebar Navigation */}
      <aside className="relative z-10 w-24 flex flex-col items-center py-8 bg-slate-900/60 backdrop-blur-xl border-r border-white/10">
        {/* Logo */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
          <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Eye className="text-white" size={28} />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-6 w-full px-3">
          <button
            onClick={() => setMode('ANNOTATE')}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${mode === 'ANNOTATE'
              ? 'bg-gradient-to-br from-blue-600/80 to-purple-600/80 shadow-lg shadow-blue-500/50'
              : 'hover:bg-white/5'
              }`}
          >
            <Database size={26} className={mode === 'ANNOTATE' ? 'text-white' : 'text-gray-400 group-hover:text-blue-400'} />
            <span className={`text-xs font-medium ${mode === 'ANNOTATE' ? 'text-white' : 'text-gray-400 group-hover:text-blue-400'}`}>标注</span>
          </button>

          <button
            onClick={() => setMode('TRAIN')}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${mode === 'TRAIN'
              ? 'bg-gradient-to-br from-purple-600/80 to-pink-600/80 shadow-lg shadow-purple-500/50'
              : 'hover:bg-white/5'
              }`}
          >
            <Brain size={26} className={mode === 'TRAIN' ? 'text-white' : 'text-gray-400 group-hover:text-purple-400'} />
            <span className={`text-xs font-medium ${mode === 'TRAIN' ? 'text-white' : 'text-gray-400 group-hover:text-purple-400'}`}>训练</span>
          </button>

          <button
            onClick={() => setMode('INFERENCE')}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${mode === 'INFERENCE'
              ? 'bg-gradient-to-br from-green-600/80 to-emerald-600/80 shadow-lg shadow-green-500/50'
              : 'hover:bg-white/5'
              }`}
          >
            <Zap size={26} className={mode === 'INFERENCE' ? 'text-white' : 'text-gray-400 group-hover:text-green-400'} />
            <span className={`text-xs font-medium ${mode === 'INFERENCE' ? 'text-white' : 'text-gray-400 group-hover:text-green-400'}`}>识别</span>
          </button>

          <button
            onClick={() => setMode('QUIZ')}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${mode === 'QUIZ'
              ? 'bg-gradient-to-br from-orange-600/80 to-yellow-600/80 shadow-lg shadow-orange-500/50'
              : 'hover:bg-white/5'
              }`}
          >
            <BookOpen size={26} className={mode === 'QUIZ' ? 'text-white' : 'text-gray-400 group-hover:text-orange-400'} />
            <span className={`text-xs font-medium ${mode === 'QUIZ' ? 'text-white' : 'text-gray-400 group-hover:text-orange-400'}`}>答题</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <div className={`flex flex-col items-center gap-2 px-3 py-2 rounded-xl ${isBackendAlive
            ? 'bg-green-500/20 border border-green-500/50'
            : 'bg-red-500/20 border border-red-500/50'
            }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isBackendAlive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
            <span className="text-[10px] text-white font-medium">AI</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* QUIZ MODE - 使用独立布局 */}
        {mode === 'QUIZ' ? (
          <QuizSystem />
        ) : (
          <>
            {/* Header */}
            <header className="px-8 py-6 bg-slate-900/40 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                    {mode === 'ANNOTATE' && '数据标注系统'}
                    {mode === 'TRAIN' && 'AI模型训练'}
                    {mode === 'INFERENCE' && 'AI智能识别'}
                    <Sparkles className="text-yellow-400 animate-pulse" size={24} />
                  </h1>
                  <p className="text-purple-300/80 text-sm mt-1">
                    {mode === 'ANNOTATE' && '标记训练数据 · 构建数据集'}
                    {mode === 'TRAIN' && '深度学习 · 模型优化'}
                    {mode === 'INFERENCE' && '计算机视觉 · 物体检测'}
                  </p>
                </div>
                {mode === 'INFERENCE' && (
                  <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/10">
                    <Layers className="text-purple-400" size={20} />
                    <span className="text-sm text-purple-200 font-medium">模型: {currentModelName}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
              {/* ANNOTATE MODE */}
              {mode === 'ANNOTATE' && (
                <div className="h-full overflow-auto p-8">
                  <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      {/* 主卡片 */}
                      <div className="lg:col-span-2">
                        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                          <div className="flex items-center gap-5 mb-8">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-75"></div>
                              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                                <Database className="text-white" size={40} />
                              </div>
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white mb-1">数据标注</h2>
                              <p className="text-gray-300">标记图片中的物体，构建训练数据集</p>
                            </div>
                          </div>

                          <div className="space-y-4 mb-8">
                            <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/5">
                              <p className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="text-purple-400">⚡</span> 快速开始
                              </p>
                              <ol className="text-gray-300 text-sm space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">1.</span>
                                  <span>将图片放入 <code className="text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">dataset/images/</code></span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">2.</span>
                                  <span>点击下方按钮启动标注工具</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">3.</span>
                                  <span>选择 YOLO 格式，框选目标并指定类别</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">4.</span>
                                  <span>标注完成后点击“生成配置”</span>
                                </li>
                              </ol>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-5 border border-blue-500/30">
                              <p className="text-white font-semibold mb-2 flex items-center gap-2">
                                <span>💡</span> 标注技巧
                              </p>
                              <ul className="text-gray-300 text-sm space-y-1">
                                <li>• 尽量框选完整的目标边界</li>
                                <li>• 保持类别标签一致性</li>
                                <li>• 多角度、多场景提高模型鲁棒性</li>
                              </ul>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={handleStartLabelImg}
                              disabled={!isBackendAlive}
                              className={`group relative py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${isBackendAlive
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70'
                                : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                              {isBackendAlive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                              )}
                              <div className="relative flex items-center justify-center gap-3">
                                <Database size={24} />
                                <span>启动标注工具</span>
                              </div>
                            </button>
                            
                            <button
                              onClick={handleGenerateYaml}
                              disabled={!isBackendAlive}
                              className={`group relative py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${isBackendAlive
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70'
                                : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                              {isBackendAlive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                              )}
                              <div className="relative flex items-center justify-center gap-3">
                                <Sparkles size={24} />
                                <span>生成配置</span>
                              </div>
                            </button>
                          </div>

                          {labelImgStatus && (
                            <div className={`mt-6 rounded-2xl p-4 border-2 ${labelImgStatus.includes('✓')
                              ? 'bg-green-500/10 border-green-500/50'
                              : labelImgStatus.includes('❌')
                                ? 'bg-red-500/10 border-red-500/50'
                                : 'bg-blue-500/10 border-blue-500/50'
                              }`}>
                              <p className={`text-sm whitespace-pre-wrap ${labelImgStatus.includes('✓')
                                ? 'text-green-300'
                                : labelImgStatus.includes('❌')
                                  ? 'text-red-300'
                                  : 'text-blue-300'
                                }`}>{labelImgStatus}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 统计侧边栏 */}
                      <div className="space-y-6">
                        {/* 数据集概览 */}
                        {datasetStats && (
                          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <Target size={20} className="text-blue-400" />
                              数据集概览
                            </h3>
                            
                            {/* 进度条 */}
                            <div className="mb-6">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">标注进度</span>
                                <span className="text-white font-bold">{datasetStats.progress}%</span>
                              </div>
                              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                                  style={{ width: `${datasetStats.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* 统计数据 */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                                <div className="text-2xl font-bold text-white">{datasetStats.total_images}</div>
                                <div className="text-xs text-gray-400">总图片</div>
                              </div>
                              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
                                <div className="text-2xl font-bold text-green-400">{datasetStats.annotated_images}</div>
                                <div className="text-xs text-gray-400">已标注</div>
                              </div>
                              <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/30">
                                <div className="text-2xl font-bold text-yellow-400">{datasetStats.unannotated_images}</div>
                                <div className="text-xs text-gray-400">未标注</div>
                              </div>
                              <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/30">
                                <div className="text-2xl font-bold text-purple-400">{datasetStats.total_boxes}</div>
                                <div className="text-xs text-gray-400">总标注框</div>
                              </div>
                            </div>

                            {/* 类别分布 */}
                            {datasetStats.class_distribution && datasetStats.class_distribution.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm text-gray-400 mb-2">类别分布</p>
                                <div className="space-y-2">
                                  {datasetStats.class_distribution.map((cls: any) => (
                                    <div key={cls.id} className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400 w-20 truncate">{cls.name}</span>
                                      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                          style={{ width: `${(cls.count / datasetStats.total_boxes * 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-white font-bold w-8 text-right">{cls.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 最近标注 */}
                        {datasetStats && datasetStats.recent_labels && datasetStats.recent_labels.length > 0 && (
                          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <Eye size={20} className="text-green-400" />
                              最近标注
                            </h3>
                            <div className="space-y-2">
                              {datasetStats.recent_labels.slice(0, 5).map((file: string, idx: number) => (
                                <div key={idx} className="bg-slate-900/60 rounded-lg p-2 border border-white/5">
                                  <p className="text-xs text-gray-300 truncate font-mono">{file}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRAIN MODE */}
              {mode === 'TRAIN' && (
                <div className="h-full overflow-auto p-8">
                  <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 主训练面板 */}
                      <div className="lg:col-span-2">
                        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                          <div className="flex items-center gap-5 mb-8">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-75 animate-pulse"></div>
                              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                                <Brain className="text-white" size={40} />
                              </div>
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white mb-1">模型训练</h2>
                              <p className="text-gray-300">使用标注数据训练AI模型</p>
                            </div>
                          </div>

                          <div className="space-y-5 mb-8">
                            <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/5">
                              <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="text-purple-400">🔄</span> 训练轮数
                              </label>
                              <input
                                type="number"
                                value={epochs}
                                onChange={(e) => setEpochs(parseInt(e.target.value) || 50)}
                                min={1}
                                max={500}
                                className="w-full bg-slate-800 border-2 border-slate-700 focus:border-purple-500 rounded-xl px-5 py-3 text-white text-lg font-semibold focus:outline-none transition-colors"
                              />
                              <p className="text-gray-400 text-sm mt-3">💡 建议: 测试 10-20 轮，生产 50-100 轮</p>
                            </div>

                            <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/5">
                              <p className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="text-pink-400">⚙️</span> 训练配置
                              </p>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <p className="text-gray-400">基础模型</p>
                                  <p className="text-white font-semibold">YOLOv8s (迁移学习)</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <p className="text-gray-400">图像大小</p>
                                  <p className="text-white font-semibold">640×640</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <p className="text-gray-400">批次大小</p>
                                  <p className="text-white font-semibold">16 (GPU优化)</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <p className="text-gray-400">设备</p>
                                  <p className="text-white font-semibold">CUDA GPU</p>
                                </div>
                              </div>
                            </div>

                            {/* 训练建议 */}
                            {datasetStats && (
                              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5 border border-purple-500/30">
                                <p className="text-white font-semibold mb-3 flex items-center gap-2">
                                  <span>💡</span> 训练建议
                                </p>
                                <div className="space-y-2 text-sm">
                                  {datasetStats.annotated_images < 10 && (
                                    <p className="text-yellow-300">⚠️ 数据量较少 ({datasetStats.annotated_images}张)，建议至少20张以获得更好效果</p>
                                  )}
                                  {datasetStats.annotated_images >= 10 && datasetStats.annotated_images < 50 && (
                                    <p className="text-green-300">✓ 数据量适中，可以开始训练</p>
                                  )}
                                  {datasetStats.annotated_images >= 50 && (
                                    <p className="text-green-300">✓ 数据量充足，预期效果良好</p>
                                  )}
                                  {datasetStats.class_distribution && datasetStats.class_distribution.length > 0 && (
                                    <p className="text-blue-300">📊 共{datasetStats.class_distribution.length}个类别，{datasetStats.total_boxes}个标注框</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleStartTraining}
                            disabled={!isBackendAlive || isTraining}
                            className={`group relative w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden mb-6 ${isBackendAlive && !isTraining
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70'
                              : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                              }`}
                          >
                            {isBackendAlive && !isTraining && (
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            )}
                            <div className="relative flex items-center justify-center gap-3">
                              {isTraining ? (
                                <>
                                  <Loader2 className="animate-spin" size={24} />
                                  <span>训练进行中...</span>
                                </>
                              ) : (
                                <>
                                  <Brain size={24} />
                                  <span>开始训练</span>
                                </>
                              )}
                            </div>
                          </button>

                          {trainingStatus && (
                            <div className={`rounded-2xl p-5 border-2 ${trainingStatus.includes('✓') || trainingStatus.includes('完成')
                              ? 'bg-green-500/10 border-green-500/50'
                              : trainingStatus.includes('❌') || trainingStatus.includes('失败')
                                ? 'bg-red-500/10 border-red-500/50'
                                : 'bg-purple-500/10 border-purple-500/50'
                              }`}>
                              <div className="flex items-center gap-3 mb-2">
                                {isTraining && <Loader2 className="animate-spin text-purple-400" size={20} />}
                                <p className="text-white font-semibold">训练状态</p>
                              </div>
                              <p className={`text-sm whitespace-pre-wrap font-medium mb-3 ${trainingStatus.includes('✓') || trainingStatus.includes('完成')
                                ? 'text-green-300'
                                : trainingStatus.includes('❌') || trainingStatus.includes('失败')
                                  ? 'text-red-300'
                                  : 'text-purple-300'
                                }`}>{trainingStatus}</p>

                              {!isTraining && (trainingStatus.includes('✓') || trainingStatus.includes('完成')) && (
                                <>
                                  <button
                                    onClick={handleOpenResultsFolder}
                                    className="group relative w-full mt-3 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                    <div className="relative flex items-center justify-center gap-2">
                                      <FolderOpen size={18} />
                                      <span>📊 查看训练结果</span>
                                    </div>
                                  </button>

                                  {/* 训练结果说明 */}
                                  <div className="mt-4 bg-slate-900/60 rounded-xl p-4 border border-white/5">
                                    <p className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                                      <span className="text-blue-400">📁</span> 训练结果文件说明
                                    </p>
                                    <div className="space-y-2 text-xs text-gray-300">
                                      <div className="flex items-start gap-2">
                                        <span className="text-green-400 font-mono">best.pt</span>
                                        <span>最佳模型权重(mAP最高)</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-green-400 font-mono">last.pt</span>
                                        <span>最后一轮训练权重</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-blue-400 font-mono">results.csv</span>
                                        <span>训练指标记录(loss、mAP等)</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-purple-400 font-mono">confusion_matrix.png</span>
                                        <span>混淆矩阵(分类准确度)</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 指标说明 */}
                                  <div className="mt-3 bg-slate-900/60 rounded-xl p-4 border border-white/5">
                                    <p className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                                      <span className="text-purple-400">📊</span> 关键指标说明
                                    </p>
                                    <div className="space-y-2 text-xs text-gray-300">
                                      <div>
                                        <span className="text-yellow-400 font-semibold">mAP50</span>
                                        <span className="text-gray-400"> - 平均精度(IoU=0.5)，越高越好</span>
                                      </div>
                                      <div>
                                        <span className="text-yellow-400 font-semibold">Precision</span>
                                        <span className="text-gray-400"> - 准确率，预测为正的样本中真正为正的比例</span>
                                      </div>
                                      <div>
                                        <span className="text-yellow-400 font-semibold">Recall</span>
                                        <span className="text-gray-400"> - 召回率，所有正样本中被正确预测的比例</span>
                                      </div>
                                      <div>
                                        <span className="text-yellow-400 font-semibold">Loss</span>
                                        <span className="text-gray-400"> - 损失值，越低越好(box/cls/dfl)</span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 侧边栏 - 数据集信息 */}
                      <div className="space-y-6">
                        {/* 数据集检查 */}
                        {datasetStats && (
                          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <Database size={20} className="text-purple-400" />
                              数据集状态
                            </h3>
                            
                            <div className="space-y-3">
                              <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-400 text-sm">图片数量</span>
                                  <span className="text-white font-bold">{datasetStats.total_images}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-400 text-sm">已标注</span>
                                  <span className="text-green-400 font-bold">{datasetStats.annotated_images}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 text-sm">标注框</span>
                                  <span className="text-purple-400 font-bold">{datasetStats.total_boxes}</span>
                                </div>
                              </div>

                              {datasetStats.class_distribution && datasetStats.class_distribution.length > 0 && (
                                <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5">
                                  <p className="text-gray-400 text-sm mb-2">类别分布</p>
                                  <div className="space-y-2">
                                    {datasetStats.class_distribution.map((cls: any) => (
                                      <div key={cls.id} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-300">{cls.name}</span>
                                        <span className="text-xs text-white font-bold">{cls.count}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 训练提示 */}
                        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-400" />
                            优化提示
                          </h3>
                          <div className="space-y-3 text-sm text-gray-300">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              <span>数据增强会自动应用(翻转、缩放、亮度调整)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              <span>使用GPU训练可显著提升速度</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              <span>训练结果保存在 runs/detect/train*</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              <span>可通过tensorboard查看详细训练曲线</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INFERENCE MODE */}
              {mode === 'INFERENCE' && (
                <div className="h-full flex flex-col">
                  {/* Controls */}
                  <div className="px-8 py-6">
                    <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
                      {/* Mode Tabs */}
                      <div className="flex gap-3 mb-5">
                        <button
                          onClick={() => { setInferenceMode('image'); setInferenceResult([]); setInferenceError(null); stopCamera(); stopWebcamStream(); }}
                          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            inferenceMode === 'image'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          <Upload size={20} />
                          图片识别
                        </button>
                        <button
                          onClick={() => { setInferenceMode('video'); setInferenceResult([]); setInferenceError(null); stopCamera(); stopWebcamStream(); }}
                          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            inferenceMode === 'video'
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          <Video size={20} />
                          视频识别
                        </button>
                        <button
                          onClick={() => { setInferenceMode('webcam'); setInferenceResult([]); setInferenceError(null); stopCamera(); }}
                          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            inferenceMode === 'webcam'
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          <Camera size={20} />
                          实时摄像头
                        </button>
                      </div>

                      {/* Model Selection */}
                      <div className="mb-5 bg-slate-900/60 rounded-2xl p-4 border border-white/5">
                        <label className="text-sm text-white font-semibold mb-3 block flex items-center gap-2">
                          <Layers className="text-purple-400" size={18} />
                          选择模型
                        </label>
                        <select
                          value={selectedModel}
                          onChange={(e) => handleModelChange(e.target.value)}
                          className="w-full bg-slate-800 text-white border-2 border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 focus:outline-none transition-colors font-medium"
                        >
                          {availableModels.map((model) => (
                            <option key={model.path} value={model.path}>
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Image Mode */}
                        {inferenceMode === 'image' && (
                          <>
                            <label className="group relative px-8 py-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500/50 shadow-lg shadow-blue-500/50">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/5 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                              <div className="relative flex items-center gap-3">
                                <Upload size={24} className="text-white" />
                                <span className="font-semibold text-lg text-white">选择图片</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleInferenceUpload}
                                className="hidden"
                              />
                            </label>

                            {inferenceImage && (
                              <button
                                onClick={runInference}
                                disabled={isInferencing || !isBackendAlive}
                                className={`group relative px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden ${
                                  isInferencing || !isBackendAlive
                                    ? 'bg-slate-700/30 border-2 border-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-2 border-yellow-500/50 text-white shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105'
                                }`}
                              >
                                {!isInferencing && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                )}
                                <div className="relative flex items-center gap-3">
                                  {isInferencing ? (
                                    <>
                                      <Loader2 className="animate-spin" size={28} />
                                      <span>识别中...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap size={28} />
                                      <span>开始识别</span>
                                    </>
                                  )}
                                </div>
                              </button>
                            )}
                          </>
                        )}

                        {/* Video Mode */}
                        {inferenceMode === 'video' && (
                          <>
                            <label className="group relative px-8 py-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500/50 shadow-lg shadow-purple-500/50">
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-white/5 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                              <div className="relative flex items-center gap-3">
                                <Video size={24} className="text-white" />
                                <span className="font-semibold text-lg text-white">选择视频</span>
                              </div>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                              />
                            </label>

                            {inferenceVideo && !processedVideoUrl && (
                              <button
                                onClick={processVideo}
                                disabled={isInferencing || !isBackendAlive}
                                className={`group relative px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden ${
                                  isInferencing || !isBackendAlive
                                    ? 'bg-slate-700/30 border-2 border-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-2 border-yellow-500/50 text-white shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105'
                                }`}
                              >
                                {!isInferencing && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                )}
                                <div className="relative flex items-center gap-3">
                                  {isInferencing ? (
                                    <>
                                      <Loader2 className="animate-spin" size={28} />
                                      <span>处理中 {videoProgress}%</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play size={28} />
                                      <span>处理视频</span>
                                    </>
                                  )}
                                </div>
                              </button>
                            )}

                            {processedVideoUrl && (
                              <a
                                href={processedVideoUrl}
                                download="detected_video.mp4"
                                className="group relative px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-500/50 text-white shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <div className="relative flex items-center gap-3">
                                  <Download size={28} />
                                  <span>下载结果</span>
                                </div>
                              </a>
                            )}
                          </>
                        )}

                        {/* Webcam Mode */}
                        {inferenceMode === 'webcam' && (
                          <>
                            {!isWebcamStreaming ? (
                              <button
                                onClick={startWebcamStream}
                                disabled={!isBackendAlive}
                                className={`group relative px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden ${
                                  !isBackendAlive
                                    ? 'bg-slate-700/30 border-2 border-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-500/50 text-white shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105'
                                }`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <div className="relative flex items-center gap-3">
                                  <Camera size={28} />
                                  <span>启动实时检测</span>
                                </div>
                              </button>
                            ) : (
                              <button
                                onClick={stopWebcamStream}
                                className="group relative px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden bg-gradient-to-r from-red-600 to-pink-600 border-2 border-red-500/50 text-white shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <div className="relative flex items-center gap-3">
                                  <Square size={28} />
                                  <span>停止检测</span>
                                </div>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview Area */}
                  <div className="flex-1 px-8 pb-8 overflow-hidden">
                    {/* Empty State */}
                    {!inferencePreviewUrl && !isWebcamStreaming && (
                      <div className="h-full flex flex-col items-center justify-center bg-slate-800/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-purple-500/30">
                        <div className="text-center">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                              {inferenceMode === 'image' && <Target size={64} className="text-purple-400 animate-pulse" />}
                              {inferenceMode === 'video' && <Video size={64} className="text-purple-400 animate-pulse" />}
                              {inferenceMode === 'webcam' && <Camera size={64} className="text-purple-400 animate-pulse" />}
                            </div>
                          </div>
                          <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                            {inferenceMode === 'image' && '准备图片识别'}
                            {inferenceMode === 'video' && '准备视频识别'}
                            {inferenceMode === 'webcam' && '准备实时检测'}
                            <Sparkles className="text-yellow-400" size={28} />
                          </h2>
                          <p className="text-purple-300 text-lg">
                            {inferenceMode === 'image' && '选择图片，让AI帮你识别物体'}
                            {inferenceMode === 'video' && '选择视频文件进行批量检测'}
                            {inferenceMode === 'webcam' && '启动摄像头进行实时检测'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Image Preview */}
                    {inferenceMode === 'image' && inferencePreviewUrl && (
                      <div className="h-full bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-white/10 p-6 overflow-auto">
                        <div className="h-full flex items-center justify-center">
                          <div className="relative inline-block">
                            {scanning && (
                              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent h-32 animate-scan"></div>
                              </div>
                            )}
                            <img
                              src={inferencePreviewUrl}
                              alt="识别目标"
                              className="max-w-full max-h-full rounded-2xl border-4 border-purple-500/50 shadow-2xl shadow-purple-500/30"
                            />

                            {/* Bounding Boxes SVG Overlay */}
                            {inferenceResult.length > 0 && (
                              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <defs>
                                  <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                  </linearGradient>
                                </defs>
                                {inferenceResult.map((box) => (
                                  <g key={box.id}>
                                    <rect
                                      x={`${box.xmin * 100}%`}
                                      y={`${box.ymin * 100}%`}
                                      width={`${(box.xmax - box.xmin) * 100}%`}
                                      height={`${(box.ymax - box.ymin) * 100}%`}
                                      fill="rgba(59, 130, 246, 0.15)"
                                      stroke="url(#boxGradient)"
                                      strokeWidth="3"
                                      className="animate-pulse-border"
                                    />
                                    <text
                                      x={`${box.xmin * 100 + 1}%`}
                                      y={`${box.ymin * 100}%`}
                                      fill="white"
                                      fontSize="14"
                                      fontWeight="bold"
                                      className="drop-shadow-lg"
                                    >
                                      <tspan x={`${box.xmin * 100 + 1}%`} dy="-5">
                                        {box.label} {box.confidence ? `${(box.confidence * 100).toFixed(0)}%` : ''}
                                      </tspan>
                                    </text>
                                  </g>
                                ))}
                              </svg>
                            )}

                            {/* Results Overlay */}
                            {inferenceResult.length > 0 && (
                              <div className="absolute top-6 right-6 bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-2xl min-w-[250px]">
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <Target className="text-white" size={20} />
                                  </div>
                                  <div>
                                    <p className="text-white font-bold text-lg">发现目标</p>
                                    <p className="text-green-300 text-sm">{inferenceResult.length} 个物体</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {inferenceResult.map((box, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                                      <span className="text-white font-semibold">{box.label}</span>
                                      {box.confidence && (
                                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-full">
                                          {(box.confidence * 100).toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Video Preview */}
                    {inferenceMode === 'video' && (inferencePreviewUrl || processedVideoUrl) && (
                      <div className="h-full bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-white/10 p-6 overflow-auto">
                        <div className="h-full flex items-center justify-center">
                          <div className="relative max-w-full max-h-full">
                            {isInferencing && (
                              <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-purple-400 mb-4" size={64} />
                                <p className="text-white text-2xl font-bold">正在处理视频...</p>
                                <div className="mt-4 w-64">
                                  <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                                      style={{ width: `${videoProgress}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-purple-300 text-lg mt-2 text-center font-mono">{videoProgress}%</p>
                                </div>
                              </div>
                            )}
                            <video
                              src={processedVideoUrl || inferencePreviewUrl!}
                              controls
                              className="max-w-full max-h-full rounded-2xl border-4 border-purple-500/50 shadow-2xl shadow-purple-500/30"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Webcam Stream */}
                    {inferenceMode === 'webcam' && isWebcamStreaming && inferencePreviewUrl && (
                      <div className="h-full bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-white/10 p-6 overflow-auto">
                        <div className="h-full flex items-center justify-center">
                          <div className="relative inline-block max-w-full">
                            <img
                              src={inferencePreviewUrl}
                              alt="实时检测"
                              className="max-w-full max-h-full rounded-2xl border-4 border-green-500/50 shadow-2xl shadow-green-500/30"
                            />

                            {/* Results Overlay - Bottom Right */}
                            {inferenceResult.length > 0 && (
                              <div className="absolute bottom-4 right-4 bg-gradient-to-br from-slate-900/95 to-green-900/95 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-2xl max-w-[280px]">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <Target className="text-white" size={16} />
                                  </div>
                                  <div>
                                    <p className="text-white font-bold text-sm">检测到 {inferenceResult.length} 个物体</p>
                                  </div>
                                </div>
                                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                  {inferenceResult.map((box, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                      <span className="text-white font-semibold text-sm truncate mr-2">{box.label}</span>
                                      {box.confidence && (
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                                          {(box.confidence * 100).toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {inferenceError && (
                      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-red-400 flex items-center gap-3">
                        <AlertCircle size={24} />
                        <span className="font-semibold">{inferenceError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(500%);
          }
        }
        .animate-scan {
          animation: scan 1.5s ease-in-out;
        }
        @keyframes pulse-border {
          0%, 100% {
            stroke-width: 3;
          }
          50% {
            stroke-width: 5;
          }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
