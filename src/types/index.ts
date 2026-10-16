// ─── Common ───────────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface Pagination {
  total: number
  pageSize: number
  pageNumber: number
  totalPages: number
}

export interface PaginatedData<T> {
  items: T[]
  pagination: Pagination
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserRole {
  name: string
  code: string
  permissions: string[]
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  name?: string
  role?: UserRole | string
  department?: string
  isActive?: boolean
  createdAt?: string
  lastLoginAt?: string
  lastLogin?: string   // API returns this field name
}

// Helper to get display name from user object
export const getUserDisplayName = (user: User): string =>
  user.fullName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '—'

// Helper to get role name string
export const getUserRoleName = (user: User): string => {
  if (!user.role) return '—'
  if (typeof user.role === 'string') return user.role
  return user.role.name ?? user.role.code ?? '—'
}

export interface TokenPair {
  token: string
  refreshToken: string
  expiresAt: string
}

export interface LoginResponse extends TokenPair {
  user: User
}

export interface InviteUserRequest {
  email: string
  fullName: string
  roleId?: string
}

// ─── Roles & Permissions ──────────────────────────────────────────────────────

export interface Permission {
  id: string
  code: string
  name: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
  createdAt?: string
}

export interface RoleDetails extends Role {
  permissionDetails: Permission[]
  userCount?: number
}

// ─── Budget Codes ─────────────────────────────────────────────────────────────

export interface BudgetSubItem {
  id: string
  code: string
  name: string
  categoryCode: string
  sort?: number
}

export interface BudgetCategory {
  id: string
  code: string
  name: string
  sort?: number
  subItems: BudgetSubItem[]
}

export interface FiscalYear {
  year: number
  status: 'open' | 'closed'
}

export interface BudgetReference {
  categories: BudgetCategory[]
  fiscalYears: FiscalYear[]
}

// ─── Fund Inflows ─────────────────────────────────────────────────────────────

export type FundInflowStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface FundInflow {
  id: string
  fiscalYear: number
  inflowDate: string
  source: string
  referenceNo?: string
  amount: number
  supportingDocuments?: string[]
  notes?: string
  status: FundInflowStatus
  createdAt: string
  updatedAt: string
  createdBy?: User
  reviewedBy?: User
  approvedBy?: User
  rejectionReason?: string
}

export interface CreateFundInflowPayload {
  fiscalYear: number
  inflowDate: string
  source: string
  referenceNo?: string
  amount: number
  supportingDocuments?: string[]
  notes?: string
}

export interface UpdateFundInflowPayload extends Partial<CreateFundInflowPayload> {}

export interface ReviewPayload {
  notes?: string
}

export interface RejectPayload {
  reason: string
}

export interface GetFundInflowsParams {
  fiscalYear?: number
  source?: string
  status?: FundInflowStatus
  createdById?: string
}

// ─── AIE ──────────────────────────────────────────────────────────────────────

export type AIEStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'

export interface AIEFulfillingProposal {
  id: string
  fiscalYear: number
  departmentId: string
  amount: number
  justification: string
  status: string
  submittedAt?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  lineItemId: string
  createdAt: string
  updatedAt: string
}

export interface AIELineItem {
  id: string
  aieId: string
  itemCodeId: string
  subItemCodeId: string
  subItemLabel: string
  budgetAmount: number
  fulfillingProposal: AIEFulfillingProposal | null
  actualAmountId: string | null
  createdAt: string
  updatedAt: string
}

export interface AIE {
  id: string
  fiscalYear: number
  aieNo: string
  issueDate: string
  expiresOn: string
  recipientUnit: string | null
  totalAmount: number
  lineItems: AIELineItem[]
  status?: string
  notes?: string
}

export interface AIEImport {
  importId: string
  fiscalYear: number
  status: 'pending' | 'approved'
  uploadedAt: string
  uploadedBy?: User
}

export interface CreateAIEPayload {
  fiscalYear: number
  aieNo: string
  issueDate: string
  expiresOn?: string
  recipientUnit: string
  lineItems: { itemCode: string; subItemCode: string; amount: number }[]
  notes?: string
}

// ─── Distributions ────────────────────────────────────────────────────────────

export type DistributionStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'returned'

export interface Zone {
  id: string
  name: string
  code: string
}

export interface Formation {
  id: string
  name: string
  code: string
  zoneId: string
}

export interface School {
  id: string
  name: string
  code: string
}

export interface ExpenditureItem {
  id: string
  name: string
  code: string
}

export interface DistributionLineItem {
  sno: number | null | string
  code: string
  desc: string
  amounts: (number | null)[]
}

export interface DistributionCommand {
  sno: string
  name: string
  snos: string[]
  items: DistributionLineItem[]
  totals: number[]
  provision: number
  provisions: number[]
}

// formations / schools view: sections array
export interface DistributionSection {
  name: string
  items: DistributionLineItem[]
}

// summary view: flat rows
export interface DistributionSummaryRow {
  name: string
  fromDist: number
  allocation: number
}

// Union of all three view shapes returned by GET /distributions?view=...
export interface DistributionPeriod {
  id: string
  label?: string      // present on zone / formations / schools; absent on summary
  columns?: string[]  // present on zone / formations / schools
  data?: Record<string, DistributionCommand[]>  // zone view
  sections?: DistributionSection[]              // formations / schools view
  rows?: DistributionSummaryRow[]               // summary view
}

export interface DistributionAuditEntry {
  action: string
  user: User
  timestamp: string
  notes?: string
}

// ─── Budget Proposals ─────────────────────────────────────────────────────────

export type BudgetProposalStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

export interface BudgetProposalItem {
  id: string
  aieLineItemId: string
  budgetCode: string
  proposedAmount: number
  justification?: string
}

export interface BudgetProposal {
  id: string
  fiscalYear: number
  status: BudgetProposalStatus
  items: BudgetProposalItem[]
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: User
  rejectionReason?: string
}

// ─── Departments ──────────────────────────────────────────────────────────────

export interface Department {
  id: string
  name: string
  code?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateDepartmentPayload {
  name: string
  code?: string
  description?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardCardData {
  label: string
  value: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  fiscalYear?: number
}

export interface InflowVsExpenditurePoint {
  month: string
  inflow: number
  expenditure: number
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportCardAnalytics {
  label: string
  value: number | string
  description?: string
}

export type ReportView = 'monthly-release' | 'line-item' | 'distribution' | 'aie'

// ─── Comparisons ─────────────────────────────────────────────────────────────

export interface ZoneComparisonEntry {
  zone: string
  formation?: string
  periodA?: number
  periodB?: number
  difference?: number
}

export interface MonthOverMonthEntry {
  month: string
  current: number
  previous: number
  change: number
  changePercent: number
}

export interface BudgetVsActualEntry {
  budgetCode: string
  name: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditPerformedBy {
  id: string
  fullName: string
  email: string
}

export interface AuditEntry {
  id: string
  entityType: string
  entityId?: string
  action: string
  performedBy: AuditPerformedBy | null
  changes: Record<string, { old: unknown; new: unknown }> | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export interface PresignedUploadResult {
  uploadUrl: string
  key: string
  expiresAt: string
}

export interface UploadResult {
  key: string
  url: string
  size: number
  mimeType: string
}

export interface ObjectMetadata {
  key: string
  size: number
  mimeType: string
  lastModified: string
}

// ─── Repository ───────────────────────────────────────────────────────────────

export interface RepositoryStats {
  totalRows: number
  totalTables: number
  lastSyncAt?: string
}

export interface RepositoryTableSummary {
  name: string
  rowCount: number
  lastUpdated?: string
}

// ─── Capital Budget ───────────────────────────────────────────────────────────

export type CapitalBudgetItemType = 'ONGOING' | 'NEW'

export interface CapitalBudgetItem {
  id: string
  title: string
  entity: string
  ergCode: string
  description: string
  fiscalYear?: number
  type?: CapitalBudgetItemType
  amountNgn?: number | null
  page?: number | null
  currency?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateCapitalBudgetItemPayload {
  title: string
  entity: string
  ergCode: string
  description: string
  fiscalYear?: number
  type?: CapitalBudgetItemType
  amountNgn?: number | null
  page?: number | null
  currency?: string
}

export interface GetCapitalBudgetItemsParams {
  fiscalYear?: number
  ergCode?: string
  type?: CapitalBudgetItemType
  docPage?: number
  search?: string
  page?: number
  limit?: number
}

export interface CapitalBudgetPreviewRow {
  rowNumber: number
  data: Record<string, unknown>
  valid: boolean
  errors?: string[]
}

export interface CapitalBudgetImportPreview {
  valid: CapitalBudgetPreviewRow[]
  invalid: CapitalBudgetPreviewRow[]
  totalRows: number
  validCount: number
  invalidCount: number
}

// ─── Expenditures ─────────────────────────────────────────────────────────────

export interface ExpenditureView {
  periodId: string
  month: string
  fiscalYear: number
  zone?: string
  formation?: string
  expenditureItem?: string
  amount: number
  status: string
}
