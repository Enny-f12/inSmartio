# inSmartio Admin Dashboard

## 1) Project overview

This repo is the internal admin console for the inSmartio platform.

The application is an internal tool for administrators. The dashboard is built around role-based access, with permissions defined per admin role such as `admin`, `verification`, `finance`, `support`, and `view`.

From the code, the main operational domains are:
- Users: list/search/filter user records; view detail; suspend/reactivate; delete; create/assign users
- Jobs: view job records and manage related operations
- Verifications: review expert verification submissions, select verify or reject documnets when viewed
- Tas management- view and approve tas, check active tas to see number of expert onboarded and their details
- Payments and payouts: view balances, escrows, refunds, payouts
- Disputes: review cases and resolution flows
- Reports: user growth, revenue trend, top categories, cities, verification and analysis exports
- Settings: categories, announcements, banners, FAQ, notifications, commission settings, admins, app version, waitlist, subscription management
- Audit logs: admin action logs for visibility and auditing
- settings:
1. categories management: add categories and select icons related to the categories and sub-categories
2. commission: set commission models, percentage, tier range and progress stat
3. Banner management: Upload banners in 2:1. crop added
4. app version: set app-version
5. faq management : faq management for different roles
notification settings
6. admin management: add admin for diffrent roles and turn on 2fa
7. Announceent mangement
8. Notification template


## 2) Tech stack

This is based directly on the package.json and source imports in the repo.

### Frontend / app framework
- Next.js: `16.2.6`
- React: `19.2.4`
- React DOM: `19.2.4`
- TypeScript: `^5`
- App Router: used via `app/` directory with route groups like `(auth)` and `(dashboard)`

### State management
- Redux Toolkit: `^2.11.2`
- React Redux: `^9.2.0`
- Global state is split into many slices under `lib/redux/*.ts`


### Styling and UI
- Tailwind CSS: `^4`
- Custom CSS in `app/globals.css` and component-level inline styles
- Lucide React icon library: `^1.16.0`
- Sonner: `^2.0.7` for toast notifications


### API and auth
- Axios: `^1.16.1`
- js-cookie: `^3.0.5` for token persistence
- Cookie-based auth token stored as `token`

### Media and uploads
- Cloudinary: `^2.10.0`
- `react-image-crop`: `^11.0.10`

### Tooling
- ESLint: `^9`
- `eslint-config-next`: `16.2.6`
- `@tailwindcss/postcss`: `^4`
- TypeScript types for Node, React, and js-cookie

## 3) Folder and file structure

