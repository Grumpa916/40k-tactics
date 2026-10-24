// Keep a re-rendered dialog usable with a keyboard and preserve its reading place.
export function createDialogLifecycle({ overlay, document = overlay.ownerDocument, onDismiss = () => {}, getReturnFocus = () => null }) {
  let opener = null, dismissible = true;
  const controls = () => [...overlay.querySelectorAll('[data-dialog-key]')].filter(node => !node.disabled && !node.hidden);
  const focus = node => node?.focus?.({ preventScroll: true });
  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    focus(opener?.isConnected && opener !== document.body ? opener : getReturnFocus());
    opener = null;
  }
  function keydown(event) {
    if (overlay.hidden) return;
    if (event.key === 'Escape' && dismissible) { event.preventDefault(); onDismiss(); return; }
    if (event.key !== 'Tab') return;
    const nodes = controls(), active = document.activeElement;
    const first = nodes[0], last = nodes.at(-1);
    if (!nodes.length) { event.preventDefault(); focus(overlay.querySelector('[role="dialog"]')); }
    else if (event.shiftKey && (active === first || !nodes.includes(active))) { event.preventDefault(); focus(last); }
    else if (!event.shiftKey && (active === last || !nodes.includes(active))) { event.preventDefault(); focus(first); }
  }
  overlay.addEventListener('keydown', keydown);
  return {
    rememberOpener(node) { opener = node; },
    render(html, { canDismiss = true } = {}) {
      const wasOpen = !overlay.hidden, active = document.activeElement;
      const key = overlay.contains(active) ? active?.getAttribute?.('data-dialog-key') : null;
      const scroll = wasOpen ? overlay.querySelector('[role="dialog"]')?.scrollTop ?? 0 : 0;
      if (!wasOpen) opener ??= active;
      dismissible = canDismiss;
      overlay.innerHTML = html; overlay.hidden = false;
      const dialog = overlay.querySelector('[role="dialog"]');
      dialog?.setAttribute('tabindex', '-1');
      focus(controls().find(node => key && node.getAttribute('data-dialog-key') === key) ?? controls()[0] ?? dialog);
      if (dialog) dialog.scrollTop = scroll;
    },
    close,
    destroy() { overlay.removeEventListener('keydown', keydown); close(); }
  };
}
