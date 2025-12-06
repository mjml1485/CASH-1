# Frontend Deployment Guide for Vercel

## Prerequisites
1. Backend deployed on Render (or your backend URL)
2. Vercel account
3. GitHub repository connected

## Deployment Steps

### 1. Prepare Environment Variables

You'll need to set these environment variables in Vercel:

- **VITE_CASH_API_URL**: Your Render backend URL (e.g., `https://your-backend.onrender.com`)
- **VITE_CASH_FIREBASE_API_KEY**: Your Firebase API key
- **VITE_CASH_FIREBASE_AUTH_DOMAIN**: Your Firebase auth domain (e.g., `your-project.firebaseapp.com`)
- **VITE_CASH_FIREBASE_PROJECT_ID**: Your Firebase project ID
- **VITE_CASH_FIREBASE_STORAGE_BUCKET**: Your Firebase storage bucket (e.g., `your-project.appspot.com`)
- **VITE_CASH_FIREBASE_MESSAGING_SENDER_ID**: Your Firebase messaging sender ID
- **VITE_CASH_FIREBASE_APP_ID**: Your Firebase app ID
- **VITE_CASH_FIREBASE_MEASUREMENT_ID**: Your Firebase measurement ID (optional, for analytics)

### 2. Get Firebase Configuration

1. Go to Firebase Console → Project Settings → General
2. Scroll down to "Your apps" section
3. Click on your web app (or create one if you haven't)
4. Copy the configuration values from `firebaseConfig`

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts and add environment variables when asked

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add all environment variables from step 1
6. Click "Deploy"

### 4. Update Backend CORS

After deploying, update your backend's `FRONTEND_URL` environment variable in Render to match your Vercel deployment URL.

### 5. Verify Deployment

1. Visit your Vercel deployment URL
2. Check browser console for any errors
3. Test authentication and API calls

## Troubleshooting

- **API Connection Errors**: Verify `VITE_CASH_API_URL` points to your Render backend
- **CORS Errors**: Ensure backend `FRONTEND_URL` matches your exact Vercel URL
- **Firebase Errors**: Double-check all Firebase environment variables
- **Build Errors**: Check Vercel build logs for specific issues
- **Routing Issues**: The `vercel.json` includes SPA rewrite rules, but verify they're working

## Environment Variables in Vercel

To update environment variables after deployment:

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add or update variables
4. Redeploy for changes to take effect

**Note**: All Vite environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

