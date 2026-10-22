from pathlib import Path


def replace_once(path, old, new):
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"test anchor not found in {path}: {old!r}")
    path.write_text(text.replace(old, new, 1))


p = Path('tests/ui/army-selection-panel.test.js')
replace_once(
    p,
    '  assert.match(root.innerHTML, /Select Armies for This Battle/);',
    '  assert.doesNotMatch(root.innerHTML, /Select Armies for This Battle/);'
)

p = Path('tests/ui/tabletop-default-layout.test.js')
replace_once(
    p,
    "test('Tabletop is the authoritative default and classic remains explicit rollback', () => {",
    "test('Tabletop remains the authoritative default without an on-screen layout switch', () => {"
)
replace_once(
    p,
    '  assert.match(shell, /\\?ui=classic/);',
    '  assert.doesNotMatch(shell, /Current layout|Test tabletop layout|\\?ui=classic/);'
)
