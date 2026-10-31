// Preserve the player's place when a phase view refreshes.
export function captureViewContinuity(container) {
  const selectors = ['.shoot-tabletop__control-scroll', '.combat-workspace__scroll'];
  const scroll = selectors.map(selector => [selector, container.querySelector?.(selector)?.scrollTop ?? 0]);
  const more = container.querySelector?.('[data-comparison-more]')?.open;
  const disclosures = [...(container.querySelectorAll?.('[data-view-key]') ?? [])]
    .map(node => [node.getAttribute('data-view-key'), node.open]);
  // Unkeyed menus also need to survive a phase redraw (for example, recording
  // a secondary card). Match by their summary within the current phase view.
  const menuState = new Map();
  for (const node of container.querySelectorAll?.('details') ?? []) {
    if (node.hasAttribute?.('data-view-key')) continue;
    const label = node.querySelector?.(':scope > summary')?.textContent?.trim();
    if (!label) continue;
    const states = menuState.get(label) ?? [];
    states.push(Boolean(node.open));
    menuState.set(label, states);
  }
  const active = container.ownerDocument?.activeElement;
  const focusSelectors = ['[data-weapon]', '[data-target]', '[data-shoot-precision]',
    '[data-shooting-unit-picker]', '[data-fight-weapon]', '[data-fight-target]', '[data-fight-precision]'];
  const focusedControl = active ? focusSelectors.find(selector => container.querySelector?.(selector) === active) : null;
  const focusedTarget = active && [...(container.querySelectorAll?.('[data-advisor-target]') ?? [])].includes(active)
    ? active.getAttribute('data-advisor-target') : null;
  return () => {
    const moreNode = container.querySelector?.('[data-comparison-more]');
    if (moreNode && more !== undefined) moreNode.open = more;
    for (const node of container.querySelectorAll?.('[data-view-key]') ?? []) {
      const previous = disclosures.find(([key]) => key === node.getAttribute('data-view-key'));
      if (previous) node.open = previous[1];
    }
    const menuPositions = new Map();
    for (const node of container.querySelectorAll?.('details') ?? []) {
      if (node.hasAttribute?.('data-view-key')) continue;
      const label = node.querySelector?.(':scope > summary')?.textContent?.trim();
      if (!label) continue;
      const position = menuPositions.get(label) ?? 0;
      menuPositions.set(label, position + 1);
      const previous = menuState.get(label)?.[position];
      if (previous !== undefined) node.open = previous;
    }
    const focusNode = focusedControl ? container.querySelector?.(focusedControl) : focusedTarget !== null
      ? [...(container.querySelectorAll?.('[data-advisor-target]') ?? [])]
        .find(node => node.getAttribute('data-advisor-target') === focusedTarget) : null;
    if (focusNode && !focusNode.disabled) focusNode.focus?.({ preventScroll: true });
    for (const [selector, top] of scroll) {
      const node = container.querySelector?.(selector);
      if (node) node.scrollTop = top;
    }
  };
}
