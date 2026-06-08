# CLance Solutions - Vendor Management System (VMS)

A full-stack Vendor Management System built with React, TypeScript, Express, and MongoDB. The application provides role-based portals for Administrators, Financial Managers, and Vendors to manage vendor relationships, invoices, purchase requests, and onboarding workflows.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend**: Express.js, TypeScript
- **Database**: MongoDB (via MongoDB Node.js driver)
- **Icons**: Lucide React
- **Runtime**: Node.js with tsx for development

## Project Structure

```
clance-solutions-vms/
├── server.ts                 # Express server entry point, API routes, Vite middleware
├── vite.config.ts            # Vite configuration with React and Tailwind plugins
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and npm scripts
├── server/
│   ├── db.ts                 # MongoDB connection management
│   └── seed.ts               # Database seeding with initial users, vendors, invoices, purchases
├── src/
│   ├── main.tsx              # React app entry point
│   ├── App.tsx               # Root component, state management, routing logic
│   ├── types.ts              # TypeScript interfaces (Vendor, Invoice, PurchaseRequest, etc.)
│   ├── index.css             # Global styles, theme variables, scrollbar styles
│   ├── config/
│   │   └── roles.ts          # Role definitions, menu items, access control
│   ├── context/
│   │   ├── ThemeContext.tsx  # Theme (light/dark/system) and scrollbar toggle state
│   │   ├── ToastContext.tsx  # Toast notification system
│   │   └── ConfirmContext.tsx # Confirmation dialog system
│   └── components/
│       ├── Header.tsx        # Top navigation bar with theme and scrollbar toggles
│       ├── Sidebar.tsx       # Side navigation menu
│       ├── BottomNav.tsx     # Mobile bottom navigation
│       ├── LoginView.tsx     # Login page with role selection
│       ├── OnboardingView.tsx # Vendor self-registration form
│       ├── AdminOnboardingView.tsx # Admin view for reviewing registrations
│       ├── DashboardView.tsx # Admin dashboard with stats and recent activity
│       ├── VendorDirectoryView.tsx # Admin vendor list view
│       ├── VendorDetailView.tsx # Admin individual vendor detail view
│       ├── PaymentsView.tsx  # Financial Manager invoices and purchase requests
│       ├── VendorPortalView.tsx # Vendor self-service portal
│       ├── StatusBadge.tsx   # Reusable status indicator component
│       ├── ThemeToggle.tsx   # Light/dark/system theme switcher
│       ├── ToastStack.tsx    # Toast notification container
│       └── Modal.tsx         # Reusable modal dialog
└── README.md
```

## Features

### Role-Based Access

The system supports three user roles, each with a dedicated portal:

- **Admin**: Full access to dashboard, vendor directory, and onboarding management
- **Financial Manager**: Access to invoices, payments, and purchase request management
- **Vendor**: Access to their own portal with invoices, purchase requests, catalog management, and profile editing

### Admin Portal

- **Dashboard**: Overview of total vendors, pending registrations, invoice metrics, and recent activity
- **Vendor Directory**: Searchable list of all vendors with detail view access
- **Vendor Detail**: View vendor information, linked invoices, and catalog items
- **Onboarding**: Review and approve or reject vendor registration requests with document verification

### Financial Manager Portal

- **Invoices**: Create, edit, and delete invoices. Track pending, paid, and overdue statuses
- **Purchase Requests**: Create purchase requests to vendors, select items with quantities, track approval and delivery status

### Vendor Portal

- **Overview**: Summary of invoices, outstanding amounts, and purchase request status
- **Invoices**: View all invoices linked to the vendor
- **Purchase Requests**: View and update status of purchase requests received
- **Catalog**: Manage the list of items/products the vendor offers, including name, price, and description
- **Profile**: Update company contact information, address, and phone number

### Input Validation

- All numeric inputs (amounts, quantities, prices) reject negative numbers and invalid characters
- Phone inputs accept only valid phone characters (digits, +, spaces, parentheses, hyphens, dots)
- All placeholder texts have been removed from form inputs

### Scrollbar Control

- A toggle in the header allows users to show or hide scrollbars globally
- Preference is persisted in localStorage

### Theme Support

- Light, dark, and system preference modes
- Theme preference is persisted in localStorage

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (local instance or MongoDB Atlas connection string)
- npm or yarn

### Installation

1. Clone or navigate to the project directory:

   ```
   cd /Users/kushalthapa/Desktop/clance-solutions-vms
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the project root with the following variables:

   ```
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB_NAME=clance_vms
   PORT=3000
   ```

   - `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017` or Atlas URI)
   - `MONGODB_DB_NAME`: The database name (defaults to `clance_vms` if not set)
   - `PORT`: Server port (defaults to `3000` if not set)

## Running the Application

### Development Mode

Start the development server with hot reloading:

```
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

Build the frontend and bundle the server:

```
npm run build
```

Start the production server:

```
npm start
```

### Preview Production Build

Preview the built frontend:

```
npm run preview
```

## Available Scripts

