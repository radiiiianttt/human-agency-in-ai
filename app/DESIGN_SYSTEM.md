# Prototype design system

The shared component foundation comes from the supplied [shadcn/ui community Figma file](https://www.figma.com/design/PneSnj5ZWVlKIsljIHRbdK/-shadcn-ui---Design-System--Community-?node-id=1-22). The current visual skin follows Tanya's industrial interface reference supplied on November 7, 2026, with the explicit constraints to preserve the existing layout and elements and replace its cyan accent with action-specific colors.
This is a local React/CSS adaptation, rather than a claim that the latest shadcn CLI defaults match this older file. Shared components live in `components/ui`; base semantic tokens and component states live in `app/design-system.css`. Screen layout belongs in `app/globals.css`. The styling-only industrial overrides live in `app/industrial-theme.css`, loaded last.

## Current visual theme

- True-black and neutral charcoal surfaces without a green tint, subtle scan-line texture, square corners, inset dark fields, fine borders, and tab-like treatments on the existing stage headings. Native browser controls use the dark color scheme.
- Self-hosted IBM Plex Mono for technical labels, controls, and structured data. Inter remains on prose, reason labels, result summaries, and display titles to retain legibility and the existing wrapping.
- Action controls have explicit hierarchy: Undo uses the Execute green, clarification choices and Continue use violet, and confirmation CTAs stay black with an amber border. Run has a stronger neutral border; Cancel and secondary controls remain neutral. Hover, pressed, disabled, loading, and keyboard-focus behaviors come from the shared components. Assessment markers, completed state markers, chevrons, secondary controls, and trace content have contrasting dark-theme treatments.
- The existing policy title and current lifecycle marker carry the action color: Execute uses green, Clarify violet, Confirm amber, and Stopped muted red. No global cyan accent is used. Foreground/background pairs exceed 4.5:1 contrast.
- No new markup, controls, sidebar, navigation, illustration, or content was introduced. Panel order, grid columns, spacing, responsive breakpoints, runtime, and policy are unchanged.

The base Figma values below describe the underlying component contract; the industrial stylesheet overrides visual tokens and typography without replacing the components.

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

## Foundation

- Inter is bundled through `@fontsource-variable/inter`; it is no longer only a fallback font name.
- Default button: 40px height, 14px/24px medium label, 16px horizontal inset, 6px radius, no arbitrary shadow.
- Primary: Slate 900 → Slate 700 on hover. Destructive: Red 500 → Red 600 on hover. Outline: white with Slate 200 border → Slate 100 on hover. Secondary (called “subtle” in Figma): Slate 100 → Slate 200. Ghost: transparent → Slate 100. Link: underline on hover.
- Fields: white, Slate 300 border, Slate 400 placeholder/ring, 6px radius; disabled opacity 50%. Default text input uses 16px/24px; textarea uses 14px/20px.
- Tabs: Slate 100 track, 3px trigger radius, white selected tab, 14px/20px medium labels.
- The Figma spinner, checkmark, and chevrons are stored locally in `public/design-system`; there are no temporary Figma URLs in the application.

## States and behavior

All action buttons use `Button`, with explicit `type="submit"` only inside submit flows. It forwards native button attributes and refs, and provides default, hover, pressed, keyboard focus, disabled, and loading states. Loading disables repeat submissions, retains the accessible label, and sets `aria-busy`. Disabled controls do not acquire enabled hover/pressed treatments.

The prototype maps Run, Continue, Undo, and every Confirm action CTA to the shared primary variant; cancellation and clarification choices to outline; debug follow-up to secondary; and request cancellation/close to ghost. The current theme applies semantic color to Undo and clarification controls while keeping confirmation CTAs black. Scenario selection uses `aria-pressed` and the primary variant, not a one-off active style. The destructive variant remains available in the shared component but is not used for confirmation CTAs.

The scenario menu supports keyboard navigation/typeahead with Radix Select. Workspace tabs use tab/tabpanel semantics and arrow-key navigation. Drawers use Radix Dialog for modal focus containment, Escape/outside dismissal, scroll locking, and focus return to the opening button. Trace expanders retain native `details` keyboard behavior. Reduced-motion preferences suppress component animations.

## Deliberate product extensions

The reference does not define this experiment's five-panel diagram, assessment scales, lifecycle, status colors, trace source markers, or reason badges. Those remain product-specific compositions backed by shared color/surface/radius tokens. Compact diagram annotations retain their existing sizes. The System trace drawer uses the same light surface and borders as the workspace drawer, Inter for event titles and descriptions, muted metadata, and a subtle surface with monospace text for structured data.

To preserve the approved responsive layout, scenario prompts use a documented 36px small button size, icon buttons use the reference's 32px square size, and the one-line request composer uses a compact 40px textarea. The default textarea retains the reference's 80px minimum. Panel padding adapts to window height rather than forcing Figma's standalone example dimensions onto the screen.

The Figma button set does not specify a separate pressed or keyboard-focus variant. Pressed states use the next stronger color in the same palette; keyboard focus uses the input reference's Slate 400 ring with a 2px offset. Trace expanders inset that ring to keep it visible inside their scrolling container. These are explicit interaction extensions, not inferred Figma variants. Validation borders use the destructive token. The scenario select intentionally resets to its placeholder after choosing an action, preserving the prototype's existing action-picker behavior.

## Verification

Run `npm run typecheck`, `npm run build`, and the existing policy/runtime tests. Browser verification should cover button normal/hover/pressed/focus/disabled/loading states; scenario selection and menu keyboard controls; approval, cancellation, clarification, undo and blocked undo; both drawers and focus return; and desktop/tablet/phone overflow. Interpretation loading can be checked with an intercepted local API response, without calling a model.

Verified on November 7, 2026: all six button variants' resting/hover/pressed/disabled/focus styling; default 40px button geometry and loaded Inter; Run and Continue loading states with intercepted API responses; reduced motion; keyboard select and tabs; drawer focus containment and return; native keyboard trace expansion; and five scenario states at ten viewport sizes (320–1440px wide). Existing policy/runtime tests: 45 passed. TypeScript checking and an isolated production build passed.

Industrial restyling: compared Ready, Execute, Confirm, Clarify, and blocked-undo states before and after at 1280×700, 1440×900, 390×844, and 320×568. All 20 comparisons retain identical DOM structure and header, request area, board, and panel rectangles. The semantic title colors have contrast ratios of 7.70:1 (Execute), 6.50:1 (Clarify), 5.78:1 (Confirm), and 5.09:1 (Stopped).
