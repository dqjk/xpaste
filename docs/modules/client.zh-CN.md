# 客户端模块

[English](./client.md)

## 目标

客户端模块在不引入前端框架的前提下提供响应式浏览器界面。

## 职责

- 确保 `deviceId` Cookie 存在
- 建立并消费 SSE 事件流
- 提交文本和文件数据
- 根据浏览器语言选择英语或简体中文
- 将页面状态与 DOM 渲染分离
- 渲染响应式的多设备内容界面

## 内部边界

- `api/`：HTTP 请求
- `app/`：应用启动和浏览器生命周期辅助逻辑
- `i18n/`：类型安全的语言协商和翻译字典
- `state/`：页面内存状态
- `ui/`：渲染逻辑

## 当前范围

- `index.ts`
- `api/http-client.ts`
- `app/device-cookie.ts`
- `app/event-source.ts`
- `i18n/locale.ts`
- `state/store.ts`
- `ui/render.ts`

## 本地化生命周期

客户端启动时根据浏览器提供的有序语言偏好协商一次界面语言。中文语言标签使用 `zh-CN` 字典，
受支持的英语标签使用 `en`，其他语言回退为英语。协商结果会更新文档语言，并将不可变翻译函数
显式传入渲染层；客户端不会保存语言偏好。

## 浏览器兼容性

设备身份在可用时使用 `Crypto.randomUUID()`，在普通局域网 HTTP 环境中则通过
`Crypto.getRandomValues()` 生成相同格式的 UUID v4。剪贴板操作会在运行时检测安全上下文 API，
不可用时分别回退为手动粘贴或基于文本选区的复制。
