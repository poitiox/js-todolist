// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodoApp } from "../src/components/todo-app";

// 按磁盘路径读取夹具，避免 Vite 将资源 URL 转换成浏览器地址。
const pageHtml = readFileSync(
  resolve(import.meta.dirname, "../index.html"),
  "utf8",
);
let root: Root | undefined;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  const page = new DOMParser().parseFromString(pageHtml, "text/html");
  document.body.replaceChildren(...page.body.childNodes);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.replaceChildren();
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

function element<T extends Element>(selector: string, type: { new (): T }): T {
  const target = document.querySelector(selector);
  if (!(target instanceof type)) throw new Error(`页面缺少元素：${selector}`);
  return target;
}

async function mountApp(): Promise<void> {
  root = createRoot(element("#root", HTMLElement));
  await act(async () => {
    root?.render(createElement(StrictMode, null, createElement(TodoApp)));
  });
}

async function fillInput(selector: string, text: string): Promise<void> {
  const input = element(selector, HTMLInputElement);
  // 原生赋值器模拟用户输入，避免绕过 React 的受控输入追踪。
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  await act(async () => {
    setter?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submitTodo(text: string): Promise<void> {
  await fillInput("#todo-input", text);
  await act(async () => {
    element("#todo-form", HTMLFormElement).dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
}

async function click(selector: string): Promise<void> {
  await act(async () => element(selector, HTMLElement).click());
}

async function selectFilter(value: string): Promise<void> {
  await act(async () => {
    const select = element("#todo-filter", HTMLSelectElement);
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("React 页面状态与业务交互", () => {
  it("从实际 HTML 挂载，新增后同步列表和存储并清空输入", async () => {
    await mountApp();
    await submitTodo("  任务A  ");
    expect(element("#todo-input", HTMLInputElement).value).toBe("");
    expect(element("#todo-list", HTMLUListElement).textContent).toContain(
      "任务A",
    );
    expect(localStorage.getItem("todo-v2")).toBe(
      '[{"id":1,"text":"任务A","completed":false}]',
    );
    expect(document.activeElement).toBe(
      element("#todo-input", HTMLInputElement),
    );
  });

  it("拒绝空白输入，保留原列表与输入并显示反馈", async () => {
    await mountApp();
    await submitTodo("   ");
    expect(document.querySelectorAll("#todo-list li[data-id]")).toHaveLength(0);
    expect(element("#todo-feedback", HTMLElement).textContent).toContain(
      "不能只包含空白",
    );
    expect(element("#todo-input", HTMLInputElement).value).toBe("   ");
    expect(localStorage.getItem("todo-v2")).toBeNull();
  });

  it("复选框只切换一次，连续切换恢复原状态", async () => {
    await mountApp();
    await submitTodo("任务A");
    await click('[data-id="1"] input');
    expect(element('[data-id="1"] input', HTMLInputElement).checked).toBe(true);
    expect(document.querySelector('[data-id="1"] s')?.textContent).toBe(
      "任务A",
    );
    expect(localStorage.getItem("todo-v2")).toBe(
      '[{"id":1,"text":"任务A","completed":true}]',
    );
    await click('[data-id="1"] input');
    expect(element('[data-id="1"] input', HTMLInputElement).checked).toBe(
      false,
    );
    expect(document.querySelector('[data-id="1"] s')).toBeNull();
  });

  it("点击删除按钮内文字时只删除目标任务", async () => {
    localStorage.setItem(
      "todo-v2",
      '[{"id":1,"text":"删除项","completed":false},{"id":2,"text":"保留项","completed":false}]',
    );
    await mountApp();
    await click('[data-id="1"] [data-action="delete"] span');
    expect(document.querySelector('[data-id="1"]')).toBeNull();
    expect(document.querySelector('[data-id="2"]')?.textContent).toContain(
      "保留项",
    );
    expect(localStorage.getItem("todo-v2")).toBe(
      '[{"id":2,"text":"保留项","completed":false}]',
    );
  });

  it("事件使用业务编号，篡改展示属性不会错改其他任务", async () => {
    localStorage.setItem(
      "todo-v2",
      '[{"id":1,"text":"第一项","completed":false},{"id":2,"text":"第二项","completed":false}]',
    );
    await mountApp();
    const item = element('[data-id="1"]', HTMLLIElement);
    item.dataset.id = "2";
    await act(async () => item.click());
    expect(localStorage.getItem("todo-v2")).toBe(
      '[{"id":1,"text":"第一项","completed":true},{"id":2,"text":"第二项","completed":false}]',
    );
  });

  it("筛选只改变视图，清除已完成时保留未完成任务", async () => {
    localStorage.setItem(
      "todo-v2",
      '[{"id":1,"text":"未完成项","completed":false},{"id":2,"text":"已完成项","completed":true}]',
    );
    await mountApp();
    await selectFilter("active");
    expect(document.querySelectorAll("li[data-id]")).toHaveLength(1);
    expect(document.querySelector('[data-id="1"]')).not.toBeNull();
    await selectFilter("completed");
    expect(document.querySelector('[data-id="2"]')).not.toBeNull();
    await click("#clear-completed");
    expect(element("#todo-list", HTMLUListElement).textContent).toContain(
      "当前筛选下暂无",
    );
    expect(localStorage.getItem("todo-v2")).toBe(
      '[{"id":1,"text":"未完成项","completed":false}]',
    );
    await selectFilter("all");
    expect(document.querySelector('[data-id="1"]')).not.toBeNull();
  });

  it("编辑去除首尾空白，取消和空白编辑保留原内容", async () => {
    await mountApp();
    await submitTodo("原任务");
    await click('[data-action="edit"]');
    await fillInput('[aria-label="编辑待办内容"]', "  修改后  ");
    await click('[data-action="save"]');
    expect(localStorage.getItem("todo-v2")).toBe(
      '[{"id":1,"text":"修改后","completed":false}]',
    );
    await click('[data-action="edit"]');
    await fillInput('[aria-label="编辑待办内容"]', "取消的修改");
    await click('[data-action="cancel"]');
    expect(document.querySelector('[data-id="1"] > span')?.textContent).toBe(
      "修改后",
    );
    await click('[data-action="edit"]');
    await fillInput('[aria-label="编辑待办内容"]', "   ");
    await click('[data-action="save"]');
    expect(localStorage.getItem("todo-v2")).toBe(
      '[{"id":1,"text":"修改后","completed":false}]',
    );
    expect(element("#todo-feedback", HTMLElement).textContent).toContain(
      "已保留原内容",
    );
  });
});

describe("React 页面存储与文本安全", () => {
  it.each([
    { name: "JSON语法错误", saved: "{" },
    {
      name: "非法字段",
      saved: '[{"id":1,"text":"脏数据","completed":"false"}]',
    },
    {
      name: "重复编号",
      saved:
        '[{"id":1,"text":"A","completed":false},{"id":1,"text":"B","completed":true}]',
    },
  ])(
    "遇到$name时显示恢复失败，StrictMode 挂载不覆盖原记录",
    async ({ saved }) => {
      localStorage.setItem("todo-v2", saved);
      await mountApp();
      expect(element("#todo-feedback", HTMLElement).textContent).toContain(
        "本地记录无法恢复",
      );
      expect(document.querySelectorAll("li[data-id]")).toHaveLength(0);
      expect(localStorage.getItem("todo-v2")).toBe(saved);
    },
  );

  it("读取失败仍显示空列表和明确反馈", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("存储被禁用", "SecurityError");
    });
    await mountApp();
    expect(element("#todo-feedback", HTMLElement).textContent).toContain(
      "本地记录无法恢复",
    );
    expect(element("#todo-list", HTMLUListElement).textContent).toContain(
      "暂无待办事项",
    );
  });

  it("保存失败保留页面更改，并提示刷新后可能丢失", async () => {
    await mountApp();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("存储已满", "QuotaExceededError");
    });
    await submitTodo("尚未保存的任务");
    expect(element("#todo-list", HTMLUListElement).textContent).toContain(
      "尚未保存的任务",
    );
    expect(element("#todo-feedback", HTMLElement).textContent).toContain(
      "刷新后可能丢失",
    );
    expect(localStorage.getItem("todo-v2")).toBeNull();
  });

  it("把含HTML标签的任务作为普通文字显示", async () => {
    await mountApp();
    const content = '<img src=x onerror="alert(1)">';
    await submitTodo(content);
    expect(
      document.querySelector("#todo-list li[data-id] span")?.textContent,
    ).toBe(content);
    expect(document.querySelector("#todo-list img")).toBeNull();
  });

  it("重新挂载后恢复已保存任务与完成状态", async () => {
    await mountApp();
    await submitTodo("恢复任务");
    await click('[data-id="1"] input');
    await act(async () => root?.unmount());
    root = undefined;
    await mountApp();
    expect(document.querySelector('[data-id="1"] s')?.textContent).toBe(
      "恢复任务",
    );
    expect(element('[data-id="1"] input', HTMLInputElement).checked).toBe(true);
  });
});
