(() => {
  "use strict";

  const todoForm = document.querySelector("#todo-form");
  const todoInput = document.querySelector("#todo-input");
  const todoList = document.querySelector("#todo-list");
  const feedback = document.querySelector("#todo-feedback");

  // 页面结构变化时明确失败，避免带着缺失的依赖继续初始化。
  if (!todoForm || !todoInput || !todoList || !feedback) {
    console.error("Todo 初始化失败：页面缺少表单、输入框、列表或提示区域。");
    if (feedback) {
      feedback.textContent = "待办列表暂不可用，请检查页面结构。";
    }
    return;
  }

  todoForm.addEventListener("submit", (event) => {
    // 列表在当前页面更新，默认提交导航会丢失页面内的任务。
    event.preventDefault();

    const text = todoInput.value.trim();
    if (!text) {
      feedback.textContent = "请输入待办事项，不能只包含空白。";
      todoInput.focus();
      return;
    }

    const item = document.createElement("li");
    // 待办属于纯文本，用户输入不能作为 HTML 解释。
    item.textContent = text;
    todoList.appendChild(item);

    todoInput.value = "";
    feedback.textContent = "待办事项已添加。";
    todoInput.focus();
  });
})();
