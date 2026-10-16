# Goa Eats — Progress

_Last updated: 16 Oct 2026_

## What we are building
A free, personal app for an **iPhone 17 and a Windows PC** (no Mac):
**discover → share → verify → save → visit.**
You find a Goa restaurant on Instagram or YouTube and share it to Goa Eats. The app identifies the restaurant, finds its real location, and saves it as a Google Earth pin with the original post link.

## How it works today
- **Frontend:** React + TypeScript + Vite, on port 5173.
- **Backend:** Node.js + Express, on port 3001. It runs on the PC.
- **Storage:** JSON files on the PC in `server/data/`:
  - `restaurants.json` for restaurants
  - `links.json` for shared links
  - These files are kept out of git.
- **Devices:** the iPhone opens `http://<PC-IP>:5173` on the same Wi-Fi. Both devices use the same backend, so they always see the same data.
- **Start:** run `npm run dev` in `goa-eats/`.

## Working rule
Build one step, test it, commit it, then move on. If a step fails, fix it before going further.

## Done

| Step | What | Test result | Commit |
|---|---|---|---|
| Phase 1 | App, backend, manual Add Place, Saved Places, PC–iPhone sync, migration of old local data | Passed | `fc84d82` |
| 0.1 | Removed the leftover IndexedDB test panel from Settings | Passed on PC and iPhone | `fc84d82` |
| 0.2 | `.gitignore` keeps personal data and build files out of git | Passed | `fc84d82` |
| 0.3 | Safe server writes (temp file + rename, one save at a time) | Passed: 20 saves and 20 deletes at the same moment, no data lost | `b8e16b5` |
| 2.1 | Link inbox API: `GET/POST/DELETE /api/links`. Strips tracking codes, detects Instagram/YouTube, blocks duplicates, pulls the link out of shared text | Passed all 15 automated tests | `8f80491` |
| 2.2 | **Share tab**: paste a link, view the inbox, delete links, auto-refresh when switching back to the app | **Built, acceptance test still pending (see below)** | this push |

## Pending: Step 2.2 acceptance test
Run this on both devices (PC: `http://localhost:5173`, iPhone: `http://192.168.1.180:5173`):
1. The Share tab is visible, and all 5 tabs fit in the iPhone's bottom bar.
2. Save an Instagram Reel link on the iPhone. It shows an **Instagram** label.
3. Save a YouTube link on the PC. It shows a **YouTube** label.
4. Refresh both devices. Both links are still there.
5. Each device shows both links (this checks sync).
6. Saving the same Reel again shows "Already in your inbox".
7. A link deleted on one device disappears on the other.

## Next steps

### Phase 2: Share intake (current)
- **2.3 Access token:** writes need a secret key, which you enter once per device in Settings. This must be done before the app is reachable from outside your home.
- **2.4 Use it anywhere, over HTTPS:** Tailscale (free) on the PC and the iPhone, so the app works on mobile data.
- **2.5 iOS Shortcut:** "Send to Goa Eats" in the iPhone share sheet. From Instagram you tap Share → Goa Eats, and the link lands in the inbox with no copy/paste.

### Phase 3: Extraction
- **3.1** Fetch whatever post information is publicly available (title, caption).
- **3.2** Manual fallback for when Instagram hides the details.
- **3.3** Gemini (free tier) suggests the restaurant name and area.
- **3.4** You review the suggestion and convert it into a restaurant.

### Phase 4: Verification
- **4.1** OpenStreetMap search (free). If too few Goa restaurants are found, consider Google Places on its free tier.
- **4.2** Pick the correct match on a map.
- **4.3** Real Map tab.
- **4.4** Merge duplicates.

### Phase 5: Google Earth
- **5.1** KML export.
- **5.2** Keep Google Earth in sync without duplicate pins.

### Phase 6: Discovery
- **6.1** Nearby list.
- **6.2** Installable app with offline viewing.

### Phase 7
- Full end-to-end test on both devices.

## Known limits and notes
- The PC must be on for the iPhone to save or sync.
- Instagram often hides post details, so some links will need a manual name.
- The Saved Places cards and the Add Place form are not styled yet (small polish task).
- `client/src/services/restaurantStorage.ts` (the old IndexedDB code) is unused. It may be reused for offline mode in 6.2, or deleted.
