// Preserve the player's place when a phase view refreshes.
export function captureViewContinuity(container) {
  const selectors = ['.shoot-tabletop__control-scroll', '.combat-workspace__scroll'];
  const scroll = selectors.map(selector => [selector, container.querySelector?.(selector)?.scrollTop ?? 0]);
  const more = container.querySelector?.('[data-comparison-more]')?.open;
  return () => {
    const moreNode = container.querySelector?.('[data-comparison-more]');
    if (moreNode && more !== undefined) moreNode.open = more;
    for (const [selector, top] of scroll) {
      const node = container.querySelector?.(selector);
      if (node) node.scrollTop = top;
    }
  };
}
