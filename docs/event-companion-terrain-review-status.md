# Event Companion terrain map coverage

Current scope: all 45 layouts on Event Companion Pages 9–53.

Pages 9–17 have a fresh PDF source audit, independent candidate/production data,
explicit source transforms, canonical and mirror checks, and the shared boxed
callouts with tap-to-focus. Page 18 now includes the previously restricted
10-inch mirror on T5. No new printed distance has been calculated.

## Current verification

- 826 Node tests pass.
- 45 exact preview SVG outputs checked for bounds and focused-callout overlap.
- 102 SVG views rendered; Pages 9–17 compared side by side with the official PDF
  and separate canonical/complete layers.
- 2,385 actual focus-handler assertions pass with a mock DOM across all 45 pages.
- Browser access remains blocked in the agent environment. These are source,
  rendered-output, and mock-DOM checks, not new Safari touch verification.
- The user accepted the prior preview on 15 October 2026. Pages 9–17 were then
  re-audited under the user’s explicit instruction to bring every map to the same
  standard; those revised pages and Page 18’s additional mirror await final
  user visual acceptance. Pages 19–53 retain the accepted layers.

## Source details

The fresh audit uses printed labels and PDF vector line endpoints, not V2-derived
measurements. It declares one `flipX` source alignment for Pages 9–17 and transforms
reference edges with the points. Four source-defined edge points (two on Page 11,
one each on Pages 14 and 17) are retained without moving them to a different V2
corner. Audited source paths remain explicit exceptions to own-footprint checks.

The lower-left white 4-inch pipeline guide on Page 17 is visible in the rendered
source image but absent from the extracted vector guide set. Its earlier source
transcription was checked visually and converted to the common source frame.
The audit records this separately. Deployment-only dimensions remain excluded.

Mirrors reuse confirmed values unchanged and apply reciprocal terrain mappings.
Canonical source guides remain unchanged when mirrors are enabled. Where the
source already labels both counterparts, the mirror layer does not duplicate them.

## Coverage by page

| Page | Layout | Canonical guides | Mirror guides | Terrain coverage | User review |
| --- | --- | ---: | ---: | --- | --- |
| 9 | A | 17 | 14 | 16/16 | Revised preview ready |
| 10 | B | 20 | 17 | 16/16 | Revised preview ready |
| 11 | C | 18 | 15 | 16/16 | Revised preview ready |
| 12 | A | 18 | 18 | 16/16 | Revised preview ready |
| 13 | B | 20 | 20 | 16/16 | Revised preview ready |
| 14 | C | 19 | 19 | 16/16 | Revised preview ready |
| 15 | A | 21 | 21 | 16/16 | Revised preview ready |
| 16 | B | 19 | 16 | 16/16 | Revised preview ready |
| 17 | C | 20 | 20 | 16/16 | Revised preview ready |
| 18 | A | 17 | 14 | 16/16 | Revised preview ready |
| 19 | B | 20 | 20 | 16/16 | Prior preview accepted |
| 20 | C | 19 | 19 | 16/16 | Prior preview accepted |
| 21 | A | 18 | 18 | 16/16 | Prior preview accepted |
| 22 | B | 18 | 18 | 16/16 | Prior preview accepted |
| 23 | C | 18 | 18 | 16/16 | Prior preview accepted |
| 24 | A | 19 | 19 | 16/16 | Prior preview accepted |
| 25 | B | 20 | 20 | 16/16 | Prior preview accepted |
| 26 | C | 22 | 22 | 16/16 | Prior preview accepted |
| 27 | A | 20 | 20 | 16/16 | Prior preview accepted |
| 28 | B | 19 | 19 | 16/16 | Prior preview accepted |
| 29 | C | 20 | 20 | 16/16 | Prior preview accepted |
| 30 | A | 19 | 19 | 16/16 | Prior preview accepted |
| 31 | B | 18 | 18 | 16/16 | Prior preview accepted |
| 32 | C | 19 | 19 | 16/16 | Prior preview accepted |
| 33 | A | 20 | 20 | 16/16 | Prior preview accepted |
| 34 | B | 20 | 20 | 16/16 | Prior preview accepted |
| 35 | C | 19 | 19 | 16/16 | Prior preview accepted |
| 36 | A | 16 | 16 | 16/16 | Prior preview accepted |
| 37 | B | 19 | 19 | 16/16 | Prior preview accepted |
| 38 | C | 18 | 15 | 16/16 | Prior preview accepted |
| 39 | A | 17 | 17 | 16/16 | Prior preview accepted |
| 40 | B | 22 | 22 | 16/16 | Prior preview accepted |
| 41 | C | 18 | 18 | 16/16 | Prior preview accepted |
| 42 | A | 22 | 19 | 16/16 | Prior preview accepted |
| 43 | B | 22 | 22 | 16/16 | Prior preview accepted |
| 44 | C | 19 | 16 | 16/16 | Prior preview accepted |
| 45 | A | 18 | 18 | 16/16 | Prior preview accepted |
| 46 | B | 16 | 16 | 16/16 | Prior preview accepted |
| 47 | C | 20 | 20 | 16/16 | Prior preview accepted |
| 48 | A | 16 | 16 | 16/16 | Prior preview accepted |
| 49 | B | 19 | 16 | 16/16 | Prior preview accepted |
| 50 | C | 18 | 15 | 16/16 | Prior preview accepted |
| 51 | A | 22 | 19 | 16/16 | Prior preview accepted |
| 52 | B | 22 | 22 | 16/16 | Prior preview accepted |
| 53 | C | 19 | 19 | 16/16 | Prior preview accepted |

PR #282 remains draft and unmerged. Step 3 setup-flow integration is the next
separate implementation step after map development.
