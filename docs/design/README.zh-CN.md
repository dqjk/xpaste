# xpaste UI 设计基线

[English](./README.md)

本目录保存项目自有的视觉设计基线。后续 UI 工作应以这些资源为参考，不再依赖外部设计工具。

## 当前设计稿

### 页面布局

- `xpaste-responsive-ui-draft.png`

### 主题与状态

- `xpaste-dark-mode-availability-draft.png`

### 本地化

- `xpaste-locale-en-draft.svg`
- `xpaste-locale-zh-cn-draft.svg`

### 组件

- `xpaste-dataitem-card-draft.png`
- `xpaste-device-connect-entry-draft.svg`
- `xpaste-device-connect-modal-draft.svg`

## 已验证实现截图

- `xpaste-desktop-verified.png`
- `xpaste-tablet-verified.png`
- `xpaste-mobile-verified.png`
- `xpaste-impl-desktop-light.png`
- `xpaste-impl-desktop-dark.png`
- `xpaste-impl-tablet-dark.png`
- `xpaste-impl-mobile-dark.png`
- `xpaste-chrome-http-compatibility.png`

设计稿包含三个响应式目标：

- 桌面端：顶部为紧凑的 Quick Share，下方为多列 DataItem 网格。
- 平板端：结构保持一致，列数减少，Quick Share 操作允许换行。
- 移动端：DataItem 使用单列流式布局，Quick Share 保持紧凑。

## 设计规则

- UI 遵循“即用即走”，用户应聚焦于粘贴或上传内容，然后获取 DataItem。
- 不添加侧边栏、菜单、底部标签栏、搜索栏、头像、悬浮添加按钮或布局切换控件。
- 顶部右侧仅保留一个小型设置按钮。
- Quick Share 以粘贴为第一操作，`粘贴剪贴板内容` 是主操作。
- 文本输入是辅助方式，通过 `发送` 提交，不提供独立的“文本”快捷按钮。
- 媒体操作属于次要操作：`图片`、`文件`、`视频`，移动端额外提供 `相册`。
- DataItem 卡片依次突出内容预览、操作和紧凑的来源信息。
- 桌面、平板和移动端的卡片操作统一使用“图标 + 文字”。
- 文件、图片和视频等非 inline 资源必须在卡片底部、类型图标和来源信息附近显示可用状态。
- 文本等即时消费型 inline 卡片不显示“可用”或“不可用”。
- 不可用的非 inline 卡片整体弱化，同时禁用操作。
- 来源信息保持紧凑：设备/系统图标、显示名称和 IP。
- 浅色与深色主题都必须先完成设计再实现。
- 桌面端设备连接使用紧凑的顶部入口和应用生成的二维码。
- 关闭态入口和打开态弹层使用不同设计稿。
- 英语和简体中文复用同一响应式几何布局，翻译不得引入独立布局。
- 每次页面加载都根据浏览器语言决定界面语言，不提供手动语言选择，也不保存偏好。

## 待确认设计

- `xpaste-dark-mode-availability-draft.png` 定义深色主题，并将可用状态从卡片右上角移到底部。
- `xpaste-dataitem-card-draft.png` 单独展示 DataItem 卡片，不包含应用外壳、手机边框、设置按钮或页面级控件。
- 实现或调整 UI 前应先确认相应设计方向。

## 验证目标

实现或调整真实 UI 时至少验证：

- 桌面宽度：每行显示多个 DataItem 卡片。
- 平板宽度：每行卡片数量减少。
- 移动宽度：单列 DataItem 卡片。
- 所有宽度下 Quick Share 都保持紧凑且以粘贴为主。
- DataItem 操作始终清晰可见，但不能压过内容本身。
