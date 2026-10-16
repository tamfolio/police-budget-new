# NPF Budget Management System API — Endpoints

Base URL: `https://api.pabdigitalsystem.com`
Docs: https://api.pabdigitalsystem.com/docs/
OpenAPI spec: `GET /docs/openapi.json`
Version: 0.1.0 (OAS 3.0)

API documentation for the Nigeria Police Force Budget Management System backend.

## System — Service health and API metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API, database, and Redis health |
| GET | `/docs/openapi.json` | Get the OpenAPI specification |
| GET | `/docs` | Open Swagger UI |

## Authentication — Authentication and user session endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/invite` | Invite one or more users |
| POST | `/auth/login` | Log in with email and password |
| POST | `/auth/update-password` | Update the authenticated user's password |
| POST | `/auth/refresh` | Refresh access and refresh tokens |
| POST | `/auth/logout` | Log out the current user |
| GET | `/auth/me` | Get the authenticated user profile |

## Admin — Administrative and RBAC verification endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/ping` | Verify SYSADMIN access |
| GET | `/admin/users` | List users |

## Roles — Role management endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | List roles |
| POST | `/roles` | Create a role |
| GET | `/roles/{id}` | Get role details |
| PATCH | `/roles/{id}` | Update a role |
| DELETE | `/roles/{id}` | Delete a role |
| POST | `/roles/{roleId}/assign` | Assign a role to an existing user |

## Permissions — Permission management endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles/permissions` | List permissions |
| POST | `/roles/permissions` | Create a permission |

## Budget Codes — Budget code management endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/budget-codes` | Create a budget category or sub-item |
| GET | `/budget-codes` | List budget categories with sub-items |
| POST | `/budget-codes/seed-all` | Seed all predefined budget categories and sub-items |
| GET | `/budget-codes/reference` | Get budget reference data with fiscal years |
| PATCH | `/budget-codes/fiscal-years/{year}/status` | Open or close a fiscal year |

## Fund Inflows — Fund inflow management endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/fund-inflows` | Create a new draft fund inflow |
| GET | `/fund-inflows` | Get all fund inflows with filters |
| GET | `/fund-inflows/totals/{fiscalYear}` | Get total approved inflows for a fiscal year |
| GET | `/fund-inflows/queue/review` | Get officer's review queue |
| GET | `/fund-inflows/queue/approval` | Get director's approval queue |
| GET | `/fund-inflows/{id}` | Get a specific fund inflow by ID |
| PATCH | `/fund-inflows/{id}` | Update a draft fund inflow |
| DELETE | `/fund-inflows/{id}` | Delete a draft fund inflow |
| PATCH | `/fund-inflows/{id}/submit` | Submit a draft for review |
| PATCH | `/fund-inflows/{id}/review` | Review a fund inflow |
| PATCH | `/fund-inflows/{id}/approve` | Approve a fund inflow |
| PATCH | `/fund-inflows/{id}/reject` | Reject a fund inflow |
| PATCH | `/fund-inflows/{id}/reopen` | Reopen a rejected fund inflow |

## AIE — AIE management endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/aies/imports` | Import monthly AIE budgets and actual release details |
| POST | `/aies/imports/replace` | Replace AIE data for a fiscal year |
| GET | `/aies/imports/{importId}` | Get metadata for one AIE workbook import |
| POST | `/aies/imports/{importId}/approve` | Approve a pending AIE workbook import |
| POST | `/aies` | Create a new AIE draft |
| GET | `/aies` | List all AIEs with optional filters |
| POST | `/aies/seed` | Seed AIEs from predefined data |
| GET | `/aies/queue/review` | Get officer's review queue |
| GET | `/aies/queue/approval` | Get director's approval queue |
| GET | `/aies/totals/{fiscalYear}` | Get total approved AIE amounts for a fiscal year |
| GET | `/aies/{id}` | Get a specific AIE by ID |
| PATCH | `/aies/{id}` | Update an AIE draft |
| DELETE | `/aies/{id}` | Delete an AIE draft |
| GET | `/aies/report` | Comparative budget vs. actual report |
| GET | `/aies/{id}/line-items` | Get an AIE's line items |
| PATCH | `/aies/{id}/submit` | Submit an AIE for review |
| PATCH | `/aies/{id}/review` | Review an AIE |
| PATCH | `/aies/{id}/approve` | Approve an AIE |
| PATCH | `/aies/{id}/reject` | Reject an AIE |
| PATCH | `/aies/{id}/reopen` | Reopen a rejected AIE |

