# Taomony v2 - 项目指南

## 行为准则（Andrej Karpathy 风格）

遵循以下原则减少常见编码错误。对于琐碎任务可酌情放宽。

### 1. 先想清楚再写代码（Think Before Coding）

**不要假设。不要隐藏疑惑。暴露权衡。**

实施之前：
- 明确陈述你的假设。如果不确定，就问。
- 如果存在多种解读，列出它们——不要默默选择。
- 如果存在更简单的方案，说出来。在必要时提出异议。
- 如果某件事不清楚，停下来。指出困惑所在。提问。

### 2. 简洁优先（Simplicity First）

**用最少的代码解决问题。不做投机性扩展。**

- 不实现未要求的特性。
- 不为一次性使用场景做抽象。
- 不添加未要求的"灵活性"或"可配置性"。
- 不为不可能发生的场景做错误处理。
- 如果写了 200 行但可以用 50 行解决，重写。

问自己："一位资深工程师会觉得这过于复杂吗？"如果是，简化。

### 3. 精准修改（Surgical Changes）

**只碰必须碰的。只清理自己造成的混乱。**

编辑现有代码时：
- 不要"改进"相邻的代码、注释或格式。
- 不要重构没有问题的部分。
- 匹配现有风格，即使你个人偏好不同的写法。
- 如果发现无关的废弃代码，提出来——但不要删除。

当你的修改产生了孤儿代码时：
- 删除因你的修改而不再使用的 import/变量/函数。
- 不要删除预先存在的废弃代码，除非被要求。

检验标准：每一行修改都应能追溯到用户的直接请求。

### 4. 目标驱动执行（Goal-Driven Execution）

**定义成功标准。循环直到验证通过。**

将任务转化为可验证的目标：
- "添加验证" → "编写针对无效输入的测试，然后让它们通过"
- "修复 bug" → "编写可复现它的测试，然后让测试通过"
- "重构 X" → "确保重构前后测试都通过"

对于多步骤任务，陈述简要计划：
```
1. [步骤] → 验证：[检查项]
2. [步骤] → 验证：[检查项]
3. [步骤] → 验证：[检查项]
```

强的成功标准让你能独立迭代。弱的标准（"让它工作"）需要持续澄清。

---

## 全局规则
- **所有下载的文件都必须放入 D 盘**，避免占用 C 盘空间。软件包、仓库克隆、Chrome 配置profile 等都优先放到 D:\Developer\ 或 D:\Dev\ 下。
- **所有 skill 必须安装在 `~\.claude\skills\` 下**，不要放在项目级别的 `.agents\skills\` 或其他位置。安装后需同时链接到 Cowork 目录：`C:\Users\Admin\AppData\Local\Claude-3p\local-agent-mode-sessions\skills-plugin\00000000-0000-4000-8000-000000000001\ec00fb06-0add-448b-8bf9-65948e8cf6c9\skills\`，确保 Cowork 也能使用。
- **⚠️ 关键工作文件（CRITICAL）**：所有开发修改都必须在 `file:///D:/Documents/Claude/Projects/Taomony%20App/index.html` 上直接进行。该文件是唯一打开的浏览器页面，用户通过 Chrome 的 `file://` 协议直接访问。**不要修改 Vite 项目中的 src/ 文件**来试图影响页面行为 —— 页面加载的是 index.html 中的内联 React/Babel 代码，不经过 Vite 构建。任何编辑后只需刷新浏览器即可验证。

## 技术栈
- **框架**: React 19 + Vite 8
- **样式**: Tailwind CSS 4 (CDN: @tailwindcss/vite)
- **路由**: React Router 7 (BrowserRouter)
- **图标**: Lucide React
- **后端**: Supabase
- **字体**: Playfair Display (英文标题), Lato (正文), Noto Serif SC (中文)

## 项目结构
```
src/
├── App.jsx                 # 根组件，路由配置
├── Layout.jsx              # 布局（Header + Outlet + BottomNav）
├── main.jsx                # 入口
├── index.css               # 全局样式 + Tailwind 配置
├── components/             # 公共组件
│   ├── Header.jsx          # 顶部导航
│   └── BottomNav.jsx       # 底部导航
├── pages/                  # 页面组件
│   ├── Home.jsx
│   ├── Meditate.jsx
│   ├── Sleep.jsx
│   ├── TaoWeight.jsx
│   └── HarmonyPavilion.jsx
└── lib/
    ├── supabase.js         # Supabase 客户端
    └── youtubeUtils.js
```

## 样式约定
- 使用 Tailwind CSS v4，通过 `@import "tailwindcss"` 引入
- 自定义主题在 `@theme` 块中定义
- 使用 `@layer base/components/utilities` 组织样式
- 容器最大宽度 480px（移动端优先）

## 路由
- `/home` - 首页
- `/meditate` - 冥想
- `/sleep` - 睡眠
- `/tao-weight` - 体重/养生
- `/harmony-pavilion` - 和谐阁（社区）

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
