#!/bin/bash

# 安装 nvm（Node 版本管理器）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# 或国内镜像（网络慢时用）
# curl -o- https://gitee.com/mirrors/nvm/raw/v0.39.7/install.sh | bash

# 生效 nvm（重启终端也可）
source ~/.bashrc  # 若用 zsh 则执行 source ~/.zshrc

# 安装 Node 18 LTS 版本
nvm install 18
# 设置 Node 18 为默认版本
# nvm alias default 18