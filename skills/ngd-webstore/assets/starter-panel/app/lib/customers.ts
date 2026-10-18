/**
 * Customer types and constants shared by the server (queries) and the UI (filters, labels).
 * Anything a component imports must live outside *.server.ts modules, or the build refuses it.
 */
export const CUSTOMER_STATUSES = ['active', 'trial', 'overdue', 'churned'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const CUSTOMER_SORTS = ['name', 'company', 'mrr', 'created'] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: CustomerStatus;
  plan: string;
  /** Monthly recurring revenue in cents */
  mrr: number;
  createdAt: string;
};

export type CustomerQuery = { q: string; status: CustomerStatus | ''; sort: CustomerSort; desc: boolean; page: number; pageSize: number };
