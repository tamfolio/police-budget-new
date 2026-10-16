# NPF Budget Management System API — Full Reference

Base URL: `https://api.pabdigitalsystem.com`  
Version: 0.1.0 (OAS 3.0)  
Interactive docs: https://api.pabdigitalsystem.com/docs/

## Authentication

All protected endpoints use **HTTP Bearer (JWT)** auth. Obtain tokens via `POST /auth/login`,
send them as `Authorization: Bearer <access_token>`, and renew with `POST /auth/refresh`.

---


## System

### `GET /health`

Check API, database, and Redis health  
**Auth required:** No

**Success response** (`application/json`): `HealthResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes |  |
| `db` | string | Yes |  |
| `redis` | string | Yes |  |
| `timestamp` | string | Yes |  |

**Error responses:** `500`

### `GET /docs/openapi.json`

Get the OpenAPI specification  
**Auth required:** No

**Success response** (`application/json`): `object`

### `GET /docs`

Open Swagger UI  
**Auth required:** No

**Success response** (`text/html`): `string`


## Authentication

### `POST /auth/invite`

Invite one or more users  
Requires the `users.invite` permission.  
**Auth required:** Yes

**Request body** (`application/json`):

Schema: `array[InviteUserRequest]`

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `404`, `409`, `500`

### `POST /auth/login`

Log in with email and password  
**Auth required:** No

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes |  |
| `password` | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `429`, `500`

### `POST /auth/update-password`

Update the authenticated user's password  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes |  |

**Success response** (`application/json`): `SuccessResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes |  |

**Error responses:** `400`, `401`, `429`, `500`

### `POST /auth/refresh`

Refresh access and refresh tokens  
**Auth required:** No

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `500`

### `POST /auth/logout`

Log out the current user  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`

### `GET /auth/me`

Get the authenticated user profile  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`


## Admin

### `GET /admin/ping`

Verify SYSADMIN access  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`, `500`

### `GET /admin/users`

List users  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `pageSize` | query | integer | No |  |
| `pageNumber` | query | integer | No |  |
| `search` | query | string | No |  |

**Success response** (`application/json`): `SuccessResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes |  |

**Error responses:** `401`, `403`, `500`


## Roles

### `GET /roles`

List roles  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `pageSize` | query | integer | No |  |
| `pageNumber` | query | integer | No |  |
| `search` | query | string | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`, `500`

### `POST /roles`

Create a role  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `description` | string | No |  |
| `permissions` | array[string] | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `409`, `500`

### `GET /roles/{id}`

Get role details  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`, `404`, `500`

### `PATCH /roles/{id}`

Update a role  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No |  |
| `description` | string | No |  |
| `permissions` | array[string] | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `404`, `500`

### `DELETE /roles/{id}`

Delete a role  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `SuccessResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes |  |

**Error responses:** `401`, `403`, `404`, `500`

### `POST /roles/{roleId}/assign`

Assign a role to an existing user  
Updates the user's role immediately (permission checks are evaluated live on every request, so there is no delay) and sends the user an email notifying them to log in.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes |  |

**Success response** (`application/json`): `SuccessResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes |  |

**Error responses:** `400`, `401`, `403`, `404`, `409`, `500`


## Permissions

### `GET /roles/permissions`

List permissions  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `pageSize` | query | integer | No |  |
| `pageNumber` | query | integer | No |  |
| `search` | query | string | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`, `500`

### `POST /roles/permissions`

Create a permission  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `name` | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `409`, `500`


## Budget Codes

### `POST /budget-codes`

Create a budget category or sub-item  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `name` | string | Yes |  |
| `categoryCode` | string | No | Omit this field to create a parent budget category. |
| `sort` | integer | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `409`, `500`

### `GET /budget-codes`

List budget categories with sub-items  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `search` | query | string | No | Filter budget categories and sub-items by code or name. |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`, `500`

### `POST /budget-codes/seed-all`

Seed all predefined budget categories and sub-items  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`, `500`

### `GET /budget-codes/reference`

Get budget reference data with fiscal years  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `search` | query | string | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`, `500`

### `PATCH /budget-codes/fiscal-years/{year}/status`

Open or close a fiscal year  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `year` | path | integer | Yes |  |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `500`


## Fund Inflows

### `POST /fund-inflows`

Create a new draft fund inflow  
Creates a new draft fund inflow record. All fields must pass validation before submission.  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | Yes | The fiscal year for the fund inflow (2000-2100) |
| `inflowDate` | string | Yes | The date of the fund inflow (YYYY-MM-DD) |
| `source` | string | Yes | The source category of the fund inflow |
| `referenceNo` | string | No | Reference number (uppercase letters, numbers, slashes, or hyphens only) |
| `amount` | number | Yes | The amount of the fund inflow (must be positive, max 2 decimal places) |
| `supportingDocuments` | array[string] | No | Array of document IDs or URLs for supporting documentation |
| `notes` | string | No | Additional notes or comments about the fund inflow |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the created fund inflow |
| `fiscalYear` | integer | No |  |
| `inflowDate` | string | No |  |
| `source` | string | No |  |
| `referenceNo` | string | No |  |
| `amount` | number | No |  |
| `supportingDocuments` | array[string] | No |  |
| `notes` | string | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |
| `status` | string | No |  |

**Error responses:** `400`, `401`, `403`, `422`, `500`

### `GET /fund-inflows`

Get all fund inflows with filters  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | query | integer | No |  |
| `source` | query | string | No |  |
| `status` | query | string | No |  |
| `createdById` | query | string | No |  |

**Error responses:** `401`, `422`

### `GET /fund-inflows/totals/{fiscalYear}`

Get total approved inflows for a fiscal year  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | path | integer | Yes |  |

**Error responses:** `401`

### `GET /fund-inflows/queue/review`

Get officer's review queue  
Returns all inflows pending review by an officer. Requires the `fund-inflows.review` permission.  
**Auth required:** Yes

**Error responses:** `401`, `403`

### `GET /fund-inflows/queue/approval`

Get director's approval queue  
Returns all inflows pending approval by a director. Requires the `fund-inflows.approve` permission.  
**Auth required:** Yes

**Error responses:** `401`, `403`

### `GET /fund-inflows/{id}`

Get a specific fund inflow by ID  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `401`, `404`

### `PATCH /fund-inflows/{id}`

Update a draft fund inflow  
Updates an existing draft fund inflow. Only draft status records can be modified. All fields are optional and will be validated against the same rules as creation.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the fund inflow to update |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No | The fiscal year for the fund inflow (2000-2100) |
| `inflowDate` | string | No | The date of the fund inflow (YYYY-MM-DD) |
| `source` | string | No | The source category of the fund inflow |
| `referenceNo` | string | No | Reference number (uppercase letters, numbers, slashes, or hyphens only) |
| `amount` | number | No | The amount of the fund inflow (must be positive, max 2 decimal places) |
| `supportingDocuments` | array[string] | No | Array of document IDs or URLs for supporting documentation |
| `notes` | string | No | Additional notes or comments about the fund inflow |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the updated fund inflow |
| `fiscalYear` | integer | No |  |
| `inflowDate` | string | No |  |
| `source` | string | No |  |
| `referenceNo` | string | No |  |
| `amount` | number | No |  |
| `supportingDocuments` | array[string] | No |  |
| `notes` | string | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |
| `status` | string | No | Current status of the fund inflow |

