export interface Todo {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
}

export function addTodo(todos: readonly Todo[], text: unknown): readonly Todo[] {
  if (typeof text !== "string" || text.trim() === "") return todos;

  const ids = new Set(todos.map((todo) => todo.id));
  let id = todos.reduce((highest, todo) => Math.max(highest, todo.id), 0);
  do {
    id = id === Number.MAX_SAFE_INTEGER ? 1 : id + 1;
  } while (ids.has(id));

  return [...todos, { id, text: text.trim(), completed: false }];
}

export function toggleTodo(todos: readonly Todo[], id: number): readonly Todo[] {
  if (!Number.isSafeInteger(id) || id <= 0) return todos;
  if (!todos.some((todo) => todo.id === id)) return todos;

  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}

export function parseTodoId(value: string | undefined): number | null {
  // Number 会接受空白、指数和十六进制格式，页面编号只允许规范十进制。
  if (value === undefined || !/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isTodo(value: unknown): value is Todo {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "id" in value &&
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    "text" in value &&
    typeof value.text === "string" &&
    value.text.trim() !== "" &&
    "completed" in value &&
    typeof value.completed === "boolean";
}

export function parseTodos(value: unknown): Todo[] {
  if (!Array.isArray(value)) {
    throw new Error("本地待办数据必须是数组。");
  }

  const entries: readonly unknown[] = value;
  const ids = new Set<number>();
  const restored: Todo[] = [];

  for (const entry of entries) {
    if (!isTodo(entry) || ids.has(entry.id)) {
      throw new Error("本地待办数据格式不正确或存在重复编号。");
    }
    ids.add(entry.id);
    // 只恢复约定字段，避免把存储中的额外属性带入业务状态。
    restored.push({ id: entry.id, text: entry.text, completed: entry.completed });
  }

  return restored;
}
