# MeowNotes / 喵记知识库

本地 AI 智能笔记客户端 —— 面向知识工作者和开发者，在沉浸式编辑与知识管理的基础上，提供富有情绪价值的 AI 宠物猫陪伴。

**版本：v1.0.0 | Phase 1 高保真视觉原型**

---

## 目录

- [预览](#预览)
- [核心特性](#核心特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [设计规范](#设计规范)
- [本地开发](#本地开发)
- [路线图](#路线图)
- [版本记录](#版本记录)
- [License](#license)

---

## 预览

当前版本为 Phase 1 **高保真视觉原型**（纯 HTML/CSS/JS），浏览器直接打开即可预览。

```bash
# 本地预览
python -m http.server 8090
# 访问 http://localhost:8090
```

---

## 核心特性

- **四栏桌面布局**：导航、笔记列表、编辑区、AI 猫咪助手
- **Markdown 编辑器**：支持实时预览、Block 编辑原型
- **双链笔记**：`[[ ]]` 语法支持，知识图谱可视化
- **AI 集成**：OpenAI、DeepSeek、Gemini、Ollama 配置预设
- **AI 快捷动作**：总结、思维导图、相关笔记、解释文本
- **猫咪陪伴**：AI 宠物猫互动，提供情绪价值
- **本地存储**：Markdown 文件 + JSON 索引，数据完全本地

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面端框架 | Tauri 2 |
| 前端 | React 19 + TypeScript + Tailwind CSS 4 |
| 后端 | Rust |
| 本地存储 | Markdown 文件 + JSON 索引（后续替换 SQLite） |
| 编辑器 | 自研轻量 Markdown Block Editor |

---

## 项目结构

```
meownotes/
├── docs/                          # 项目文档（预留）
│   ├── requirements/              # 需求文档
│   ├── database/                  # 数据库设计文档
│   ├── api/                       # API 接口文档
│   └── architecture/              # 系统设计文档
├── src/                           # 前端源代码
│   ├── components/                # 组件目录
│   │   └── editor/                # 编辑器组件
│   │       ├── EditorToolbar.tsx      # 编辑器工具栏
│   │       ├── MarkdownBlockEditor.tsx # Markdown Block 编辑器
│   │       ├── MarkdownPreview.tsx    # Markdown 预览
│   │       ├── SlashCommandMenu.tsx   # / 命令菜单
│   │       ├── WikiLinkSuggest.tsx    # 双链建议
│   │       └── index.ts              # 组件导出
│   ├── data/                      # 数据文件
│   │   └── sampleData.ts         # 示例数据
│   ├── services/                  # 服务层
│   │   └── tauriClient.ts        # Tauri API 客户端
│   ├── types/                     # 类型定义
│   │   └── models.ts             # 数据模型
│   ├── utils/                     # 工具函数
│   │   └── markdown.ts           # Markdown 处理
│   ├── App.tsx                    # 根组件
│   ├── main.tsx                   # 入口文件
│   └── index.css                  # 全局样式
├── src-tauri/                     # Tauri 后端（Rust）
│   ├── src/
│   │   ├── commands/              # Tauri 命令
│   │   │   ├── ai.rs             # AI 相关命令
│   │   │   ├── app.rs            # 应用启动命令
│   │   │   ├── assets.rs         # 资源管理命令
│   │   │   ├── cat.rs            # 猫咪互动命令
│   │   │   ├── graph.rs          # 知识图谱命令
│   │   │   ├── notes.rs          # 笔记管理命令
│   │   │   └── mod.rs            # 命令模块导出
│   │   ├── models/                # 数据模型
│   │   │   ├── ai.rs             # AI 配置模型
│   │   │   ├── app.rs            # 应用路径模型
│   │   │   ├── assets.rs         # 资源模型
│   │   │   ├── cat.rs            # 猫咪状态模型
│   │   │   ├── graph.rs          # 图谱节点模型
│   │   │   ├── notes.rs          # 笔记模型
│   │   │   └── mod.rs            # 模型导出
│   │   ├── services/              # 业务逻辑层
│   │   │   ├── ai.rs             # AI 服务
│   │   │   ├── app.rs            # 应用服务
│   │   │   ├── assets.rs         # 资源服务
│   │   │   ├── cat.rs            # 猫咪服务
│   │   │   ├── error.rs          # 错误处理
│   │   │   ├── graph.rs          # 图谱服务
│   │   │   ├── notes.rs          # 笔记服务
│   │   │   └── mod.rs            # 服务导出
│   │   ├── storage/               # 存储层
│   │   │   ├── file_storage.rs   # 文件存储实现
│   │   │   └── mod.rs            # 存储模块导出
│   │   ├── lib.rs                 # 库入口
│   │   └── main.rs                # 程序入口
│   ├── icons/                     # 应用图标
│   │   └── icon.ico              # Windows 图标
│   ├── Cargo.toml                 # Rust 依赖配置
│   ├── tauri.conf.json           # Tauri 配置
│   └── build.rs                  # 构建脚本
├── .env.example                   # 环境变量模板
├── .gitignore                     # Git 忽略配置
├── index.html                     # HTML 入口
├── package.json                   # Node.js 依赖
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                # Vite 配置
└── README.md                      # 项目说明
```

---

## 设计规范

### 色彩系统

| Token | 色值 | 用途 |
|-------|------|------|
| `--bg-primary` | `#1A1D24` | 主背景 |
| `--bg-secondary` | `#23262F` | 次背景 |
| `--bg-tertiary` | `#2A2E3B` | 三级背景 |
| `--accent-primary` | `#4ECDC4` | 主强调色 |
| `--accent-secondary` | `#FF6B6B` | 次强调色 |
| `--text-primary` | `#F0F2F5` | 主文本 |
| `--text-secondary` | `#8B92A8` | 次文本 |

### 字体规范

- 标题：`font-weight: 600`，`letter-spacing: -0.02em`
- 正文：`font-weight: 400`，`line-height: 1.6`
- 标签：`font-weight: 500`，`letter-spacing: 0.02em`

---

## 本地开发

### 前置要求

- Windows
- Node.js
- Rust
- Tauri Windows 依赖

### 安装依赖

```bash
npm install
```

### 运行 Web 调试

```bash
npm run dev
```

### 运行 Windows 桌面端

```bash
npm run desktop:dev
```

### 打包 Windows 安装包

```bash
npm run desktop:build
```

### 本地数据目录

Tauri 运行时会在系统应用数据目录下创建：

- `vault/`：Markdown 笔记
- `assets/`：导入资源
- `storage/`：JSON 索引
- `logs/app/`：日志目录

---

## 路线图

| Phase | 目标 | 状态 |
|-------|------|------|
| Phase 1 | 高保真视觉原型 | ✅ 已完成 |
| Phase 2 | 可交互桌面端骨架 | 🚧 进行中 |
| Phase 3 | 完整功能实现 | 📋 计划中 |
| Phase 4 | 性能优化与扩展 | 📋 计划中 |

---

## 版本记录

### v1.0.0 (2026-04-22)

- 初始版本发布
- 四栏桌面布局原型
- Markdown 编辑器基础功能
- AI 配置预设骨架
- 猫咪陪伴面板 UI

---

## License

MIT License