**Error responses:** `400`, `401`, `403`, `404`, `422`, `500`

### `DELETE /fund-inflows/{id}`

Delete a draft fund inflow  
Clerk deletes their own DRAFT  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `204`, `401`, `403`, `404`

### `PATCH /fund-inflows/{id}/submit`

Submit a draft for review  
Clerk submits DRAFT → PENDING_REVIEW  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `401`, `403`, `404`, `409`

### `PATCH /fund-inflows/{id}/review`

Review a fund inflow  
Officer reviews → PENDING_APPROVAL  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `401`, `403`, `404`, `409`

### `PATCH /fund-inflows/{id}/approve`

Approve a fund inflow  
Director approves → APPROVED  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `401`, `403`, `404`, `409`

### `PATCH /fund-inflows/{id}/reject`

Reject a fund inflow  
Officer or Director rejects → REJECTED  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Request body** (`application/json`):

Schema: `RejectFundInflowRequest`

**Error responses:** `401`, `403`, `404`, `409`, `422`

### `PATCH /fund-inflows/{id}/reopen`

Reopen a rejected fund inflow  
Clerk re-opens REJECTED → DRAFT  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `401`, `403`, `404`, `409`


## AIE

### `POST /aies/imports`

Import monthly AIE budgets and actual release details  
Accepts Budgets and Actuals sheets or the legacy Balances workbook. Actuals require a month. Imports that replace approved proposal actuals for the same month and code await budget director review.  
**Auth required:** Yes