| Script            | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Start development server with Vite middleware and tsx   |
| `npm run build`   | Build frontend with Vite and bundle server with esbuild |
| `npm start`       | Run the production server from `dist/server.cjs`        |
| `npm run preview` | Preview the production frontend build                   |
| `npm run clean`   | Remove build output directories                         |
| `npm run lint`    | Run TypeScript type checking (no emit)                  |

## Database Seeding

The application automatically seeds the database with initial data on every server start. The seed data includes:

### Users

| Email                   | Password        | Role             | Name                |
| ----------------------- | --------------- | ---------------- | ------------------- |
| admin@clance.com        | admin123        | Admin            | Admin               |
| finance@clance.com      | finance123      | FinancialManager | Maria Chen          |
| finance2@clance.com     | financepassword | FinancialManager | Alex Rivera         |
| partner@techflow.com    | vendor123       | Vendor           | Sarah J. Montgomery |
| supplier@dishome.com.np | vendorpassword  | Vendor           | Sujan Chhetri       |

### Vendors

- TechFlow Solutions Inc. (Cloud Services)
- AWS (Cloud Services)
- Dishome Fibernet (ISP / Network)

Each vendor includes a catalog of items with names, prices, and descriptions.

### Invoices

Three sample invoices with varying statuses (Paid, Pending, Overdue) linked to vendors.

### Purchase Requests

Two sample purchase requests demonstrating item selection and quantity tracking.

### Registrations

One pending vendor registration with uploaded document filenames for admin review.

**Note**: The seed script clears all collections before inserting data, so running the server will reset the database to the initial state.

## Key Workflows

### User Login

1. Navigate to the application
2. Select a role (Admin, Financial Manager, or Vendor)
3. Enter email and password
4. Click "Sign in"
5. The user is directed to their role-specific default view

### Vendor Self-Registration

1. From the login page, click "Register as vendor"
2. Fill in company details, contact information, and address
3. Upload business license and W-9 documents
4. Submit the registration
5. The registration appears in the Admin onboarding queue for review

### Admin Onboarding Review

1. Navigate to the Onboarding section
2. View pending registrations with uploaded document filenames
3. Click "Approve" to create a vendor record and user account, or "Reject" to decline

### Creating a Purchase Request (Financial Manager)

1. Navigate to the Payments section
2. Switch to the "Purchase Requests" tab
3. Click "New Purchase Request"
4. Select a vendor from the dropdown
5. Browse the vendor's catalog items and set quantities
6. The total amount is calculated automatically
7. Submit the request
8. The vendor can view and update the status in their portal

### Managing Catalog Items (Vendor)

1. Navigate to the Vendor Portal
2. Go to the "Catalog" tab
3. Add new items with name, price, and description
4. Edit or remove existing items
5. Price inputs accept only valid numeric values

### Updating Vendor Profile (Vendor)

1. Navigate to the Vendor Portal
2. Go to the "Profile" tab
3. Edit company name, category, contact name, email, phone, or address
4. Phone input accepts only valid phone characters
5. Save changes to update the vendor record

## API Endpoints

### Authentication

- `POST /api/auth/login` - Authenticate user with email, password, and role

### Vendors

- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id` - Get a specific vendor
- `POST /api/vendors` - Create a new vendor
- `PUT /api/vendors/:id` - Update a vendor
- `DELETE /api/vendors/:id` - Delete a vendor

### Invoices

- `GET /api/payments` - List all invoices
- `POST /api/invoices` - Create a new invoice
- `PUT /api/invoices/:id` - Update an invoice
- `DELETE /api/invoices/:id` - Delete an invoice

### Registrations

- `GET /api/registrations` - List all registrations
- `POST /api/registrations` - Create a new registration
- `POST /api/registrations/approve` - Approve a registration (creates vendor)
- `POST /api/registrations/reject` - Reject a registration

### Purchase Requests

- `GET /api/purchases` - List all purchase requests
- `POST /api/purchases` - Create a new purchase request
- `PUT /api/purchases/:id` - Update a purchase request
- `DELETE /api/purchases/:id` - Delete a purchase request

### Health Check

- `GET /api/health` - Check database connection and list collections

## Environment Variables

| Variable          | Required | Description                    | Default       |
| ----------------- | -------- | ------------------------------ | ------------- |
| `MONGODB_URI`     | Yes      | MongoDB connection string      | -             |
| `MONGODB_DB_NAME` | No       | Database name                  | `clance_vms`  |
| `PORT`            | No       | Server port                    | `3000`        |
| `NODE_ENV`        | No       | Environment mode               | `development` |
| `DISABLE_HMR`     | No       | Disable hot module replacement | `false`       |

## Type Definitions

Key TypeScript interfaces are defined in [`src/types.ts`](src/types.ts):

- `Vendor` - Vendor record with optional catalog items
- `VendorItem` - Individual item in a vendor catalog (name, price, description)
- `Invoice` - Invoice record with vendor reference, amount, date, and status
- `Registration` - Vendor onboarding registration with document metadata
- `PurchaseRequest` - Purchase request with line items, quantities, and status
- `UserInfo` - Authenticated user information with role and optional vendorId

## Browser Support

The application uses modern CSS features (oklch color space, CSS custom properties) and requires a modern browser. Recommended: latest versions of Chrome, Firefox, Safari, or Edge.
