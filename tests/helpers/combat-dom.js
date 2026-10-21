import assert from 'node:assert/strict';
function parseAttrs(text) {
  const attrs = new Map();
  for (const match of text.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs.set(match[1], match[2] ?? '');
  return attrs;
}

export function fakeDom() {
  let html = '';
  let nodes = [];
  const rebuild = (value) => {
    html = value;
    nodes = [...value.matchAll(/<(button|select|div|details|summary)([^>]*)>/g)].map((match) => {
      const attrs = parseAttrs(match[2]);
      return {
        attrs,
        events: {},
        style: {},
        disabled: attrs.has('disabled'),
        value: attrs.get('value') ?? '',
        getAttribute(name) { return this.attrs.get(name) ?? null; },
        setAttribute(name, value) { this.attrs.set(name, String(value)); },
        addEventListener(name, fn) { this.events[name] = fn; },
        classList: { add() {}, remove() {} }
      };
    });
  };
  const attrName = (selector) => selector.match(/^\[([^\]]+)\]$/)?.[1] ?? null;
  const findNode = (selector, value = null) => {
    const attr = attrName(selector);
    return nodes.find((candidate) => candidate.attrs.has(attr) && (value == null || candidate.attrs.get(attr) === value));
  };
  return {
    get innerHTML() { return html; },
    set innerHTML(value) { rebuild(value); },
    replaceChildren() { rebuild(''); },
    querySelector(selector) {
      const attr = attrName(selector);
      return attr ? nodes.find((node) => node.attrs.has(attr)) ?? null : null;
    },
    querySelectorAll(selector) {
      const attr = attrName(selector);
      return attr ? nodes.filter((node) => node.attrs.has(attr)) : [];
    },
    node(selector, value = null) {
      const node = findNode(selector, value);
      assert.ok(node, `Missing ${selector}${value == null ? '' : '=' + value}`);
      return node;
    },
    click(selector, value = null) {
      const node = findNode(selector, value);
      assert.ok(node, `Missing ${selector}${value == null ? '' : '=' + value}`);
      assert.equal(typeof node.events.click, 'function', `No click handler for ${selector}`);
      node.events.click({ target: node, preventDefault() {} });
    },
    change(selector, value) {
      const node = findNode(selector);
      assert.ok(node, `Missing ${selector}`);
      assert.equal(typeof node.events.change, 'function', `No change handler for ${selector}`);
      node.value = value;
      node.events.change({ target: node, preventDefault() {} });
    }
  };
}

