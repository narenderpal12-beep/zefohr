---
name: npm-only package management
description: The user's package-manager rule for this project.
---

Use npm only. Do not add pnpm files.

**Why:** the user explicitly requested npm-only project tooling.

**How to apply:** use npm commands and npm-compatible workspace configuration for package and script changes; do not create pnpm lockfiles or workspace files.
