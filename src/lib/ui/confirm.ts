export function confirmDialog(opts: { title: string; body: string; confirm: string }): Promise<boolean> {
  const dialog = document.querySelector<HTMLDialogElement>("[data-confirm]");
  if (!dialog) return Promise.resolve(window.confirm(opts.title));
  dialog.querySelector("[data-confirm-title]")!.textContent = opts.title;
  dialog.querySelector("[data-confirm-body]")!.textContent = opts.body;
  dialog.querySelector("[data-confirm-ok]")!.textContent = opts.confirm;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
  });
}
