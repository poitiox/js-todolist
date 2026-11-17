import { useEffect, useState } from "react";
import { addTodo, toggleTodo } from "../todo-model";
import type { Todo } from "../todo-model";
import { loadTodos, saveTodos } from "../todo-storage";
import { TodoForm } from "./todo-form";
import { TodoList } from "./todo-list";

type TodoFilter = "all" | "active" | "completed";

export function TodoApp() {
  const [state, setState] = useState(() => ({
    ...loadTodos(),
    hasChanges: false,
  }));
  const [filter, setFilter] = useState<TodoFilter>("all");
  const { todos, feedback, hasChanges } = state;

  useEffect(() => {
    // 初次恢复失败时保留原记录，只有用户修改列表后才写入。
    if (!hasChanges) return;
    const message = saveTodos(todos);
    setState((current) => ({ ...current, feedback: message }));
  }, [todos, hasChanges]);

  function updateTodos(
    update: (current: readonly Todo[]) => readonly Todo[],
  ): void {
    setState((current) => {
      const updated = update(current.todos);
      if (updated === current.todos) return current;
      return { ...current, todos: updated, hasChanges: true };
    });
  }

  function handleAdd(text: string): boolean {
    if (text.trim() === "") {
      setState((current) => ({
        ...current,
        feedback: "请输入待办事项，不能只包含空白。",
      }));
      return false;
    }
    updateTodos((current) => addTodo(current, text));
    return true;
  }

  function handleEdit(id: number, text: string): boolean {
    const content = text.trim();
    if (!content) {
      setState((current) => ({
        ...current,
        feedback: "待办事项不能为空，已保留原内容。",
      }));
      return false;
    }
    updateTodos((current) =>
      current.map((item) =>
        item.id === id ? { ...item, text: content } : item,
      ),
    );
    return true;
  }

  const visibleTodos = todos.filter(
    (todo) =>
      filter === "all" ||
      (filter === "completed" ? todo.completed : !todo.completed),
  );

  return (
    <main>
      <h1>待办列表</h1>
      <TodoForm onAdd={handleAdd} />
      <p id="todo-feedback" role="status">
        {feedback}
      </p>
      <div className="toolbar">
        <label htmlFor="todo-filter">筛选任务</label>
        <select
          id="todo-filter"
          value={filter}
          onChange={(event) => {
            const selected = event.target.value;
            setFilter(
              selected === "active" || selected === "completed"
                ? selected
                : "all",
            );
          }}
        >
          <option value="all">全部</option>
          <option value="active">未完成</option>
          <option value="completed">已完成</option>
        </select>
        <button
          id="clear-completed"
          type="button"
          onClick={() =>
            updateTodos((current) => current.filter((todo) => !todo.completed))
          }
        >
          清除已完成
        </button>
      </div>
      <TodoList
        todos={visibleTodos}
        emptyMessage={
          filter === "all" ? "暂无待办事项。" : "当前筛选下暂无待办事项。"
        }
        onToggle={(id) => updateTodos((current) => toggleTodo(current, id))}
        onEdit={handleEdit}
        onDelete={(id) =>
          updateTodos((current) => current.filter((todo) => todo.id !== id))
        }
      />
    </main>
  );
}
