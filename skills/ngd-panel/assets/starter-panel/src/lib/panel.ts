import { site } from './site';

/**
 * Panel facts and interface text: navigation, formats and labels change here, not in components.
 * Translate `ui` into the panel's language.
 */
export const panel = {
  name: site.name,
  home: '/app' as const,
  locale: 'en-GB',
  currency: 'EUR',
  /** Dates render in this zone on the server and in the browser, so both produce the same text. */
  timeZone: 'Europe/Amsterdam',
  /** `to` is type-checked against the routes; `exact` marks it current only on that exact path */
  nav: [
    { label: 'Overview', to: '/app', icon: 'grid', exact: true },
    { label: 'Customers', to: '/app/customers', icon: 'users', exact: false },
  ],
  ui: {
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    panelNav: 'Panel',
    toggleTheme: 'Switch between light and dark',
    loading: 'Loading',
    overview: 'Overview',
    overviewIntro: 'What needs attention today.',
    keyFigures: 'Key figures',
    kpis: { mrr: 'Monthly revenue', active: 'Active customers', trials: 'Trials', overdue: 'Overdue payments' },
    recentActivity: 'Recent activity',
    viewAll: 'View all',
    customers: 'Customers',
    customersIntro: 'Everyone with an account, newest first.',
    search: 'Search',
    searchPlaceholder: 'Name, company or email',
    status: 'Status',
    allStatuses: 'All statuses',
    apply: 'Apply',
    clearFilters: 'Clear filters',
    statuses: { active: 'Active', trial: 'Trial', overdue: 'Overdue', churned: 'Churned' },
    columns: { name: 'Name', company: 'Company', status: 'Status', plan: 'Plan', mrr: 'MRR', created: 'Customer since' },
    customersTable: 'Customers',
    noCustomersTitle: 'No customers yet',
    noCustomersText: 'Customers appear here as soon as the first one signs up.',
    noResultsTitle: 'No customers match these filters',
    noResultsText: 'Try another search term or clear the filters.',
    showing: '{from}–{to} of {total}',
    pagination: 'Pages',
    previous: 'Previous',
    next: 'Next',
    widgetError: "This part couldn't be loaded.",
    retry: 'Try again',
    errorTitle: 'Something went wrong',
    errorText: 'Try again in a moment. If it keeps happening, contact support.',
    notFoundTitle: 'Not found',
    notFoundText: "This page or record doesn't exist, or you don't have access to it.",
    forbiddenTitle: 'No access',
    forbiddenText: "Your role doesn't allow this. Ask an owner for access.",
    backToOverview: 'Back to the overview',
    signInTitle: 'Sign in',
    signInNotConfigured: "Sign-in hasn't been set up yet, so the panel stays closed. Add authentication to open it.",
  },
} as const;

export type PanelIcon = (typeof panel.nav)[number]['icon'];

/** Every panel page's `head`: a title plus noindex (the layout's X-Robots-Tag header says the same). */
export function panelHead(title: string) {
  return { meta: [{ title: `${title} · ${panel.name}` }, { name: 'robots', content: 'noindex, nofollow' }] };
}

export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
