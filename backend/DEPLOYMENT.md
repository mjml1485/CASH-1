# Backend Deployment Guide for Render

## Prerequisites
1. MongoDB Atlas account (or your MongoDB connection string)
2. Firebase project with service account key
3. Render account

## Deployment Steps

### 1. Prepare Environment Variables

You'll need to set these environment variables in Render:

- **NODE_ENV**: `production`
- **PORT**: `10000` (Render automatically sets this, but you can override)
- **MONGO_URI**: Your MongoDB connection string
- **FRONTEND_URL**: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
- **FIREBASE_API_KEY**: Your Firebase API key
- **SERVICE_ACCOUNT_JSON**: The entire content of your `serviceAccountKey.json` file as a single-line JSON string

### 2. Get Firebase Service Account JSON

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Copy the entire JSON content
5. In Render, paste it as the value for `SERVICE_ACCOUNT_JSON` (you may need to minify it or escape quotes)

**Alternative**: You can also use `SERVICE_ACCOUNT_PATH` if you upload the file, but JSON string is recommended for Render.

### 3. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `cash-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`
5. Add all environment variables from step 1
6. Click "Create Web Service"

### 4. Verify Deployment

Once deployed, your backend will be available at:
`https://your-service-name.onrender.com`

Test the health endpoint:
```bash
curl https://your-service-name.onrender.com/health
```

You should get: `{"status":"ok","message":"CASH API is running"}`

### 5. Update Frontend

After deployment, update your frontend's `VITE_CASH_API_URL` environment variable to point to your Render backend URL.

## Troubleshooting

- **MongoDB Connection Issues**: Verify your MONGO_URI includes proper authentication and network access
- **CORS Errors**: Ensure FRONTEND_URL matches your exact Vercel deployment URL
- **Firebase Errors**: Verify SERVICE_ACCOUNT_JSON is properly formatted (single-line JSON)
- **Port Issues**: Render automatically sets PORT, but you can override it if needed

