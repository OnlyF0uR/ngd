import { panel } from './panel';

// One locale, currency and time zone for server and browser, so hydration never sees different text.
const date = new Intl.DateTimeFormat(panel.locale, { dateStyle: 'medium', timeZone: panel.timeZone });
const dateTime = new Intl.DateTimeFormat(panel.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: panel.timeZone });
const money = new Intl.NumberFormat(panel.locale, { style: 'currency', currency: panel.currency, maximumFractionDigits: 0 });
const number = new Intl.NumberFormat(panel.locale);

export const formatDate = (iso: string) => date.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
/** Amounts are integers in minor units (cents). */
export const formatMoney = (minor: number) => money.format(minor / 100);
export const formatNumber = (value: number) => number.format(value);
