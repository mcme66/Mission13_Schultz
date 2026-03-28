# Mission 12 — Online Bookstore

ASP.NET Core Web API (SQLite) + React (Vite) bookstore with category filtering, pagination, shopping cart (session storage), and Bootstrap UI.

**Requirements:** [.NET SDK](https://dotnet.microsoft.com/download) and [Node.js](https://nodejs.org/) (includes npm).

---

## Starting the app

1. **Install frontend dependencies** (first time, or after `package.json` changes):

   ```bash
   cd frontend
   npm install
   ```

2. **Start the API** (keep this terminal running):

   ```bash
   cd backend/WaterProject.API
   dotnet run
   ```

   The API listens at **http://localhost:5076** (see launch output if your port differs). CORS allows the Vite dev server at **http://localhost:5173** and **http://127.0.0.1:5173**.

3. **Start the frontend** (second terminal):

   ```bash
   cd frontend
   npm run dev
   ```

4. **Open the app** in your browser using the URL Vite prints (usually **http://localhost:5173**).

5. **Optional — API URL:** If the UI cannot reach the API, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to your API base URL (for example `http://localhost:5076`). Restart `npm run dev` after changing env files.

**What to try:** Browse the catalog, filter by category, change page size and sort, add books to the cart, open **Cart** in the header, and use **Continue shopping** to return to the last catalog view from when you added an item. Use **Add book** in the header to post a new book (same flow as Mission 11).

---

## Reset / troubleshooting

**Cart and “return to catalog” (session-only data)**  
The cart and the saved catalog URL for **Continue shopping** live in the browser’s **session storage** for that tab. To clear them without wiping all site data:

- **Chrome / Edge:** DevTools (F12) → **Application** → **Session storage** → your origin → delete keys `booksmith_cart` and `booksmith_catalog_return`, or right‑click the origin → **Clear**.
- **Firefox:** DevTools → **Storage** → **Session Storage** → delete the same keys or clear storage for the site.

Closing the tab also ends that session’s storage for typical browser behavior.

**After backend code changes**  
Stop the API (`Ctrl+C` in its terminal) and run `dotnet run` again from `backend/WaterProject.API`.

**After frontend dependency changes**  
From `frontend`, run `npm install` again, then `npm run dev`.

**Database**  
Book data is stored in **SQLite** (`Bookstore.sqlite` next to the API project / working directory when you run `dotnet run`). You normally do not need to delete it. If the file is corrupted or you need a clean database, stop the API, remove `Bookstore.sqlite` (and any copy under `bin`/`obj` if your setup duplicated it), then start the API again so EF can recreate or re-seed as your project is configured.

**Port already in use**  
If `5076` or `5173` is taken, change the API launch URL in your VS / `launchSettings.json` or free the process using that port, and align `VITE_API_URL` with the API’s actual base URL.

---

## Production build (frontend)

```bash
cd frontend
npm run build
```

Output is in `frontend/dist`. Serve the static files with any static host; point `VITE_API_URL` at your deployed API when building.
