# Recovery provenance

This source tree was reconstructed on 2026-10-16 after the original GitHub account became unavailable.

- Runtime source: exact files from the last preserved Cloudflare direct-upload deployment bundle.
- Recovered regression suite: tests that could be reconstructed exactly from the preserved integration patch.
- Current recovered suite: 117 passing Node tests at reconstruction time.
- Prior session reported 969 tests passing in the original working repository. The missing historical tests were not present in the deployment bundle, so they have not been invented or represented as recovered.
- `40K_V2_Step3_Integration.patch` is retained as forensic/reference material.

The GitLab repository created from this bundle becomes the new source-control baseline. Future tests should be added incrementally as features are touched.
