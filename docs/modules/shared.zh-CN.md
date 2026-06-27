# 共享模块

[English](./shared.md)

## 目标

共享模块定义客户端与服务端之间的协议契约。

## 职责

- 设备模型
- 数据摘要模型
- SSE 事件载荷
- 共用请求载荷

## 规则

- 保持平台无关。
- 不在此处加入 Express、DOM 或 Node.js 文件系统逻辑。
- 优先使用普通类型和小型常量。

## 当前范围

- `types/device.ts`
- `types/data.ts`
- `types/sse.ts`
