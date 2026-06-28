# EventGo Frontend — 项目规划

> 校园活动管理平台前端，React SPA，连接 EventGo 后端 API
> 定位：前端实习求职核心项目 | 与 DocuMind AI + EventGo Backend 组成三件套

---

## 技能缺口分析

两个已完成项目的技术栈：

| 项目 | 覆盖技能 |
|------|---------|
| **DocuMind AI** | Python, LangChain, RAG, Chroma, Embedding, Streamlit, LM Studio, Prompt Eng, Docker |
| **EventGo Backend** | FastAPI, PostgreSQL, SQL, JWT/RBAC, REST API, Docker, Pytest, Git |
| **EventGo Frontend（本项）** | **React, TypeScript, Tailwind, Zustand, React Router, 表单验证, 响应式, 无障碍, 测试** |

> 三项目技术栈 **零重叠**，合计覆盖 29 个岗位 80% 以上的核心要求。

---

## 技术栈

| 类别 | 选型 | 理由 |
|------|------|------|
| 框架 | React 18 + TypeScript | 4+ 岗位点名，行业标准 |
| 构建 | Vite | 快，零配置，原生 TS 支持 |
| 样式 | Tailwind CSS | 原子化 CSS，响应式友好 |
| 状态管理 | Zustand | 轻量，比 Redux 简单 10 倍 |
| 路由 | React Router v6 | SPA 多页面 |
| 表单 | React Hook Form + Zod | 高性能表单 + 类型安全验证 |
| HTTP | 原生 fetch（封装） | 学会写 API 层，不依赖 Axios |
| 测试 | Vitest + Testing Library | Vite 原生集成 |
| 部署 | Vercel / Netlify | 免费，一键部署 |
| CI/CD | GitHub Actions | 自动化测试 + 部署 |

---

## 页面清单

| 路由 | 页面 | 鉴权 | 对接的 EventGo API |
|------|------|:--:|-------------------|
| `/login` | 登录 | 无 | `POST /api/auth/login` |
| `/register` | 注册 | 无 | `POST /api/auth/register` |
| `/` | 活动列表（首页） | 无 | `GET /api/events` + `GET /api/categories` |
| `/events/:id` | 活动详情 | 无（预订需登录） | `GET /api/events/:id` |
| `/events/new` | 创建活动 | organizer+ | `POST /api/events` |
| `/events/:id/edit` | 编辑活动 | organizer+ | `PUT /api/events/:id` |
| `/events/:id/participants` | 参与者列表 | organizer+ | `GET /api/events/:id/participants` |
| `/dashboard` | 组织者看板 (Kanban) | organizer+ | `GET /api/events` + status 分组 |
| `/bookings` | 我的预约 | 登录 | `GET /api/bookings/my` |
| `/notifications` | 通知中心 | 登录 | `GET /api/notifications` |
| `/profile` | 个人资料 | 登录 | `GET/PUT /api/auth/me` |

---

## 五阶段实施计划

### 阶段 1：脚手架 + 主题 + 布局（1 次会话）

**目标**：Vite 工程就绪，主题系统可用，页面壳子到位。

1. `npm create vite` 初始化 React + TS 项目
2. 安装 Tailwind CSS、Zustand、React Router
3. 搭建目录结构
4. 实现 light/dark/system 三档主题切换（Zustand + localStorage 持久化）
5. 创建 AppLayout（Header + 主内容区 + 移动端导航）
6. 空占位页面验证路由和主题正常

**产出**：能在浏览器里看到导航栏，点击切换主题，路由跳转不报错。

---

### 阶段 2：认证体系（1 次会话）

**目标**：注册/登录全流程走通，JWT 管理就绪。

1. 封装 API 层（`src/api/client.ts` — fetch 封装 + 自动附加 Token）
2. 创建 `useAuthStore`（login / register / logout / 401 自动跳转）
3. 登录页 + 注册页（React Hook Form + Zod 验证）
4. 受保护路由（未登录重定向到 `/login`）
5. 角色感知 UI（普通用户看不到「创建活动」按钮）
6. Profile 页（查看/编辑个人信息）

**产出**：能注册、登录、退出，刷新后保持登录态，Token 过期重定向。

---

### 阶段 3：活动浏览与预订（2 次会话）

