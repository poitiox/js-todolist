import { addTodo, parseTodoId, parseTodos, toggleTodo } from "./todo-model";
import type { Todo } from "./todo-model";

declare global {
  interface Window {
    clearCompleted?: () => void;
  }
}

type TodoFilter = "all" | "active" | "completed";

function initTodoApp(): void {
  const formElement = document.querySelector("#todo-form");
  const inputElement = document.querySelector("#todo-input");
  const listElement = document.querySelector("#todo-list");
  const feedbackElement = document.querySelector("#todo-feedback");
  const filterElement = document.querySelector("#todo-filter");
  const clearCompletedButton = document.querySelector("#clear-completed");

  if (
    !(formElement instanceof HTMLFormElement) ||
    !(inputElement instanceof HTMLInputElement) ||
    !(listElement instanceof HTMLUListElement) ||
    !(feedbackElement instanceof HTMLElement) ||
    !(filterElement instanceof HTMLSelectElement)
  ) {
    console.error("Todo 初始化失败：页面缺少必需元素或元素类型不正确。");
    if (feedbackElement instanceof HTMLElement) {
      feedbackElement.textContent = "待办列表暂不可用，请检查页面结构。";
    }
    return;
  }

  // 嵌套函数只捕获已通过校验的元素，避免丢失类型收窄。
  const todoForm = formElement;
  const todoInput = inputElement;
  const todoList = listElement;
  const feedback = feedbackElement;
  const todoFilter = filterElement;

  const storageKey = "todo-v2";
  let todos: readonly Todo[] = loadTodos();
  let filter: TodoFilter = "all";

  function saveTodos(): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(todos));
      feedback.textContent = "待办事项已保存。";
    } catch (error: unknown) {
      console.error("待办事项保存失败：", error);
      feedback.textContent = "本地保存失败，当前更改仅在本页面有效，刷新后可能丢失。";
    }
  }

  function loadTodos(): Todo[] {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === null) return [];

      // JSON.parse 的结果不可信，类型检查不能代替运行时校验。
      const parsed: unknown = JSON.parse(saved);
      const restored = parseTodos(parsed);
      feedback.textContent = `已从本地恢复 ${restored.length} 项待办。`;
      return restored;
    } catch (error: unknown) {
      console.error("待办事项恢复失败：", error);
      feedback.textContent = "本地记录无法恢复，暂以空列表开始；后续保存会写入新的记录。";
      return [];
    }
  }

  function saveAndRender(): void {
    saveTodos();
    render();
  }

  function removeTodo(id: number): void {
    todos = todos.filter((todo) => todo.id !== id);
    saveAndRender();
  }

  function clearCompleted(): void {
    todos = todos.filter((todo) => !todo.completed);
    saveAndRender();
  }

  function editTodo(id: number): void {
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) return;

    const input = window.prompt("编辑待办事项", todo.text);
    if (input === null) return;

    const content = input.trim();
    if (!content) {
      feedback.textContent = "待办事项不能为空，已保留原内容。";
      return;
    }

    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, text: content } : todo
    );
    saveAndRender();
  }

  function render(): void {
    todoFilter.value = filter;
    const visibleTodos = todos.filter((todo) =>
      filter === "all" || (filter === "completed" ? todo.completed : !todo.completed)
    );
    todoList.replaceChildren();

    for (const todo of visibleTodos) {
      const item = document.createElement("li");
      item.dataset.id = String(todo.id);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.setAttribute("aria-label", `切换完成状态：${todo.text}`);

      const text = document.createElement(todo.completed ? "s" : "span");
      text.textContent = todo.text;

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.dataset.action = "edit";
      editButton.textContent = "编辑";
      editButton.setAttribute("aria-label", `编辑待办：${todo.text}`);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.dataset.action = "delete";
      removeButton.setAttribute("aria-label", `删除待办：${todo.text}`);
      const removeText = document.createElement("span");
      removeText.textContent = "删除";
      removeButton.append(removeText);

      item.append(checkbox, text, editButton, removeButton);
      todoList.append(item);
    }

    if (visibleTodos.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = filter === "all"
        ? "暂无待办事项。"
        : "当前筛选下暂无待办事项。";
      todoList.append(emptyItem);
    }
  }

  todoList.addEventListener("click", (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const item = event.target.closest("li");
    if (!(item instanceof HTMLLIElement) || !todoList.contains(item)) return;

    const id = parseTodoId(item.dataset.id);
    if (id === null || !todos.some((todo) => todo.id === id)) return;

    const removeButton = event.target.closest('[data-action="delete"]');
    if (removeButton && item.contains(removeButton)) {
      removeTodo(id);
      return;
    }

    const editButton = event.target.closest('[data-action="edit"]');
    if (editButton && item.contains(editButton)) {
      editTodo(id);
      return;
    }

    todos = toggleTodo(todos, id);
    saveAndRender();
  });

  todoForm.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();
    const updated = addTodo(todos, todoInput.value);
    if (updated === todos) {
      feedback.textContent = "请输入待办事项，不能只包含空白。";
    } else {
      todos = updated;
      saveAndRender();
      todoInput.value = "";
    }
    todoInput.focus();
  });

  todoFilter.addEventListener("change", () => {
    const selected = todoFilter.value;
    filter = selected === "active" || selected === "completed" ? selected : "all";
    render();
  });

  if (clearCompletedButton instanceof HTMLButtonElement) {
    clearCompletedButton.addEventListener("click", clearCompleted);
  }

  window.clearCompleted = clearCompleted;
  render();
}

initTodoApp();
