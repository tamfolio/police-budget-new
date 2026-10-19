// Auth
export const AUTH = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  UPDATE_PASSWORD: '/auth/update-password',
  INVITE: '/auth/invite',
}

// Admin
export const ADMIN = {
  PING: '/admin/ping',
  USERS: '/admin/users',
  GET_USER: (id: string) => `/admin/users/${id}`,
  UPDATE_USER: (id: string) => `/admin/users/${id}`,
  DEACTIVATE_USER: (id: string) => `/admin/users/${id}/deactivate`,
}

// Roles & Permissions
export const ROLES = {
  LIST: '/roles',
  CREATE: '/roles',
  GET: (id: string) => `/roles/${id}`,
  UPDATE: (id: string) => `/roles/${id}`,
  DELETE: (id: string) => `/roles/${id}`,
  ASSIGN: (roleId: string) => `/roles/${roleId}/assign`,
  PERMISSIONS: '/roles/permissions',
  CREATE_PERMISSION: '/roles/permissions',
}

// Budget Codes
export const BUDGET_CODES = {
  LIST: '/budget-codes',
  CREATE: '/budget-codes',
  SEED: '/budget-codes/seed-all',
  REFERENCE: '/budget-codes/reference',
  FISCAL_YEAR_STATUS: (year: number) => `/budget-codes/fiscal-years/${year}/status`,
}

// Fund Inflows
export const FUND_INFLOWS = {
  LIST: '/fund-inflows',
  CREATE: '/fund-inflows',
  TOTALS: (fiscalYear: number) => `/fund-inflows/totals/${fiscalYear}`,
  QUEUE_REVIEW: '/fund-inflows/queue/review',
  QUEUE_APPROVAL: '/fund-inflows/queue/approval',
  GET: (id: string) => `/fund-inflows/${id}`,
  UPDATE: (id: string) => `/fund-inflows/${id}`,
  DELETE: (id: string) => `/fund-inflows/${id}`,
  SUBMIT: (id: string) => `/fund-inflows/${id}/submit`,
  REVIEW: (id: string) => `/fund-inflows/${id}/review`,
  APPROVE: (id: string) => `/fund-inflows/${id}/approve`,
  REJECT: (id: string) => `/fund-inflows/${id}/reject`,
  REOPEN: (id: string) => `/fund-inflows/${id}/reopen`,
}

// AIE
export const AIE = {
  LIST: '/aies',
  CREATE: '/aies',
  SEED: '/aies/seed',
  QUEUE_REVIEW: '/aies/queue/review',
  QUEUE_APPROVAL: '/aies/queue/approval',
  TOTALS: (fiscalYear: number) => `/aies/totals/${fiscalYear}`,
  REPORT: '/aies/report',
  GET: (id: string) => `/aies/${id}`,
  UPDATE: (id: string) => `/aies/${id}`,
  DELETE: (id: string) => `/aies/${id}`,
  LINE_ITEMS: (id: string) => `/aies/${id}/line-items`,
  SUBMIT: (id: string) => `/aies/${id}/submit`,
  REVIEW: (id: string) => `/aies/${id}/review`,
  APPROVE: (id: string) => `/aies/${id}/approve`,
  REJECT: (id: string) => `/aies/${id}/reject`,
  REOPEN: (id: string) => `/aies/${id}/reopen`,
  IMPORTS: '/aies/imports',
  IMPORTS_REPLACE: '/aies/imports/replace',
  IMPORTS_LIST: '/aies/imports',
  GET_IMPORT: (importId: string) => `/aies/imports/${importId}`,
  APPROVE_IMPORT: (importId: string) => `/aies/imports/${importId}/approve`,
  REJECT_IMPORT: (importId: string) => `/aies/imports/${importId}/reject`,
  BUDGET_CODE_SUMMARY: (code: string) => `/aies/budget-codes/${code}/summary`,
  BUDGET_CODE_ACTUALS: (code: string) => `/aies/budget-codes/${code}/actuals`,
}

// Distributions
export const DISTRIBUTIONS = {
  LIST: '/distributions',
  CREATE: '/distributions',
  TEMPLATE: '/distributions/template',
  TEMPLATE_CSV: '/distributions/template.csv',
  IMPORT_CSV: '/distributions/import',
  REFERENCE: '/distributions/reference',
  SEED: '/distributions/seed-all',
  UPDATE: (periodId: string) => `/distributions/${periodId}`,
  DELETE: (periodId: string) => `/distributions/${periodId}`,
  SUBMIT: (periodId: string) => `/distributions/${periodId}/submit`,
  REVIEW: (periodId: string) => `/distributions/${periodId}/review`,
  APPROVE: (periodId: string) => `/distributions/${periodId}/approve`,
  RETURN: (periodId: string) => `/distributions/${periodId}/return`,
  AUDIT_TRAIL: (periodId: string) => `/distributions/${periodId}/audit-trail`,
}

