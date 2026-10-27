// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  delete window.clearCompleted;
  const page = new DOMParser().parseFromString(pageHtml, "text/html");
  document.body.replaceChildren(...page.body.childNodes);
  // 异常分支会主动记录错误，避免预期内日志掩盖真实测试失败。
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.replaceChildren();
  delete window.clearCompleted;
});

function submitTodo(text: string): void {
  const input = document.querySelector("#todo-input");
  const form = document.querySelector("#todo-form");
  if (!(input instanceof HTMLInputElement) || !(form instanceof HTMLFormElement)) {
    throw new Error("测试页面缺少待办输入框或表单。");
  }
  input.value = text;
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("页面依赖与安全边界", () => {
  it.each(["todo-form", "todo-input", "todo-list", "todo-feedback", "todo-filter"])(
    "缺少必需元素 %s 时安全退出初始化",
    async (id) => {
      document.getElementById(id)?.remove();

      await import("../src/todo");

      expect(window.clearCompleted).toBeUndefined();
      if (id !== "todo-feedback") {
        expect(document.getElementById("todo-feedback")?.textContent)
          .toContain("待办列表暂不可用");
      }
    }
  );

  it.each([
    { name: "JSON语法错误", saved: "{" },
    {
      name: "非法字段",
      saved: JSON.stringify([{ id: 1, text: "脏数据", completed: "false" }]),
    },
  ])("存储中出现$name时显示恢复失败并保留原始记录", async ({ saved }) => {
    localStorage.setItem("todo-v2", saved);

    await import("../src/todo");

    expect(document.getElementById("todo-feedback")?.textContent)
      .toContain("本地记录无法恢复");
    expect(document.querySelectorAll("#todo-list li[data-id]")).toHaveLength(0);
    expect(localStorage.getItem("todo-v2")).toBe(saved);
  });

  it("读取本地存储失败时仍显示空列表和明确反馈", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("存储被禁用", "SecurityError");
    });

    await import("../src/todo");

    expect(document.getElementById("todo-feedback")?.textContent)
      .toContain("本地记录无法恢复");
    expect(document.getElementById("todo-list")?.textContent).toContain("暂无待办事项");
  });

  it("保存失败时保留页面中的更改，并提示刷新后可能丢失", async () => {
    await import("../src/todo");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("存储已满", "QuotaExceededError");
    });

    submitTodo("尚未保存的任务");

    expect(document.getElementById("todo-list")?.textContent)
      .toContain("尚未保存的任务");
    expect(document.getElementById("todo-feedback")?.textContent)
      .toContain("刷新后可能丢失");
    expect(localStorage.getItem("todo-v2")).toBeNull();
  });

  it("把含HTML标签的任务作为普通文字显示", async () => {
    await import("../src/todo");
    const content = '<img src=x onerror="alert(1)">';

    submitTodo(content);

    expect(document.querySelector("#todo-list li[data-id] span")?.textContent)
      .toBe(content);
    expect(document.querySelector("#todo-list img")).toBeNull();
  });

  it("页面编号被篡改为指数格式时不切换原任务", async () => {
    const saved = '[{"id":1,"text":"保留状态","completed":false}]';
    localStorage.setItem("todo-v2", saved);
    await import("../src/todo");
    const item = document.querySelector("#todo-list li[data-id]");
    if (!(item instanceof HTMLLIElement)) throw new Error("未找到待办列表项。");

    item.dataset.id = "1e0";
    item.click();

    expect(localStorage.getItem("todo-v2")).toBe(saved);
    expect(item.querySelector("s")).toBeNull();
    expect(item.querySelector("input")?.checked).toBe(false);
  });

  it("点击删除按钮内的文字时只删除目标任务", async () => {
    localStorage.setItem("todo-v2", JSON.stringify([
      { id: 1, text: "需要删除", completed: false },
      { id: 2, text: "需要保留", completed: false },
    ]));
    await import("../src/todo");
    const target = document.querySelector('[data-id="1"] [data-action="delete"] span');
    if (!(target instanceof HTMLElement)) throw new Error("未找到删除按钮文字。");

    target.click();

    expect(document.querySelector('[data-id="1"]')).toBeNull();
    expect(document.querySelector('[data-id="2"]')?.textContent).toContain("需要保留");
    expect(localStorage.getItem("todo-v2"))
      .toBe('[{"id":2,"text":"需要保留","completed":false}]');
  });
});
