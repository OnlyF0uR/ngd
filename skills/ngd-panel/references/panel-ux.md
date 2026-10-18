# Panel UX

Admin and user panels are tools people use every day, often for hours. Good panels feel calm, fast and predictable: the most important work is one click away, nothing jumps while loading, every action confirms itself, and power users can fly with the keyboard. Brand expression is restrained: the theme color marks primary actions, focus and selection, not the furniture.

## Contents
1. App shell
2. Navigation and information architecture
3. Page anatomy
4. Dashboards
5. Data tables and lists
6. Detail views
7. Forms
8. Feedback: loading, success, errors, undo
9. Empty states and onboarding
10. Charts
11. Settings
12. User panels vs admin panels
13. Density, theming and the design system
14. Keyboard and command palette
15. Accessibility
16. Mobile
17. Checklist

## 1. App shell

- **Sidebar** (240–280px) with the logo/workspace switcher at the top, primary navigation, secondary items (settings, help) at the bottom. It collapses to a 64px icon rail (with tooltips) and remembers the choice.
- **Top bar:** page context or breadcrumbs, a search / command-palette trigger ("Search or jump to… ⌘K"), notifications, help, and the user menu (profile, theme, sign out).
- **Content area** with a consistent maximum width for forms and settings, full width for tables and boards.
- The shell is server-rendered and appears instantly; content regions stream in behind skeletons (panel-architecture.md, section 5).

## 2. Navigation and information architecture

- Organise by the user's tasks and objects, not the database. The 3–5 most frequent tasks from discovery get top-level items; at most about seven primary items.
- Show counts where they drive action (open tickets, pending approvals), never vanity counts.
- Active state is unmistakable (filled background or accent bar plus `aria-current="page"`).
- Deep hierarchies get breadcrumbs; sibling sections get tabs inside the page.
- The same object always lives at the same URL, so links can be shared.

## 3. Page anatomy

Every screen follows one pattern, so users never have to re-learn layouts:
1. **Page header:** title, optional one-line description, primary action on the right (one), secondary actions in a menu.
2. **Toolbar** (for lists): search, filters as chips, view switcher, density, export.
3. **Content:** the list, board, form or detail.
4. **Contextual panel** (optional): a right-side drawer for details or quick edit without leaving the list.

## 4. Dashboards

A dashboard answers "what needs my attention?" before "how are we doing?":
1. **Attention first:** tasks, alerts, items waiting on the user (with direct actions).
2. **KPIs:** 4–6 cards with the value, the change against the previous period (with color *and* an arrow/sign), and an optional sparkline. Tabular figures.
3. **One main trend chart** with a date-range picker (presets: 7 days, 30 days, quarter, custom).
4. **Recent activity:** who did what, linked to the objects.
- Each widget loads independently with its own skeleton and its own error state.
- New accounts see an onboarding checklist instead of empty charts.

## 5. Data tables and lists

- **Columns:** the identifying column first (name, title, ID) and sticky on horizontal scroll; numbers right-aligned with tabular figures; dates relative ("3 h ago") with the absolute time on hover; status as pills with text (never color alone).
- **Sorting** on meaningful columns (`aria-sort`), **filtering** through a filter bar with removable chips, **search** with debounce, **pagination** with a page-size choice and "1–25 of 1,240".
- **Row interaction:** click opens the detail (drawer or page); checkboxes select rows; a bulk-action bar appears with the selection count ("3 selected: Assign · Export · Archive").
- **Density:** comfortable (about 52px rows) and compact (about 36px), user-selectable.
- **States:** skeleton rows while loading (the header stays), an empty state that helps (section 9), "No results for these filters" with a clear-filters action, inline error with retry.
- **Saved views** and column visibility for power users.
- **Mobile:** turn rows into cards with the 3–4 most important fields, or allow horizontal scroll with the first column frozen.

## 6. Detail views

- Header with the object's name, key status and primary actions.
- Key facts in a summary block (two or three columns of label/value pairs).
- Tabs for big sections (Overview, Activity, Files, Settings); the activity timeline shows changes with author and time.
- Related objects as compact lists linking onward.
- Editing in place for single fields (click → input → Enter saves, Escape cancels), an edit page or drawer for larger changes.

## 7. Forms

- One column, grouped sections with headings, labels above fields, helper text below, "(optional)" on optional fields.
- Validate on blur and on submit, server-side always; show errors next to fields plus a summary at the top for long forms; focus the first error.
- **Records** (create/edit): explicit Save with a sticky bar that appears when there are unsaved changes ("Unsaved changes · Discard · Save"), guarded against accidental navigation (`useBlocker`).
- **Settings and preferences:** save per field or section automatically, with an inline "Saved" confirmation.
- Keyboard: Enter submits single-line forms, ⌘/Ctrl+Enter submits from a textarea, Escape closes drawers (asking first if there are unsaved changes).
- Disable the submit button and show "Saving…" while pending; never double-submit.
- **Danger zone** for destructive actions at the end of settings, with a confirmation that names the object (type the name to delete a workspace).

