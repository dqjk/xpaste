# npm 包发布

[English](./package-distribution.md)

## 职责

npm 包是 xpaste 的安装边界，包含运行时所需的已编译服务端、浏览器模块和静态 Web 资源。
开发源码、设计参考、TypeScript 构建元数据和本地工具不会进入发布包。

## 发布文件

`package.json` 中的 `files` 白名单发布以下运行时目录：

- `dist`：已编译的服务端、客户端和共享 JavaScript 模块
- `static`：HTML 外壳、样式表和浏览器资源

npm 还会自动包含 `package.json`、`README.md` 和 `LICENSE`。

## 构建生命周期

`npm pack` 和 `npm publish` 会触发 `prepack`。该流程先让 TypeScript 清理 Project References
输出和增量构建元数据，再删除输出目录并执行完整构建。这样可避免 TypeScript 在 `dist` 缺失时
仍误判为无需构建。清理命令仅使用跨平台的 TypeScript 与 Node.js 命令，因此可在 Windows、
macOS 和 Linux 上保持一致行为。

## 运行契约

包要求 Node.js 20 或更高版本并使用原生 ESM。全局安装会将 `xpaste` 命令映射到
`dist/server/app.js`。该文件同时包含轻量前台 CLI 和 Express 应用组合根，不使用 CLI 框架，
也不启动守护进程。

## 发布元数据

包使用 MIT 许可证并以 public 方式发布到 npm。规范源码仓库、问题跟踪和项目主页位于
`https://github.com/dqjk/xpaste`。
