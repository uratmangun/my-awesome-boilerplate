# Implementation Plan

- [x] 1. Create `middleware/cors.ts`
  - Implements unified CORS logic
  - _Requirements: R1_

- [x] 2. Update `server.ts` to use CORS middleware and handle OPTIONS
  - _Requirements: R1_

- [x] 3. Ensure dev script runs with `--allow-env` in `deno.json` tasks
  - _Requirements: R2_

- [x] 4. Add `.env` loader at startup (e.g., `std/dotenv`) in `server.ts`
  - _Requirements: R2_

- [x] 5. Create `redis.ts` singleton using `REDIS_URL`
  - _Requirements: R2_

- [x] 6. Implement `routes/get-item.ts` endpoint
  - _Requirements: R3_

- [x] 7. Add unit tests for `get-item` success and 404 cases
  - _Requirements: R3_

- [x] 8. Update React `AISearchPage` UI: add input field & toast notifications
  - _Requirements: R4_

- [x] 9. Integrate toast library and replace all `alert()` calls
  - _Requirements: R4_

- [x] 10. Manual test: fetch item via UI and verify CORS, env, Redis
  - _Requirements: R1, R2, R3, R4_
