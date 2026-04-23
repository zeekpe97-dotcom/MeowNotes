# MeowNotes / 喵记知识库 - Phase 1 高保真 UI 原型实现计划

## Context

用户需要构建一个面向知识工作者和开发者的本地笔记客户端 "MeowNotes / 喵记知识库"。核心卖点是在沉浸式编辑与知识管理（类 Obsidian）的基础上，提供富有情绪价值的 AI 宠物猫陪伴。

当前阶段目标：**纯视觉高保真原型**（HTML/CSS/JS），验证四栏布局、毛玻璃拟态、配色方案和猫咪交互动画的视觉效果。后续阶段将迁移至 Tauri + React + Three.js 构建完整桌面应用。

项目目录：`c:\Obsidian\Workspace\AI知识库qoder`（当前为空目录）

---

## 文件结构

```
AI知识库qoder/
├── index.html              # 单入口，包含所有四栏面板结构
├── css/
│   ├── variables.css       # 设计令牌（颜色、间距、字体、阴影、过渡）
│   ├── base.css            # Reset、排版、全局基础样式
│   ├── glassmorphism.css   # 毛玻璃卡片系统、阴影层级
│   ├── layout.css          # 四栏 CSS Grid 布局
│   ├── sidebar.css         # 第1栏：极简侧边栏
│   ├── filetree.css        # 第2栏：文件目录面板
│   ├── editor.css          # 第3栏：核心编辑区
│   ├── ai-panel.css        # 第4栏：AI + 宠物面板
│   ├── animations.css      # 关键帧、微交互动画
│   └── cat.css             # 猫咪 SVG 占位动画
├── js/
│   ├── app.js              # 初始化、面板状态管理
│   ├── interactions.js     # 悬停效果、面板切换、提示触发
│   ├── cat-animation.js    # 猫咪状态机（idle/sleep/active）
│   └── typewriter.js       # AI 建议打字机效果
└── assets/
    ├── cat-sprite.svg      # 多状态猫咪 SVG（含分组的身体部件）
    ├── icons.svg           # 内联 SVG 图标精灵
    └── avatar-cat.svg      # 聊天气泡中的猫咪头像
```

**技术选择**：纯 HTML/CSS/JS，无构建工具，浏览器直接打开即可预览。通过 CDN 加载 Google Fonts（Inter、LXGW WenKai）。

---

## 布局架构

```
┌─────────────────────────────────────────────────────────────────────┐
│  100vw × 100vh，8px 外边距（悬浮窗口效果，为 Tauri 无框窗口做准备）    │
│ ┌──────┬───────────┬─────────────────────────┬────────────────────┐ │
│ │ 64px │  240px    │        flex: 1          │      320px         │ │
│ │ 侧边 │  文件目录  │     编辑区（最大沉浸）     │   AI + 宠物面板    │ │
│ │ 功能栏│           │                         │                    │ │
│ │      │ 搜索栏    │  标题 + 面包屑           │  猫咪动画区域       │ │
│ │ 图标  │ 树状列表   │  Markdown 内容          │  猫咪状态          │ │
│ │ 按钮  │ 标签区域   │  AI 内联建议            │  AI 聊天气泡       │ │
│ │ 设置  │ 新建按钮   │  代码块、双链            │  输入框 + 发送     │ │
│ └──────┴───────────┴─────────────────────────┴────────────────────┘ │
│  背景: linear-gradient(135deg, #FDFBFB, #EBEDEE)                   │
└─────────────────────────────────────────────────────────────────────┘
```

**分割方式**：无任何硬边框。通过毛玻璃卡片的透明度差异、阴影深度层级和空间间距实现自然视觉分隔。

---

## 设计令牌系统 (css/variables.css)

### 颜色
| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-bg-primary` | `#F7F9FC` | 云白基底 |
| `--color-bg-gradient` | `linear-gradient(135deg, #FDFBFB, #EBEDEE)` | 全页背景 |
| `--color-text-dark` | `#2D3748` | 标题、正文 |
| `--color-text-light` | `#A0AEC0` | 说明、元数据 |
| `--color-text-mid` | `#8A94A5` | 图标、次级层级 |
| `--color-accent` | `#FFB067` | 橘猫色 - CTA、AI 高亮 |
| `--color-accent-soft` | `rgba(255,176,103,0.15)` | AI 光晕 |
| `--color-glass-bg` | `rgba(255,255,255,0.6)` | 毛玻璃填充 |
| `--color-glass-border` | `rgba(255,255,255,0.5)` | 毛玻璃边框 |
| `--color-link` | `#5B8DEF` | 双向链接蓝 |

