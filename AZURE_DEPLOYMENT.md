# Azure deployment (student-friendly)

This repo is a **Vite/React SPA** in `frontend/` and an **ASP.NET Core Web API** in `backend/WaterProject.API/`.

You’ll deploy them as:
- **API** → Azure **App Service** (Windows)
- **Frontend** → Azure **Static Web Apps**

## 0) Prereqs (one-time setup)
- **Create an Azure account** (student free credits are fine).
- **Create a GitHub account** (Azure will deploy from GitHub easiest).
- Install:
  - **Git**
  - **.NET SDK** (same major version you use locally)
  - **Node.js LTS**

## 1) Push your branch to GitHub
1. Create a GitHub repo (private or public is fine for class).
2. Push your `phase6` branch.

## 2) Deploy the ASP.NET API to Azure App Service
### Create the App Service
1. In Azure Portal, search **App Services** → **Create**.
2. **Publish**: Code  
3. **Runtime stack**: `.NET` (pick the latest LTS available)  
4. **Operating System**: Windows  
5. **Region**: pick something close to you  
6. **Pricing plan**: Free/Basic is fine for class.
7. Create it.

### Connect App Service to GitHub (CI deploy)
1. Open your new App Service → **Deployment Center**.
2. Choose **GitHub** as source.
3. Pick your repo + branch (typically `phase6`) and save.

### Configure the database connection (SQLite)
Your API defaults to SQLite using:
- `BookstoreConnection` → `Data Source=Bookstore.sqlite`

In Azure App Service → **Configuration** → **Application settings**:
1. Add setting:
   - **Name**: `ConnectionStrings__BookstoreConnection`
   - **Value**: `Data Source=Bookstore.sqlite`
2. Save and **Restart** the App Service.

> Note: SQLite works for demos/homework, but Azure App Service storage is not meant as a “forever database.” For a real production app you’d switch to Azure SQL. For this mission, SQLite is usually acceptable unless your instructor says otherwise.

### Configure CORS so the frontend can call the API
Your API supports a comma-separated allowlist via:
- `CORS_ALLOWED_ORIGINS`

In App Service → **Configuration** → **Application settings**:
1. Add (or later update) setting:
   - **Name**: `CORS_ALLOWED_ORIGINS`
   - **Value**: your Static Web Apps URL (you’ll get it in Step 3), for example:  
     `https://<your-swa-name>.azurestaticapps.net`
2. Save and **Restart** the App Service.

### Confirm the API is running
1. Copy your API URL from the App Service overview, like:
   - `https://<your-api-name>.azurewebsites.net`
2. Test in a browser:
   - `https://<your-api-name>.azurewebsites.net/api/Books?page=1&pageSize=5&sortOrder=asc`

If you get JSON back, the API is up.

## 3) Deploy the React frontend to Azure Static Web Apps
### Create the Static Web App
1. In Azure Portal, search **Static Web Apps** → **Create**.
2. Pick your subscription + resource group.
3. Choose the same GitHub repo/branch.
4. **Build presets**: React (or “Custom” is fine).
5. Fill these values:
   - **App location**: `frontend`
   - **Api location**: *(leave blank)* (your API is separate on App Service)
   - **Output location**: `dist`
6. Create it.

Azure will create a GitHub Action and run a build/deploy automatically.

### GitHub secret for the deployment token (required)
The workflow [`.github/workflows/azure-static-web-apps-calm-beach-0e503d61e.yml`](.github/workflows/azure-static-web-apps-calm-beach-0e503d61e.yml) expects a repository secret named **`AZURE_STATIC_WEB_APPS_API_TOKEN`**. If this secret is missing or empty, the deploy step fails with `deployment_token was not provided`.

1. In **Azure Portal** → your Static Web App → **Overview** → **Manage deployment token** (or **Settings** → **Deployment tokens**) → copy the token.
2. In **GitHub** → your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN` (exactly; or edit the workflow to use the auto-generated name Azure added, if different)
   - **Value**: paste the token from step 1.
3. Save and re-run the failed workflow (or push a commit).

If you reset the token in Azure, update this secret with the new value.

### Set the frontend API URL
Your frontend uses:
- `VITE_API_URL` (with a localhost fallback)

In Static Web App → **Configuration** → **Environment variables**:
1. Add variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://<your-api-name>.azurewebsites.net`
2. Save.
3. Trigger a new deployment (push a tiny commit, or use the “Redeploy” option if shown).

### Confirm `/adminbooks` deep links work
This repo includes `frontend/public/routes.json` so that:
- visiting `https://<your-swa>.azurestaticapps.net/adminbooks` works (SPA route)

Test:
1. Open the site root URL.
2. Click **Admin** in the navbar.
3. Also paste `/adminbooks` after the URL in the browser and press Enter.

## 4) TA checklist (what to hand in / what they’ll test)
- **Frontend URL**: `https://<your-swa-name>.azurestaticapps.net`
- **Admin route**: `https://<your-swa-name>.azurestaticapps.net/adminbooks`
- **API URL**: `https://<your-api-name>.azurewebsites.net`
- CRUD works on admin page:
  - Add a book (POST)
  - Edit a book (PUT)
  - Delete a book (DELETE)

## Troubleshooting
### `deployment_token was not provided` (GitHub Actions)
- Add the **`AZURE_STATIC_WEB_APPS_API_TOKEN`** repository secret as described in [GitHub secret for the deployment token](#github-secret-for-the-deployment-token-required) above.
- **Pull requests from forks** do not receive repository secrets; deploy from a branch on the same repo, or adjust workflow permissions (not typical for class assignments).

### The frontend can’t reach the API
- Check `VITE_API_URL` in Static Web Apps environment variables.
- Check `CORS_ALLOWED_ORIGINS` in App Service includes the SWA URL exactly.
- After changing settings, **restart** App Service and **redeploy** SWA.

### `/adminbooks` 404 on refresh
- Confirm `frontend/public/routes.json` exists in the deployed build.

