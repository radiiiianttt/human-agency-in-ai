# Prototype design system

The current visual theme follows Tanya's black-and-white HUMAN / AGENT experiment cover, supplied November 17, 2026. A light canvas and a continuous black decision/result column express the same contrast through the existing prototype layout.

Shared components live in `components/ui`. `app/design-system.css` defines the component contract; `app/globals.css` defines the base screen layout; `app/monochrome-theme.css`, imported last, defines the current palette, typography, spacing, and responsive presentation. The earlier `industrial-theme.css` is retained as an inactive reference and is not imported.

## Visual foundations

- Canvas: `#f4f4f2`. Main surfaces: white. Primary ink, actions, and inverse surfaces: `#171717`. Grays provide borders, secondary text, and inactive states; there are no chromatic status accents.
- Self-hosted Inter Variable is used for reading and controls. Display titles use bold, tightly spaced uppercase type, reflecting the cover. IBM Plex Mono is reserved for stage numbers, technical labels, structured data, and metadata.
- The small split capsule beside the identity echoes the cover's central boundary. It is decorative CSS with no added interaction or accessible content.
- The desktop board joins Interpret and Assess on white, Policy and Result on black, and State below the white region. Internal rules replace separate card outlines. A 20px outer radius echoes the cover at the scale of an interactive interface.
- Controls use an 8px radius; compact scenario controls and reason badges use 6px. Primary actions are black on light surfaces and white on inverse surfaces. Secondary actions remain visually subordinate.
- Default controls retain a 40px minimum height. The request composer uses 48px (44px in compact desktop windows). Scenario buttons retain the existing 36px size. Mobile inputs use 16px text.

## States and interaction contract

This change affects visual presentation only. Page markup, copy, scenario order, policy, runtime, tools, API behavior, and accessible component semantics are unchanged.

Execute, Confirm, Clarify, Working, and Stopped use the same monochrome palette. Their existing decision text, icons, reasons, and available controls distinguish them. Assessment selections use filled markers and heavier labels; current lifecycle stages use a ring and heavier text.

Inverse tokens are scoped to the Policy and Result panels. Buttons, fields, badges, disabled controls, loading spinners, and keyboard-focus indicators remain legible against black. Focus is a 2px outline with an offset. Invalid fields receive a thicker border. Text selection also adapts to the surface.

Radix Select retains keyboard navigation and typeahead. Radix Tabs retains arrow-key navigation. Radix Dialog retains focus containment, Escape dismissal, scroll locking, and focus return. Trace entries retain native details/summary semantics. Reduced-motion settings suppress component transitions and spinner animation.

## Responsive presentation

The existing breakpoint structure remains: three columns above 1050px; two assessment columns with full-width subsequent stages from 701–1050px; one column at 700px and below. The same DOM and reading order apply at every size. Scenario controls retain horizontal scrolling. Short desktop windows receive compact spacing so the decision chain remains visible. Drawers use the same neutral palette and adapt to narrow screens.

## Source mapping

| Component/foundation | Figma node | Implementation |
| --- | --- | --- |
| Button variants and hover states | `1:85` | `components/ui/button.tsx` |
| Text inputs and focus/disabled states | `2:285` | `components/ui/input.tsx` |
| Textarea and disabled state | `8:268` | `components/ui/textarea.tsx` |
| Select trigger and options | `8:302`, `13:2034` | `components/ui/select.tsx`, Radix Select |
| Tab variants | `6:212` | `components/ui/tabs.tsx`, Radix Tabs |
| Card surface, border, and radius | `6:420` | `components/ui/card.tsx` |
| Dialog title and content | `4:329` | `components/ui/sheet.tsx`, Radix Dialog |
| Collapsible open/closed indicator | `1:55` | `components/ui/collapsible.tsx` |
| Inter heading style | `21:1284` | Self-hosted Inter Variable and heading tokens/styles |

## Verification

Verified November 17, 2026:

- TypeScript check, production build, and all 45 existing policy, world, interpretation, evaluation, and runtime tests passed.
- Browser review covered idle, execute with undo, confirmation and cancellation, clarification and selection, and successful undo. Trace expansion, Escape dismissal with focus return, workspace tabs, and both drawer treatments were checked.
- Visual review at 1440×900, 1280×800, 768×1024, and 390×844; the workspace drawer was also checked at 320×568. No horizontal page overflow was observed at the checked sizes. The complete confirmation view fits within the 1280×800 desktop viewport.
- Runtime and page component code were not edited. API interpretation was not called during this styling pass.
