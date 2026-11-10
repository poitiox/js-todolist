import { useRef, useState } from "react";

export interface TodoFormProps {
  onAdd: (text: string) => boolean;
}

export function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      id="todo-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (onAdd(text)) setText("");
        inputRef.current?.focus();
      }}
    >
      <label htmlFor="todo-input">待办事项</label>
      <div className="form-controls">
        <input
          ref={inputRef}
          id="todo-input"
          type="text"
          autoComplete="off"
          aria-describedby="todo-feedback"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit">添加</button>
      </div>
    </form>
  );
}
