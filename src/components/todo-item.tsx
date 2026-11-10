import { useState } from "react";
import type { Todo } from "../todo-model";

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onEdit: (id: number, text: string) => boolean;
  onDelete: (id: number) => void;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  if (editing) {
    return (
      <li data-id={todo.id}>
        <form
          className="edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (onEdit(todo.id, draft)) setEditing(false);
          }}
        >
          <input
            aria-label="编辑待办内容"
            aria-describedby="todo-feedback"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" data-action="save">
            保存
          </button>
          <button
            type="button"
            data-action="cancel"
            onClick={() => setEditing(false)}
          >
            取消
          </button>
        </form>
      </li>
    );
  }

  return (
    <li data-id={todo.id} onClick={() => onToggle(todo.id)}>
      <input
        type="checkbox"
        checked={todo.completed}
        aria-label={`切换完成状态：${todo.text}`}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggle(todo.id)}
      />
      {todo.completed ? <s>{todo.text}</s> : <span>{todo.text}</span>}
      <div className="item-actions">
        <button
          type="button"
          data-action="edit"
          aria-label={`编辑待办：${todo.text}`}
          onClick={(event) => {
            event.stopPropagation();
            setDraft(todo.text);
            setEditing(true);
          }}
        >
          编辑
        </button>
        <button
          type="button"
          data-action="delete"
          aria-label={`删除待办：${todo.text}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(todo.id);
          }}
        >
          <span>删除</span>
        </button>
      </div>
    </li>
  );
}
