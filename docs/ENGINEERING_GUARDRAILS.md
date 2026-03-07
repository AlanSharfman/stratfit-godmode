# STRATFIT Engineering Guardrails

## Product Stance

- 3D is the standard.
- Reduced 3D is the safety net.
- 2D is the emergency fallback.

The product should strongly prefer 3D rendering. We only move to reduced 3D or fallback 2D when a device is unstable, unsupported, or repeatedly loses graphics context.

## Automation Policy

The repository is protected by:

- CI checks for `typecheck`, `lint`, `test`, and `build`
- browser smoke coverage for app boot, `Initiate -> Position`, `Compare`, and AI/network failure handling
- terrain render smoke coverage
- Husky pre-commit checks for staged linting and staged TypeScript validation
- optional pre-push tests

## Runtime Diagnostics

Diagnostics are mounted at app startup and track:

- terrain failures
- graphics context loss and restore events
- AI request failures
- network request failures

In development, diagnostics also log to the console so failures are visible immediately.

## Hook Policy

Hooks are intentionally lightweight:

- `pre-commit` stays fast by linting only staged files and typechecking only staged TypeScript files
- `pre-push` runs the test suite, but can be skipped with `STRATFIT_SKIP_PREPUSH=1` when necessary

## Current Intent

These guardrails are designed to catch regressions early without changing terrain behavior or slowing normal development work more than necessary.
