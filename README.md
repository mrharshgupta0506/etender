## E-Tender Platform (MVP)

Minimal web-based E-Tender platform with Admin and Bidder roles.

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, Nodemailer
- **Frontend**: React 18, Vite, React Router, Axios, Tailwind CSS

### 1. Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env`**
   ```bash
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/etender
   JWT_SECRET=super-secret-jwt-key

   # Single company
   COMPANY_ID=COMPANY_1

   # Seed admin user
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=Admin@123

   # SMTP (Nodemailer)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-pass
   SMTP_FROM="E-Tender Platform <no-reply@example.com>"

   # Frontend base URL for deep links
   FRONTEND_BASE_URL=http://localhost:5173
   ```

3. **Run backend**
   ```bash
   npm run dev
   ```

   - Server runs on `http://localhost:4000`
   - On first start, an Admin user is seeded using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 2. Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API base URL**
   - Create `frontend/.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:4000
   ```

3. **Run frontend**
   ```bash
   npm run dev
   ```

   - App runs on `http://localhost:5173`

### 3. Core Flows

- **Authentication**
  - `POST /auth/login` with `email`, `password`
  - `POST /auth/change-password` (JWT-protected)

- **Admin (Tender Creator)**
  - Login with seeded admin credentials.
  - Create tenders with:
    - `name`, `description`, optional `startBidPrice`, `maxBidPrice`
    - `startDate`, `endDate`
    - `invitedEmails` (comma-separated)
  - Edit tender only before `startDate`.
  - Set status to `published` to send invitation emails.
  - View all tenders with status (Upcoming / Active / Closed / Awarded) and bid count.
  - View tender details + all bids.
  - After `endDate`, award tender to a bid (winner email sent to all bidders).

- **Bidder**
  - Receives tender invitation email with link (`/tenders/:id`) and, if new, login credentials.
  - Can see only invited tenders on **Bidder Dashboard** (`/bidder`).
  - From tender details:
    - See tender info and all submitted bids.
    - Create **one** bid per tender.
    - Edit own bid until tender `endDate`.
    - Bid amount validated against min/max if set.
  - After award, can see winning bidder and result (Won/Lost) in dashboard.

### 4. Dashboards & Pages

- **Login Page**
  - Email + password, redirects:
    - Admin → `/admin`
    - Bidder → `/bidder`
  - Preserves direct tender links: visiting `/tenders/:id` while unauthenticated sends you to login and then back to that tender after successful login.

- **Admin Dashboard (`/admin`)**
  - Table of all tenders with status badge and bid count.
  - Actions: Create, Edit (before start date), View details.

- **Tender Create/Edit (`/admin/tenders/new`, `/admin/tenders/:id/edit`)**
  - Full tender form and status (draft/published).
  - Edit disabled once the tender start date has passed.

- **Tender Details (`/tenders/:id`)**
  - Shared view for Admin and invited Bidders.
  - Shows tender info, all bids, and (for bidders) a bid create/edit form.
  - Admin can award a bid after end date; winner is highlighted.

- **Bidder Dashboard (`/bidder`)**
  - Lists invited tenders.
  - Shows tender status, bidder’s own bid, and tender result (Won/Lost/Closed).

- **Change Password (`/change-password`)**
  - Available to both roles (protected route).

### 5. Auth & Routing

- **JWT storage**: token + user info stored in `localStorage` (`etender_auth`).
- **Protected routes**:
  - `ProtectedRoute` checks for auth and optional `role` (admin | bidder).
  - Redirects to role-appropriate dashboard or login.

### 6. Notes

- SMTP settings must be valid for emails to send; if not configured, the backend logs email actions to the console instead.
- Company is hardcoded via `COMPANY_ID` as per single-company assumption.
- No payments or extra features beyond the spec have been added.


