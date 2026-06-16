import type { ChangeEvent } from "react";

export function keepCaretAtEnd(event: ChangeEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  window.requestAnimationFrame(() => {
    if (document.activeElement !== input) return;
    const length = input.value.length;
    input.setSelectionRange(length, length);
  });
}