### 阴影层级
- **Level 1**（面板）: `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)`
- **Level 2**（悬停）: `0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.04)`
- **Level 3**（弹窗）: `0 4px 16px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.12)`

### 过渡曲线
- Fast (悬停): `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- Normal (面板): `250ms cubic-bezier(0.4, 0, 0.2, 1)`
- Slow (弹窗): `400ms cubic-bezier(0.16, 1, 0.3, 1)`
- Spring (猫咪弹跳): `500ms cubic-bezier(0.34, 1.56, 0.64, 1)`

### 字体
- 标题: `Inter, PingFang SC, -apple-system, sans-serif`
- 正文: `Inter, PingFang SC, sans-serif`
- 阅读: `LXGW WenKai, Inter, serif`
- 等宽: `JetBrains Mono, Fira Code, monospace`

---

## 四栏面板详细设计

### 第1栏：极简侧边栏 (64px)
- 垂直排列图标按钮：首页、搜索、图谱、书签、标签
- 底部固定：设置齿轮、用户头像
- 当前活跃图标：橘猫色 + `rgba(255,176,103,0.12)` 背景药丸
- 悬停：图标颜色变深 + scale(1.08) + 右侧毛玻璃提示框
- 顶部：40x40px 猫爪 Logo SVG

### 第2栏：文件目录面板 (240px)
- 搜索栏：圆角胶囊形，聚焦时边框变橘色 + 光晕
- 树状结构：文件夹可展开（chevron 旋转90度），笔记项32px行高
- 选中笔记：左侧3px橘色边框 + 浅橘背景
- 底部标签区：横向 flex-wrap，圆角药丸标签
- 自定义细滚动条（4px，橘色滑块）

### 第3栏：核心编辑区 (flex: 1)
- 最高毛玻璃透明度 `rgba(255,255,255,0.7)` — 纸张质感
- 慷慨内边距，内容区最大宽度720px居中
- 顶部工具栏：面包屑导航 + 日期/字数/标签元信息
- 预渲染 Markdown 内容：H1/H2/段落/粗体斜体/`[[双链]]`/代码块/AI建议/引用/列表/分割线
- `[[双链]]`：蓝色虚线下划线，悬停显示预览卡片
- 代码块：深色背景 + 语法高亮外观（彩色 span 模拟）
- AI 内联建议：左侧3px橘色边框 + 渐变背景 + 呼吸光晕 + 打字机动画

### 第4栏：AI + 宠物面板 (320px)
- **上部 40%** - 猫咪区域：200x200px 猫咪 SVG + 橘色径向光晕背景 + 状态文字
- **分隔线**：渐变光线 `linear-gradient(90deg, transparent, rgba(255,176,103,0.3), transparent)`
- **下部 60%** - 聊天区：AI气泡（左对齐 + 猫咪头像）/ 用户气泡（右对齐 + 橘色底）
- 打字指示器：三点弹跳动画
- 输入框：毛玻璃圆角 + 圆形橘色发送按钮

---

## 猫咪占位动画方案

使用多层 SVG 猫咪 + CSS 动画（为后续 Three.js 3D 过渡做准备）：

### SVG 结构
分组部件：`#cat-body`, `#cat-head`, `#cat-eyes`, `#cat-tail`, `#cat-whiskers`, `#cat-paws`
风格：扁平/2.5D，橘猫色主体，浅色肚皮，吉卜力简约感

### 动画状态
| 状态 | 触发条件 | 动画内容 |
|------|---------|---------|
| **Idle（待机）** | 默认 | 尾巴摆动(3s)、慢眨眼(4s间隔)、呼吸起伏(±2px, 4s)、胡须微颤 |
| **Sleep（睡眠）** | 30秒无交互 | 眼睛变新月、呼吸变慢(6s)、"Zzz"淡入淡出、尾巴停止 |
| **Active（活跃）** | 鼠标进入AI面板/点击发送 | 眼睛放大(1.15)、尾巴加速(1.5s)、弹跳(-8px)、散发星光粒子 |

### JS 状态机
- 监听 `.ai-panel` 的 mouseenter/mouseleave
- 监听 `.btn-send` 的 click
- 通过 setTimeout 追踪空闲时间
- 仅切换 CSS 类：`.cat--idle`, `.cat--sleep`, `.cat--active`

---

## 微交互清单

