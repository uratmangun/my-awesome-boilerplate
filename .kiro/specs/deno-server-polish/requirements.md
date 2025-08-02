# Deno Server Polish Requirements

## Introduction

This specification targets polishing the local Deno server so the React front-end at `localhost:5173` can interact with it reliably. Focus areas are:

1. Robust CORS middleware for every function route
2. Secure access to `REDIS_URL` via environment variables loaded from `.env`
3. A new `get-item` endpoint to fetch a single Redis value by ID
4. Improved front-end UX replacing plain alerts with notifications and adding an "Item by ID" form

## Requirements

### R1. Universal CORS Support

**User Story:** As a front-end developer, I want correct CORS headers on all API routes, so that my React app can call them without browser blocks.

#### Acceptance Criteria

1. WHEN any client on `localhost:5173` sends **GET/POST/PUT/DELETE** to `/api/*` or `/functions/*` THEN the system SHALL include `Access-Control-Allow-Origin:*` (or configured origin).
2. WHEN a pre-flight **OPTIONS** request is received THEN the system SHALL respond **204** with required `Access-Control-Allow-*` headers.
3. WHEN middleware runs THEN the system SHALL NOT duplicate CORS headers.

### R2. Environment Variable Accessibility

**User Story:** As a developer, I want the Deno server to read `REDIS_URL` from `.env`, so that I can run locally without manual flags.

#### Acceptance Criteria

1. WHEN the dev script starts THEN the system SHALL run with `--allow-env`.
2. WHEN `.env` exists THEN the system SHALL load variables before Redis client initialisation.
3. WHEN `REDIS_URL` is absent THEN the system SHALL log an error and exit non-zero.

### R3. Get-Item Endpoint

**User Story:** As an API consumer, I want to retrieve a Redis item by its ID, so that I can display it in the UI.

#### Acceptance Criteria

1. WHEN a **GET** request hits `/api/get-item/:id` THEN the system SHALL fetch the value and return `{ id, value }` JSON.
2. WHEN the ID does not exist THEN the system SHALL return **404** `{ error:"Item not found" }`.
3. WHEN Redis errors THEN the system SHALL return **500** `{ error:"Internal server error" }`.

### R4. Front-end UX Polish

**User Story:** As an end user, I want friendly notifications and an input to fetch by ID, so that I have a smooth experience.

#### Acceptance Criteria

1. WHEN an item is added successfully THEN the UI SHALL show a success toast instead of `alert()`.
2. WHEN an error occurs THEN the UI SHALL display an error notification with reason.
3. WHEN I input an ID and click "Get" THEN the UI SHALL fetch `/api/get-item/:id` and display the result or error.
