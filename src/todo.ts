import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TodoApp } from "./components/todo-app";
import "./styles.css";

const container = document.getElementById("root");
if (!(container instanceof HTMLElement)) {
  throw new Error("Todo 初始化失败：页面缺少根挂载容器。");
}

createRoot(container).render(
  createElement(StrictMode, null, createElement(TodoApp)),
);
