# Tests — Jardin de demain

## Smoke test

Simple verification that the app serves its main page and contains expected content.

**Run:**

```bash
bash tests/smoke.sh
```

**What it checks:**

1. `index.html` exists
2. `index.html` contains required elements (DOCTYPE, title, brand mark, tools grid)
3. All linked guide pages exist (10 pages)
4. `assets/` directory exists (optional)

**Exit code:**
- `0`: all tests passed
- `1`: one or more tests failed

**Used by:**
- CI pipeline (`tools/ci.mjs`) runs this test after health check
- Local verification before commits
