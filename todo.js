(() => {
  "use strict";

  const todoForm = document.querySelector("#todo-form");
  const todoInput = document.querySelector("#todo-input");
  const todoList = document.querySelector("#todo-list");
  const feedback = document.querySelector("#todo-feedback");
  const todoFilter = document.querySelector("#todo-filter");
  const clearCompletedButton = document.querySelector("#clear-completed");


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

  let lastTodoId = todos.reduce((highest, todo) => Math.max(highest, todo.id), 0);

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      feedback.textContent = "待办事项已保存。";
    } catch (error) {

      console.error("待办事项保存失败：", error);
      feedback.textContent = "本地保存失败，当前更改仅在本页面有效，刷新后可能丢失。";
    }
  }

  function loadTodos() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) return [];

      const restored = JSON.parse(saved);

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

      feedback.textContent = `已从本地恢复 ${restored.length} 项待办。`;
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


    do {
      lastTodoId = lastTodoId === Number.MAX_SAFE_INTEGER ? 1 : lastTodoId + 1;
    } while (todos.some((todo) => todo.id === lastTodoId));

    todos = [...todos, { id: lastTodoId, text: content, completed: false }];
    saveTodos();
    render();
    return true;
  }

  function removeTodo(id) {

    console.log("删除：任务", id);
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
    console.log("切换：任务", id);
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    render();
  }

  function editTodo(id) {
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) return;

    const input = window.prompt("编辑待办事项", todo.text);
    if (input === null) return;

    const content = input.trim();
    if (!content) {
      feedback.textContent = "待办事项不能为空，已保留原内容。";
      return;
    }

    console.log("编辑：任务", id);
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, text: content } : todo
    );
    saveTodos();
    render();
  }

  function render() {
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


  todoList.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;

    const item = e.target.closest("li");
    if (!item || !todoList.contains(item)) return;


    const id = Number(item.dataset.id);
    if (!Number.isSafeInteger(id) || id <= 0) return;
    if (!todos.some((todo) => todo.id === id)) return;

    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn && item.contains(delBtn)) {
      removeTodo(id);
      return;
    }

    const editBtn = e.target.closest('[data-action="edit"]');
    if (editBtn && item.contains(editBtn)) {
      editTodo(id);
      return;
    }

    toggleTodo(id);
  });

  todoForm.addEventListener("submit", (event) => {

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


  if (clearCompletedButton) {
    clearCompletedButton.addEventListener("click", clearCompleted);
  }


  window.clearCompleted = clearCompleted;
  render();
})();
