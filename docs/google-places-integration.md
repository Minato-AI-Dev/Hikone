# Google Places API (New) integration plan

## Current state
Not yet connected. The repository currently has published opening hours for three shops, and null hours for most other shops. Do not show live “open” badges without fetching verified matching records.

## Google Cloud setup
1. Enable Places API (New) and billing for the project.
2. Create a server-side API key, restricted to Places API (New). Restrict source IPs where supported.
3. Configure GOOGLE_PLACES_API_KEY in the Vercel server environment, not a VITE_ prefixed variable.
4. Configure cost limits, API quotas, and alerts in Google Cloud.
5. Publish a VITE_SHOP_STATUS_ENDPOINT to the actual Vercel POST endpoint.

## Implementation requirements
- Add api/shop-status.ts, reusing server/http.ts origin and request validation and server/rateLimit.ts Redis-based rate controls.
- Accept only a known shop ID from shoppingPlaces or localShopCandidates; never arbitrary search text or URL.
- On demand, call Places API (New) Text Search, and request only fields necessary for matched identity and current opening status.
- Compare returned name and 彦根市 address to the canonical shop and reject ambiguous or unmatched results. Avoid wrongly labeling another shop as open.
- When a canonical Place ID has been checked by a maintainer, use Place Details (New) for subsequent lookups instead of search.
- Output open, closed, unknown, or unavailable; report time fetched and source. Do not conflate published opening hours with openNow.
- If an API call fails, keep the status unknown. Do not imply the business is closed.
- Permit visitors to request data from catalog cards rather than querying every shop on page load.
- Do not opt unknown or closed stores into time-constrained route recommendations automatically.
- Respect Places API attribution, caching and storage policies. Confirm permitted Place ID storage and any display requirements.

## External documentation
- https://developers.google.com/maps/documentation/places/web-service/text-search
- https://developers.google.com/maps/documentation/places/web-service/place-details

## Safety limits
No live API key is committed; no runtime API calls have been tested. Server-side implementation and UI wiring are pending.
