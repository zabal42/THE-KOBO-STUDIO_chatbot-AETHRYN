<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- STA:BEGIN (lo gestiona install.sh: no lo edites a mano) -->
# AGENTS.md

> Project instructions for Codex and tools that read `AGENTS.md`.
> ShapingTheAxe lives in the `STA/` folder at the project root; all paths below
> are relative to the project root.

## ShapingTheAxe — framework (governs how all material work is done)

Before material work, read and follow `STA/ShapingTheAxe.md`.
`STA/SHAPING_THE_AXE_BRAIN_SPEC.md` is the semantic authority.
Use `STA/prompts/activate.md` for the activation receipt and fallback behavior.
Use the minimum preparation justified by risk; do not add universal approval gates.
Do not load anything under `STA/incubator/` unless the user explicitly authorizes a controlled evaluation.
If a required file is unavailable, say so instead of claiming activation.

## Git commits

When committing, do not add the `Co-Authored-By: Claude` trailer, nor the blank
line that separates it from the rest of the message body.
<!-- STA:END -->
