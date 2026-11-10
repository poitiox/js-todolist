import { TodoItem } from "./todo-item";
import type { TodoItemProps } from "./todo-item";
import type { Todo } from "../todo-model";

export interface TodoListProps extends Omit<TodoItemProps, "todo"> {
  todos: readonly Todo[];
  emptyMessage: string;
}

export function TodoList({ todos, emptyMessage, ...events }: TodoListProps) {
  return (
    <ul id="todo-list">
      {todos.length === 0 ? (
        <li>{emptyMessage}</li>
      ) : (
        todos.map((todo) => <TodoItem key={todo.id} todo={todo} {...events} />)
      )}
    </ul>
  );
}
