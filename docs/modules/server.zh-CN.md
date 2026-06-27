# 服务端模块

[English](./server.md)

## 目标

服务端模块托管浏览器应用、跟踪在线设备、接收共享内容，并通过 SSE 推送运行时变化。

## 职责

- 解析轻量的前台 CLI 参数
- 输出本机和局域网访问地址
- 提供静态资源
- 注册 SSE 连接
- 根据 `deviceId` 跟踪设备状态
- 接收文本和二进制上传
- 通过 HTTP 提供当前数据资源
- 在最后一个会话断开后删除设备数据

## 内部边界

- `routes/`：HTTP 和 SSE 入口
- `services/`：运行时状态与业务逻辑
- `utils/`：无状态辅助函数

## 当前范围

- `app.ts`：npm 可执行入口、CLI 解析和应用组合根
- `routes/events.ts`
- `routes/data.ts`
- `routes/static.ts`
- `services/device-service.ts`
- `services/data-service.ts`
- `services/sse-service.ts`