## 8. Feedback: loading, success, errors, undo

- **Loading:** skeletons for content, a slim top progress bar for navigations, inline spinners only inside buttons. Never a full-screen blocker.
- **Success:** a toast for actions without a visible result ("Invoice sent"), the visible change itself otherwise. Toasts sit in a polite live region, auto-dismiss after about 5 seconds, pause on hover, and can be dismissed.
- **Undo** for reversible actions (archive, delete-to-trash, bulk moves) instead of a confirmation dialog.
- **Confirmation dialogs** only for irreversible actions; the button names the action ("Delete 3 users"), and the cancel button is the default focus.
- **Errors:** say what failed and what to do; keep the user's input; offer retry.
- **Optimistic UI** for quick toggles and edits, with rollback on failure.

## 9. Empty states and onboarding

An empty screen is an opportunity: explain what will appear here and why it's useful, offer the primary action ("Create your first invoice"), and optionally import or sample data. Use a small illustration or icon consistent with the brand, never a giant sad cloud. A first-run checklist on the dashboard guides new users through setup.

## 10. Charts

- Lazy-load the chart library; keep the initial bundle small.
- Pick the simplest correct chart: lines for trends, bars for comparisons, a single number for a single number. Avoid pie and 3D charts for comparisons.
- Colors from tokens: one series color plus neutrals for context; status colors only for status meaning.
- Every chart has a title, axis labels or units, tooltips, and an accessible alternative (summary text or a data table toggle).
- Respect reduced motion (no animated drawing).

## 11. Settings

Sections as separate pages under one settings layout with side navigation: Profile, Workspace/Organisation, Members and roles, Billing (often a hosted billing portal), Notifications, Integrations, API keys (shown once, then masked; rotate and revoke), Security (sessions, MFA), Data (export, delete).

## 12. User panels vs admin panels

| | User panel (customer portal, account area) | Admin panel (back-office, internal tools) |
|---|---|---|
| Users | Occasional, non-expert | Daily, expert |
| Density | Comfortable, generous spacing | Compact options, more on screen |
| Guidance | Explanations, help links, friendly empty states | Short labels, keyboard shortcuts, bulk actions |
| Brand | Closer to the public site | Calmer, neutral, brand in accents |
| Typical screens | Orders, invoices, subscriptions, profile, support, withdrawal/returns (shops) | Records CRUD, approvals, reporting, audit log, roles |

## 13. Density, theming and the design system

- Reuse the public site's tokens (palette.mjs output), typography and primitives so the panel feels like the same brand; tune for density: base text 14–15px, tighter spacing scale, smaller radii if the public site is very soft.
- Light and dark mode with a system default and a toggle in the user menu (the starter's theme script prevents a flash on load).
- Neutral surfaces carry the UI; the accent marks primary buttons, links, focus, selection and the active nav item.
- Status colors (success, warning, danger, info) come from the tokens and always pair with text or icons.

## 14. Keyboard and command palette

- A command palette (⌘/Ctrl+K) to jump to pages and objects and to run common actions: a dialog with a combobox, results grouped by type, recent items, and keyboard hints.
- Shortcuts for frequent actions (C to create, / to search, G then D to go to the dashboard), listed in a help dialog (?). Never override browser or screen-reader shortcuts; let users turn single-key shortcuts off.
- Lists are navigable with the arrow keys (J/K optional); Enter opens, Escape closes.

## 15. Accessibility

- Focus moves to the page heading on navigation; dialogs and drawers trap focus and restore it on close (native `<dialog>` handles most of this).
- Tables use real table markup with `scope` and `aria-sort`; interactive rows have a real link or button inside.
- Live regions announce async results (toasts, saved states, filter result counts).
- Color is never the only signal (statuses, deltas, validation).
- Every control has an accessible name; icon-only buttons have labels and tooltips.
- WCAG 2.2 specifics: focus not obscured by sticky bars, dragging alternatives (buttons for reordering), target size at least 24×24px (44px on touch-first screens).

## 16. Mobile

- Navigation: a bottom tab bar for the 4–5 main destinations, or a drawer.
- Tables become cards; filters move into a sheet; primary actions sit in a sticky bottom bar.
- Forms are single column with large inputs and correct keyboards.
- Avoid hover-only tooltips and tiny icon buttons.

## 17. Checklist

- [ ] The shell renders instantly; every data region has a matching skeleton and its own error state.
- [ ] Navigation reflects the top tasks; the active state is clear; URLs are shareable.
- [ ] Tables: server-side pagination, sorting and filtering in the URL; bulk actions; empty and no-result states.
- [ ] Forms: server validation, inline errors, unsaved-changes guard, clear saving states.
- [ ] Feedback: toasts with undo for reversible actions; confirmations only for destructive ones.
- [ ] Keyboard: everything reachable; command palette and shortcuts if built; Escape behaves.
- [ ] Light and dark mode both checked; density options if the users are power users.
- [ ] Works on a phone for the tasks people actually do on the go.
