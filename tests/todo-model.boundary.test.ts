import { describe, expect, it } from "vitest";
import { addTodo, parseTodoId, parseTodos } from "../src/todo-model";
import type { Todo } from "../src/todo-model";

describe("新增待办的编号边界", () => {
  it("允许生成安全整数上限编号", () => {
    const initial: readonly Todo[] = [
      { id: 9007199254740990, text: "已有任务", completed: false },
    ];

    expect(addTodo(initial, "边界任务")).toStrictEqual([
      { id: 9007199254740990, text: "已有任务", completed: false },
      { id: 9007199254740991, text: "边界任务", completed: false },
    ]);
  });

  it("到达上限后回绕，并跳过已经占用的编号", () => {
    const initial: readonly Todo[] = [
      { id: 1, text: "第一项", completed: false },
      { id: 2, text: "第二项", completed: true },
      { id: 9007199254740991, text: "上限任务", completed: false },
    ];

    expect(addTodo(initial, "回绕任务")).toStrictEqual([
      { id: 1, text: "第一项", completed: false },
      { id: 2, text: "第二项", completed: true },
      { id: 9007199254740991, text: "上限任务", completed: false },
      { id: 3, text: "回绕任务", completed: false },
    ]);
  });

  it("允许相同文字的独立任务，使用不同编号区分", () => {
    const initial = addTodo([], "每日阅读");

    expect(addTodo(initial, "每日阅读")).toStrictEqual([
      { id: 1, text: "每日阅读", completed: false },
      { id: 2, text: "每日阅读", completed: false },
    ]);
  });
});

describe("页面任务编号转换", () => {
  it.each([
    { text: "1", expected: 1 },
    { text: "42", expected: 42 },
    { text: "9007199254740991", expected: 9007199254740991 },
  ])("把规范编号 $text 转换为安全整数", ({ text, expected }) => {
    expect(parseTodoId(text)).toBe(expected);
  });

  it.each([
    undefined, "", " ", "0", "-1", "1.5", "1e3", "0x10", "01",
    "+1", "1 ", " 1", "NaN", "Infinity", "9007199254740992", "1a", "1\n",
  ])("拒绝不规范或越界的编号 %j", (text) => {
    expect(parseTodoId(text)).toBeNull();
  });
});

describe("本地待办数据校验", () => {
  it("恢复完整业务字段，丢弃额外字段并隔离原始对象", () => {
    const saved = [
      { id: 1, text: "保留状态", completed: true, extra: "无需恢复" },
    ];

    const result = parseTodos(saved);

    expect(result).toStrictEqual([
      { id: 1, text: "保留状态", completed: true },
    ]);
    expect(result).not.toBe(saved);
    expect(result[0]).not.toBe(saved[0]);
    expect(saved).toStrictEqual([
      { id: 1, text: "保留状态", completed: true, extra: "无需恢复" },
    ]);
  });

  it("允许恢复空数组", () => {
    expect(parseTodos([])).toStrictEqual([]);
  });

  it.each([
    { name: "null", value: null },
    { name: "undefined", value: undefined },
    { name: "对象", value: {} },
    { name: "未解析的JSON字符串", value: "[]" },
    { name: "数字", value: 1 },
  ])("拒绝非数组的$name记录", ({ value }) => {
    expect(() => parseTodos(value)).toThrow(Error);
  });

  it.each([
    { name: "null记录", value: null },
    { name: "缺少字段", value: {} },
    { name: "字符串编号", value: { id: "1", text: "任务", completed: false } },
    { name: "零编号", value: { id: 0, text: "任务", completed: false } },
    { name: "负编号", value: { id: -1, text: "任务", completed: false } },
    { name: "小数编号", value: { id: 1.5, text: "任务", completed: false } },
    { name: "越界编号", value: { id: 9007199254740992, text: "任务", completed: false } },
    { name: "数字文本", value: { id: 1, text: 123, completed: false } },
    { name: "空文本", value: { id: 1, text: "", completed: false } },
    { name: "空白文本", value: { id: 1, text: " \t", completed: false } },
    { name: "字符串状态", value: { id: 1, text: "任务", completed: "false" } },
    { name: "缺少状态", value: { id: 1, text: "任务" } },
    { name: "数组记录", value: [] },
  ])("拒绝包含$name的整批记录", ({ value }) => {
    const saved = [{ id: 2, text: "合法任务", completed: false }, value];

    expect(() => parseTodos(saved)).toThrow(Error);
  });

  it("不同文字使用相同编号时拒绝恢复，避免误切换任务", () => {
    const saved = [
      { id: 1, text: "第一项", completed: false },
      { id: 1, text: "第二项", completed: true },
    ];

    expect(() => parseTodos(saved)).toThrow(Error);
  });
});
