import { useTheme } from "@/contexts/ThemeContext";

// ponytail: shared by Navbar + auth pages (2+ users)
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="iconbtn" onClick={toggle} aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
      <span key={theme} className="spin-in">{theme === "light" ? "☾" : "☀"}</span>
    </button>
  );
}
