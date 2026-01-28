#!/bin/bash
cd '/home/cyun/Documents/1.31-demo开发/tju-project/tju-vision-lab'
export DISPLAY=:1
nohup /home/cyun/.local/bin/labelImg '/home/cyun/Documents/1.31-demo开发/tju-project/tju-vision-lab/dataset/images' '/home/cyun/Documents/1.31-demo开发/tju-project/tju-vision-lab/dataset/predefined_classes.txt' '/home/cyun/Documents/1.31-demo开发/tju-project/tju-vision-lab/dataset/labels' > /tmp/labelimg.log 2>&1 &
echo $!