**目标**：首页活动列表 + 详情页 + 预订流程。

**3A — 活动列表与筛选**
1. 活动卡片组件（封面图、标题、时间、地点、剩余名额）
2. 分类筛选（从 API 获取分类列表，点击切换）
3. 关键词搜索（防抖 300ms）
4. 分页（上一页/下一页，或无限滚动）
5. 加载态 / 空态 / 错误态三种状态处理

**3B — 活动详情与预订**
6. 活动详情页（完整信息展示）
7. 预订按钮 + 名额检查（已满则灰掉）
8. 取消预订（确认弹窗）
9. 「我的预约」页面（列表 + 取消操作）
10. 通知中心页面

**产出**：能浏览活动列表、筛选搜索、点进详情、预订/取消、查看预约记录。

---

### 阶段 4：组织者看板 + 活动管理（2 次会话）

**目标**：Organizer 专属功能——Kanban 管理活动。

**4A — 活动 CRUD**
1. 创建活动表单（标题、描述、时间、地点、容量、分类、封面图上传）
2. 编辑活动（预填现有数据，部分更新）
3. 删除活动（确认弹窗，软删除）
4. 参与者列表页面

**4B — 组织者 Kanban 看板**
5. 按 status 分列：Draft / Published / In Progress / Completed
6. 拖拽卡片改变活动状态（调用 `PUT /api/events/:id`）
7. 每列显示活动数量、总容量、已报名数
8. 响应式适配（桌面四列，平板两列，手机纵向堆叠）

**产出**：Organizer 能创建/编辑/删除活动，在 Kanban 看板上拖拽管理活动状态。

---

### 阶段 5：测试 + 优化 + 部署（1-2 次会话）

**目标**：从学生项目变成可交付的工程产物。

1. 安装配置 Vitest + Testing Library
2. 写 5-8 个单元测试（auth store、API 封装、工具函数）
3. 写 3-5 个组件测试（登录表单提交、活动卡片渲染、预订按钮状态）
4. Lighthouse 性能优化到 90+
5. 无障碍审查（axe DevTools）+ 修复
6. 响应式最后打磨（手机/平板/桌面全都过一遍）
7. GitHub Actions CI（push 自动跑测试）
8. 部署到 Vercel

**产出**：`npm test` 全通过，Lighthouse ≥ 90，公网可访问，README 含截图。

---

## 运行 EventGo 后端（开发时）

```bash
cd eventgo
docker compose up -d           # 启动 MySQL + Redis
uvicorn app.main:app --reload  # API 在 localhost:8000
```

前端 Vite dev server 通过 proxy 转发 `/api` 请求到后端，无跨域问题。

---

## 目录结构（阶段 1 完成后）

```
eventgo-frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css              # Tailwind + 主题变量
│   ├── api/
│   │   └── client.ts          # fetch 封装 + Token 管理
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   └── ui/
│   │       └── ThemeToggle.tsx
│   ├── stores/
│   │   ├── useThemeStore.ts
│   │   └── useAuthStore.ts
│   ├── hooks/                 # 自定义 hooks
│   ├── pages/                 # 每个路由一个页面组件
│   ├── types/
│   │   └── index.ts           # Event, User, Booking 等类型
│   └── utils/                 # 工具函数（日期格式化等）
└── public/
    └── favicon.svg
```

---

## 与原始 TaskFlow 方案的差异

| 原方案 | 新方案 |
|--------|--------|
| 通用 Kanban 看板 | EventGo 活动管理平台 |
| Mock 数据 / localStorage | 真实 EventGo API |
| 无认证 | JWT 认证 + 角色权限 |
| 无表单验证 | React Hook Form + Zod |
| 无 API 层 | fetch 封装 + 错误处理 |
| 无后端联动 | 与完整 FastAPI 后端对接 |

原方案的核心亮点（Kanban 拖拽）保留在阶段 4B，作为 Organizer 的活动管理看板。

---

## 学习原则

- 每阶段写完跑起来，看到效果再停下
- Git commit 按阶段提交，方便回溯
- 报错先自己读 30 秒，这是最重要的前端技能
- 代码自己敲，AI 提供方案但不代写

---

准备好了告诉我，从阶段 1 第一步 — `npm create vite` 开始。
