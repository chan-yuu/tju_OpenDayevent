#!/usr/bin/env python3
"""
简化的后端启动脚本
直接运行: python3 run.py
"""
import os
# 禁用 WandB，解决登录和参数报错
os.environ["WANDB_DISABLED"] = "true"
os.environ["WANDB_MODE"] = "disabled"  # 双重兜底，兼容不同 WandB 版本
# os.environ['CUDA_LAUNCH_BLOCKING'] = '1'
# os.environ['TORCH_USE_CUDA_DSA'] = '1'  # 启用CUDA断言调试

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        ws="none"  # 禁用 WebSocket，避免依赖问题
    )
