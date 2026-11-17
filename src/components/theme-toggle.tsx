import { useTheme } from "../theme-context";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      id="theme-toggle"
      type="button"
      aria-label="深色模式"
      aria-pressed={theme === "dark"}
      onClick={() =>
        setTheme((current) => (current === "light" ? "dark" : "light"))
      }
    >
      {theme === "light" ? "切换到深色" : "切换到浅色"}
    </button>
  );
}