| 触发 | 元素 | 效果 |
|------|------|------|
| 悬停 | 侧边栏图标 | scale(1.08) + 颜色变深, 150ms |
| 悬停 | 文件树项 | 背景变亮 + translateX(2px), 150ms |
| 点击 | 活跃笔记 | 左侧橘色边框 + 背景变化, 200ms |
| 悬停 | 毛玻璃卡片 | 阴影升级 Level 1→2, 250ms |
| 聚焦 | 搜索/聊天输入 | 橘色边框 + 光晕环, 200ms |
| 悬停 | 双链链接 | 下划线实化 + 预览卡片淡入, 200ms |
| 点击 | 发送按钮 | scale(0.92)→1 弹簧弹跳, 300ms |
| 加载 | AI 建议 | 打字机逐字显示 (40ms/字) + 光标闪烁 |
| 持续 | AI 光晕 | 透明度 0.6↔1.0 呼吸循环, 3s |

---

## 实现步骤

### Step 1: 基础搭建
- 创建 `index.html`（CDN 引入 Google Fonts、meta viewport、所有 CSS/JS 链接）
- 实现 `css/variables.css`（完整设计令牌系统）
- 实现 `css/base.css`（CSS Reset、排版、全局样式）
- **验证**：页面显示渐变背景，字体正确加载

### Step 2: 毛玻璃系统 + 布局骨架
- 实现 `css/glassmorphism.css`（.glass-surface 系列工具类、.ai-glow）
- 实现 `css/layout.css`（四栏 CSS Grid、8px 外边距）
- 在 HTML 中放置4个空面板 div
- **验证**：4个半透明毛玻璃栏目可见，渐变背景透出

### Step 3: 侧边栏
- 创建 `assets/icons.svg`（SVG symbol 精灵图：约14个图标）
- 实现侧边栏 HTML 结构 + `css/sidebar.css`
- 图标、活跃态、悬停态、提示框
- **验证**：侧边栏渲染完整，有一个活跃图标

### Step 4: 文件目录面板
- 构建树状 HTML（3个文件夹、8个笔记的示例数据）
- 实现 `css/filetree.css`：搜索栏、树、标签、悬停/选中态
- **验证**：文件树可导航，搜索栏和标签区域正常

### Step 5: 编辑区
- 构建完整的模拟 Markdown 文档 HTML（含所有元素类型）
- 实现 `css/editor.css`：排版、代码块、双链、AI 建议块、工具栏
- **验证**：漂亮的文档视图，所有排版元素齐全

### Step 6: AI + 宠物面板
- 构建面板结构（宠物区 + 聊天区）
- 实现 `css/ai-panel.css`：聊天气泡、输入框、发送按钮、状态区
- 打字指示器三点动画
- **验证**：聊天界面看起来完整，有对话内容

### Step 7: 猫咪 SVG + 动画
- 创建 `assets/cat-sprite.svg`（多部件猫咪）
- 实现 `css/cat.css`：idle/sleep/active 三态动画
- AI 光晕径向渐变
- **验证**：猫咪平滑循环 idle 动画

### Step 8: JavaScript 交互
- `js/app.js`：初始化
- `js/cat-animation.js`：猫咪状态机
- `js/interactions.js`：面板悬停、提示触发、搜索聚焦
- **验证**：猫咪响应鼠标，面板感觉可交互

### Step 9: 打字机效果 + 润色
- `js/typewriter.js`：AI 建议打字机效果
- `css/animations.css`：呼吸光晕、所有剩余微交互
- 设置弹窗（HTML + CSS + 开关 JS）
- 知识图谱占位浮动卡片
- **验证**：所有动画流畅，时序合理

### Step 10: 最终检查
- 核对所有颜色与设计令牌一致
- 验证 backdrop-filter 毛玻璃效果正常
- 在 1280px、1440px、1920px 分辨率下测试
- 确保无任何可见硬边框
- 动画流畅无卡顿

---

## 验证方案

1. **视觉验证**：在浏览器中直接打开 `index.html`，检查四栏布局、毛玻璃效果、配色方案
2. **交互验证**：鼠标悬停各面板观察微交互、进入AI面板触发猫咪活跃态、点击发送按钮
3. **动画验证**：等待30秒观察猫咪进入睡眠态，移入面板触发唤醒
4. **响应式验证**：拖拽窗口至不同宽度（1280-1920px），编辑区自适应
5. **性能验证**：检查动画帧率（Chrome DevTools Performance），确保60fps
