# Implementation Plan

- [x] 1. Install Clerk React SDK
  - Add @clerk/clerk-react as a project dependency using pnpm
  - Verify compatibility with existing React version
  - _Requirements: 1.1_

- [x] 2. Configure Clerk Provider
  - Wrap the application with ClerkProvider in main.tsx
  - Set up proper environment variable handling for CLERK_PUBLISHABLE_KEY
  - Ensure provider is configured correctly for Vite environment
  - _Requirements: 1.1, 2.1_

- [x] 3. Implement Sign In Button Component
  - Create or modify component to use Clerk's SignInButton
  - Position component in the top right corner of HomePage
  - Add proper styling to match existing UI
  - _Requirements: 1.1, 3.1_

- [x] 4. Update Theme Toggle Button Position
  - Move existing ThemeToggle component to top left corner of HomePage
  - Ensure proper styling and positioning relative to other header elements
  - _Requirements: 3.2_

- [x] 5. Add Add Project Button with Conditional Rendering
  - Create "Add Project" button component below search input
  - Implement conditional rendering logic based on authentication state
  - Add username check to only show for "uratmangun"
  - _Requirements: 3.3, 4.1, 4.2, 4.3_

- [x] 6. Update Environment Variables Configuration
  - Add CLERK_PUBLISHABLE_KEY to .env.example file
  - Ensure variable uses VITE_ prefix for Vite framework compatibility
  - Document the variable purpose in the example file
  - _Requirements: 2.2_

- [x] 7. Update Cloudflare Pages Deployment Workflow
  - Modify .github/workflows/deploy.yml to include Clerk environment variables
  - Follow existing pattern for environment variable inclusion
  - Ensure variables are properly mapped for deployment
  - _Requirements: 2.3_

- [x] 8. Verify Integration and Security
  - Test authentication flow locally
  - Confirm CLERK_SECRET_KEY is not exposed to client
  - Verify conditional rendering works correctly for different user states
  - _Requirements: 1.2, 4.1, 4.2, 4.3_
