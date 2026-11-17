export function announce(message: string): void {
  const el = document.querySelector<HTMLElement>("[data-announcer]");
  if (!el) return;
  el.textContent = "";
  window.setTimeout(() => (el.textContent = message), 30);
}
