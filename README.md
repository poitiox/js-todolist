# V4.0 待办列表

使用 React 19.3.1 和 TypeScript，保留新增、编辑、删除、完成切换、筛选、清除已完成和本地保存功能。Vite 提供开发与构建，ESLint、Prettier 和严格类型检查约束工程质量。

## 开发方式

开发环境使用 Node.js 22.22.2 以上的 22 版本、24.15 以上的 24 版本或 26 及以上版本，以 `package.json` 为准。

```sh
npm ci
npm run dev
```

通过终端显示的本地地址访问页面。检查与生产构建：

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run preview
```

`index.html` 通过模块脚本加载 `src/todo.ts`，该入口只定位根容器并在 StrictMode 下挂载 React。TSX 使用 react-jsx 自动转换，无需额外的 Vite 插件。构建脚本固定为 `tsc --noEmit && vite build`，输出至 `dist/`，不提交生成产物。

ESLint 10 通过 `eslint.config.cjs` 的 FlatCompat 读取课程指定的 `.eslintrc.cjs`，规则只维护一份。复杂度上限为 10，嵌套深度上限为 3，显式 `any` 为错误；三项均设为错误，`npm run lint` 另禁止告警。扫描范围同时覆盖 TS 和 TSX 业务源码。

使用 `npm run format` 统一格式。Prettier 保留两空格、双引号、分号，格式检查不扫描生成文件。TypeScript 固定为 6.0.3，以满足当前 TypeScript ESLint 解析器的支持范围；`strict` 及全部原有严格选项保留。

## 手动执行测试

```sh
npm run test
```

脚本固定为 `vitest run`，一次性运行测试，不进入监听模式。需要逐项输出时执行 `npm run test -- --reporter=verbose`。测试由用户手动执行，阶段完成后自行提交。

基础测试直接调用真实业务函数，覆盖新增、首尾空白、连续编号、空白及非字符串输入、双向完成切换、连续切换、无对应任务和非法编号。成功操作同时检查原数据未被修改，失败操作检查列表内容与引用均不改变，不需要浏览器或存储 mock。

`npm run typecheck` 分别检查浏览器源码与测试源码，避免给页面代码引入 Node.js 全局类型。它只做静态检查，不会执行测试；类型检查通过不代表测试已经通过。

## 文件职责

| 文件                                | 职责                                         |
| ----------------------------------- | -------------------------------------------- |
| `index.html`                        | React 根容器和浏览器入口                     |
| `src/todo-model.ts`                 | 待办类型、新增、完成切换、编号与恢复数据校验 |
| `src/todo.ts`                       | StrictMode 与 React 根挂载                   |
| `src/components/todo-app.tsx`       | 列表状态、业务事件、筛选和存储同步           |
| `src/components/todo-form.tsx`      | 受控输入、提交及输入焦点                     |
| `src/components/todo-list.tsx`      | 列表组合与空状态                             |
| `src/components/todo-item.tsx`      | 单条待办展示与事件回调                       |
| `src/todo-storage.ts`               | todo-v2 读写与异常反馈                       |
| `src/styles.css`                    | 基础布局与窄屏适配                           |
| `tests/todo-model.basic.test.ts`    | 新增与完成切换的基础单测                     |
| `tests/todo-model.boundary.test.ts` | 编号、恢复数据和重复记录的边界单测           |
| `tests/todo-app.test.ts`            | 实际页面结构、存储异常与文本渲染回归         |
| `dist/`                             | Vite 生成的生产页面与资源，不提交            |
| `tsconfig.json`                     | 严格类型检查配置                             |
| `tsconfig.test.json`                | 测试源码的类型检查配置                       |
| `.eslintrc.cjs`                     | 课程要求的三条代码规则                       |
| `eslint.config.cjs`                 | 当前 ESLint 的旧配置兼容入口                 |
| `.prettierrc.json`                  | 统一格式规则                                 |
