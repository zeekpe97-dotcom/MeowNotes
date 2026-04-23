# MeowNotes / 喵记知识库

本地 AI 智能笔记客户端 —— 面向知识工作者和开发者，在沉浸式编辑与知识管理的基础上，提供富有情绪价值的 AI 宠物猫陪伴。

## 预览

当前版本为 **Phase 1 高保真视觉原型**（纯 HTML/CSS/JS），浏览器直接打开即可预览。

```bash
# 本地预览
python -m http.server 8090
# 访问 http://localhost:8090
```

## 核心特性

- **四栏毛玻璃布局** — 侧边栏 (64px) / 文件树 (240px) / 编辑器 (flex:1) / AI面板 (320px)
- **3D AI 宠物猫** — 5种自主行为（坐/走/舔爪/伸懒腰/睡觉），随机切换，点击互动
- **Markdown 编辑器** — 代码高亮（Catppuccin 配色）、双向链接、AI 内联建议
- **知识图谱** — 文件树中的可视化关系覆盖层
- **设计令牌系统** — 完整的颜色/字体/间距/阴影 CSS 变量体系
- **全中文界面** — 模拟数据完全中文化

## 技术栈

| 阶段 | 技术 |
|---|---|
| Phase 1 (当前) | HTML / CSS / JavaScript |
| Phase 2 (计划) | Tauri + React + TypeScript |
| Phase 3 (计划) | Three.js 3D猫咪 + SQLite 数据层 |

## 项目结构

```
MeowNotes/
├── index.html          # 单入口页面
├── css/                # 模块化样式（9个CSS文件）
│   ├── variables.css   # 设计令牌
│   ├── base.css        # 基础样式
│   ├── glassmorphism.css
│   ├── layout.css      # 四栏Grid
│   ├── sidebar.css
│   ├── filetree.css
│   ├── editor.css
│   ├── ai-panel.css
│   ├── animations.css
│   └── cat.css         # 猫咪动画系统
├── js/                 # 交互逻辑
│   ├── app.js
│   ├── cat-animation.js # 猫咪行为状态机
│   ├── interactions.js
│   └── typewriter.js
├── assets/             # 图片和SVG
│   ├── cat-*.png       # 5种猫咪姿态3D渲染图
│   └── *.svg           # 图标精灵
└── docs/               # 设计文档
    └── design-spec.md  # 完整设计规范
```

## 设计规范

详见 [docs/design-spec.md](docs/design-spec.md)

- 主色: `#F7F9FC` (背景) / `#FFB067` (强调色)
- 字体: Inter + PingFang SC
- 毛玻璃: `backdrop-filter: blur(20px)` + 半透明白色背景

## 路线图

- [x] Phase 1: 高保真视觉原型
- [ ] Phase 2: Tauri + React 迁移，真实 Markdown 编辑器
- [ ] Phase 3: Three.js 3D 猫咪，骨骼动画
- [ ] Phase 4: SQLite 本地存储，文件系统集成
- [ ] Phase 5: AI 模型集成（本地 LLM / API）

## License

MIT
