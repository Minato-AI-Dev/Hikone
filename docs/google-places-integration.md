# Google Places API (New): shop-hour status

## Scope and state
The \`/api/shop-hours\` endpoint is implemented for the three manually listed Shibancho Square shops. It checks the **current** published open/closed status only. A shop whose Place ID is unverified, whose identity does not match, or whose API request fails is **unknown**. This is not a booking/calendar integration or a prediction of opening status on arrival.

Shop-specific arrival-time travel and minimum visit time are not verified. Hence the shop listings do **not** enter the time-constrained route recommendation graph; even generic store-dependent actions remain ineligible. The public results screen lets users who selected shopping/food/Hikonyan opt to look up storefront information, without promising a viable detour.

## Cloud configuration
1. Enable Google Places API (New) on the existing Google Cloud project, with billing, API-only key restrictions, quotas, alerts, and appropriate rate limits. \`currentOpeningHours\` may incur a higher Places Details SKU.
2. Match each \`SHOP001\`–\`SHOP003\` to the **exact** Google Place ID. Check name, address, entry point and association source independently; do not invent IDs.
3. Set the server-only Vercel environment variable \`HIKONE_SHOP_PLACE_IDS_JSON\` to a JSON object of approved mappings. Do not put this value in \`VITE_\` variables or the repository.
4. The server reuses \`GOOGLE_MAPS_API_KEY\`. It must also be restricted for Places API (New), or use a dedicated server-side key in a subsequent change. Never expose this key in client code. Confirm the existing Routes API restriction before changing it.
5. Add \`VITE_SHOP_HOURS_ENDPOINT=https://<actual-Vercel-domain>/api/shop-hours\` to GitHub Actions variables. There is deliberately no fallback to the live API in a public build if the URL is unset.
6. Deploy Preview, test identity mismatch, missing hours, server protection, and output on mobile. Do not merge or advertise live shop status before verifying cloud configuration.

## Safety and interpretation
- \`scheduled_open\` and \`scheduled_closed\` are **only the retrieval-time** Google published status. They do not mean the store will be open on arrival. Missing data or mismatched identity returns \`unknown\`.
- Official closures, special unannounced holidays, queues, reservations and visit duration are not automatically verified.
- API accepts only SHOP IDs from an exact allowlist; it refuses arbitrary URL, geolocation or business names.
- End-user request is opt-in; it does not fetch all shops on page load.
- Response is not cached or stored; show a Google attribution and the check time.
- Never rank time-constrained store-specific activities solely using \`openNow\`.
- Check the provider's Places API attribution and storage terms before wider release.

Docs: https://developers.google.com/maps/documentation/places/web-service/place-details and https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
