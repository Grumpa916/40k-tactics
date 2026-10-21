# Combined deployment workspace

The default pre-game flow is Select Armies → Prepare Game (missions and layout) → Deploy & Begin. The last screen combines both armies' map placement, reserves, transport assignments, attacker/defender and first-player results. Terrain and secondary choices remain available from this workspace. The tabletop setup order is a reference, not ten app confirmations.

Existing actual positions take precedence over planning positions. Entering the workspace imports valid planned positions. Units without a position appear as dashed staging markers and still need placement or reserve assignment. Moving a unit into reserves removes its marker; returning it restores its last placed position. Attached leaders follow their bodyguard. Embarked passengers remain off-map and count toward reserve totals when their carrier is reserved.

Begin battle validates missing roles, secondary modes/Fixed choices, unit assignments and reserve reviews, then atomically enters Round 1 Command for the recorded first player. The final button records tabletop deployment/redeployment/pre-battle review. An error leaves the setup state intact. No per-checkpoint confirmations are fabricated, and the previous guided controller remains available via `guidedOrder: true` for compatibility.

Implementation is split between `deployment-workspace` rules and transitions, the `deploy-begin` view/controller and CSS, and a small `live-preparation-screen` router. Existing map interaction and secondary/terrain screens are reused.

Validation: engine coverage includes saved-state migration, reserve/field restoration after reload, attached leaders and passengers, missing/unknown data, and opponent-first entry. UI coverage exercises default routing, assignment controls, reference opening/closing, Fixed choices during deployment, and listener cleanup. Physical iPad layout and drag testing remains a manual acceptance check.
