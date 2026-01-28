import React, { useState, useEffect, useRef } from 'react';
import { BoundingBox } from './types';
import { detectObjectsPython, checkBackendHealth, trainModel, startLabelImg, getTrainingProgress, getAvailableModels, selectModel, getCurrentModel } from './services/pythonService';
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
    Database
} from 'lucide-react';

type AppMode = 'ANNOTATE' | 'TRAIN' | 'INFERENCE';

const App = () => {
    const [mode, setMode] = useState<AppMode>('INFERENCE');
    const [isBackendAlive, setIsBackendAlive] = useState(false);

    // Training State
    const [isTraining, setIsTraining] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState<string>('');
    const [epochs, setEpochs] = useState(50);

    // Inference State
    const [inferenceImage, setInferenceImage] = useState<File | null>(null);
    const [inferencePreviewUrl, setInferencePreviewUrl] = useState<string | null>(null);
    const [isInferencing, setIsInferencing] = useState(false);
    const [inferenceResult, setInferenceResult] = useState<BoundingBox[]>([]);
    const [inferenceError, setInferenceError] = useState<string | null>(null);
    const [useCamera, setUseCamera] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>('default');
    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [currentModelName, setCurrentModelName] = useState<string>('智能视觉');
    const [scanning, setScanning] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Annotation State
    const [labelImgStatus, setLabelImgStatus] = useState<string>('');

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

    const handleInferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInferenceImage(file);
            setInferencePreviewUrl(URL.createObjectURL(file));
            setInferenceResult([]);
            setInferenceError(null);
            setUseCamera(false);
        }
    };

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
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="max-w-2xl w-full">
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
                                                <span className="text-blue-400">📁</span> 数据集目录
                                            </p>
                                            <pre className="text-gray-400 text-sm font-mono">
                                                {`dataset/
  ├── images/     # 放置训练图片
  ├── labels/     # 标注文件
  └── data.yaml   # 配置文件`}
                                            </pre>
                                        </div>

                                        <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/5">
                                            <p className="text-white font-semibold mb-3 flex items-center gap-2">
                                                <span className="text-purple-400">⚙️</span> 操作步骤
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
                                                    <span>在工具中选择 YOLO 格式标注</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-400 font-bold">4.</span>
                                                    <span>标注会自动保存到 labels 目录</span>
                                                </li>
                                            </ol>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleStartLabelImg}
                                        disabled={!isBackendAlive}
                                        className={`group relative w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${isBackendAlive
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

                                    {!isBackendAlive && (
                                        <div className="mt-6 bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-4 flex items-center gap-3">
                                            <AlertCircle className="text-red-400" size={24} />
                                            <p className="text-red-300 font-medium">AI引擎离线，请先启动后端服务</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TRAIN MODE */}
                    {mode === 'TRAIN' && (
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="max-w-2xl w-full">
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
                                                    <p className="text-gray-400">数据集</p>
                                                    <p className="text-white font-semibold">data.yaml</p>
                                                </div>
                                                <div className="bg-slate-800/50 rounded-lg p-3">
                                                    <p className="text-gray-400">模型架构</p>
                                                    <p className="text-white font-semibold">YOLOv8n</p>
                                                </div>
                                                <div className="bg-slate-800/50 rounded-lg p-3">
                                                    <p className="text-gray-400">图像大小</p>
                                                    <p className="text-white font-semibold">640×640</p>
                                                </div>
                                                <div className="bg-slate-800/50 rounded-lg p-3">
                                                    <p className="text-gray-400">批次大小</p>
                                                    <p className="text-white font-semibold">16</p>
                                                </div>
                                            </div>
                                        </div>
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
                                            <p className={`text-sm whitespace-pre-wrap font-medium ${trainingStatus.includes('✓') || trainingStatus.includes('完成')
                                                    ? 'text-green-300'
                                                    : trainingStatus.includes('❌') || trainingStatus.includes('失败')
                                                        ? 'text-red-300'
                                                        : 'text-purple-300'
                                                }`}>{trainingStatus}</p>
                                        </div>
                                    )}

                                    {!isBackendAlive && (
                                        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-4 flex items-center gap-3">
                                            <AlertCircle className="text-red-400" size={24} />
                                            <p className="text-red-300 font-medium">AI引擎离线，请先启动后端服务</p>
                                        </div>
                                    )}
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
                                        <div className="flex gap-4">
                                            <label className={`group relative px-8 py-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 overflow-hidden ${!useCamera && !isCameraActive
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500/50 shadow-lg shadow-blue-500/50'
                                                    : 'bg-slate-700/50 border-slate-600 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/30'
                                                }`}>
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/5 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                                <div className="relative flex items-center gap-3">
                                                    <Upload size={24} className={!useCamera && !isCameraActive ? 'text-white' : 'text-blue-400'} />
                                                    <span className={`font-semibold text-lg ${!useCamera && !isCameraActive ? 'text-white' : 'text-blue-300'}`}>
                                                        选择图片
                                                    </span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleInferenceUpload}
                                                    className="hidden"
                                                    disabled={isCameraActive}
                                                />
                                            </label>

                                            {!isCameraActive ? (
                                                <button
                                                    onClick={() => { setUseCamera(true); startCamera(); }}
                                                    className="group relative px-8 py-4 bg-slate-700/50 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 border-2 border-slate-600 hover:border-green-500/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-white/5 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                                    <div className="relative flex items-center gap-3">
                                                        <Camera size={24} className="text-green-400" />
                                                        <span className="font-semibold text-lg text-green-300">启动相机</span>
                                                    </div>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={stopCamera}
                                                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 border-2 border-red-500/50 rounded-2xl transition-all duration-300 shadow-lg shadow-red-500/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Square size={24} className="text-white" />
                                                        <span className="font-semibold text-lg text-white">关闭相机</span>
                                                    </div>
                                                </button>
                                            )}
                                        </div>

                                        {/* Detect Button */}
                                        {(isCameraActive || inferenceImage) && (
                                            <button
                                                onClick={isCameraActive ? captureAndDetect : runInference}
                                                disabled={isInferencing || !isBackendAlive}
                                                className={`group relative px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden ${isInferencing || !isBackendAlive
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
                                                            <span>{isCameraActive ? '拍照识别' : '开始识别'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="flex-1 px-8 pb-8 overflow-hidden">
                                {!inferencePreviewUrl && !isCameraActive ? (
                                    <div className="h-full flex flex-col items-center justify-center bg-slate-800/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-purple-500/30">
                                        <div className="text-center">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                                                <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                                    <Target size={64} className="text-purple-400 animate-pulse" />
                                                </div>
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                                                准备开始识别
                                                <Sparkles className="text-yellow-400" size={28} />
                                            </h2>
                                            <p className="text-purple-300 text-lg">选择图片或启动相机，让AI帮你识别物体</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-white/10 p-6 overflow-auto">
                                        <div className="h-full flex items-center justify-center">
                                            {isCameraActive ? (
                                                <div className="relative max-w-full max-h-full">
                                                    {scanning && (
                                                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
                                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent h-32 animate-scan"></div>
                                                        </div>
                                                    )}
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        className="max-w-full max-h-full rounded-2xl border-4 border-purple-500/50 shadow-2xl shadow-purple-500/30"
                                                    />
                                                    <canvas ref={canvasRef} className="hidden" />

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
                                            ) : (
                                                <div className="relative max-w-full max-h-full">
                                                    {scanning && (
                                                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
                                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent h-32 animate-scan"></div>
                                                        </div>
                                                    )}
                                                    <img
                                                        src={inferencePreviewUrl!}
                                                        alt="识别目标"
                                                        className="max-w-full max-h-full rounded-2xl border-4 border-purple-500/50 shadow-2xl shadow-purple-500/30"
                                                    />

                                                    {/* Bounding Boxes */}
                                                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                                        {inferenceResult.map((box) => (
                                                            <g key={box.id}>
                                                                <rect
                                                                    x={`${box.xmin * 100}%`}
                                                                    y={`${box.ymin * 100}%`}
                                                                    width={`${(box.xmax - box.xmin) * 100}%`}
                                                                    height={`${(box.ymax - box.ymin) * 100}%`}
                                                                    fill="rgba(59, 130, 246, 0.15)"
                                                                    stroke="url(#gradient)"
                                                                    strokeWidth="4"
                                                                    className="animate-pulse-border"
                                                                />
                                                                <rect
                                                                    x={`${box.xmin * 100}%`}
                                                                    y={`${box.ymin * 100 - 3}%`}
                                                                    width="auto"
                                                                    height="28"
                                                                    fill="rgba(59, 130, 246, 0.95)"
                                                                    rx="6"
                                                                />
                                                                <text
                                                                    x={`${box.xmin * 100 + 1}%`}
                                                                    y={`${box.ymin * 100 - 1}%`}
                                                                    fill="white"
                                                                    fontSize="16"
                                                                    fontWeight="bold"
                                                                >
                                                                    {box.label} {box.confidence ? `${(box.confidence * 100).toFixed(0)}%` : ''}
                                                                </text>
                                                                <defs>
                                                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                        <stop offset="0%" stopColor="#3b82f6" />
                                                                        <stop offset="50%" stopColor="#8b5cf6" />
                                                                        <stop offset="100%" stopColor="#ec4899" />
                                                                    </linearGradient>
                                                                </defs>
                                                            </g>
                                                        ))}
                                                    </svg>

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

                                                    {isInferencing && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-md rounded-2xl">
                                                            <div className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 p-8 rounded-3xl flex flex-col items-center gap-5 border-2 border-white/20 shadow-2xl">
                                                                <div className="relative">
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-75 animate-pulse"></div>
                                                                    <Loader2 className="relative animate-spin text-blue-400" size={56} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-white text-xl font-bold mb-1">AI 分析中...</p>
                                                                    <p className="text-purple-300 text-sm">使用 {currentModelName} 识别物体</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {inferenceError && (
                                <div className="px-8 pb-6">
                                    <div className="bg-gradient-to-r from-red-900/80 to-pink-900/80 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl shadow-red-500/30">
                                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                                            <AlertCircle className="text-white" size={24} />
                                        </div>
                                        <p className="text-white font-semibold text-lg">{inferenceError}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
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
