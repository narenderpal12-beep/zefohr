---
name: SSR integration pitfalls
description: Non-obvious package-version and server/client integration constraints.
---

When using lottie-react v3, consult its installed type definitions rather than v2 examples: it exports a named component and takes the animation as `src`. Do not treat the module namespace as a React component.

**Why:** The latest installed major version changed both the export and prop API; older default-import/animationData examples cause a runtime error even when loose component casts pass TypeScript.

**How to apply:** Keep the player client-only and lazy, but use the actual installed package contract. Avoid broad casts concealing import mistakes.

Use identical provider and sibling structure for the server-rendered and hydrated tree, including toast viewports.

**Why:** Omitting the toast/provider siblings on the server caused a visible hydration error even though primary page markup was identical.

**How to apply:** Keep shell wrappers in sync across server/client entry points; dynamic routes like robots and sitemap must precede Vite's public-file middleware.
