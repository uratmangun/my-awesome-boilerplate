# Clerk Authentication Integration Guide

This document explains how Clerk authentication has been integrated into this React + Vite boilerplate project.

## Frontend Integration

### 1. Dependencies
- Added `@clerk/clerk-react` package to the project
- No additional dependencies were required

### 2. Provider Setup
- Wrapped the application with `<ClerkProvider>` in `src/App.tsx`
- Uses `VITE_CLERK_PUBLISHABLE_KEY` environment variable for the publishable key

### 3. Login UI
- Added Clerk's `<SignIn>` component to the HomePage
- Component is configured with `routing="path"` and `path="/sign-in"`

## Environment Variables

### Required Variables
- `VITE_CLERK_PUBLISHABLE_KEY` - This is used in the frontend and should be added to your deployment environment

### Backend Variables
- `CLERK_SECRET_KEY` - This is used only in backend services and should NEVER be exposed to the frontend
- Currently not used in this codebase as there is no backend integration

## Deployment Configuration

### GitHub Actions
- Updated `.github/workflows/deploy.yml` to include `VITE_CLERK_PUBLISHABLE_KEY` in the build environment
- The variable is passed as a secret during deployment to Cloudflare Pages

### Manual Setup Required
1. Create a Clerk account at [https://clerk.com](https://clerk.com)
2. Create a new application in your Clerk dashboard
3. Get your publishable key from the Clerk dashboard
4. Add `VITE_CLERK_PUBLISHABLE_KEY` as a GitHub secret in your repository settings
5. For local development, add the key to your `.env` file (copy from `.env.example`)

## Security Notes
- Never expose `CLERK_SECRET_KEY` in frontend code
- Always use the `VITE_` prefix for frontend environment variables in Vite projects
- The secret key should only be used in backend services when needed

## Testing
- The login UI should be visible on the HomePage
- You can test the integration by signing in with Clerk's test users or by creating a new account

## Future Enhancements
- Add backend integration with Deno Deploy if needed
- Implement user session management
- Add protected routes based on authentication status