```text
help-me-admin/
├── app/
│   ├── globals.css                  # Global styling, theme variables, app-wide CSS
│   ├── layout.tsx                   # Root layout; wraps app with Redux provider and Sonner
│   ├── page.tsx                     # Redirects to login screen
│   ├── providers.tsx                # Redux Provider wrapper
│   ├── (auth)/
│   │   ├── layout.tsx               # Shared auth page layout (if present)
│   │   ├── login/page.tsx           # Admin login screen and 2FA flow
│   │   ├── forgot-password/page.tsx # Password reset request screen
│   │   └── reset-password/page.tsx  # OTP/password reset confirmation screen
│   └── (dashboard)/
│       ├── layout.tsx               # Sidebar + app shell for authenticated admin routes
│       ├── audit-log/page.tsx       # Audit log table and export views
│       ├── bid/page.tsx             # Bid management dashboard
│       ├── dashboard/page.tsx       # Main admin overview analytics dashboard
│       ├── dispute/page.tsx         # Dispute review and management
│       ├── jobs/page.tsx            # Job listing and management pages
│       ├── payments/page.tsx        # Escrow, payouts, refunds, balances
│       ├── profile/page.tsx         # Admin profile/account area
│       ├── report/page.tsx          # Report generation and downloads
│       ├── reports/page.tsx         # Detailed reports panel and report dashboards
│       ├── settings/page.tsx        # Settings hub; permission-gated subviews
│       ├── tas/page.tsx             # TAS management and verification screens
│       ├── users/page.tsx           # User management UI
│       └── verifications/page.tsx   # Expert verification review flows
│
├── components/
│   ├── audit/
│   │   └── AuditlogWidget.tsx       # Widget used for recent audit activity
│   ├── bid/
│   │   ├── CancellationFeeDetailModal.tsx
│   │   ├── DisputeFlaggingPanel.tsx
│   │   ├── ExportModal.tsx
│   │   ├── MockData.ts
│   │   ├── NotificationLogPanel.tsx
│   │   ├── types.ts
│   │   ├── WaiveFeeModal.tsx
│   │   └── …
│   ├── dashboard/
│   │   └── DashboardLineChart.tsx   # Reusable chart for KPI dashboards
│   ├── disputes/
│   │   ├── DisputeBadges.tsx
│   │   ├── Disputedetail.tsx
│   │   └── types.ts
│   ├── jobs/
│   │   ├── Jobdetails.tsx
│   │   └── types.ts
│   ├── layout/
│   │   ├── Navbar.tsx               # Topbar with profile, notifications, logout, role info
│   │   ├── Sidebar.tsx              # Sidebar navigation and permission filtering
│   │   └── SidebarWrapper.tsx       # Wrapper used by dashboard layout
│   ├── payments/
│   │   ├── EscrowReleasetab.tsx
│   │   ├── PaymentBadges.tsx
│   │   ├── Payouttabs.tsx
│   │   ├── Refundstab.tsx
│   │   ├── Transactionstab.tsx
│   │   └── types.ts
│   ├── report/(dormant for now)
│   │   ├── DonutChart.tsx           # Donut chart visualizations
│   │   ├── LineChart.tsx            # Line chart visualizations
│   │   ├── ReportCard.tsx           # Report summary cards
│   │   ├── ReportControls.tsx       # Date / report filter controls
│   │   ├── ReportTemplatesSection.tsx
│   │   ├── ScheduledReportSection.tsx
│   │   └── types.ts
│   ├── reports/
│   │   ├── DashboardLineChart.tsx   # Another report dashboard chart component(fuctional)
│   │   ├── ExpertDetailsReport.tsx
│   │   ├── ExportMenuButton.tsx
│   │   ├── mockData.ts
│   │   ├── ReportDashboard.tsx
│   │   ├── ReportPicker.tsx
│   │   ├── ReportTable.tsx
│   │   ├── ReportTemplates.tsx
│   │   ├── RowDetailModal.tsx
│   │   ├── rowUtils.tsx
│   │   ├── ScheduledReport.tsx
│   │   ├── shared.ts
│   │   ├── Skeleton.tsx
│   │   ├── TASDetailModal.tsx
│   │   ├── TASPerformanceReport.tsx
│   │   ├── TransactionDetailReport.tsx
│   │   ├── UserGrowthReport.tsx
│   │   ├── VerificationDetailModal.tsx
│   │   └── VerificationReport.tsx
│   ├── settings/
│   │   ├── AdminManagement.tsx
│   │   ├── AnnouncementManagement.tsx
│   │   ├── AppVersion.tsx
│   │   ├── BannerImageUploader.tsx
│   │   ├── BannerManagement.tsx
│   │   ├── CategoriesMnagement.tsx
│   │   ├── CommisionSettings.tsx
│   │   ├── FaqManagement.tsx
│   │   ├── NotificationSettings.tsx
│   │   ├── Notification.tsx
│   │   ├── SubscriptionManagement.tsx
│   │   ├── types.ts
│   │   ├── WaitlistManagement.tsx
│   │   └── …
│   ├── tas/
│   │   └── …                         # TAS onboarding and management screens
│   ├── ui/
│   │   └── …                         # Shared modal/loading styles and UI primitives
│   ├── users/
│   │   ├── AddUserModal.tsx
│   │   ├── Shared.tsx
│   │   ├── UserDetail.tsx
│   │   └── …
│   ├── verifications/
│   │   └── …                         # Verification review UIs and detail modals
│   └── …
│
├── context/
│   └── SidebarContext.tsx            # Collapsible mobile/desktop sidebar state
│
├── hooks/
│   ├── redux.ts                      # Typed Redux hooks
│   └── usePermissions.ts             # Role-based permission access helper
│
├── lib/
│   ├── adminPermissions.ts           # Role definitions and permission matrix
│   ├── api/
│   │   ├── axiosInstance.ts          # Shared Axios client with base URL and auth token handling
│   │   ├── authApi.ts                # Login, forgot password, reset password calls
│   │   ├── usersApi.ts               # Fetch/create/delete/suspend users
│   │   ├── jobApi.ts                 # Job and admin job endpoints
│   │   ├── paymentApi.ts             # Payment, escrow, payout logic
│   │   ├── reportApi.ts              # Report queries and download endpoints
│   │   ├── verificationApi.ts        # Verification review APIs
│   │   ├── dashboardApi.ts           # Dashboard summary/alerts endpoints
│   │   ├── adminApi.ts               # Admins CRUD and role management
│   │   ├── announcementApi.ts
│   │   ├── bannerApi.ts
│   │   ├── bidApi.ts
│   │   ├── categoriesApi.ts
│   │   ├── commissionApi.ts
│   │   ├── disputeApi.ts
│   │   ├── faqApi.ts
│   │   ├── notificationApi.ts
│   │   ├── notificationSettingsApi.ts
│   │   ├── reportTemplateApi.ts
│   │   ├── scheduledReportApi.ts
│   │   ├── subscriptionApi.ts
│   │   ├── tasApi.ts
│   │   ├── tastierApi.ts
│   │   ├── verificationSettingsApi.ts
│   │   ├── upload/
│   │   │   └── api.ts                # Cloudinary upload helper utility
│   │   └── …
│   └── redux/
│       ├── authSlice.ts              # Auth state, login thunk, logout
│       ├── usersSlice.ts             # Users list/detail/suspend/delete actions
│       ├── reportSlice.ts            # Charts/data for reports
│       ├── jobSlice.ts               # Jobs state
│       ├── paymentSlice.ts           # Payments and balances
│       ├── dashboardSlice.ts         # Dashboard alerts/activity
│       ├── store.ts                 # Redux store assembly
│       ├── …                        # Many domain slices for settings, disputes, waitlist, etc.
│       └── counterSlice.ts           # Example/basic reducer kept in repo
│
├── public/
│   ├── login/                        # Login hero images
│   ├── logo/                         # App branding assets
│   └── …
│
├── docs/
│   └── README.md                     # Project handoff documentation (this file)
│
├── .env.local                        # Local environment variables for this app
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
├── .next/                            # Local Next build cache (generated)
├── node_modules/                     # Installed dependencies (generated)

```



