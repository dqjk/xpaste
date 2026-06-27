# xpaste

[English](./README.md)

`xpaste` 是一个轻量的浏览器端局域网共享服务，用于在多个设备之间共享文本、图片、视频和文件。
一台电脑以前台方式运行 Node.js 服务，手机、平板和其他电脑只需浏览器即可使用，无需安装客户端。

## 环境要求

- Node.js 20 或更高版本
- 其他设备能够通过局域网访问运行服务的电脑

## 安装与启动

```sh
npm install --global xpaste
xpaste
```

命令启动后会输出本机地址及检测到的全部局域网地址。在其他设备中打开其中一个 `Network` 地址即可。
共享期间保持终端运行，使用完毕后按 `Ctrl+C` 关闭服务。

需要更换端口时：

```sh
xpaste --port 8080
```

```text
Usage: xpaste [options]

Options:
  -p, --port <port>  Port to listen on (default: 3000)
  -h, --help         Show usage
  -v, --version      Show version
```

## 功能

- 以粘贴为核心的文本和剪贴板共享
- 图片、视频和文件上传
- 桌面端拖放上传
- 基于 SSE 的设备和 DataItem 实时更新
- 适配桌面、平板和移动端的响应式布局
- 根据浏览器语言自动显示英语或简体中文
- 跟随系统偏好的浅色与深色主题
- 无数据库、无后台守护进程

## 运行时与安全边界

设备在线状态和近期数据元信息仅保存在进程内存中。二进制内容使用操作系统临时目录，并在正常的
DataItem 或设备生命周期中删除。停止 `xpaste` 后，所有运行时内容会立即变为不可访问。

当前版本不提供身份认证。任何能够访问服务端口的设备都可以查看和发布共享内容。请仅在可信网络
中运行 xpaste，并在允许系统防火墙放行前确认当前网络环境。

其他设备通过普通局域网 HTTP 打开 xpaste 时，浏览器可能因为安全上下文限制而禁止自动读取剪贴板。
此时仍可使用手动粘贴、文件选择、相册选择和拖放上传。

## 开发

```sh
npm install
npm run build
npm test
npm start
```

项目使用 TypeScript Project References 管理 `shared`、`server` 和 `client`，采用原生 ESM、
Express 以及无前端框架的浏览器客户端。

参见[架构概览](./docs/architecture-overview.zh-CN.md)和[模块文档](./docs/modules/)。

## 许可证

[MIT](./LICENSE)
