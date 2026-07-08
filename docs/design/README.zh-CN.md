# xpaste UI 设计基线

[English](./README.md)

本目录只保留当前有效的 UI 设计基线。每张设计稿都是独立 PNG，不依赖其他草图或外部设计工具。

## 当前设计稿

- `xpaste-desktop-light.png`
- `xpaste-desktop-dark.png`
- `xpaste-tablet-light.png`
- `xpaste-tablet-dark.png`
- `xpaste-mobile-light.png`
- `xpaste-mobile-dark.png`

## 设计规则

- Quick Share 是页面第一个可见区域，不添加顶部工具栏、品牌栏、设置按钮、侧边栏、标签栏、搜索栏、头像、悬浮按钮或布局切换控件。
- 粘贴是 Quick Share 的主要操作，文本输入和媒体选择为辅助操作。
- 桌面端使用流式多列 DataItem 网格，平板端减少列数，移动端使用单列布局。
- 所有端的 DataItem 操作统一使用“图标 + 文字”。
- 非 inline 资源在标题行右侧显示可用状态，并与标题垂直对齐。
- 长标题必须在状态标识之前截断，状态标识不得覆盖标题或将标题挤出卡片。
- 文本等 inline 内容不显示可用状态。
- 不可用的非 inline 卡片整体弱化，同时禁用操作。
- 来源信息保持紧凑：平台或设备图标、显示名称和 IP。
- 浅色与深色主题复用相同几何布局。
- 英语与简体中文复用同一响应式布局，根据浏览器语言自动选择，不提供手动选择器。

## 工作流

修改正式 UI 代码前，先更新这些设计稿并完成确认。实现后必须在真实浏览器中验证桌面、平板和移动端，并将实际截图与本基线逐一对比。
