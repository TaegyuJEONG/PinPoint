@AGENTS.md

# Design System

**Never use raw Tailwind color names** (`indigo-*`, `emerald-*`, `amber-*`, `orange-*`, `purple-*`, `violet-*`, `blue-*`, `green-*`, `yellow-*`, `red-*` except `destructive`). Use only these semantic tokens:

| Token scale | Semantic meaning | Example usage |
|-------------|-----------------|---------------|
| `brand-*`   | Primary / interactive | buttons, links, active states, focus rings |
| `success-*` | Positive / done states | checkmarks, connected badges, posted status |
| `caution-*` | Warnings / pending / locked | amber-style alerts, private badges, permission warnings |
| `destructive` | Errors / danger | already defined in shadcn theme |
| `slate-*`   | Neutrals | backgrounds, borders, body text, icons |

All token scales run 50–950 and are defined in `src/app/globals.css` under the `@theme` block.

The `text-green-300` used in the code editor textarea (`geo-files-preview.tsx`) is the one intentional exception — it's a terminal/code aesthetic, not a semantic state color.
