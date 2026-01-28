import React, { useState, useEffect } from 'react';
import { selectRandomQuestions, Question, UserScore } from '../data/quizData';
import {
    Trophy,
    CheckCircle,
    XCircle,
    Clock,
    Star,
    Award,
    Target,
    Zap,
    Brain,
    Sparkles
} from 'lucide-react';

const QuizSystem = () => {
    const [username, setUsername] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
    const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [timeUsed, setTimeUsed] = useState(0);

    // 从后端加载排行榜
    useEffect(() => {
        fetch('http://localhost:8000/get-leaderboard')
            .then(res => res.json())
            .then(data => {
                if (data.leaderboard) {
                    setLeaderboard(data.leaderboard);
                }
            })
            .catch(() => {
                // 如果后端不可用,尝试从localStorage加载
                const saved = localStorage.getItem('aiQuizLeaderboard');
                if (saved) {
                    setLeaderboard(JSON.parse(saved));
                }
            });
    }, []);

    // 保存排行榜到后端JSON文件
    const saveLeaderboard = async (newScore: UserScore) => {
        try {
            const response = await fetch('http://localhost:8000/save-leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: newScore })
            });
            const data = await response.json();
            if (data.leaderboard) {
                setLeaderboard(data.leaderboard);
            }
            // 同时保存到localStorage作为备份
            localStorage.setItem('aiQuizLeaderboard', JSON.stringify(data.leaderboard));
        } catch (error) {
            // 如果后端失败,降级到localStorage
            const updated = [...leaderboard, newScore]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            setLeaderboard(updated);
            localStorage.setItem('aiQuizLeaderboard', JSON.stringify(updated));
        }
    };

    // 开始答题
    const handleStart = () => {
        if (username.trim().length < 2) {
            alert('请输入至少2个字符的用户名！');
            return;
        }

        // 从题库中随机抽取20道题（总分300分）
        const selectedQuestions = selectRandomQuestions();
        setQuizQuestions(selectedQuestions);
        setHasStarted(true);
        setStartTime(Date.now());
    };

    // 选择答案
    const handleSelectAnswer = (index: number) => {
        if (showAnswer) return;
        setSelectedAnswer(index);
    };

    // 提交答案
    const handleSubmitAnswer = () => {
        if (selectedAnswer === null) {
            alert('请选择一个答案！');
            return;
        }

        const currentQ = quizQuestions[currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQ.correctAnswer;

        if (isCorrect) {
            const points = currentQ.difficulty === 'easy' ? 10 :
                currentQ.difficulty === 'medium' ? 15 : 20;
            setScore(score + points);
            setCorrectCount(correctCount + 1);
        }

        setShowAnswer(true);
    };

    // 下一题
    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setShowAnswer(false);
        } else {
            // 答题结束
            const time = Math.floor((Date.now() - startTime) / 1000);
            setTimeUsed(time);
            setIsFinished(true);

            // 保存成绩
            const userScore: UserScore = {
                username,
                score,
                correctCount,
                totalQuestions: quizQuestions.length,
                timestamp: Date.now()
            };
            saveLeaderboard(userScore);
        }
    };

    // 重新开始
    const handleRestart = () => {
        setUsername('');
        setHasStarted(false);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setScore(0);
        setCorrectCount(0);
        setIsFinished(false);
        setTimeUsed(0);
    };

    // 未开始 - 输入用户名
    if (!hasStarted) {
        return (
            <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 overflow-hidden">
                {/* 背景动画 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ top: '20%', left: '10%', animationDuration: '4s' }} />
                    <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ bottom: '10%', right: '10%', animationDuration: '6s' }} />
                </div>

                <div className="relative z-10 max-w-2xl w-full">
                    <div className="bg-slate-800/60 backdrop-blur-2xl rounded-3xl border-2 border-white/20 p-12 shadow-2xl">
                        {/* 标题 */}
                        <div className="text-center mb-10">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
                                <div className="relative bg-gradient-to-r from-yellow-500 to-orange-600 p-6 rounded-3xl">
                                    <Brain className="text-white mx-auto" size={64} />
                                </div>
                            </div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
                                AI 视觉识别挑战赛
                            </h1>
                            <p className="text-purple-200 text-xl">测试你的人工智能与计算机视觉知识！</p>
                        </div>

                        {/* 说明 */}
                        <div className="bg-slate-900/60 rounded-2xl p-6 mb-8 border border-white/10">
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                <Sparkles className="text-yellow-400" size={20} />
                                挑战规则
                            </h3>
                            <ul className="space-y-2 text-purple-200">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>从60道题库中随机抽取20题，每人题目不同</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>简单题10分，中等题15分，困难题20分（总分300分）</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>答错不扣分，每题都有详细解释</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>完成后可查看实时排行榜</span>
                                </li>
                            </ul>
                        </div>

                        {/* 输入用户名 */}
                        <div className="mb-8">
                            <label className="block text-white font-semibold text-lg mb-3">
                                输入你的名字
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                                placeholder="例如：小明"
                                maxLength={20}
                                className="w-full px-6 py-4 bg-slate-900/60 border-2 border-purple-500/50 focus:border-purple-400 rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none transition-all"
                            />
                        </div>

                        {/* 开始按钮 */}
                        <button
                            onClick={handleStart}
                            className="group relative w-full py-5 rounded-2xl font-bold text-xl overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                <Zap size={28} />
                                <span>开始挑战</span>
                            </div>
                        </button>

                        {/* 排行榜预览 */}
                        {leaderboard.length > 0 && (
                            <div className="mt-8 bg-slate-900/60 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <Trophy className="text-yellow-400" size={20} />
                                    排行榜 TOP 5
                                </h3>
                                <div className="space-y-2">
                                    {leaderboard.slice(0, 5).map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-400' :
                                                    index === 1 ? 'text-gray-300' :
                                                        index === 2 ? 'text-orange-400' :
                                                            'text-purple-300'
                                                    }`}>
                                                    #{index + 1}
                                                </span>
                                                <span className="text-white font-medium">{entry.username}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-green-400 font-bold">{entry.score}分</span>
                                                <span className="text-gray-400 text-sm">
                                                    {entry.correctCount}/{entry.totalQuestions}题
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 答题结束 - 显示结果
    if (isFinished) {
        const percentage = Math.round((correctCount / quizQuestions.length) * 100);
        const rank = leaderboard.findIndex(entry => entry.username === username && entry.timestamp === leaderboard[leaderboard.length - 1].timestamp) + 1;

        return (
            <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 overflow-hidden">
                {/* 背景动画 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ top: '20%', left: '10%', animationDuration: '3s' }} />
                    <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ bottom: '10%', right: '10%', animationDuration: '5s' }} />
                </div>

                <div className="relative z-10 max-w-4xl w-full">
                    <div className="bg-slate-800/60 backdrop-blur-2xl rounded-3xl border-2 border-white/20 p-12 shadow-2xl">
                        {/* 成绩标题 */}
                        <div className="text-center mb-10">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-2xl opacity-75 animate-pulse"></div>
                                <Trophy className="relative text-yellow-400 mx-auto" size={80} />
                            </div>
                            <h1 className="text-5xl font-bold text-white mb-3">
                                挑战完成！{username}
                            </h1>
                            <p className="text-purple-200 text-xl">你的成绩已记录到排行榜</p>
                        </div>

                        {/* 成绩卡片 */}
                        <div className="grid grid-cols-2 gap-6 mb-10">
                            <div className="bg-gradient-to-br from-green-600/40 to-emerald-600/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <Star className="text-yellow-400" size={28} />
                                    <span className="text-white font-semibold text-lg">总分</span>
                                </div>
                                <p className="text-5xl font-bold text-white">{score}</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-600/40 to-cyan-600/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <Target className="text-blue-300" size={28} />
                                    <span className="text-white font-semibold text-lg">正确率</span>
                                </div>
                                <p className="text-5xl font-bold text-white">{percentage}%</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle className="text-green-400" size={28} />
                                    <span className="text-white font-semibold text-lg">答对</span>
                                </div>
                                <p className="text-5xl font-bold text-white">{correctCount}/{quizQuestions.length}</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-600/40 to-red-600/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <Clock className="text-orange-300" size={28} />
                                    <span className="text-white font-semibold text-lg">用时</span>
                                </div>
                                <p className="text-5xl font-bold text-white">{Math.floor(timeUsed / 60)}'{timeUsed % 60}"</p>
                            </div>
                        </div>

                        {/* 评价 */}
                        <div className="bg-slate-900/60 rounded-2xl p-6 mb-10 border border-white/10">
                            <h3 className="text-white font-bold text-xl mb-3">
                                {percentage >= 90 ? '🏆 AI大师！' :
                                    percentage >= 75 ? '🌟 优秀！' :
                                        percentage >= 60 ? '👍 良好！' :
                                            percentage >= 40 ? '💪 继续努力！' :
                                                '📚 多看看学习资料吧！'}
                            </h3>
                            <p className="text-purple-200">
                                {percentage >= 90 ? '太棒了！你对AI知识掌握得非常好！' :
                                    percentage >= 75 ? '很不错！你已经理解了大部分AI概念！' :
                                        percentage >= 60 ? '不错！继续学习会更好！' :
                                            percentage >= 40 ? '还不错，多复习一下会更好！' :
                                                '建议重新阅读学习资料，打好基础！'}
                            </p>
                        </div>

                        {/* 排行榜 */}
                        <div className="bg-slate-900/60 rounded-2xl p-6 mb-8 border border-white/10">
                            <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                                <Trophy className="text-yellow-400" size={24} />
                                实时排行榜
                                {rank <= 10 && (
                                    <span className="ml-auto px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white text-sm font-bold">
                                        你是第 {rank} 名！
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-3">
                                {leaderboard.map((entry, index) => {
                                    const isCurrentUser = entry.username === username &&
                                        entry.timestamp === leaderboard.filter(e => e.username === username)[leaderboard.filter(e => e.username === username).length - 1].timestamp;
                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between rounded-xl px-5 py-3 transition-all ${isCurrentUser
                                                ? 'bg-gradient-to-r from-purple-600/60 to-pink-600/60 border-2 border-purple-400 scale-105'
                                                : 'bg-slate-800/40'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {index < 3 ? (
                                                    <Award className={`${index === 0 ? 'text-yellow-400' :
                                                        index === 1 ? 'text-gray-300' :
                                                            'text-orange-400'
                                                        }`} size={24} />
                                                ) : (
                                                    <span className="text-purple-300 font-bold text-lg w-6 text-center">
                                                        {index + 1}
                                                    </span>
                                                )}
                                                <span className={`font-semibold ${isCurrentUser ? 'text-white' : 'text-purple-200'}`}>
                                                    {entry.username}
                                                    {isCurrentUser && <span className="ml-2 text-yellow-400">★</span>}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className={`font-bold text-xl ${isCurrentUser ? 'text-yellow-300' : 'text-green-400'}`}>
                                                    {entry.score}分
                                                </span>
                                                <span className="text-gray-400 text-sm">
                                                    {entry.correctCount}/{entry.totalQuestions}题
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleRestart}
                                className="group relative py-4 rounded-2xl font-bold text-lg overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-xl transition-all"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <span className="relative">再来一次</span>
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="group relative py-4 rounded-2xl font-bold text-lg overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl transition-all"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <span className="relative">返回主页</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 答题中
    const currentQ = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 overflow-hidden">
            {/* 背景动画 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ top: '10%', left: '10%', animationDuration: '4s' }} />
                <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ bottom: '10%', right: '10%', animationDuration: '6s' }} />
            </div>

            {/* 顶部信息栏 */}
            <div className="relative z-10 max-w-5xl mx-auto mb-6">
                <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-600/30 px-4 py-2 rounded-xl border border-purple-500/50">
                                <span className="text-white font-bold">{username}</span>
                            </div>
                            <div className="bg-green-600/30 px-4 py-2 rounded-xl border border-green-500/50">
                                <span className="text-green-300 font-bold">得分: {score}</span>
                            </div>
                            <div className="bg-blue-600/30 px-4 py-2 rounded-xl border border-blue-500/50">
                                <span className="text-blue-300 font-bold">
                                    {correctCount}/{currentQuestionIndex} 正确
                                </span>
                            </div>
                        </div>
                        <div className="text-white font-bold text-xl">
                            第 {currentQuestionIndex + 1} / {quizQuestions.length} 题
                        </div>
                    </div>

                    {/* 进度条 */}
                    <div className="h-3 bg-slate-900/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 题目卡片 */}
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="bg-slate-800/60 backdrop-blur-2xl rounded-3xl border-2 border-white/20 p-10 shadow-2xl">
                    {/* 难度标签 */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className={`px-4 py-2 rounded-xl font-bold text-sm ${currentQ.difficulty === 'easy' ? 'bg-green-600/30 text-green-300 border border-green-500/50' :
                            currentQ.difficulty === 'medium' ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/50' :
                                'bg-red-600/30 text-red-300 border border-red-500/50'
                            }`}>
                            {currentQ.difficulty === 'easy' ? '简单 10分' :
                                currentQ.difficulty === 'medium' ? '中等 20分' :
                                    '困难 30分'}
                        </span>
                        <span className="px-4 py-2 bg-purple-600/30 text-purple-300 rounded-xl font-bold text-sm border border-purple-500/50">
                            {currentQ.category}
                        </span>
                    </div>

                    {/* 题目 */}
                    <h2 className="text-white text-3xl font-bold mb-8 leading-relaxed">
                        {currentQ.question}
                    </h2>

                    {/* 选项 */}
                    <div className="space-y-4 mb-8">
                        {currentQ.options.map((option, index) => {
                            const isSelected = selectedAnswer === index;
                            const isCorrectAnswer = index === currentQ.correctAnswer;

                            let bgClass = 'bg-slate-700/40 hover:bg-slate-600/60 border-slate-600';
                            if (showAnswer) {
                                if (isCorrectAnswer) {
                                    bgClass = 'bg-green-600/40 border-green-500';
                                } else if (isSelected && !isCorrect) {
                                    bgClass = 'bg-red-600/40 border-red-500';
                                }
                            } else if (isSelected) {
                                bgClass = 'bg-purple-600/60 border-purple-500';
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSelectAnswer(index)}
                                    disabled={showAnswer}
                                    className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all ${bgClass} ${showAnswer ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {String.fromCharCode(65 + index)}
                                        </span>
                                        <span className="text-white text-lg font-medium">{option}</span>
                                        {showAnswer && isCorrectAnswer && (
                                            <CheckCircle className="ml-auto text-green-400" size={28} />
                                        )}
                                        {showAnswer && isSelected && !isCorrect && (
                                            <XCircle className="ml-auto text-red-400" size={28} />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* 答案解析 */}
                    {showAnswer && (
                        <div className={`rounded-2xl p-6 mb-8 border-2 ${isCorrect
                            ? 'bg-green-600/20 border-green-500/50'
                            : 'bg-red-600/20 border-red-500/50'
                            }`}>
                            <div className="flex items-center gap-3 mb-3">
                                {isCorrect ? (
                                    <CheckCircle className="text-green-400" size={28} />
                                ) : (
                                    <XCircle className="text-red-400" size={28} />
                                )}
                                <h3 className="text-white font-bold text-xl">
                                    {isCorrect ? '回答正确！' : '答错了，再接再厉！'}
                                </h3>
                            </div>
                            <p className="text-white text-lg leading-relaxed">{currentQ.explanation}</p>
                        </div>
                    )}

                    {/* 操作按钮 */}
                    {!showAnswer ? (
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={selectedAnswer === null}
                            className={`w-full py-5 rounded-2xl font-bold text-xl transition-all ${selectedAnswer === null
                                ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-500/50'
                                }`}
                        >
                            提交答案
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="group relative w-full py-5 rounded-2xl font-bold text-xl overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-xl transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative">
                                {currentQuestionIndex < quizQuestions.length - 1 ? '下一题' : '查看成绩'}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizSystem;
