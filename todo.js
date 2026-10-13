(() => {
  "use strict";

  const todoForm = document.querySelector("#todo-form");
  const todoInput = document.querySelector("#todo-input");
  const todoList = document.querySelector("#todo-list");
  const feedback = document.querySelector("#todo-feedback");
  const todoFilter = document.querySelector("#todo-filter");

  // 页面结构变化时明确失败，避免带着缺失的依赖继续初始化。
  if (!todoForm || !todoInput || !todoList || !feedback || !todoFilter) {
    console.error("Todo 初始化失败：页面缺少表单、输入框、列表、提示区域或筛选器。");
    if (feedback) {
      feedback.textContent = "待办列表暂不可用，请检查页面结构。";
    }
    return;
  }

  const STORAGE_KEY = "todo-v2";
  let todos = loadTodos();
  let filter = "all";
  // 从已恢复的任务继续编号，避免刷新后操作到多个同号任务。
  let nextTodoId = todos.reduce((highest, todo) => Math.max(highest, todo.id), 0) + 1;

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      feedback.textContent = "待办事项已保存。";
    } catch (error) {
      // 保存失败不应阻止当前页面使用，但必须说明刷新会丢失此次更改。
      console.error("待办事项保存失败：", error);
      feedback.textContent = "本地保存失败，当前更改仅在本页面有效，刷新后可能丢失。";
    }
  }

  function loadTodos() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) return [];

      const restored = JSON.parse(saved);
      // 本地记录也可能被手动修改，不能只判断 JSON 是否能解析。
      if (
        !Array.isArray(restored) ||
        !restored.every((todo) =>
          todo !== null &&
          typeof todo === "object" &&
          Number.isSafeInteger(todo.id) &&
          todo.id > 0 &&
          typeof todo.text === "string" &&
          todo.text.trim() !== "" &&
          typeof todo.completed === "boolean"
        ) ||
        new Set(restored.map((todo) => todo.id)).size !== restored.length
      ) {
        throw new Error("本地待办数据格式不正确。");
      }

      return restored;
    } catch (error) {
      console.error("待办事项恢复失败：", error);
      feedback.textContent = "本地记录无法恢复，暂以空列表开始；后续保存会写入新的记录。";
      return [];
    }
  }

  function addTodo(text) {
    const content = text.trim();
    if (!content) {
      feedback.textContent = "请输入待办事项，不能只包含空白。";
      return false;
    }

    todos = [...todos, { id: nextTodoId++, text: content, completed: false }];
    saveTodos();
    render();
    return true;
  }

  function removeTodo(id) {
    todos = todos.filter((todo) => todo.id !== id);
    saveTodos();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((todo) => !todo.completed);
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    render();
  }

  function render() {
    todoFilter.value = filter;
    // 筛选只影响显示，不能把隐藏任务从完整数据中删除。
    const visibleTodos = todos.filter((todo) =>
      filter === "all" || (filter === "completed" ? todo.completed : !todo.completed)
    );
    todoList.replaceChildren();

    for (const todo of visibleTodos) {
      const item = document.createElement("li");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.addEventListener("change", () => toggleTodo(todo.id));

      const text = document.createElement(todo.completed ? "s" : "span");
      // 待办属于纯文本，用户输入不能作为 HTML 解释。
      text.textContent = todo.text;
      label.append(checkbox, text);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "删除";
      removeButton.setAttribute("aria-label", `删除待办：${todo.text}`);
      removeButton.addEventListener("click", () => removeTodo(todo.id));

      item.append(label, removeButton);
      todoList.append(item);
    }

    if (visibleTodos.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = filter === "all" ? "暂无待办事项。" : "当前筛选下暂无待办事项。";
      todoList.append(emptyItem);
    }
  }

  todoForm.addEventListener("submit", (event) => {
    // 列表在当前页面更新，不需要通过表单提交导航。
    event.preventDefault();

    if (addTodo(todoInput.value)) {
      todoInput.value = "";
    }
    todoInput.focus();
  });

  todoFilter.addEventListener("change", () => {
    filter = todoFilter.value;
    render();
  });

  // 练习要求从控制台调用，局部函数需要提供明确入口。
  window.clearCompleted = clearCompleted;
  render();
})();