**Request body** (`multipart/form-data`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | Yes |  |
| `fiscalYear` | integer | Yes |  |
| `action` | string | Yes |  |

**Error responses:** `400`, `409`

### `POST /aies/imports/replace`

Replace AIE data for a fiscal year  
System admins and budget directors only. A first request returns overlap details and requires an explicit confirmReplacement=true retry.  
**Auth required:** Yes

**Request body** (`multipart/form-data`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | Yes |  |
| `fiscalYear` | integer | Yes |  |
| `confirmReplacement` | boolean | No |  |

**Error responses:** `409`

### `GET /aies/imports/{importId}`

Get metadata for one AIE workbook import  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `importId` | path | string | Yes |  |

**Error responses:** `404`

### `POST /aies/imports/{importId}/approve`

Approve a pending AIE workbook import  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `importId` | path | string | Yes |  |

**Error responses:** `403`

### `POST /aies`

Create a new AIE draft  
Creates a new AIE (Advance/Imprest/Emergency) as a draft with one or more line items. All line items must have valid GIFMIS item codes and sub-item codes.  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | Yes | The fiscal year for the AIE (2000-2100) |
| `aieNo` | string | Yes | AIE reference number |
| `issueDate` | string | Yes | The date the AIE is issued (YYYY-MM-DD) |
| `expiresOn` | string | No | Expiry date of the AIE (defaults to issueDate + 90 days if omitted) |
| `recipientUnit` | string | Yes | The recipient unit/department for the AIE |
| `lineItems` | array[object] | Yes | List of line items for the AIE |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the created AIE |
| `fiscalYear` | integer | No |  |
| `aieNo` | string | No |  |
| `issueDate` | string | No |  |
| `expiresOn` | string | No |  |
| `recipientUnit` | string | No |  |
| `lineItems` | array[object] | No |  |
| `status` | string | No | Current status of the AIE |
| `totalAmount` | number | No | Sum of all line item amounts |
| `createdBy` | string | No | ID of the user who created the AIE |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

**Error responses:** `400`, `401`, `403`, `422`, `500`

### `GET /aies`

List all AIEs with optional filters  
Returns a list of AIEs with optional filtering by fiscal year, status, creator, or expiry date. Requires authentication.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | query | integer | No |  |
| `status` | query | string | No |  |
| `createdById` | query | string | No |  |
| `expiringBefore` | query | string | No |  |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array[AieResponse] | No |  |
| `total` | integer | No | Total number of matching records |

**Error responses:** `401`, `422`

### `POST /aies/seed`

Seed AIEs from predefined data  
Creates AIE records from the predefined AIE seed data.
Items are grouped by month, with one AIE created for each distinct month.
The issue date for each AIE is set to the first day of its respective month.
Each AIE is created as a DRAFT.  
**Auth required:** Yes

**Success response** (`application/json`): `array[object]`

### `GET /aies/queue/review`

Get officer's review queue  
Returns all AIEs pending review by an officer. Requires the `aie.review` permission.  
**Auth required:** Yes

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array[AieResponse] | No |  |
| `total` | integer | No |  |

**Error responses:** `401`, `403`

### `GET /aies/queue/approval`

Get director's approval queue  
Returns all AIEs pending approval by a director. Requires the `aie.approve` permission.  
**Auth required:** Yes

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array[AieResponse] | No |  |
| `total` | integer | No |  |

**Error responses:** `401`, `403`

### `GET /aies/totals/{fiscalYear}`

Get total approved AIE amounts for a fiscal year  
Returns the sum of all approved AIE amounts for the specified fiscal year. Requires authentication.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | path | integer | Yes |  |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No |  |
| `totalAmount` | number | No | Sum of all approved AIE amounts |
| `count` | integer | No | Number of approved AIEs |

**Error responses:** `400`, `401`

### `GET /aies/{id}`

Get a specific AIE by ID  
Retrieves a complete AIE record including all line items. Requires authentication.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `AieResponse`

**Error responses:** `401`, `404`

### `PATCH /aies/{id}`

Update an AIE draft  
Clerk edits their own DRAFT AIE. All fields are optional and will be validated against the same rules as creation. Providing `lineItems` fully replaces the existing line items. Only draft records can be modified.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No | The fiscal year for the AIE |
| `aieNo` | string | No | AIE reference number |
| `issueDate` | string | No | The date the AIE is issued |
| `expiresOn` | string | No | Expiry date (must be after issueDate) |
| `recipientUnit` | string | No | The recipient unit/department |
| `lineItems` | array[AieLineItem] | No | Line items for the AIE (fully replaces existing line items) |

**Success response** (`application/json`): `AieResponse`

**Error responses:** `400`, `401`, `403`, `404`, `422`, `500`

### `DELETE /aies/{id}`

Delete an AIE draft  
Clerk deletes their own DRAFT AIE. Cascades to delete all associated line items. Only draft records can be deleted.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `204`, `401`, `403`, `404`

### `GET /aies/report`

Comparative budget vs. actual report  
Returns one row per expenditure sub-item code with the annual appropriation, % allocated, and a Budget/Actual pair per month. "Actual" reflects the sum of APPROVED budget proposals for that code — once a proposal is approved it becomes the actual spend against the AIE item. Requires authentication.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | query | integer | Yes |  |
| `month` | query | integer | No |  |
| `year` | query | integer | No |  |

**Error responses:** `400`, `401`

### `GET /aies/{id}/line-items`

Get an AIE's line items  
Returns only the line items belonging to a single AIE. Each item includes `actualAmount` — the approved BudgetProposal (if any) that funded it — alongside its original budgeted amount.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Error responses:** `401`, `404`

### `PATCH /aies/{id}/submit`

Submit an AIE for review  
Clerk submits a DRAFT AIE for review, changing status to PENDING_REVIEW. Only draft records can be submitted.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `AieResponse`

**Error responses:** `401`, `403`, `404`, `409`

### `PATCH /aies/{id}/review`

Review an AIE  
Officer reviews a PENDING_REVIEW AIE, changing status to PENDING_APPROVAL. Requires the `aie.review` permission.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `AieResponse`

**Error responses:** `401`, `403`, `404`, `409`

### `PATCH /aies/{id}/approve`

Approve an AIE  
Director approves a PENDING_APPROVAL AIE, changing status to APPROVED. Requires the `aie.approve` permission.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `AieResponse`

**Error responses:** `401`, `403`, `404`, `409`

### `PATCH /aies/{id}/reject`

Reject an AIE  
Officer or Director rejects an AIE, changing status to REJECTED. Requires either `aie.reject` permission. A rejection reason must be provided.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Reason for rejecting the AIE |

**Success response** (`application/json`): `AieResponse`

**Error responses:** `401`, `403`, `404`, `409`, `422`

### `PATCH /aies/{id}/reopen`

Reopen a rejected AIE  
Clerk re-opens a REJECTED AIE, changing status back to DRAFT. Requires the `aie.reopen` permission.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `AieResponse`

**Error responses:** `401`, `403`, `404`, `409`


## Distributions

### `GET /distributions/template`

Get add-period template for a frontend tab  
Returns the editable page structure for Zone, Formations, Schools, or Summary with exactly one zeroed/null value for the complete two-month period, ready for the Add Period dialog.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `view` | query | DistributionView | Yes | Frontend tab to read or mutate. |
| `periodId` | query | string | No | Any month in the fixed two-month period. Both months resolve to the same record. When omitted, all periods for the selected view are returned. |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `404`, `500`

### `GET /distributions/reference`

Get seeded zones, formations, and schools  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `view` | query | DistributionView | Yes | Frontend tab to read or mutate. |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`

### `POST /distributions/seed-all`

Seed distribution reference data and starter periods  
Seeds zones, formations, schools, and starter tab payloads from the frontend distribution seed data.  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`

### `GET /distributions`

Get distribution data for a frontend tab  
Returns tab-ready payloads for Zone, Formations, Schools, or Summary. Each record represents one fixed two-month period with one value per line item. Pass periodId for one period; omit it for all periods in that view.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `view` | query | DistributionView | Yes | Frontend tab to read or mutate. |
| `periodId` | query | string | No | Any month in the fixed two-month period. Both months resolve to the same record. When omitted, all periods for the selected view are returned. |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `404`, `500`

### `POST /distributions`

Create a distribution period for a frontend tab  
Body must be the frontend period payload for the selected view. The first value in each value array is used for the entire two-month period; additional legacy values are accepted but ignored. Only id is used to identify the period; label is generated automatically. Either month in a pair resolves to the same period.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `view` | query | DistributionView | Yes | Frontend tab to read or mutate. |

**Request body** (`application/json`):

Schema: `DistributionPayload`

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `500`

### `PATCH /distributions/{periodId}`

Update a distribution period for a frontend tab  
Body must be the full frontend period payload for the selected view. The first value in each value array is used for the complete two-month period; additional legacy values are accepted but ignored. The route periodId and body.id may use either month in the same pair; label is generated automatically.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | path | string | Yes | Any month in the fixed two-month period. Both months resolve to the same record. |
| `view` | query | DistributionView | Yes | Frontend tab to read or mutate. |

**Request body** (`application/json`):

Schema: `DistributionPayload`

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `404`, `500`

### `DELETE /distributions/{periodId}`

Delete a distribution period from a frontend tab  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | path | string | Yes | Any month in the fixed two-month period. Both months resolve to the same record. |
| `view` | query | DistributionView | Yes | Frontend tab to read or mutate. |

**Success response** (`application/json`): `SuccessResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes |  |

**Error responses:** `401`, `404`, `500`

### `POST /distributions/{periodId}/submit`

Submit a distribution period for review  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | path | string | Yes | Any month in the fixed two-month period. Both months resolve to the same record. |

**Error responses:** `401`, `404`, `500`

### `POST /distributions/{periodId}/review`

Mark a submitted distribution period as officer-reviewed  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | path | string | Yes | Any month in the fixed two-month period. Both months resolve to the same record. |

**Error responses:** `401`, `403`, `404`, `500`

### `POST /distributions/{periodId}/approve`

Approve an officer-reviewed distribution period  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | path | string | Yes | Any month in the fixed two-month period. Both months resolve to the same record. |

**Error responses:** `401`, `403`, `404`, `500`

### `POST /distributions/{periodId}/return`

Return a distribution period for correction  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | path | string | Yes | Any month in the fixed two-month period. Both months resolve to the same record. |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `remarks` | string | Yes |  |

**Error responses:** `400`, `401`, `404`, `500`

### `GET /distributions/{periodId}/audit-trail`

Get distribution period approval audit trail  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | path | string | Yes | Any month in the fixed two-month period. Both months resolve to the same record. |

**Error responses:** `401`, `404`, `500`


## Expenditures

### `GET /expenditures`

Get expenditure data by view  
Use view=sub-item for the combined summary list, view=distribution for tabbed distribution data, or view=aie for the AIE list. distributionView is required when view=distribution.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `view` | query | ExpenditureView | Yes |  |
| `distributionView` | query | ExpenditureDistributionView | No | Required when view=distribution. |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `500`


## Audit

### `GET /audit/http-logs`

List HTTP request logs  
Returns a paginated list of all HTTP requests logged by the system. Requires the `audit.view` permission.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `userId` | query | string | No | Filter by the user who made the request |
| `method` | query | string | No | Filter by HTTP method |
| `endpoint` | query | string | No | Partial match on the request URL path |
| `statusCode` | query | integer | No | Filter by HTTP response status code |
| `dateFrom` | query | string | No | Start of date range (inclusive) |
| `dateTo` | query | string | No | End of date range (inclusive) |
| `page` | query | integer | No |  |
| `limit` | query | integer | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`

### `GET /audit/entries`

List business audit entries  
Returns a paginated list of business-level audit events (CREATE, SUBMIT, APPROVE, REJECT, etc.) across all modules (BudgetProposal, AIE, FundInflow, Expenditure, Distribution, User). Requires the `audit.view` permission.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `entityType` | query | string | No | Filter by the type of business entity |
| `entityId` | query | string | No | Filter by a specific entity's ID |
| `action` | query | string | No | Filter by the audit action type |
| `performedById` | query | string | No | Filter by the user who performed the action |
| `dateFrom` | query | string | No |  |
| `dateTo` | query | string | No |  |
| `page` | query | integer | No |  |
| `limit` | query | integer | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `403`


## Storage

### `POST /storage/presign`

Generate a presigned upload URL  
Returns a short-lived presigned PUT URL that the browser can use to
upload a file **directly** to the object store — no file bytes pass
through this API server.

**Frontend upload flow:**
1. Call this endpoint to obtain `uploadUrl` and `key`.
2. `PUT` the file binary to `uploadUrl` with the matching `Content-Type` header.
3. On success (HTTP 200 from the object store), persist `key` in your
   resource (e.g. `documentKey` on a budget proposal).

Works with both S3-compatible stores and OpenStack Swift (Nobus).
Swift temp URLs require `STORAGE_TEMP_URL_KEY` to be configured — see
the `POST /storage/admin/temp-url-key` endpoint.  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fileName` | string | Yes | Original filename including extension |
| `contentType` | string | Yes | MIME type of the file to be uploaded |
| `folder` | string | No | Destination folder/prefix inside the bucket/container. Defaults to "uploads". |
| `expiresIn` | integer | No | Seconds until the presigned URL expires. Defaults to 900 (15 minutes). |

**Success response** (`application/json`): `PresignedUploadResult`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uploadUrl` | string | No | Presigned PUT URL — upload the file binary directly to this |
| `key` | string | No | Object key (path) inside the bucket — persist this to reference the file later |
| `publicUrl` | string | No | Public (non-presigned) URL for reading the object after upload |
| `expiresIn` | integer | No | Seconds until the presigned upload URL expires |

**Error responses:** `400`, `401`, `403`, `500`

### `POST /storage/upload`

Upload a single file through the server  
Accepts a `multipart/form-data` request and uploads the file from the
API server directly to the object store. Use this when the object store
is not publicly reachable from the browser (e.g. a self-hosted MinIO
or Nobus Swift instance on a private network).

Max file size: **10 MB**.
Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`,
`application/pdf`, `.docx`, `.xlsx`.  
**Auth required:** Yes

**Request body** (`multipart/form-data`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | Yes | The file to upload |
| `folder` | string | No | Destination folder/prefix. Defaults to "uploads". |

**Success response** (`application/json`): `UploadResult`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | No | Object key (path) inside the bucket/container |
| `publicUrl` | string | No | Public URL for the uploaded object |

**Error responses:** `400`, `401`, `403`, `413`, `500`

### `POST /storage/upload/bulk`

Upload multiple files through the server  
Accepts a `multipart/form-data` request with up to **10 files** and
uploads them all in parallel to the object store.

Max file size per file: **10 MB**. Max files per request: **10**.  
**Auth required:** Yes

**Request body** (`multipart/form-data`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | array[string] | Yes | Files to upload (max 10) |
| `folder` | string | No | Destination folder/prefix. Defaults to "uploads". |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uploaded` | integer | No | Number of files successfully uploaded |
| `results` | array[UploadResult] | No |  |

**Error responses:** `400`, `401`, `403`, `413`, `500`

### `GET /storage/download/{key}`

Generate a presigned download URL  
Returns a short-lived presigned GET URL for downloading or previewing
a private object. The browser can open this URL directly without any
additional authentication headers.

On Swift backends this generates a Temp URL using `STORAGE_TEMP_URL_KEY`.
On S3 backends it generates a standard presigned GET URL.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `key` | path | string | Yes | Object key inside the bucket/container. Forward slashes must be percent-encoded as `%2F`.  |
| `expiresIn` | query | integer | No | Seconds until the presigned URL expires. Defaults to 900 (15 minutes). |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `downloadUrl` | string | No |  |
| `key` | string | No |  |
| `expiresIn` | integer | No |  |

**Error responses:** `401`, `403`, `404`, `500`

### `GET /storage/metadata/{key}`

Get object metadata  
Returns metadata for an object (size, last modified, content type, ETag)
without downloading the object body.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `key` | path | string | Yes | Object key (forward slashes percent-encoded as %2F) |

**Success response** (`application/json`): `ObjectMetadata`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | No |  |
| `size` | integer | No | File size in bytes |
| `lastModified` | string | No |  |
| `contentType` | string | No |  |
| `etag` | string | No |  |

**Error responses:** `401`, `403`, `404`, `500`

### `GET /storage/exists/{key}`

Check whether an object exists  
Performs a lightweight HEAD check and returns whether the object exists.
Useful for validating a `key` before saving it to the database.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `key` | path | string | Yes | Object key (forward slashes percent-encoded as %2F) |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | No |  |
| `exists` | boolean | No |  |

**Error responses:** `401`, `403`, `500`

### `GET /storage/list`

List objects under a prefix  
Returns a paginated list of objects whose keys start with the given prefix.
Pass `continuationToken` from a previous response to fetch the next page.

On Swift backends, the token is the last key of the previous page
(marker-based pagination). On S3 it is an opaque token from the API.
The interface is identical either way.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `prefix` | query | string | Yes |  |
| `maxKeys` | query | integer | No |  |
| `continuationToken` | query | string | No |  |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `objects` | array[ObjectMetadata] | No |  |
| `isTruncated` | boolean | No |  |
| `nextContinuationToken` | string | No |  |

**Error responses:** `400`, `401`, `403`, `500`

### `POST /storage/admin/temp-url-key`

Set the Swift temp-url-key (Swift backend only)  
Sets the secret key used to sign Swift Temp URLs (the Swift equivalent
of S3 presigned URLs). Only needs to be called **once** per account.

After calling this, store the key in `STORAGE_TEMP_URL_KEY` env var
so it persists across server restarts.

**No-op on S3 backends** — returns 204 immediately.  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Secret signing key — treat like a password. Min 32 characters recommended. |

**Error responses:** `204`, `400`, `401`, `403`, `500`

### `DELETE /storage/bulk`

Delete multiple objects  
Deletes up to **1 000 objects** in one request.

On S3 this uses a single batched DeleteObjects API call.
On Swift, individual deletes are parallelised in batches of 10.

Successful deletions are **not** rolled back if some keys fail.  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keys` | array[string] | Yes |  |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requested` | integer | No |  |
| `deleted` | integer | No |  |
| `failed` | array[string] | No |  |

**Error responses:** `400`, `401`, `403`, `500`

### `DELETE /storage/{key}`

Delete a single object  
Permanently deletes an object by key. Returns 204 whether or not the
object existed (standard S3/Swift behaviour).  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `key` | path | string | Yes | Object key (forward slashes percent-encoded as %2F) |

**Error responses:** `204`, `401`, `403`, `500`


## Repository

### `GET /repository/stats`

Get repository-wide statistics  
Returns table count, total row count across all tables, and document storage stats.  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`

### `GET /repository/tables`

List all tables with row counts  
Returns every user table in the public schema (excluding migration/metadata tables), along with its row count.  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`

### `GET /repository/tables/{table}/export`

Export a single table's rows  
Streams every row of the given table as CSV or JSON. The table name is validated against the live schema before querying.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `table` | path | string | Yes | Name of the table to export. Must match an existing table in the public schema. |
| `format` | query | string | No | Output format for the exported table rows. |

**Success response** (`text/csv`): `string`

**Success response** (`application/json`): `array[object]`

**Error responses:** `400`, `401`, `404`, `500`

### `GET /repository/backup`

Download a full repository backup  
Streams a ZIP archive containing a CSV and JSON dump of every table, plus stored document files.  
**Auth required:** Yes

**Success response** (`application/zip`): `string`

**Error responses:** `401`, `500`

### `POST /repository/sync`

Sync all tables to the external Postgres mirror  
Creates/updates a flat reporting mirror schema on an external Postgres instance and replaces its data with the current contents of every table. No PKs/FKs/indexes are mirrored.  
**Auth required:** Yes

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`


## Reports

### `GET /reports/cards`

Get report card analytics  
Returns the dashboard-style summary cards for a selected month.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `month` | query | integer | No | (e.g., 1 for January, 2 for February). |
| `year` | query | integer | No | (e.g., 2026) |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `500`

### `GET /reports`

Get report data by view  
Use view=monthly-release, line-item, distribution, or aie to fetch the corresponding report dataset. Optional filters narrow the output.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `view` | query | ReportView | Yes |  |
| `state` | query | string | No |  |
| `formation` | query | string | No |  |
| `budgetCode` | query | string | No |  |
| `from` | query | string | No |  |
| `to` | query | string | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `403`, `500`


## Budget Proposals

### `GET /budget-proposals`

Get all budget proposals with filters  
Retrieves a paginated list of budget proposals with optional filtering by fiscal year, department, sub-item, status, and creator.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | query | integer | No | Filter by fiscal year (2000-2100) |
| `departmentId` | query | string | No | Filter by department UUID |
| `subItemId` | query | string | No | Filter by sub-item UUID |
| `status` | query | string | No | Filter by proposal status |
| `createdById` | query | string | No | Filter by creator UUID |
| `page` | query | integer | No | Page number for pagination (starts at 1) |
| `limit` | query | integer | No | Number of items per page (max 100) |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | array[BudgetProposal] | No |  |
| `meta` | object | No |  |

**Error responses:** `401`, `422`, `500`

### `POST /budget-proposals`

Create draft budget proposals for one or more AIE line items  
Creates one draft BudgetProposal record per item in the `items` array. All items share the same fiscalYear, departmentId, justification, and supporting document references, but each targets its own AIE line item with its own amount. Each line item must exist, must match the sub-item code supplied for it, and must not already be fulfilled by another approved proposal. The whole batch is created in a single transaction — if any item fails validation, none of the proposals are created.  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | Yes | The fiscal year shared by all proposals in this submission (2000-2100) |
| `departmentId` | string | Yes | UUID of the department requesting the budget, shared by all items in this submission |
| `justification` | string | Yes | Justification shared across all line items in this submission |
| `supportingDocumentKey` | string | No | S3-style object key for a supporting document, shared across this submission |
| `supportingDocumentUrl` | string | No | URL for a supporting document, shared across this submission |
| `items` | array[BudgetProposalItem] | Yes | One or more AIE line items being requested against, each with its own amount |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | array[BudgetProposal] | No |  |

**Error responses:** `400`, `401`, `403`, `422`, `500`

### `GET /budget-proposals/{id}`

Get a specific budget proposal by ID  
Retrieves a single budget proposal by its unique identifier.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the budget proposal |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the budget proposal |
| `fiscalYear` | integer | No | The fiscal year for the budget proposal |
| `departmentId` | string | No | UUID of the associated department |
| `subItemId` | string | No | UUID of the associated sub-item |
| `amount` | number | No | The proposed budget amount |
| `description` | string | No | Description or justification for the budget proposal |
| `supportingDocuments` | array[string] | No | Supporting documentation references |
| `notes` | string | No | Additional notes or comments |
| `status` | string | No | Current status of the budget proposal |
| `createdById` | string | No | UUID of the user who created the proposal |
| `createdAt` | string | No | Timestamp when the proposal was created |
| `updatedAt` | string | No | Timestamp when the proposal was last updated |

**Error responses:** `401`, `404`, `500`

### `PATCH /budget-proposals/{id}`

Update a draft budget proposal  
Updates an existing draft budget proposal. Only draft status records can be modified. All fields are optional and will be validated against the same rules as creation.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the budget proposal to update |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No | The fiscal year for the budget proposal (2000-2100) |
| `departmentId` | string | No | UUID of the department this proposal belongs to |
| `subItemId` | string | No | UUID of the budget sub-item |
| `amount` | number | No | The proposed budget amount (must be positive, max 2 decimal places) |
| `description` | string | No | Detailed description or justification for the budget proposal |
| `supportingDocuments` | array[string] | No | Array of document IDs or URLs for supporting documentation |
| `notes` | string | No | Additional notes or comments about the budget proposal |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the updated budget proposal |
| `fiscalYear` | integer | No |  |
| `departmentId` | string | No |  |
| `subItemId` | string | No |  |
| `amount` | number | No |  |
| `description` | string | No |  |
| `supportingDocuments` | array[string] | No |  |
| `notes` | string | No |  |
| `status` | string | No | Current status of the budget proposal |
| `createdById` | string | No | UUID of the user who created the proposal |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

**Error responses:** `400`, `401`, `403`, `404`, `422`, `500`

### `DELETE /budget-proposals/{id}`

Delete a draft budget proposal  
Deletes a budget proposal that is in DRAFT status. Only the creator or users with appropriate permissions can delete draft proposals.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the budget proposal to delete |

**Error responses:** `204`, `401`, `403`, `404`, `500`

### `POST /budget-proposals/{id}/submit`

Submit a draft budget proposal for review  
Submits a budget proposal from DRAFT status to PENDING_REVIEW. Only the creator can submit their own draft proposals.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the budget proposal to submit |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the budget proposal |
| `fiscalYear` | integer | No |  |
| `departmentId` | string | No |  |
| `subItemId` | string | No |  |
| `amount` | number | No |  |
| `description` | string | No |  |
| `supportingDocuments` | array[string] | No |  |
| `notes` | string | No |  |
| `status` | string | No | Updated status of the budget proposal |
| `createdById` | string | No | UUID of the user who created the proposal |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

**Error responses:** `401`, `403`, `404`, `409`, `500`

### `POST /budget-proposals/{id}/review`

Review a budget proposal  
Reviews a submitted budget proposal and moves it to PENDING_APPROVAL. An optional review comment can be provided.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the budget proposal to review |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `comment` | string | No | Optional review comment or feedback on the budget proposal |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the budget proposal |
| `fiscalYear` | integer | No |  |
| `departmentId` | string | No |  |
| `subItemId` | string | No |  |
| `amount` | number | No |  |
| `description` | string | No |  |
| `supportingDocuments` | array[string] | No |  |
| `notes` | string | No |  |
| `status` | string | No | Updated status of the budget proposal |
| `reviewComment` | string | No | Review comment if provided |
| `reviewedById` | string | No | UUID of the user who reviewed the proposal |
| `reviewedAt` | string | No | Timestamp when the proposal was reviewed |
| `createdById` | string | No | UUID of the user who created the proposal |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

**Error responses:** `400`, `401`, `403`, `404`, `409`, `422`, `500`

### `POST /budget-proposals/{id}/approve`

Approve a budget proposal  
Approves a budget proposal that has been reviewed and moves it to APPROVED status. Requires appropriate approval permissions.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the budget proposal to approve |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the budget proposal |
| `fiscalYear` | integer | No |  |
| `departmentId` | string | No |  |
| `subItemId` | string | No |  |
| `amount` | number | No |  |
| `description` | string | No |  |
| `supportingDocuments` | array[string] | No |  |
| `notes` | string | No |  |
| `status` | string | No | Updated status of the budget proposal |
| `reviewComment` | string | No | Review comment if provided during review |
| `reviewedById` | string | No | UUID of the user who reviewed the proposal |
| `reviewedAt` | string | No | Timestamp when the proposal was reviewed |
| `approvedById` | string | No | UUID of the user who approved the proposal |
| `approvedAt` | string | No | Timestamp when the proposal was approved |
| `createdById` | string | No | UUID of the user who created the proposal |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

**Error responses:** `401`, `403`, `404`, `409`, `500`

### `POST /budget-proposals/{id}/reject`

Reject a budget proposal  
Rejects a budget proposal and moves it to REJECTED status. A rejection reason is required. Can be performed during review or approval stages.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes | Unique identifier of the budget proposal to reject |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Detailed reason for rejecting the budget proposal |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the budget proposal |
| `fiscalYear` | integer | No |  |
| `departmentId` | string | No |  |
| `subItemId` | string | No |  |
| `amount` | number | No |  |
| `description` | string | No |  |
| `supportingDocuments` | array[string] | No |  |
| `notes` | string | No |  |
| `status` | string | No | Updated status of the budget proposal |
| `rejectionReason` | string | No | Reason provided for rejection |
| `rejectedById` | string | No | UUID of the user who rejected the proposal |
| `rejectedAt` | string | No | Timestamp when the proposal was rejected |
| `createdById` | string | No | UUID of the user who created the proposal |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

**Error responses:** `400`, `401`, `403`, `404`, `409`, `422`, `500`


## Departments

### `GET /departments`

List departments  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `isActive` | query | boolean | No | Filter departments by active status. |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `500`

### `POST /departments`

Create a department  
**Auth required:** Yes

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `409`, `500`

### `GET /departments/{id}`

Get a department by id  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `404`, `500`

### `PATCH /departments/{id}`

Update a department  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Request body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No |  |

**Success response** (`application/json`): `any`

**Error responses:** `400`, `401`, `404`, `500`

### `PATCH /departments/{id}/deactivate`

Deactivate a department  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `id` | path | string | Yes |  |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `404`, `500`


## Dashboard

### `GET /dashboard/cards`

Get dashboard card analytics  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `month` | query | integer | No | Filter card analytics by month (e.g., 1 for January, 2 for February). |
| `year` | query | integer | No | Filter card analytics by year (e.g., 2026) |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `404`, `500`

### `GET /dashboard/inflow-vs-expenditure-chart`

Get total inflow vs total expenditure chart  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `year` | query | string | No | Filter inflow vs expenditure chart by the fiscal year - default to the current year. |

**Success response** (`application/json`): `any`

**Error responses:** `401`, `404`, `500`


## Comparisons

### `GET /comparisons/zones`

Compare distributed amounts between two zones  
Returns the total distributed amount and item count for two zones within the same distribution period. A zone's total includes items tagged directly with the zone AND items tagged with a formation that belongs to the zone.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `periodId` | query | string | Yes | The distribution period to compare within |
| `zoneAId` | query | string | Yes | Unique identifier of the first zone |
| `zoneBId` | query | string | Yes | Unique identifier of the second zone |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `periodId` | string | No |  |
| `periodLabel` | string | No |  |
| `zoneA` | ZoneComparisonEntry | No |  |
| `zoneB` | ZoneComparisonEntry | No |  |

**Error responses:** `401`, `403`, `404`, `422`, `500`

### `GET /comparisons/month-over-month`

Compare approved fund inflows month over month  
Returns total approved fund inflow amounts for a given fiscal year/month against the immediately preceding month, along with the absolute and percentage change. Defaults to the current fiscal year and month if not supplied.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | query | integer | No | The fiscal year to compare. Defaults to the current year. |
| `month` | query | integer | No | The month to compare (1-12). Defaults to the current month. |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current` | PeriodComparisonEntry | No |  |
| `previous` | PeriodComparisonEntry | No |  |
| `change` | number | No | Absolute change in total amount (current minus previous) |
| `percentageChange` | number | No | Percentage change versus the previous period. Null if the previous period total was zero. |

**Error responses:** `401`, `403`, `422`, `500`

### `GET /comparisons/budget-vs-actual`

Compare approved AIE budget against actual distribution spend  
Returns approved AIE totals for a fiscal year (budget) against actual
distributed amounts for a period (actual), along with variance and
utilization rate.

NOTE: AIE is tracked by fiscalYear, but Distribution is tracked by
periodId/periodLabel (e.g. "January-February 2026") with no fiscalYear
column in the current schema. Until those two period concepts are
unified, both fiscalYear and periodId must be supplied explicitly.  
**Auth required:** Yes

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `fiscalYear` | query | integer | Yes | The fiscal year to use for the budget (AIE) side of the comparison |
| `periodId` | query | string | Yes | The distribution period to use for the actual spend side of the comparison |

**Success response** (`application/json`): `object`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No |  |
| `budget` | AmountSummary | No |  |
| `actual` | AmountSummary | No |  |
| `variance` | number | No | actual.totalAmount minus budget.totalAmount |
| `variancePercentage` | number | No | Variance as a percentage of budget. Null if budget total is zero. |
| `utilizationRate` | number | No | actual.totalAmount as a percentage of budget.totalAmount. Null if budget total is zero. |

**Error responses:** `401`, `403`, `422`, `500`


---

## Data Schemas

### SuccessResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes |  |

### ErrorResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | No |  |
| `error` | string | Yes | Human-readable error message |
| `details` | array[object] | No | Additional error details (for validation errors) |
| `statusCode` | integer | Yes | HTTP status code |

### HealthResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes |  |
| `db` | string | Yes |  |
| `redis` | string | Yes |  |
| `timestamp` | string | Yes |  |

### LoginRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes |  |
| `password` | string | Yes |  |

### RefreshTokenRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes |  |

### InviteUserRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes |  |
| `fullName` | string | Yes |  |
| `roleId` | string | Yes |  |

### UpdatePasswordRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes |  |

### CreateRoleRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `description` | string | No |  |
| `permissions` | array[string] | Yes |  |

### UpdateRoleRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No |  |
| `description` | string | No |  |
| `permissions` | array[string] | No |  |

### CreatePermissionRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `name` | string | Yes |  |

### CreateBudgetReferenceRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `name` | string | Yes |  |
| `categoryCode` | string | No | Omit this field to create a parent budget category. |
| `sort` | integer | No |  |

### BudgetCategoryTreeItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `name` | string | Yes |  |
| `sort` | integer | Yes |  |
| `subItems` | array[BudgetSubItemNew] | Yes |  |

### FiscalYear

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | integer | Yes |  |
| `status` | string | Yes |  |
| `appropriationActAmount` | number | Yes |  |
| `revisedAmount` | number | Yes |  |

### UpdateFiscalYearStatusRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes |  |

### BudgetReferenceData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `categories` | array[BudgetCategoryTreeItem] | Yes |  |
| `fiscalYears` | array[FiscalYear] | Yes |  |

### CreateAieRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | Yes | The fiscal year for the AIE |
| `aieNo` | string | Yes | AIE reference number |
| `issueDate` | string | Yes | The date the AIE is issued |
| `expiresOn` | string | No | Expiry date (defaults to issueDate + 90 days) |
| `recipientUnit` | string | Yes | The recipient unit/department |
| `lineItems` | array[AieLineItem] | Yes | Line items for the AIE |

### CreateSchoolRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |

### CreateZoneRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `area` | string | Yes |  |
| `description` | string | Yes |  |

### CreateFormationRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `zoneId` | string | No |  |

### CreateExpenditureItemRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `budgetCodeId` | string | Yes |  |
| `schoolId` | string | No |  |
| `formationId` | string | No |  |
| `zoneId` | string | No |  |

### School

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `name` | string | Yes |  |
| `createdBy` | string | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

### Zone

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `name` | string | Yes |  |
| `area` | string | Yes |  |
| `description` | string | Yes |  |
| `formations` | array[Formation] | No |  |
| `createdBy` | string | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

### ZoneGroup

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `group` | string | Yes |  |
| `zones` | array[Zone] | Yes |  |

### Formation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `name` | string | Yes |  |
| `zoneId` | string | No |  |
| `items` | array[ExpenditureItem] | No |  |
| `createdBy` | string | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

### ExpenditureItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `name` | string | Yes |  |
| `budgetCodeId` | string | Yes |  |
| `schoolId` | string | No |  |
| `formationId` | string | No |  |
| `zoneId` | string | No |  |
| `createdBy` | string | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

### TokenPair

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accessToken` | string | Yes |  |
| `refreshToken` | string | Yes |  |

### LoginResponse

### User

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `email` | string | Yes |  |
| `fullName` | string | Yes |  |
| `isActive` | boolean | No |  |
| `role` | object | No |  |
| `invitedBy` | string | No |  |
| `lastLogin` | string | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

### Role

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `name` | string | Yes |  |
| `code` | string | Yes |  |
| `description` | string | No |  |
| `permissions` | array[Permission] | No |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

### RoleDetails

### Permission

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `name` | string | Yes |  |
| `code` | string | Yes |  |
| `createdAt` | string | No |  |
| `updatedAt` | string | No |  |

### BudgetCategoryNew

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `name` | string | Yes |  |
| `sort` | integer | Yes |  |

### BudgetSubItemNew

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `categoryCode` | string | Yes |  |
| `name` | string | Yes |  |
| `sort` | integer | Yes |  |
| `category` | BudgetCategoryNew | No |  |

### DashboardCardData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `totalFundInflow` | number | No |  |
| `fundInflowCount` | number | No |  |
| `aieCount` | number | No |  |
| `totalExpenditure` | number | No |  |
| `aieCarryOver` | number | No |  |
| `utilization` | number | No |  |

### DashboardInflowVsExpenditureChartData

Month-over-month data for the Fund Inflow vs Expenditure chart

### Pagination

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | integer | Yes |  |
| `perPage` | integer | Yes |  |
| `totalPages` | integer | Yes |  |
| `page` | integer | Yes |  |
| `urls` | array[string] | Yes |  |

### PresignedUploadResult

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uploadUrl` | string | No | Presigned PUT URL — upload the file binary directly to this |
| `key` | string | No | Object key (path) inside the bucket — persist this to reference the file later |
| `publicUrl` | string | No | Public (non-presigned) URL for reading the object after upload |
| `expiresIn` | integer | No | Seconds until the presigned upload URL expires |

### UploadResult

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | No | Object key (path) inside the bucket/container |
| `publicUrl` | string | No | Public URL for the uploaded object |

### ObjectMetadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | No |  |
| `size` | integer | No | File size in bytes |
| `lastModified` | string | No |  |
| `contentType` | string | No |  |
| `etag` | string | No |  |

### RepositoryStats

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableCount` | integer | Yes |  |
| `totalRows` | integer | Yes |  |
| `documentCount` | integer | Yes |  |
| `documentSizeBytes` | integer | Yes |  |

### RepositoryTableSummary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `table` | string | Yes |  |
| `rows` | integer | Yes |  |

### RepositoryTableList

### RepositorySyncTableResult

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `table` | string | Yes |  |
| `rowsSynced` | integer | Yes |  |

### RepositorySyncSummary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes |  |
| `tables` | array[RepositorySyncTableResult] | Yes |  |
| `syncedAt` | string | Yes |  |

### ReportView

Values: `monthly-release`, `line-item`, `distribution`, `aie`

### ReportCardAnalyticsResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `totalAie` | number | Yes |  |
| `totalExpenditure` | number | Yes |  |
| `aieItemCount` | integer | Yes |  |
| `totalFundInflow` | number | Yes |  |
| `distributions` | object | Yes |  |

### ReportMonthlyReleaseRow

### ReportLineItemRow

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes |  |
| `item` | string | Yes |  |
| `total` | number | Yes |  |

### ReportDistributionRow

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `state` | string | Yes |  |
| `allocation` | string | Yes |  |

### ReportQuery

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `view` | ReportView | Yes |  |
| `state` | string | No |  |
| `formation` | string | No |  |
| `budgetCode` | string | No |  |
| `from` | string | No |  |
| `to` | string | No |  |

### BudgetProposal

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier of the created budget proposal |
| `fiscalYear` | integer | No | The fiscal year for the budget proposal |
| `departmentId` | string | No | UUID of the associated department |
| `subItemId` | string | No | UUID of the associated sub-item |
| `amount` | number | No | The proposed amount |
| `status` | string | No | Current status of the budget proposal |
| `createdById` | string | No | UUID of the user who created the proposal |
| `createdAt` | string | No | Timestamp when the proposal was created |
| `updatedAt` | string | No | Timestamp when the proposal was last updated |
| `lineItemId` | string | No | UUID of the AIE line item this proposal targets |
| `justification` | string | No |  |
| `supportingDocumentKey` | string | No |  |
| `supportingDocumentUrl` | string | No |  |

### BudgetProposalItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lineItemId` | string | Yes | UUID of the AIE line item this proposal targets |
| `subItemId` | string | Yes | UUID of the budget sub-item code; must match the targeted line item's sub-item code |
| `amount` | number | Yes | The proposed amount for this specific line item (must be positive, max 2 decimal places) |

### CreateBudgetProposalRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | Yes | The fiscal year shared by all proposals in this submission (2000-2100) |
| `departmentId` | string | Yes | UUID of the department requesting the budget, shared by all items in this submission |
| `justification` | string | Yes | Justification shared across all line items in this submission |
| `supportingDocumentKey` | string | No | S3-style object key for a supporting document, shared across this submission |
| `supportingDocumentUrl` | string | No | URL for a supporting document, shared across this submission |
| `items` | array[BudgetProposalItem] | Yes | One or more AIE line items being requested against, each with its own amount |

### UpdateBudgetProposalRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No | The fiscal year for the budget proposal (2000-2100) |
| `departmentId` | string | No | UUID of the department this proposal belongs to |
| `subItemId` | string | No | UUID of the budget sub-item |
| `amount` | number | No | The proposed budget amount (must be positive, max 2 decimal places) |
| `description` | string | No | Detailed description or justification for the budget proposal |
| `supportingDocuments` | array[string] | No | Array of document IDs or URLs for supporting documentation |
| `notes` | string | No | Additional notes or comments about the budget proposal |

### RejectBudgetProposalRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Detailed reason for rejecting the budget proposal |

### FundInflowSource

Values: `FAAC ALLOCATION`, `SPECIAL INTERVENTION FUND`, `OTHERS`

### UpdateFundInflowRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No | The fiscal year for the fund inflow |
| `inflowDate` | string | No | The date of the fund inflow |
| `source` | string | No | The source category of the fund inflow |
| `referenceNo` | string | No | Reference number |
| `amount` | number | No | The amount of the fund inflow |
| `supportingDocuments` | array[string] | No | Supporting documentation references |
| `notes` | string | No | Additional notes |

### ExpenditureView

Values: `sub-item`, `distribution`, `aie`

### ExpenditureDistributionView

Values: `zone`, `formations`, `schools`, `summary`

### DistributionView

Values: `zone`, `formations`, `schools`, `summary`

### DistributionLineItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sno` | any | Yes |  |
| `desc` | string | Yes |  |
| `code` | string | Yes |  |
| `amounts` | array[number] | Yes | The first amount is used for the complete two-month distribution period. Additional legacy values are accepted but ignored. |

### DistributionZoneFormation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `sno` | string | Yes |  |
| `provision` | number | Yes |  |
| `snos` | array[string] | Yes | The first serial-number value is used. Additional legacy values are ignored. |
| `provisions` | array[number] | Yes | The first provision is used for the complete two-month period. Additional legacy values are ignored. |
| `items` | array[DistributionLineItem] | Yes |  |
| `totals` | array[number] | Yes | The first total is used for the complete two-month period. Additional legacy values are ignored. |

### DistributionZoneGroups

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `zone1_6` | array[DistributionZoneFormation] | Yes |  |
| `zone7_12` | array[DistributionZoneFormation] | Yes |  |
| `zone13_17` | array[DistributionZoneFormation] | Yes |  |

### DistributionZonePeriod

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Any month in YYYY-MM format. The API maps it to its fixed two-month period; for example, 2026-03 and 2026-04 both map to March-April 2026. |
| `label` | string | No | Generated by the API from id. Clients do not need to send this field. |
| `columns` | array[string] | Yes | The first display column is used for the complete two-month period. Additional legacy columns are ignored. |
| `data` | DistributionZoneGroups | Yes |  |

### DistributionSimpleItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sno` | string | Yes |  |
| `desc` | string | Yes |  |
| `code` | string | Yes |  |
| `amounts` | array[number] | Yes | The first amount is used for the complete two-month distribution period. Additional legacy values are accepted but ignored. |

### DistributionSimpleSection

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `provisions` | array[number] | Yes | The first provision is used for the complete two-month period. Additional legacy values are ignored. |
| `items` | array[DistributionSimpleItem] | Yes |  |

### DistributionSimplePeriod

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Any month in YYYY-MM format. The API maps it to its fixed two-month period; for example, 2026-03 and 2026-04 both map to March-April 2026. |
| `label` | string | No | Generated by the API from id. Clients do not need to send this field. |
| `columns` | array[string] | Yes | The first display column is used for the complete two-month period. Additional legacy columns are ignored. |
| `sections` | array[DistributionSimpleSection] | Yes |  |

### DistributionSummaryRow

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |
| `allocation` | number | Yes |  |
| `fromDist` | number | Yes |  |

### DistributionSummaryPeriod

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Any month in YYYY-MM format. The API maps it to its fixed two-month period; for example, 2026-05 and 2026-06 both map to May-June 2026. |
| `label` | string | No | Generated by the API from id. Clients do not need to send this field. |
| `rows` | array[DistributionSummaryRow] | Yes |  |

### DistributionPayload

A distribution covers one fixed two-month period and contains exactly one value per line item for that entire period.

### ReturnDistributionRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `remarks` | string | Yes |  |

### Department

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes |  |
| `name` | string | Yes |  |
| `isActive` | boolean | Yes |  |

### CreateDepartmentRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes |  |

### UpdateDepartmentRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No |  |

### ZoneComparisonEntry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `zoneId` | string | No |  |
| `zoneName` | string | No |  |
| `totalAmount` | number | No |  |
| `itemCount` | integer | No |  |

### PeriodComparisonEntry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | No |  |
| `fiscalYear` | integer | No |  |
| `month` | integer | No |  |
| `totalAmount` | number | No |  |
| `count` | integer | No |  |

### AmountSummary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `totalAmount` | number | No |  |
| `count` | integer | No |  |

### AieLineItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `itemCode` | string | Yes | GIFMIS item code category |
| `subItemCode` | string | Yes | Sub-item code belonging to the selected item category |
| `amount` | number | Yes | Amount for the line item |

### UpdateAieRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYear` | integer | No | The fiscal year for the AIE |
| `aieNo` | string | No | AIE reference number |
| `issueDate` | string | No | The date the AIE is issued |
| `expiresOn` | string | No | Expiry date (must be after issueDate) |
| `recipientUnit` | string | No | The recipient unit/department |
| `lineItems` | array[AieLineItem] | No | Line items for the AIE (fully replaces existing line items) |

### RejectAieRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Reason for rejecting the AIE |

### AieStatus

Current workflow status of the AIE

Values: `DRAFT`, `PENDING_REVIEW`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
