# Hostel Mart

## Current State
- Students can post item listings (sale/trade/free) and wanted requests.
- Backend has `markRequestFulfilled` callable by the requester only.
- `getRequestsByRequester` only returns requests with status `#open`, hiding fulfilled ones.
- `createListing` does not scan or auto-fulfill matching open requests.
- Dashboard shows a "Mark Fulfilled" button for open requests, but fulfilled requests are hidden from the list entirely (because the query only fetches `#open`).
- The Request Board page has a status filter but the underlying data query only fetches open requests.

## Requested Changes (Diff)

### Add
- Auto-fulfill logic in `createListing`: after a new listing is saved, scan all open requests. If any open request has the same category as the new listing, mark that request as `#fulfilled`.

### Modify
- `getRequestsByRequester` backend function: remove the `#open` filter so it returns requests of all statuses (open and fulfilled).
- Frontend dashboard Requests tab: show all requests (open and fulfilled), not just open ones. The status badge already differentiates them visually.
- `useRequestsByRequester` query key: no change needed; data will now include fulfilled requests since the backend returns all.

### Remove
- Nothing removed.

## Implementation Plan
1. In `main.mo`, update `createListing` to iterate over all `wantedRequests` after saving the new listing. For each request with `status == #open` and `category == newListing.category`, update its status to `#fulfilled`.
2. In `main.mo`, update `getRequestsByRequester` to remove the `status == #open` filter — return all requests for that requester regardless of status.
3. In `DashboardPage.tsx`, no code change needed (it already renders all requests returned by the hook, and the "Mark Fulfilled" button is already conditionally shown for open ones).
4. The `useRequestsByRequester` hook automatically benefits from the backend change — no hook change needed.
