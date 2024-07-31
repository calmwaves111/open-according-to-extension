对于file-open事件，依据文件后缀名指定特定的打开程序

设置 → 编辑器 → 始终聚焦新标签页打开
安装 [opener插件](https://github.com/aidan-gibson/obsidian-opener)

设置界面里添加后缀名和对应的exe路径，其中exe路径请使用`/`而不是`\`

已知的两个问题：
1. 对于obsidian不支持查看的文件，比如txt，pptx等，无法触发file-open事件
2. 对于obsidian支持的文件，还是会在obsidian中打开一个tab，目前用的方法是主动查找该tab然后关闭。