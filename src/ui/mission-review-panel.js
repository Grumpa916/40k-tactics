export function renderMissionReviewToggle({ visible = false, open = false } = {}) {
  if (!visible) return "";
  return '<li class="battle-phase battle-phase--utility"><button type="button" class="battle-phase__button battle-phase__button--missions" data-toggle-mission-review aria-expanded="' +
    String(open) + '"><strong>Missions</strong><span>Review both armies</span></button></li>';
}

export function renderMissionReviewPanel(summary, { open = false } = {}) {
  return '<div class="battle-shell__mission-review"' + (open ? "" : " hidden") + ' data-mission-review-overlay>' +
    '<section class="battle-shell__mission-review-dialog" role="dialog" aria-modal="true" aria-labelledby="battle-mission-review-title">' +
    '<header class="battle-shell__mission-review-heading"><h2 id="battle-mission-review-title">Mission review</h2>' +
    '<button type="button" data-close-mission-review aria-label="Close mission review">Close</button></header>' +
    '<div class="battle-shell__mission-review-body" data-battle-mission-summary-host>' + summary + '</div>' +
    '</section></div>';
}

export function bindMissionReviewPanel(container, { open = false, onOpenChange = () => {} } = {}) {
  let isOpen = open;
  function setOpen(value) {
    isOpen = Boolean(value);
    const overlay = container.querySelector?.("[data-mission-review-overlay]");
    if (overlay) overlay.hidden = !isOpen;
    container.querySelector?.("[data-toggle-mission-review]")?.setAttribute?.("aria-expanded", String(isOpen));
    if (isOpen) container.querySelector?.("[data-close-mission-review]")?.focus?.();
    else container.querySelector?.("[data-toggle-mission-review]")?.focus?.();
    onOpenChange(isOpen);
  }
  function handleClick(event) {
    const toggle = event.target?.closest?.("[data-toggle-mission-review]");
    const close = event.target?.closest?.("[data-close-mission-review]");
    const overlay = container.querySelector?.("[data-mission-review-overlay]");
    if (!overlay || (!toggle && !close && event.target !== overlay)) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    setOpen(Boolean(toggle) && !isOpen);
  }
  function handleKeydown(event) {
    if (event.key !== "Escape" || !isOpen) return;
    event.preventDefault?.();
    setOpen(false);
  }
  container.addEventListener?.("click", handleClick);
  container.addEventListener?.("keydown", handleKeydown);
  return () => {
    container.removeEventListener?.("click", handleClick);
    container.removeEventListener?.("keydown", handleKeydown);
  };
}
