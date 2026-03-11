# Admin Authorization System Setup

## Overview
This project now includes a secure admin authorization system that protects quest (event) creation and deletion functionality. Only authenticated administrators can create or delete quests, while regular users can view and apply to quests.

## Initial Setup

### 1. Install Dependencies
After this implementation, install the new `dotenv` package:
```bash
npm install
```

### 2. Configure Admin Credentials
The `.env` file already exists in the root directory with placeholder credentials:
```
ADMIN_ID=admin@example.com
ADMIN_PASSWORD=supersecurepassword
```

- **Important:** Replace these with your actual admin credentials before deploying:
- `ADMIN_ID`: The admin user's email or identifier
- `ADMIN_PASSWORD`: A secure password for the admin account

**Never commit the `.env` file to version control.** It's already listed in `.gitignore`.

## How It Works

### Authentication Flow
1. When logging in, the server checks if credentials match `ADMIN_ID` and `ADMIN_PASSWORD` from the `.env` file
2. If they match, the server **finds or creates** a corresponding `User` record (username is the same as `ADMIN_ID`), then marks the session with `isAdmin: true`. This ensures the admin behaves like any normal user in the system.
3. Normal user credentials are validated against the database as usual
4. Admin users receive an `isAdmin` flag in their session and API responses

### Protected Routes
- **POST /api/events** (Create Quest): Admin only
- **DELETE /api/events/:id** (Delete Quest): Admin only
- **GET /api/admin/dashboard**: Admin only

### Public Routes (Unchanged)
- **GET /api/events**: All authenticated users can view quests
- **POST /api/events/:id/apply**: All authenticated users can apply to quests
- All other existing functionality remains unchanged

## Frontend Changes
The admin dashboard navigation link ("Faculty Command") now appears in the sidebar only when logged in as an admin user.

## Testing the System

### As Admin:
1. Log in with the credentials from `.env` (ADMIN_ID and ADMIN_PASSWORD)
2. The "Faculty Command" link should appear in the sidebar
3. You should be able to create and delete quests

### As Regular User:
1. Log in with any registered user account
2. The "Faculty Command" link should NOT appear
3. Attempting to create a quest via API returns: `403 - Admin access required`
4. Attempting to delete a quest via API returns: `403 - Admin access required`

## Security Notes
- Admin credentials are never hardcoded in the application
- They are read securely from the `.env` file at runtime
- Session marks users as admin, not the request body
- All existing user functionality is preserved and unmodified
- Non-admin users get appropriate 403 responses when trying admin actions

## Environment Variables
The `.env` file is loaded automatically when the server starts. The required variables are:
- `ADMIN_ID`: Admin identifier/email
- `ADMIN_PASSWORD`: Admin password

Other variables can be added to the `.env` file as needed (e.g., `SESSION_SECRET`, `PORT`, database URLs, etc.)
