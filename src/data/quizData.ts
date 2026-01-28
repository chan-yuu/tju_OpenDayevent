// 答题系统的题库
export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
}

export const questions: Question[] = [
    // 基础概念题（简单）
    {
        id: 1,
        question: "AI是什么的缩写？",
        options: ["人工智能", "自动化", "高级智能", "计算机科学"],
        correctAnswer: 0,
        explanation: "AI是Artificial Intelligence的缩写，中文意思是人工智能。",
        difficulty: 'easy',
        category: '基础概念'
    },
    {
        id: 2,
        question: "计算机视觉的主要功能是什么？",
        options: ["让计算机听懂声音", "让计算机看懂图片", "让计算机会说话", "让计算机会思考"],
        correctAnswer: 1,
        explanation: "计算机视觉就是让计算机能够'看懂'和理解图片、视频等视觉信息。",
        difficulty: 'easy',
        category: '基础概念'
    },
    {
        id: 3,
        question: "下面哪个不是AI在生活中的应用？",
        options: ["手机人脸解锁", "音乐推荐", "计算器加法", "自动驾驶"],
        correctAnswer: 2,
        explanation: "计算器的加法是固定的程序，不涉及AI学习。其他三个都需要AI技术。",
        difficulty: 'easy',
        category: '基础概念'
    },
    {
        id: 4,
        question: "YOLO的全称是什么？",
        options: ["You Only Learn Once", "You Only Look Once", "Your Online Learning Option", "Young Object Learning"],
        correctAnswer: 1,
        explanation: "YOLO代表'You Only Look Once'，意思是只需要看一次就能完成物体检测。",
        difficulty: 'easy',
        category: 'YOLO算法'
    },
    {
        id: 5,
        question: "边界框（Bounding Box）是用来做什么的？",
        options: ["标记图片大小", "圈出检测到的物体", "美化图片", "压缩图片"],
        correctAnswer: 1,
        explanation: "边界框是一个长方形框，用来圈出AI检测到的物体位置。",
        difficulty: 'easy',
        category: '物体检测'
    },

    // 中等难度题
    {
        id: 6,
        question: "置信度85%表示什么？",
        options: ["识别速度很快", "AI有85%确定这个识别结果是对的", "图片质量85分", "训练了85轮"],
        correctAnswer: 1,
        explanation: "置信度表示AI对识别结果的确信程度，85%表示AI认为有85%的把握识别正确。",
        difficulty: 'medium',
        category: '物体检测'
    },
    {
        id: 7,
        question: "机器学习的核心思想是什么？",
        options: ["直接编写规则", "通过大量例子让计算机自己学习规律", "复制人脑", "随机猜测"],
        correctAnswer: 1,
        explanation: "机器学习的核心是让计算机通过看大量例子，自己总结出规律，而不是人工编写规则。",
        difficulty: 'medium',
        category: '机器学习'
    },
    {
        id: 8,
        question: "训练AI模型时，Epoch（轮数）是什么意思？",
        options: ["模型的大小", "AI看完整个数据集一遍", "训练时间", "数据集的数量"],
        correctAnswer: 1,
        explanation: "Epoch（轮数）表示AI把整个数据集看一遍，训练50轮就是看了50遍。",
        difficulty: 'medium',
        category: '模型训练'
    },
    {
        id: 9,
        question: "数据标注的主要目的是什么？",
        options: ["让图片更好看", "告诉AI这是什么物体", "压缩图片", "加快训练速度"],
        correctAnswer: 1,
        explanation: "数据标注就是在图片上标记物体的位置和类别，告诉AI'这是什么'，AI才能学习。",
        difficulty: 'medium',
        category: '数据标注'
    },
    {
        id: 10,
        question: "为什么需要大量的训练数据？",
        options: ["占用存储空间", "让AI看到更多例子，学得更准确", "增加训练时间", "浪费时间"],
        correctAnswer: 1,
        explanation: "就像人学习一样，见的例子越多，学得越好。AI需要大量数据才能识别得更准确。",
        difficulty: 'medium',
        category: '机器学习'
    },

    // 较难题目
    {
        id: 11,
        question: "如果模型对清晰的猫咪照片识别准确率很高，但对模糊照片识别很差，最可能的原因是？",
        options: ["模型太小", "训练数据都是清晰照片，缺少模糊照片", "训练轮数太少", "计算机太慢"],
        correctAnswer: 1,
        explanation: "这是典型的数据不够多样化的问题。如果训练数据都是清晰照片，模型就没学过识别模糊照片。",
        difficulty: 'hard',
        category: '模型训练'
    },
    {
        id: 12,
        question: "YOLO相比传统方法的主要优势是什么？",
        options: ["更便宜", "速度更快，能实时检测", "不需要训练", "永远100%准确"],
        correctAnswer: 1,
        explanation: "YOLO一次性看整张图片，比传统的滑动窗口方法快很多，能达到实时检测的速度。",
        difficulty: 'hard',
        category: 'YOLO算法'
    },
    {
        id: 13,
        question: "在YOLO格式标注中，坐标为什么使用0-1之间的相对值？",
        options: ["为了节省空间", "为了适应不同大小的图片", "为了加快速度", "为了好看"],
        correctAnswer: 1,
        explanation: "使用相对值（0-1）可以让同一个标注文件适用于不同尺寸的图片，提高模型的通用性。",
        difficulty: 'hard',
        category: '数据标注'
    },
    {
        id: 14,
        question: "如果一个模型在训练数据上表现很好，但在新数据上表现很差，这叫什么？",
        options: ["欠拟合", "过拟合", "正常现象", "模型损坏"],
        correctAnswer: 1,
        explanation: "过拟合（Overfitting）是指模型把训练数据记住了，但没有学到通用规律，遇到新数据就不行了。",
        difficulty: 'hard',
        category: '机器学习'
    },
    {
        id: 15,
        question: "Batch Size（批次大小）设置为16表示什么？",
        options: ["一次训练16轮", "一次给AI看16张图片", "模型有16层", "训练16次"],
        correctAnswer: 1,
        explanation: "Batch Size表示每次训练时同时处理的图片数量，16表示一次给AI看16张图片。",
        difficulty: 'hard',
        category: '模型训练'
    },

    // 应用题
    {
        id: 16,
        question: "你想做一个识别水果的AI，最少需要做什么？",
        options: ["买一台超级计算机", "收集水果图片并标注", "学习编程10年", "什么都不用做"],
        correctAnswer: 1,
        explanation: "最基本的是要有标注好的训练数据。计算机不一定要很好，也不需要很多年编程经验。",
        difficulty: 'medium',
        category: '实践应用'
    },
    {
        id: 17,
        question: "如果你的模型把苹果识别成橙子，应该怎么办？",
        options: ["换一台电脑", "增加更多苹果和橙子的训练图片", "放弃", "重新安装软件"],
        correctAnswer: 1,
        explanation: "识别错误通常是因为训练数据不够或不够好，应该增加更多样化的训练数据。",
        difficulty: 'medium',
        category: '实践应用'
    },
    {
        id: 18,
        question: "在学校走廊安装AI监控识别学生是否戴口罩，属于AI的什么应用？",
        options: ["娱乐应用", "安全应用", "教学应用", "科研应用"],
        correctAnswer: 1,
        explanation: "这是计算机视觉在安全和健康监控方面的应用，帮助保护学生健康安全。",
        difficulty: 'easy',
        category: '实践应用'
    },
    {
        id: 19,
        question: "你训练了一个识别猫的模型，下面哪种情况识别效果最好？",
        options: ["用训练时见过的同一张照片", "用清晰的猫咪新照片", "用狗的照片", "用模糊不清的照片"],
        correctAnswer: 1,
        explanation: "模型应该用新的、清晰的照片测试。用训练过的照片没有意义，狗的照片应该识别为狗。",
        difficulty: 'medium',
        category: '实践应用'
    },
    {
        id: 20,
        question: "下面哪个方法不能提高模型识别准确度？",
        options: ["增加训练数据", "提高标注质量", "增加训练轮数", "给计算机换个鼠标"],
        correctAnswer: 3,
        explanation: "鼠标不影响AI训练效果！提高准确度主要靠数据质量、数量和训练时间。",
        difficulty: 'easy',
        category: '实践应用'
    },

    // 更多基础概念题
    {
        id: 21,
        question: "神经网络的名字来源于什么？",
        options: ["电脑网络", "人脑神经元", "互联网", "神经系统疾病"],
        correctAnswer: 1,
        explanation: "神经网络是模仿人脑神经元的连接方式设计的，所以叫神经网络。",
        difficulty: 'easy',
        category: '基础概念'
    },
    {
        id: 22,
        question: "什么是图像分类？",
        options: ["把图片分成几块", "判断整张图片是什么", "给图片排序", "压缩图片"],
        correctAnswer: 1,
        explanation: "图像分类就是判断一张图片的类别，比如这是猫还是狗。",
        difficulty: 'easy',
        category: '基础概念'
    },
    {
        id: 23,
        question: "深度学习中的'深度'指的是什么？",
        options: ["水的深度", "网络层数很多", "学习内容很难", "思考很深刻"],
        correctAnswer: 1,
        explanation: "深度学习的'深度'指神经网络有很多层，就像楼房有很多层一样。",
        difficulty: 'easy',
        category: '基础概念'
    },
    {
        id: 24,
        question: "GPU在AI训练中的作用是什么？",
        options: ["显示图片", "加速计算", "存储数据", "联网"],
        correctAnswer: 1,
        explanation: "GPU（图形处理器）擅长并行计算，可以大大加速AI模型的训练速度。",
        difficulty: 'easy',
        category: '基础概念'
    },
    {
        id: 25,
        question: "什么是卷积神经网络（CNN）？",
        options: ["一种网络游戏", "专门处理图像的神经网络", "一种编程语言", "一种数据库"],
        correctAnswer: 1,
        explanation: "CNN是专门用来处理图像的神经网络，在计算机视觉中应用广泛。",
        difficulty: 'easy',
        category: '基础概念'
    },

    // 更多中等难度题
    {
        id: 26,
        question: "什么是迁移学习？",
        options: ["把模型从一台电脑转移到另一台", "利用已训练好的模型来解决新问题", "转移训练数据", "学习如何转移文件"],
        correctAnswer: 1,
        explanation: "迁移学习就像站在巨人的肩膀上，利用别人训练好的模型作为基础，解决自己的问题。",
        difficulty: 'medium',
        category: '机器学习'
    },
    {
        id: 27,
        question: "训练集、验证集和测试集的主要区别是什么？",
        options: ["名字不同", "用途不同：训练学习、验证调整、测试评估", "大小不同", "没有区别"],
        correctAnswer: 1,
        explanation: "训练集用来让AI学习，验证集用来调整参数，测试集用来评估最终效果。",
        difficulty: 'medium',
        category: '机器学习'
    },
    {
        id: 28,
        question: "什么是学习率（Learning Rate）？",
        options: ["学习速度", "控制模型学习步长的参数", "学习的次数", "学习时间"],
        correctAnswer: 1,
        explanation: "学习率控制模型每次更新的幅度，太大容易错过最优点，太小训练很慢。",
        difficulty: 'medium',
        category: '模型训练'
    },
    {
        id: 29,
        question: "数据增强（Data Augmentation）的目的是什么？",
        options: ["增加数据大小", "通过旋转、翻转等方式扩充训练数据", "提高图片分辨率", "压缩数据"],
        correctAnswer: 1,
        explanation: "数据增强通过翻转、旋转、缩放等方式从现有图片生成更多训练样本，提高模型泛化能力。",
        difficulty: 'medium',
        category: '数据处理'
    },
    {
        id: 30,
        question: "什么是损失函数（Loss Function）？",
        options: ["计算丢失的数据", "衡量模型预测和真实值差距的函数", "记录训练时间", "计算内存占用"],
        correctAnswer: 1,
        explanation: "损失函数用来衡量模型预测结果和真实答案的差距，损失越小表示模型越准确。",
        difficulty: 'medium',
        category: '模型训练'
    },
    {
        id: 31,
        question: "为什么要将数据集分成训练集和测试集？",
        options: ["为了节省存储空间", "为了测试模型在新数据上的表现", "为了加快训练速度", "为了方便管理"],
        correctAnswer: 1,
        explanation: "分开训练集和测试集是为了评估模型在没见过的数据上的表现，避免模型只是记住了训练数据。",
        difficulty: 'medium',
        category: '机器学习'
    },
    {
        id: 32,
        question: "什么是混淆矩阵（Confusion Matrix）？",
        options: ["让人混淆的矩阵", "展示分类结果正确与错误情况的表格", "一种复杂的数学公式", "混乱的数据"],
        correctAnswer: 1,
        explanation: "混淆矩阵是一个表格，清晰地展示了模型分类的正确和错误情况，帮助分析模型性能。",
        difficulty: 'medium',
        category: '模型评估'
    },
    {
        id: 33,
        question: "什么是特征提取？",
        options: ["提取图片文件", "从原始数据中提取有用的信息", "删除不要的数据", "复制数据"],
        correctAnswer: 1,
        explanation: "特征提取是从图片等原始数据中提取出对识别有用的关键信息，比如边缘、纹理等。",
        difficulty: 'medium',
        category: '基础概念'
    },
    {
        id: 34,
        question: "什么是Anchor Box（锚框）？",
        options: ["船锚的形状", "预定义的检测框模板", "一种标注工具", "存储框"],
        correctAnswer: 1,
        explanation: "Anchor Box是预先定义的不同大小和比例的框，帮助模型检测不同尺寸的物体。",
        difficulty: 'medium',
        category: 'YOLO算法'
    },
    {
        id: 35,
        question: "什么是mAP（平均精度均值）？",
        options: ["地图应用", "衡量目标检测模型性能的综合指标", "内存占用", "训练时间"],
        correctAnswer: 1,
        explanation: "mAP是评估目标检测模型的重要指标，综合考虑了检测的准确率和召回率。",
        difficulty: 'medium',
        category: '模型评估'
    },

    // 更多较难题目
    {
        id: 36,
        question: "为什么YOLO可以做到实时检测？",
        options: ["使用最快的电脑", "将检测任务转化为回归问题，一次性处理整张图片", "减少了准确度", "使用特殊网络"],
        correctAnswer: 1,
        explanation: "YOLO将目标检测看作回归问题，一次性预测所有物体的位置和类别，避免了重复计算。",
        difficulty: 'hard',
        category: 'YOLO算法'
    },
    {
        id: 37,
        question: "什么情况下会出现欠拟合？",
        options: ["训练数据太多", "模型太简单，无法学习数据的规律", "训练时间太长", "数据标注错误"],
        correctAnswer: 1,
        explanation: "欠拟合是指模型太简单，连训练数据都学不好，需要增加模型复杂度或训练时间。",
        difficulty: 'hard',
        category: '机器学习'
    },
    {
        id: 38,
        question: "非极大值抑制（NMS）的作用是什么？",
        options: ["抑制噪声", "去除重复的检测框，保留最优结果", "减少训练时间", "提高图片质量"],
        correctAnswer: 1,
        explanation: "NMS用来去除对同一物体的多个检测框，只保留置信度最高的那个。",
        difficulty: 'hard',
        category: 'YOLO算法'
    },
    {
        id: 39,
        question: "什么是IOU（交并比）？",
        options: ["一种芯片型号", "衡量两个框重叠程度的指标", "训练速度", "数据格式"],
        correctAnswer: 1,
        explanation: "IOU是预测框和真实框的交集除以并集，用来评估检测框的准确度，越接近1越好。",
        difficulty: 'hard',
        category: '物体检测'
    },
    {
        id: 40,
        question: "为什么要对图像进行归一化处理？",
        options: ["让图片变正常", "统一数据范围，加速训练收敛", "压缩图片", "美化图片"],
        correctAnswer: 1,
        explanation: "归一化将像素值统一到0-1或-1到1范围，可以加速模型训练，提高稳定性。",
        difficulty: 'hard',
        category: '数据处理'
    },
    {
        id: 41,
        question: "什么是Dropout层？",
        options: ["丢掉不好的数据", "训练时随机关闭一些神经元，防止过拟合", "删除某一层", "网络断开"],
        correctAnswer: 1,
        explanation: "Dropout在训练时随机让一些神经元不工作，强迫网络学习更健壮的特征，防止过拟合。",
        difficulty: 'hard',
        category: '机器学习'
    },
    {
        id: 42,
        question: "什么是Batch Normalization（批归一化）？",
        options: ["批量处理数据", "标准化每一层的输入，加速训练", "批量删除数据", "归类整理"],
        correctAnswer: 1,
        explanation: "批归一化在每一层对数据进行标准化处理，可以加速训练并提高模型稳定性。",
        difficulty: 'hard',
        category: '模型训练'
    },
    {
        id: 43,
        question: "什么是残差连接（Residual Connection）？",
        options: ["连接剩余的网络", "跨层直连，解决深层网络训练困难", "删除多余连接", "连接残次品"],
        correctAnswer: 1,
        explanation: "残差连接让信息可以跨层直接传递，解决了很深的网络难以训练的问题。",
        difficulty: 'hard',
        category: '深度学习'
    },
    {
        id: 44,
        question: "为什么训练深度学习模型需要大量计算资源？",
        options: ["程序写得不好", "需要进行海量的矩阵运算", "为了浪费电", "没有原因"],
        correctAnswer: 1,
        explanation: "深度学习涉及数百万甚至数亿个参数的矩阵运算，需要大量的计算资源。",
        difficulty: 'hard',
        category: '基础概念'
    },
    {
        id: 45,
        question: "什么是注意力机制（Attention Mechanism）？",
        options: ["提醒用户注意", "让模型关注输入中最重要的部分", "集中精力训练", "注意安全"],
        correctAnswer: 1,
        explanation: "注意力机制让模型像人一样，关注输入数据中最重要、最相关的部分。",
        difficulty: 'hard',
        category: '深度学习'
    },

    // 更多应用实践题
    {
        id: 46,
        question: "智能垃圾分类系统使用的是什么AI技术？",
        options: ["语音识别", "图像分类", "文字识别", "音乐识别"],
        correctAnswer: 1,
        explanation: "智能垃圾分类通过摄像头识别垃圾种类，属于图像分类应用。",
        difficulty: 'easy',
        category: '实践应用'
    },
    {
        id: 47,
        question: "自动驾驶汽车主要使用什么技术识别路上的行人和车辆？",
        options: ["GPS定位", "目标检测", "雷达", "温度感应"],
        correctAnswer: 1,
        explanation: "自动驾驶使用目标检测技术识别和定位路上的行人、车辆等物体。",
        difficulty: 'easy',
        category: '实践应用'
    },
    {
        id: 48,
        question: "医疗影像AI可以帮助医生做什么？",
        options: ["开处方", "辅助诊断疾病", "做手术", "管理病历"],
        correctAnswer: 1,
        explanation: "医疗影像AI可以分析X光片、CT等医学图像，辅助医生发现病灶。",
        difficulty: 'easy',
        category: '实践应用'
    },
    {
        id: 49,
        question: "训练一个识别宠物种类的模型，至少需要多少张照片？",
        options: ["1-10张", "几十到几百张以上", "不需要照片", "一张就够"],
        correctAnswer: 1,
        explanation: "一般每个类别至少需要几十到几百张图片，数据越多，模型学得越好。",
        difficulty: 'medium',
        category: '实践应用'
    },
    {
        id: 50,
        question: "如果你的猫识别模型把黑猫识别准确，但总是认不出白猫，应该怎么办？",
        options: ["重新训练整个模型", "增加更多白猫的训练图片", "放弃白猫识别", "调整显示器亮度"],
        correctAnswer: 1,
        explanation: "模型对某个子类别识别不好，说明该类别的训练数据不足，应该补充更多样本。",
        difficulty: 'medium',
        category: '实践应用'
    },
    {
        id: 51,
        question: "用手机拍照识别植物的APP，在什么情况下识别效果最好？",
        options: ["晚上黑暗环境", "光线充足、拍摄清晰", "边走边拍", "距离很远"],
        correctAnswer: 1,
        explanation: "清晰、光线充足的图片质量好，AI更容易识别准确。",
        difficulty: 'easy',
        category: '实践应用'
    },
    {
        id: 52,
        question: "学校食堂使用AI识别菜品自动计价，属于什么应用？",
        options: ["游戏娱乐", "商业应用", "科学研究", "艺术创作"],
        correctAnswer: 1,
        explanation: "这是计算机视觉在商业和日常生活中的实际应用。",
        difficulty: 'easy',
        category: '实践应用'
    },
    {
        id: 53,
        question: "如果要做一个识别手写数字的AI，最著名的数据集是？",
        options: ["ImageNet", "MNIST", "COCO", "VOC"],
        correctAnswer: 1,
        explanation: "MNIST是最经典的手写数字数据集，包含0-9的手写数字图片。",
        difficulty: 'medium',
        category: '实践应用'
    },
    {
        id: 54,
        question: "你训练了一个模型识别教室里的物品，想让它识别操场上的物品，效果会怎样？",
        options: ["完全一样好", "可能会差一些", "完全不能用", "反而更好"],
        correctAnswer: 1,
        explanation: "不同场景的物体外观可能不同，模型需要在目标场景的数据上训练或微调。",
        difficulty: 'medium',
        category: '实践应用'
    },
    {
        id: 55,
        question: "AI识别人脸时，哪个因素影响最大？",
        options: ["头发颜色", "五官特征", "衣服颜色", "背景"],
        correctAnswer: 1,
        explanation: "人脸识别主要基于五官的几何特征和纹理特征，这些是最稳定的特征。",
        difficulty: 'medium',
        category: '实践应用'
    },

    // 综合挑战题
    {
        id: 56,
        question: "为什么说数据质量比数量更重要？",
        options: ["数量不重要", "错误的数据会误导AI学习", "质量和数量一样重要", "只要数据多就行"],
        correctAnswer: 1,
        explanation: "标注错误或质量差的数据会让AI学到错误的规律，还不如没有。",
        difficulty: 'hard',
        category: '机器学习'
    },
    {
        id: 57,
        question: "模型压缩的主要目的是什么？",
        options: ["节省硬盘空间", "让模型能在手机等设备上运行", "加快训练速度", "提高准确度"],
        correctAnswer: 1,
        explanation: "模型压缩可以减小模型大小和计算量，让AI能在手机、嵌入式设备上运行。",
        difficulty: 'hard',
        category: '深度学习'
    },
    {
        id: 58,
        question: "什么是实时目标跟踪？",
        options: ["实时备份数据", "在视频中持续跟踪特定物体的位置", "实时更新软件", "实时保存结果"],
        correctAnswer: 1,
        explanation: "目标跟踪是在视频的连续帧中识别并跟踪特定物体的移动。",
        difficulty: 'hard',
        category: '计算机视觉'
    },
    {
        id: 59,
        question: "语义分割和实例分割的区别是什么？",
        options: ["没有区别", "语义分割只分类别，实例分割还要区分个体", "实例分割更简单", "只是名字不同"],
        correctAnswer: 1,
        explanation: "语义分割只标注每个像素的类别，实例分割还要区分同类别的不同个体。",
        difficulty: 'hard',
        category: '计算机视觉'
    },
    {
        id: 60,
        question: "为什么AI有时会出现一些奇怪的错误识别？",
        options: ["AI故意捣乱", "AI学习的是统计规律，不理解真正含义", "电脑坏了", "程序有bug"],
        correctAnswer: 1,
        explanation: "AI是通过统计学习的，它不真正'理解'事物，只是学习了数据中的模式，所以可能犯一些人类不会犯的错误。",
        difficulty: 'hard',
        category: '基础概念'
    }
];

// 随机抽取20道题目，保证总分为300分
export function selectRandomQuestions(): Question[] {
    // 按难度分组
    const easyQuestions = questions.filter(q => q.difficulty === 'easy');
    const mediumQuestions = questions.filter(q => q.difficulty === 'medium');
    const hardQuestions = questions.filter(q => q.difficulty === 'hard');

    // 固定抽取：10道简单题(10分×10=100分) + 6道中等题(15分×6=90分) + 4道困难题(20分×4=80分) = 总分270分
    // 为了达到300分，调整为：8道简单题(10分×8=80分) + 8道中等题(15分×8=120分) + 4道困难题(25分×4=100分) = 300分
    // 但为了使用现有分值，改为：6道简单题(10分×6=60分) + 8道中等题(15分×8=120分) + 6道困难题(20分×6=120分) = 300分

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const selectedEasy = shuffleArray(easyQuestions).slice(0, 6);
    const selectedMedium = shuffleArray(mediumQuestions).slice(0, 8);
    const selectedHard = shuffleArray(hardQuestions).slice(0, 6);

    // 合并并再次打乱
    return shuffleArray([...selectedEasy, ...selectedMedium, ...selectedHard]);
}

export interface UserScore {
    username: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    timestamp: number;
}
