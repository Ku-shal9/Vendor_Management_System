import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeMode, useTheme } from "../context/ThemeContext.js";

const CYCLE: ThemeMode[] = ["light", "dark", "system"];

function nextMode(current: ThemeMode): ThemeMode {
  const index = CYCLE.indexOf(current);
  return CYCLE[(index + 1) % CYCLE.length];
}

function themeLabel(mode: ThemeMode, resolved: "light" | "dark"): string {
  if (mode === "system") return `System theme (${resolved})`;
  if (mode === "dark") return "Dark theme";
  return "Light theme";
}

export default function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme();

  const Icon = mode === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  const label = themeLabel(mode, resolved);

  return (
    <button
      type="button"
      onClick={() => setMode(nextMode(mode))}
      aria-label={`${label}. Activate to change theme.`}
      title={label}
      className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-border bg-surface-muted text-ink-muted hover:text-ink hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
