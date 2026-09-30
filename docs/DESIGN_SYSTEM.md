# GymApp Design System

GymApp uses a dark-first, iOS-oriented presentation layer. It is intentionally
content-first: hierarchy comes from spacing, typography, translucent surface
steps, and restrained borders rather than decorative gradients or heavy
shadows.

## Source Of Truth

The mobile tokens live in `apps/mobile/src/design/theme.ts`. Screens and shared
components should consume semantic tokens instead of introducing local color,
spacing, radius, or typography values.

Reusable primitives are exported from `apps/mobile/src/design/components`:

- `AppScreen` for safe-area-aware screen layout
- `AppCard` for standard and raised surfaces
- `AppButton` for primary, secondary, ghost, and destructive commands
- `AppTextField` for labeled accessible input fields
- `AppIcon` for the single Ionicons icon family
- `ProgressBar`, `SectionHeader`, `StatusPill`, and `EmptyState`

## Color Semantics

- `background` and `backgroundElevated` create the near-black app canvas.
- `surfaceGlass`, `surfaceElevated`, `surfaceInteractive`, `surfaceSelected`,
  and `surfaceNavigation` establish semantic depth for cards, controls,
  selection, and the tab bar. The legacy `surface` aliases remain for feature
  compatibility and resolve to the same translucent graphite system.
- Standard cards use low-alpha graphite with a hairline highlight. Raised
  surfaces are more opaque, while selection uses a subtle accent tint plus a
  visible selected state. Color is not used as the sole state indicator.
- `textPrimary`, `textSecondary`, and `textMuted` define readable hierarchy.
- Mint remains GymApp's primary product and nutrition accent. It marks primary
  actions, active navigation, and nutrition progress.
- Blue/cyan identifies weight and informational data; violet identifies
  analytics and consistency. Carbohydrate uses cyan and fat uses soft violet
  so compact macro cards are distinguishable without implying good or bad.
- These accent families include foreground, muted, and very low-alpha tint
  tokens.
  Most pixels remain neutral; color is reserved for focal metrics, icons,
  selected controls, progress, and occasional tinted feature surfaces.
- `success`, `warning`, `danger`, and `information` are semantic states with
  matching muted backgrounds. They are not decorative colors.

Over-target nutrition is an attention state, not a failure state. Progress
bars can use the warm warning color while the copy remains calm, for example
`115 kcal over target`. Actual errors and destructive actions use red.

## Typography And Layout

System font typography is organized as display, screen title, section title,
card title, body, secondary, caption, micro-label, and metric styles. Numeric
nutrition, weight, streak, and consistency values use the stronger display or
metric styles so they are easy to scan.

The spacing scale is `4, 8, 12, 16, 20, 24, 32, 40`. Card radius is 8 points
or less; only compact segmented controls and status pills use capsule radii.
Standard interactive controls are at least 44 points high, with regular
buttons and inputs at 52 points.

## Navigation

The authenticated app uses a translucent inset bottom tab bar with four durable primary
destinations: Today, Diary, Progress, and More. Food search, scanning, manual
food, reminders, saved meals, onboarding, and goal editing are focused flows
outside the persistent tab bar. Main tab screens reserve bottom space for the
bar and respect safe areas. The navigation surface uses native RGBA compositing
and a restrained shadow instead of a blur dependency, preserving the same
rendering and performance profile in the existing iOS development client.

## Accessibility

Controls use native button roles, descriptive labels where text is not visible,
and selected/disabled/busy state where applicable. Provider and nutrition
source labels remain visible. Calendar states use both text/icons and color:
tracked days show a checkmark, untracked days are neutral, and future days are
subdued. Progress charts expose an accessible textual summary and never
fabricate data points.

The weight chart uses ordinary React Native views for its line segments and
recorded points. It has no native chart or SVG bridge dependency, preserving
the same rendering path in the iOS development client and production builds.

Text respects React Native system scaling. Narrow layouts avoid fixed
three-column minimum widths: macro cards can shrink and custom-food nutrition
fields wrap when necessary.

## Feedback And Motion

Press feedback is a restrained opacity and scale change. Motion tokens document quick,
standard, and deliberate timings for future animation use; no decorative
animation is required for a workflow to be understandable. Existing haptic
feedback is retained only for meaningful successful actions, such as saving a
weight check-in and scanner detection. Reduced-motion handling remains in the
scanner flow.

## Adding UI

Prefer extending a shared primitive when a pattern recurs across screens. Keep
business logic in features/services/hooks and let the design layer own only
presentation. Any new screen must handle loading, empty, error, and success
states as applicable without exposing provider, database, or authentication
diagnostics to production users.
