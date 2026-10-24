# iPad Home Screen app

40K Tactics runs in standalone mode from a Home Screen icon. It uses the same
integrated Tabletop app as Safari, without Safari's address bar or tab bar.

## Install and open

1. Open https://grumpa916.github.io/40k-tactics/battle.html in Safari.
2. Tap Share, then Add to Home Screen. Enable **Open as Web App** if offered.
3. Add the icon, then open **40K Tactics** from the Home Screen.
4. Use the iPad in landscape for the map and collapsible phase/advisor panel.

Setup remains available before starting a battle. Seeing setup on a fresh launch
does not mean the classic interface has returned. Portrait and Army Builder
pages remain scrollable. Live landscape play keeps scrolling inside its panels.

## Updates and saved data

This release requires a network connection to load; offline caching is not
enabled. Open the app again after a deployment to load the current files.
There is no service worker pinning an old release. An already-open session is
not forcibly reloaded during a game.

Safari and the installed web app may have separate local saved data. Before
switching, save/export the lists or battle you want to retain. Do not clear
website data or remove an existing installation as a routine update step.

## Device verification

- Launch from the icon: no Safari address bar or tab bar; current Tabletop UI.
- Open or begin a battle: map, right panel and bottom controls fit the usable area.
- Scroll the right panel and collapse/reopen it; select and drag map units.
- Rotate to portrait: content remains reachable; rotate back to landscape.
- Open Army Builder and setup: all fields and navigation can be reached by scrolling.
- Background and reopen: verify saved lists and saved battle access.

Browser chrome removal and iPad safe-area behavior need a physical iPad check;
automated build checks cannot certify those OS-level interactions.
