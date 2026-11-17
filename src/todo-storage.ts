import { parseTodos } from "./todo-model";
import type { Todo } from "./todo-model";

const storageKey = "todo-v2";

export function loadTodos(): { todos: readonly Todo[]; feedback: string } {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return { todos: [], feedback: "" };
    const parsed: unknown = JSON.parse(saved);
    const todos = parseTodos(parsed);
    return { todos, feedback: `已从本地恢复 ${todos.length} 项待办。` };
  } catch {
    return {
      todos: [],
      feedback: "本地记录无法恢复，暂以空列表开始；后续保存会写入新的记录。",
    };
  }
}

export function saveTodos(todos: readonly Todo[]): string {
  try {
    localStorage.setItem(storageKey, JSON.stringify(todos));
    return "待办事项已保存。";
  } catch {
    return "本地保存失败，当前更改仅在本页面有效，刷新后可能丢失。";
  }
}