## 5) Core logic and architecture

### Authentication flow
The actual auth flow is implemented in:
- `app/(auth)/login/page.tsx`
- `lib/redux/authSlice.ts`
- `lib/api/authApi.ts`
- `lib/api/axiosInstance.ts`

Behavior:
1. User enters email/password and optionally a 2FA code.
2. `dispatch(login(...))` triggers the `auth/login` thunk.
3. `adminLogin()` posts to `/admin/login` using the Axios instance.
4. On success, the token is saved to the `token` cookie via `Cookies.set(...)` and the Redux state is updated.
5. On failure, the thunk checks whether the backend explicitly says 2FA is required and sets `requires2FA` instead of treating it as a hard failure.
6. The login component then redirects to `/dashboard` when `status === "succeeded"`.
7. The Axios interceptor attaches the token as `Authorization: Bearer <token>` for each request.
8. If the server returns a 401 because the token is expired/invalid, the app clears the cookie and redirects to `/login`.



### Route and app shell structure
- Root app layout wraps the app in Redux provider and a global toaster.
- `app/(auth)` is for login/forgot/reset screens.
- `app/(dashboard)` is for authenticated dashboard pages and includes the main layout with a sidebar.
- The dashboard shell is defined in `app/(dashboard)/layout.tsx` and uses `SidebarProvider` + `SidebarWrapper`.
- The `Sidebar` component reads the current admin role from Redux auth state and filters menu items using `getPermissions(role)`.

### Permission model
The permission model lives in `lib/adminPermissions.ts`.

The role map currently includes:
- `admin`
- `verification`
- `finance`
- `support`
- `view`

Permissions are mapped to boolean flags like:
- `canViewUsers`
- `canViewJobs`
- `canViewPayments`
- `canApproveVerification`
- `canManageAnnouncements`
- `canManageAppVersion`

The app uses these permissions both for:
- sidebar visibility
- settings-view visibility
- conditional rendering of action buttons and protected sections

### Data fetching pattern
Most features follow a consistent pattern:
1. Redux slice defines state: list, selected item, loading status, error
2. API helper module defines HTTP calls under `lib/api/*.ts`
3. Thunk dispatches request and fills slice state
4. Page component reads Redux state and renders UI
5. Modals/components trigger thunks for create/update/delete/suspend actions

Examples:
- `lib/redux/usersSlice.ts` + `lib/api/usersApi.ts`
- `lib/redux/reportSlice.ts` + `lib/api/reportApi.ts`
- `lib/redux/paymentSlice.ts` + `lib/api/paymentApi.ts`
- `lib/redux/dashboardSlice.ts` + `lib/api/dashboardApi.ts`
- `lib/redux/authSlice.ts` + `lib/api/authApi.ts`

### State management structure
The Redux store is assembled in `lib/redux/store.ts`.

The store includes many domain reducers, for example:
- `auth`
- `users`
- `jobs`
- `payments`
- `report`
- `dashboard`
- `disputes`
- `banners`
- `announcements`
- `verificationSettings`
- `auditLogs`
- `bids`
- `appVersion`
- `clientRefund`
- `expertPayout`
- `cloud`
- `subscription`
- `waitlist`
- `reportDetail`

This is a classic Redux Toolkit setup with one slice per feature, not a modular entity adapter approach.


## Key Features

### ✅ Dashboard
- Real-time metrics and KPIs
- Chart visualizations (line, bar, pie)
- Quick action widgets

### ✅ Jobs Management
- Advanced filtering (status, category, date, amount)
- Bulk operations (assign, cancel, export)
- Job detail view with history
- Search with autocomplete
- Responsive table & card views

### ✅ Expert Management
- Expert profiles with ratings
- Availability status
- Assignment history
- Performance metrics

### ✅ Client Management
- Client information
- Job posting history
- Payment records
- Communication logs

### ✅ Analytics & Reporting
- Performance metrics
- Job completion rates
- Revenue analytics
- Export to PDF/CSV

### ✅ Authentication & Security
- JWT-based authentication
- Role-based access control (RBAC)
- Route protection with middleware
- Secure token storage

### ✅ Responsive Design
- Mobile-optimized UI
- Tablet-friendly layouts
- Desktop dashboard view
- Touch-friendly interactions

