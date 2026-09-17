# Motion in The Intelligence Lab

Motion supports reading and interaction. It does not run continuously or change the portfolio's visual hierarchy.

- **Hero:** a brief, staggered arrival introduces the role, explanation, and actions. Both roles retain their fixed text. The complete sequence settles in under a second.
- **Reading flow:** headings, project cards, expertise rows, the About composition, Data Lab, and case-study sections enter once per mount as they come into view. Movement is limited to 14px with a 500ms ease. Content is fully visible by default; animation API failure cannot hide it. Filtered-in cards are observed without a global scroll listener.
- **Spatial detail:** the hero distribution and featured preview artwork react to a mouse with at most three degrees of CSS perspective tilt. Captions and project text remain level. Touch/coarse pointers and reduced-motion preferences disable this behavior. There is no WebGL, device-orientation access, particle system, or perpetual render loop.
- **Data Lab:** bar fills and value positions animate using transforms. The control hit areas and chart layout remain fixed, with the existing accessible labels, tooltips, and text summaries kept in sync with the selected dataset.
- **Controls:** small arrow translations, contact underlines, an active navigation marker, and a short mobile-menu entrance clarify available actions. These do not delay navigation.
- **Portrait:** only the surrounding composition enters; the actual photo is not tilted, distorted, zoomed, or recropped.

## Accessibility and performance

CSS honors `prefers-reduced-motion`; JavaScript also listens for changes while the page is open. Active entrance animations are cancelled when the preference changes, the tab becomes hidden, or a user focuses a control inside an entering element. Under reduced motion, chart transforms still represent the actual values, but change instantly.

Animation hooks clean up observers, event handlers, and pending animation frames on navigation/unmount. Pointer updates are scheduled only in response to input and change CSS properties without React re-renders. No dependency was added. Entrance animations release their effects when finished, and there is no blanket `will-change` allocation.

## Editing

- `src/hooks/motion.ts`: entry distance/duration, observation, and maximum tilt.
- `src/styles.css`: `--motion-ease`, `--motion-fast`, `--motion-medium`, hero timing, and control feedback.
- `data-reveal` / `data-reveal-delay`: opt in relevant content; delays are capped at 120ms.
- `tests/motion.spec.ts`: mouse vs touch, live reduced-motion changes, unavailable APIs, stable chart geometry, and keyboard usability.

The larger regression suite still covers routing, project filters, contact/repository links, menus, portrait loading, and responsive overflow. Browser verification uses desktop and mobile emulation in Microsoft Edge; actual device, Safari, and Firefox checks are not implied.
