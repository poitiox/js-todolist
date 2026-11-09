import { describe, expect, it } from "vitest";
import { addTodo, toggleTodo } from "../src/todo-model";
import type { Todo } from "../src/todo-model";

describe("新增待办", () => {
  it("在空列表新增未完成任务，并去除首尾空白", () => {
    const initial: readonly Todo[] = Object.freeze([]);

    const result = addTodo(initial, "  完成 TS 重构\t");

    expect(result).toStrictEqual([
      { id: 1, text: "完成 TS 重构", completed: false },
    ]);
    expect(result).not.toBe(initial);
    expect(initial).toStrictEqual([]);
  });

  it("从现有最大编号递增，保留原任务及原列表", () => {
    const initial: readonly Todo[] = Object.freeze([
      Object.freeze({ id: 8, text: "阅读文档", completed: true }),
      Object.freeze({ id: 3, text: "整理笔记", completed: false }),
    ]);

    const result = addTodo(initial, "编写测试");

    expect(result).toStrictEqual([
      { id: 8, text: "阅读文档", completed: true },
      { id: 3, text: "整理笔记", completed: false },
      { id: 9, text: "编写测试", completed: false },
    ]);
    expect(result).not.toBe(initial);
    expect(initial).toStrictEqual([
      { id: 8, text: "阅读文档", completed: true },
      { id: 3, text: "整理笔记", completed: false },
    ]);
  });

  it("连续新增时生成不同编号，并保留第一次新增的结果", () => {
    const first = addTodo([], "第一项任务");

    const second = addTodo(first, "第二项任务");

    expect(second).toStrictEqual([
      { id: 1, text: "第一项任务", completed: false },
      { id: 2, text: "第二项任务", completed: false },
    ]);
    expect(first).toStrictEqual([
      { id: 1, text: "第一项任务", completed: false },
    ]);
  });

  it.each(["", " ", "\t\r\n", "\u3000"])(
    "拒绝空白内容 %j，原列表保持不变",
    (text) => {
      const initial: readonly Todo[] = [
        { id: 1, text: "保留已有任务", completed: false },
      ];

      const result = addTodo(initial, text);

      expect(result).toBe(initial);
      expect(result).toStrictEqual([
        { id: 1, text: "保留已有任务", completed: false },
      ]);
    }
  );

  it.each([
    { name: "null", value: null },
    { name: "undefined", value: undefined },
    { name: "数字", value: 123 },
    { name: "布尔值", value: false },
    { name: "对象", value: { text: "不是字符串" } },
    { name: "数组", value: ["不是字符串"] },
  ])("拒绝$name内容，原列表保持不变", ({ value }) => {
    const initial: readonly Todo[] = [
      { id: 1, text: "保留已有任务", completed: false },
    ];

    const result = addTodo(initial, value);

    expect(result).toBe(initial);
    expect(result).toStrictEqual([
      { id: 1, text: "保留已有任务", completed: false },
    ]);
  });
});

describe("切换待办完成状态", () => {
  it("只把目标任务改为已完成，不修改其他任务或原列表", () => {
    const initial: readonly Todo[] = Object.freeze([
      Object.freeze({ id: 1, text: "完成作业", completed: false }),
      Object.freeze({ id: 2, text: "阅读文档", completed: false }),
    ]);

    const result = toggleTodo(initial, 1);

    expect(result).toStrictEqual([
      { id: 1, text: "完成作业", completed: true },
      { id: 2, text: "阅读文档", completed: false },
    ]);
    expect(result).not.toBe(initial);
    expect(initial).toStrictEqual([
      { id: 1, text: "完成作业", completed: false },
      { id: 2, text: "阅读文档", completed: false },
    ]);
  });

  it("把已完成任务切回未完成，并保留原任务状态", () => {
    const initial: readonly Todo[] = [
      { id: 1, text: "完成作业", completed: true },
    ];

    const result = toggleTodo(initial, 1);

    expect(result).toStrictEqual([
      { id: 1, text: "完成作业", completed: false },
    ]);
    expect(initial).toStrictEqual([
      { id: 1, text: "完成作业", completed: true },
    ]);
  });

  it("连续切换两次后恢复原有业务状态", () => {
    const initial: readonly Todo[] = [
      { id: 1, text: "完成作业", completed: false },
    ];

    const result = toggleTodo(toggleTodo(initial, 1), 1);

    expect(result).toStrictEqual([
      { id: 1, text: "完成作业", completed: false },
    ]);
    expect(initial).toStrictEqual([
      { id: 1, text: "完成作业", completed: false },
    ]);
  });

  it("编号不存在时保留原列表及全部任务状态", () => {
    const initial: readonly Todo[] = [
      { id: 1, text: "保留已有任务", completed: false },
    ];

    const result = toggleTodo(initial, 999);

    expect(result).toBe(initial);
    expect(result).toStrictEqual([
      { id: 1, text: "保留已有任务", completed: false },
    ]);
  });

  it("空列表中切换任务时不新增任务", () => {
    const initial: readonly Todo[] = [];

    const result = toggleTodo(initial, 1);

    expect(result).toBe(initial);
    expect(result).toStrictEqual([]);
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "拒绝非法编号 %s，原列表保持不变",
    (id) => {
      const initial: readonly Todo[] = [
        { id: 1, text: "保留已有任务", completed: false },
      ];

      const result = toggleTodo(initial, id);

      expect(result).toBe(initial);
      expect(result).toStrictEqual([
        { id: 1, text: "保留已有任务", completed: false },
      ]);
    }
  );
});
