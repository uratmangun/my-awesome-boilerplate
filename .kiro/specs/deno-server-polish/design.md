# Deno Server Polish Design

## Architecture Overview

The project uses a Deno Fresh-style HTTP server that registers individual function handlers under `/api/*` and `/functions/*`. The React front-end communicates with these endpoints via fetch requests from `localhost:5173` during development.

```
React UI ───HTTP──▶ Deno Server @ localhost:8000
                    │
                    ├── middleware/cors.ts  (applies CORS)
                    ├── middleware/env.ts   (loads .env)
                    ├── redis.ts            (singleton Redis client)
                    └── routes
                        ├── add-item.ts
                        └── get-item.ts     ◀─ new endpoint
```

## Technical Approach

1. **CORS Middleware**
   - Single middleware imported in `server.ts` that checks method.
   - Adds `Access-Control-Allow-*` headers and handles OPTIONS with 204.
2. **Environment Loader**
   - On boot, `dotenv` (std/dotenv) loads `.env` into `Deno.env`.
   - Task script runs with `--allow-env`, ensuring access in all routes.
3. **Redis Client Singleton**
   - `redis.ts` exports an initialised client using `REDIS_URL`.
   - Client reused across functions to avoid connection overhead.
4. **get-item.ts Endpoint**
   - Parses `:id` param from URL.
   - Fetches value via `redis.get(id)`.
   - Returns JSON or 404/500 errors as per requirements.
5. **Frontend UX**
   - React component `AISearchPage` includes input + button for ID.
   - Uses toast library (e.g., `react-hot-toast`) for feedback.

## Component Design

### middleware/cors.ts

- **Purpose**: Inject correct CORS headers and handle pre-flight.
- **Dependencies**: None.
- **Interface**: `(context,next) => Response`.

### redis.ts

- **Purpose**: Provide shared Redis connection.
- **Dependencies**: `redis@v0.29.4`.
- **Interface**: `export const redis`.

### routes/get-item.ts

- **Purpose**: Return item by ID.
- **Dependencies**: `redis.ts`.
- **Interface**: default export async `(req) => Response`.

## Data Flow

1. UI triggers fetch `/api/get-item/123`.
2. Browser sends OPTIONS pre-flight → CORS middleware returns 204.
3. Browser sends GET → CORS headers added.
4. Handler fetches from Redis via singleton.
5. Response JSON returned → UI toast with result.

## Technical Considerations

- **Security**: limit CORS to `localhost:5173` in dev; allow configurable origins in prod.
- **Performance**: reuse Redis connection; avoid duplicate CORS work.
- **Scalability**: design middleware to accept additional headers/origins via env.
- **Error Handling**: structured JSON errors, logged server-side.