// Expenditures
export const EXPENDITURES = {
  LIST: '/expenditures',
  GET: (id: string) => `/expenditures/${id}`,
  CREATE: '/expenditures',
  UPDATE: (id: string) => `/expenditures/${id}`,
  DELETE: (id: string) => `/expenditures/${id}`,
  SUBMIT: (id: string) => `/expenditures/${id}/submit`,
  REVIEW: (id: string) => `/expenditures/${id}/review`,
  APPROVE: (id: string) => `/expenditures/${id}/approve`,
  RETURN: (id: string) => `/expenditures/${id}/return`,
  AUDIT_TRAIL: (id: string) => `/expenditures/${id}/audit-trail`,
}

// Org Structure
export const SCHOOLS = { LIST: '/schools', CREATE: '/schools' }
export const ZONES = { LIST: '/zones', CREATE: '/zones' }
export const FORMATIONS = { LIST: '/formations', CREATE: '/formations' }
export const EXPENDITURE_ITEMS = { LIST: '/expenditure-items', CREATE: '/expenditure-items' }

// Audit
export const AUDIT = {
  HTTP_LOGS: '/audit/http-logs',
  ENTRIES: '/audit/entries',
}

// Capital Budget
export const CAPITAL_BUDGET = {
  LIST: '/capital-budget-items',
  CREATE: '/capital-budget-items',
  IMPORT_PREVIEW: '/capital-budget-items/import/preview',
  IMPORT_COMMIT: '/capital-budget-items/import/commit',
  GET: (id: string) => `/capital-budget-items/${id}`,
  UPDATE: (id: string) => `/capital-budget-items/${id}`,
  DELETE: (id: string) => `/capital-budget-items/${id}`,
}

// Storage
export const STORAGE = {
  PRESIGN: '/storage/presign',
  UPLOAD: '/storage/upload',
  BULK_UPLOAD: '/storage/upload/bulk',
  DOWNLOAD: (key: string) => `/storage/download/${key}`,
  METADATA: (key: string) => `/storage/metadata/${key}`,
  EXISTS: (key: string) => `/storage/exists/${key}`,
  LIST: '/storage/list',
  DELETE: (key: string) => `/storage/${key}`,
  BULK_DELETE: '/storage/bulk',
}

// Repository
export const REPOSITORY = {
  STATS: '/repository/stats',
  TABLES: '/repository/tables',
  EXPORT_TABLE: (table: string) => `/repository/tables/${table}/export`,
  BACKUP: '/repository/backup',
  SYNC: '/repository/sync',
}

// Reports
export const REPORTS = {
  CARDS: '/reports/cards',
  LIST: '/reports',
}

// Budget Proposals
export const BUDGET_PROPOSALS = {
  LIST: '/budget-proposals',
  CREATE: '/budget-proposals',
  GET: (id: string) => `/budget-proposals/${id}`,
  UPDATE: (id: string) => `/budget-proposals/${id}`,
  DELETE: (id: string) => `/budget-proposals/${id}`,
  SUBMIT: (id: string) => `/budget-proposals/${id}/submit`,
  REVIEW: (id: string) => `/budget-proposals/${id}/review`,
  APPROVE: (id: string) => `/budget-proposals/${id}/approve`,
  REJECT: (id: string) => `/budget-proposals/${id}/reject`,
  WORKBOOK_RECONCILIATIONS: (id: string) => `/budget-proposals/${id}/workbook-reconciliations`,
}

// Departments
export const DEPARTMENTS = {
  LIST: '/departments',
  CREATE: '/departments',
  GET: (id: string) => `/departments/${id}`,
  UPDATE: (id: string) => `/departments/${id}`,
  DEACTIVATE: (id: string) => `/departments/${id}/deactivate`,
}

// Dashboard
export const DASHBOARD = {
  CARDS: '/dashboard/cards',
  INFLOW_VS_EXPENDITURE: '/dashboard/inflow-vs-expenditure-chart',
}

// Comparisons
export const COMPARISONS = {
  ZONES: '/comparisons/zones',
  MONTH_OVER_MONTH: '/comparisons/month-over-month',
  BUDGET_VS_ACTUAL: '/comparisons/budget-vs-actual',
}
