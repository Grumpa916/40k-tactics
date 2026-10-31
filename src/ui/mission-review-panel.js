export function renderMissionReviewToggle({ visible = false, open = false } = {}) {
  if (!visible) return "";
  return '<li class="battle-phase battle-phase--utility"><button type="button" class="battle-phase__button battle-phase__button--missions" data-toggle-mission-review aria-expanded="' +
    String(open) + '"><strong>Missions</strong><span>Review both armies</span></button></li>';
}

export function renderMissionReviewPanel(summary, { open = false } = {}) {
  const layout = '<style data-mission-review-layout>' +
    '[data-mission-review-overlay] .battle-shell__mission-review-dialog{width:min(1180px,calc(100vw - 24px));max-width:100%;max-height:calc(100dvh - 24px);overflow-x:hidden;}' +
    '[data-mission-review-overlay] .battle-shell__mission-review-body,[data-mission-review-overlay] .battle-mission-summary,[data-mission-review-overlay] .battle-mission-summary__section,[data-mission-review-overlay] .battle-mission-summary__section-content,[data-mission-review-overlay] .battle-mission-summary__player,[data-mission-review-overlay] .battle-mission-summary__detail,[data-mission-review-overlay] .battle-mission-summary__card{box-sizing:border-box;width:100%;max-width:100%;min-width:0;}' +
    '[data-mission-review-overlay] .battle-shell__mission-review-body{overflow-x:hidden;overflow-wrap:anywhere;}' +
    '[data-mission-review-overlay] .battle-mission-summary__section>summary,[data-mission-review-overlay] .battle-mission-summary__player>summary,[data-mission-review-overlay] .battle-mission-summary__card>summary{flex-wrap:wrap;min-width:0;}' +
    '[data-mission-review-overlay] .battle-mission-summary__detail{padding-left:12px;padding-right:12px;}' +
    '@media (max-width:760px),(orientation:portrait){[data-mission-review-overlay] .battle-shell__mission-review-dialog{width:calc(100vw - 16px);max-height:calc(100dvh - 16px);padding:12px;}[data-mission-review-overlay] .battle-mission-summary__detail{padding-left:8px;padding-right:8px;}}' +
    '</style>';
  return '<div class="battle-shell__mission-review"' + (open ? "" : " hidden") + ' data-mission-review-overlay>' +
    layout +
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
