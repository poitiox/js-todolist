"use strict";
(() => {
  // src/todo-model.ts
  function addTodo(todos, text) {
    if (typeof text !== "string" || text.trim() === "") return todos;
    const ids = new Set(todos.map((todo) => todo.id));
    let id = todos.reduce((highest, todo) => Math.max(highest, todo.id), 0);
    do {
      id = id === Number.MAX_SAFE_INTEGER ? 1 : id + 1;
    } while (ids.has(id));
    return [...todos, { id, text: text.trim(), completed: false }];
  }
  function toggleTodo(todos, id) {
    if (!Number.isSafeInteger(id) || id <= 0) return todos;
    if (!todos.some((todo) => todo.id === id)) return todos;
    return todos.map(
      (todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }
  function parseTodoId(value) {
    if (value === void 0 || !/^[1-9]\d*$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
  }
  function isTodo(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value) && "id" in value && typeof value.id === "number" && Number.isSafeInteger(value.id) && value.id > 0 && "text" in value && typeof value.text === "string" && value.text.trim() !== "" && "completed" in value && typeof value.completed === "boolean";
  }
  function parseTodos(value) {
    if (!Array.isArray(value)) {
      throw new Error("本地待办数据必须是数组。");
    }
    const entries = value;
    const ids = /* @__PURE__ */ new Set();
    const restored = [];
    for (const entry of entries) {
      if (!isTodo(entry) || ids.has(entry.id)) {
        throw new Error("本地待办数据格式不正确或存在重复编号。");
      }
      ids.add(entry.id);
      restored.push({ id: entry.id, text: entry.text, completed: entry.completed });
    }
    return restored;
  }

  // src/todo.ts
  function initTodoApp() {
    const formElement = document.querySelector("#todo-form");
    const inputElement = document.querySelector("#todo-input");
    const listElement = document.querySelector("#todo-list");
    const feedbackElement = document.querySelector("#todo-feedback");
    const filterElement = document.querySelector("#todo-filter");
    const clearCompletedButton = document.querySelector("#clear-completed");
    if (!(formElement instanceof HTMLFormElement) || !(inputElement instanceof HTMLInputElement) || !(listElement instanceof HTMLUListElement) || !(feedbackElement instanceof HTMLElement) || !(filterElement instanceof HTMLSelectElement)) {
      console.error("Todo 初始化失败：页面缺少必需元素或元素类型不正确。");
      if (feedbackElement instanceof HTMLElement) {
        feedbackElement.textContent = "待办列表暂不可用，请检查页面结构。";
      }
      return;
    }
    const todoForm = formElement;
    const todoInput = inputElement;
    const todoList = listElement;
    const feedback = feedbackElement;
    const todoFilter = filterElement;
    const storageKey = "todo-v2";
    let todos = loadTodos();
    let filter = "all";
    function saveTodos() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(todos));
        feedback.textContent = "待办事项已保存。";
      } catch (error) {
        console.error("待办事项保存失败：", error);
        feedback.textContent = "本地保存失败，当前更改仅在本页面有效，刷新后可能丢失。";
      }
    }
    function loadTodos() {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved === null) return [];
        const parsed = JSON.parse(saved);
        const restored = parseTodos(parsed);
        feedback.textContent = `已从本地恢复 ${restored.length} 项待办。`;
        return restored;
      } catch (error) {
        console.error("待办事项恢复失败：", error);
        feedback.textContent = "本地记录无法恢复，暂以空列表开始；后续保存会写入新的记录。";
        return [];
      }
    }
    function saveAndRender() {
      saveTodos();
      render();
    }
    function removeTodo(id) {
      todos = todos.filter((todo) => todo.id !== id);
      saveAndRender();
    }
    function clearCompleted() {
      todos = todos.filter((todo) => !todo.completed);
      saveAndRender();
    }
    function editTodo(id) {
      const todo = todos.find((todo2) => todo2.id === id);
      if (!todo) return;
      const input = window.prompt("编辑待办事项", todo.text);
      if (input === null) return;
      const content = input.trim();
      if (!content) {
        feedback.textContent = "待办事项不能为空，已保留原内容。";
        return;
      }
      todos = todos.map(
        (todo2) => todo2.id === id ? { ...todo2, text: content } : todo2
      );
      saveAndRender();
    }
    function render() {
      todoFilter.value = filter;
      const visibleTodos = todos.filter(
        (todo) => filter === "all" || (filter === "completed" ? todo.completed : !todo.completed)
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
        emptyItem.textContent = filter === "all" ? "暂无待办事项。" : "当前筛选下暂无待办事项。";
        todoList.append(emptyItem);
      }
    }
    todoList.addEventListener("click", (event) => {
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
    todoForm.addEventListener("submit", (event) => {
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
})();