## Distributions — Distribution and expenditure item endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/distributions/template` | Get add-period template for a frontend tab |
| GET | `/distributions/reference` | Get seeded zones, formations, and schools |
| POST | `/distributions/seed-all` | Seed distribution reference data and starter periods |
| GET | `/distributions` | Get distribution data for a frontend tab |
| POST | `/distributions` | Create a distribution period for a frontend tab |
| PATCH | `/distributions/{periodId}` | Update a distribution period for a frontend tab |
| DELETE | `/distributions/{periodId}` | Delete a distribution period from a frontend tab |
| POST | `/distributions/{periodId}/submit` | Submit a distribution period for review |
| POST | `/distributions/{periodId}/review` | Mark a submitted distribution period as officer-reviewed |
| POST | `/distributions/{periodId}/approve` | Approve an officer-reviewed distribution period |
| POST | `/distributions/{periodId}/return` | Return a distribution period for correction |
| GET | `/distributions/{periodId}/audit-trail` | Get distribution period approval audit trail |

## Expenditures — Expenditure workflow endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenditures` | Get expenditure data by view |

## Audit — Audit trail (HTTP request logs and business event entries)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit/http-logs` | List HTTP request logs |
| GET | `/audit/entries` | List business audit entries |

## Storage

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/storage/presign` | Generate a presigned upload URL |
| POST | `/storage/upload` | Upload a single file through the server |
| POST | `/storage/upload/bulk` | Upload multiple files through the server |
| GET | `/storage/download/{key}` | Generate a presigned download URL |
| GET | `/storage/metadata/{key}` | Get object metadata |
| GET | `/storage/exists/{key}` | Check whether an object exists |
| GET | `/storage/list` | List objects under a prefix |
| POST | `/storage/admin/temp-url-key` | Set the Swift temp-url-key (Swift backend only) |
| DELETE | `/storage/bulk` | Delete multiple objects |
| DELETE | `/storage/{key}` | Delete a single object |

## Repository

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/repository/stats` | Get repository-wide statistics |
| GET | `/repository/tables` | List all tables with row counts |
| GET | `/repository/tables/{table}/export` | Export a single table's rows |
| GET | `/repository/backup` | Download a full repository backup |
| POST | `/repository/sync` | Sync all tables to the external Postgres mirror |

## Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/cards` | Get report card analytics |
| GET | `/reports` | Get report data by view |

## Budget Proposals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/budget-proposals` | Get all budget proposals with filters |
| POST | `/budget-proposals` | Create draft budget proposals for one or more AIE line items |
| GET | `/budget-proposals/{id}` | Get a specific budget proposal by ID |
| PATCH | `/budget-proposals/{id}` | Update a draft budget proposal |
| DELETE | `/budget-proposals/{id}` | Delete a draft budget proposal |
| POST | `/budget-proposals/{id}/submit` | Submit a draft budget proposal for review |
| POST | `/budget-proposals/{id}/review` | Review a budget proposal |
| POST | `/budget-proposals/{id}/approve` | Approve a budget proposal |
| POST | `/budget-proposals/{id}/reject` | Reject a budget proposal |

## Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | List departments |
| POST | `/departments` | Create a department |
| GET | `/departments/{id}` | Get a department by id |
| PATCH | `/departments/{id}` | Update a department |
| PATCH | `/departments/{id}/deactivate` | Deactivate a department |

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/cards` | Get dashboard card analytics |
| GET | `/dashboard/inflow-vs-expenditure-chart` | Get total inflow vs total expenditure chart |

## Comparisons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/comparisons/zones` | Compare distributed amounts between two zones |
| GET | `/comparisons/month-over-month` | Compare approved fund inflows month over month |
| GET | `/comparisons/budget-vs-actual` | Compare approved AIE budget against actual distribution spend |

## Schemas

SuccessResponse, ErrorResponse, HealthResponse, LoginRequest, RefreshTokenRequest, TokenPair, LoginResponse, User, Role, RoleDetails, Permission, BudgetCategoryNew, BudgetSubItemNew, DashboardCardData, DashboardInflowVsExpenditureChartData, Pagination, PresignedUploadResult, UploadResult, ObjectMetadata, RepositoryStats, RepositoryTableSummary, RepositoryTableList, RepositorySyncTableResult, RepositorySyncSummary, ReportView, ReportCardAnalyticsResponse, ReportMonthlyReleaseRow, ReportLineItemRow, ReportDistributionRow, ReportQuery, BudgetProposal, BudgetProposalItem, CreateBudgetProposalRequest, UpdateBudgetProposalRequest, CreateAieRequest, UpdateAieRequest, RejectAieRequest, AieStatus, AieLineItem, CreateSchoolRequest, CreateZoneRequest, CreateFormationRequest, CreateExpenditureItemRequest, School, Zone, ZoneGroup, Formation, ExpenditureItem, Department, CreateDepartmentRequest, UpdateDepartmentRequest, ZoneComparisonEntry, PeriodComparisonEntry, AmountSummary, DistributionSimplePeriod, DistributionSummaryRow, DistributionSummaryPeriod, DistributionPayload, ReturnDistributionRequest
