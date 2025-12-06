# CASH

**A Cloud-Native Collaborative Expense Tracker**

CASH (Cloud Access Synchronized Hub) is a modern, full-stack expense tracking application designed for both personal and collaborative financial management. Built with cloud-native architecture, it enables users to manage their finances individually or collaborate with others through shared wallets, real-time notifications, and comprehensive analytics.

---

## 🚀 Live Demo

- **Frontend (Vercel)**: [https://cash1.vercel.app](cash1.vercel.app)
- **Backend API (Render)**: [https://cash-backend-fp4l.onrender.com](https://cash-backend-fp4l.onrender.com)

### Demo Account Credentials

```
Email: aicarandang088@gmail.com
Password: Demo123!
```

*Note: Demo account has sample data including wallets, budgets, and transactions for testing purposes.*

---

## 🛠️ Technical Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.2
- **Routing**: React Router DOM 7.9.6
- **State Management**: Zustand 5.0.8, React Context API
- **HTTP Client**: Axios 1.13.2
- **UI Icons**: React Icons 5.5.0
- **Authentication**: Firebase Auth 10.7.1
- **PDF Generation**: jsPDF 3.0.4, html2canvas 1.4.1
- **Styling**: Custom CSS (7,791 lines of optimized styles)

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB (via Mongoose 9.0.0)
- **Authentication**: Firebase Admin SDK 12.0.0
- **File Storage**: Cloudinary 2.8.0
- **CORS**: cors 2.8.5

### Cloud Services
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: MongoDB Atlas
- **Authentication**: Firebase Authentication
- **File Storage**: Cloudinary
- **Image Processing**: Cloudinary

---

## ✨ Core Functionalities

### 1. Personal & Shared Wallets
- **Personal Wallets**: Private wallets for individual expense tracking
- **Shared Wallets**: Collaborative wallets with role-based access (Owner, Editor, Viewer)
- **Wallet Management**: Create, edit, delete wallets with custom colors and themes
- **Balance Tracking**: Real-time balance updates with transaction history
- **Multi-Currency Support**: Support for multiple currencies (PHP, USD, EUR, etc.)

### 2. Transaction Management (CRUD Operations)
- **Create Transactions**: Add income, expenses, and transfers
- **Read Transactions**: View transaction history with filtering and sorting
- **Update Transactions**: Edit transaction details (amount, category, date, description)
- **Delete Transactions**: Remove transactions with confirmation
- **Transaction Types**:
  - Income: Money received
  - Expense: Money spent
  - Transfer: Money moved between wallets
- **Transaction Features**:
  - Category management (Food, Shopping, Bills, Car, Custom categories)
  - Date and time tracking
  - Description field
  - Audit trail (created by, updated by, timestamps)

### 3. Budget Management
- **Create Budgets**: Set spending limits for categories
- **Budget Tracking**: Real-time tracking of budget usage
- **Budget Periods**: Daily, weekly, monthly, yearly budgets
- **Budget Alerts**: Visual indicators for budget status
- **Wallet-Specific Budgets**: Link budgets to specific wallets
- **Progress Visualization**: Visual progress bars showing budget utilization

### 4. Social Features (Following/Follower/Friends System)
- **User Profiles**: Customizable profiles with avatars and cover photos
- **Follow System**: Follow other users to see their public activity
- **Follower Management**: View and manage followers
- **Friends System**: Mutual following creates friend relationships
- **User Search**: Search for users by username or email
- **Profile Customization**: Bio, avatar, cover photo, privacy settings

### 5. Analytics & Reporting
- **Spending Breakdown**: Category-wise spending analysis with donut charts
- **Monthly Summary**: Total income, expenses, and net balance
- **Transaction Analytics**: 
  - Total spending
  - Average transaction amount
  - Transaction count
  - Top spending categories
- **Receipt-Style Reports**: Downloadable PDF/image reports with:
  - Spending summary
  - Category breakdown
  - Transaction details
  - Visual charts
- **Wallet Analytics**: Per-wallet spending analysis
- **Time-Based Filtering**: Filter transactions by date ranges

### 6. Automation & Workflow
- **Real-Time Notifications**: 
  - Follow requests and follow-back notifications
  - Unread notification count
  - Notification polling (every 30 seconds)
- **Auto-Refresh**: 
  - Shared wallets auto-refresh every 3 seconds for collaborators
  - Real-time data synchronization
- **Event-Driven Updates**: 
  - Window events for data refresh
  - Automatic UI updates on data changes
- **Background Polling**: 
  - Smart polling based on page visibility
  - Efficient resource usage

---

## 📊 Architecture

### System Architecture

```
                    ┌─────────────────────────────────┐
                    │      User Browser/Client        │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │   Vercel CDN (Frontend Host)    │
                    │   React + TypeScript App        │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────┼──────────────────┐
                    │              │                  │
         ┌──────────▼──────┐       │      ┌───────────▼──────────┐
         │  Firebase Auth  │       │      │   Cloudinary API     │
         │  (Authentication)│      │      │  (Image Storage)     │
         └─────────────────┘       │      └──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │   HTTPS/REST API Requests       │
                    │   (Bearer Token Auth)           │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │   Render (Backend Host)         │
                    │   Express.js + Node.js          │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │   MongoDB Atlas                  │
                    │   (Database - Wallets,           │
                    │    Transactions, Budgets, etc.)  │
                    └──────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**:
   - User signs in via Firebase Authentication
   - Frontend receives Firebase ID token
   - Backend validates token via Firebase Admin SDK
   - Backend creates/updates user profile in MongoDB

2. **API Request Flow**:
   - Frontend makes authenticated requests with Bearer token
   - Backend middleware validates token
   - Backend queries MongoDB
   - Response sent back to frontend

3. **Real-Time Updates**:
   - Shared wallets poll backend every 3 seconds
   - Notifications poll every 30 seconds
   - Window events trigger data refresh

---

## 📁 Folder Structure

```
CASH-1/
├── backend/                    # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── db.js          # MongoDB connection
│   │   │   └── firebase.js    # Firebase Admin setup
│   │   ├── middleware/        # Express middleware
│   │   │   └── auth.js        # Authentication middleware
│   │   ├── models/            # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Wallet.js
│   │   │   ├── Transaction.js
│   │   │   ├── Budget.js
│   │   │   ├── Notification.js
│   │   │   ├── Follow.js
│   │   │   └── ...
│   │   ├── routes/            # API routes
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── wallets.js
│   │   │   ├── transactions.js
│   │   │   ├── budgets.js
│   │   │   └── ...
│   │   └── utils/             # Utility functions
│   │       └── roleCheck.js
│   ├── package.json
│   ├── render.yaml            # Render deployment config
│   └── env.template           # Environment variables template
│
├── frontend/                   # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/          # Authentication pages
│   │   │   │   ├── Signin.tsx
│   │   │   │   ├── Signup.tsx
│   │   │   │   ├── Forgot.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   ├── navigation/    # Main app pages
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Personal.tsx
│   │   │   │   ├── Shared.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── UserProfile.tsx
│   │   │   ├── components/    # Reusable components
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── AddWallet.tsx
│   │   │   │   └── AddBudget.tsx
│   │   │   └── onboarding/   # Onboarding flow
│   │   │       ├── Welcome.tsx
│   │   │       ├── Currency.tsx
│   │   │       ├── Wallet.tsx
│   │   │       └── Budget.tsx
│   │   ├── services/          # API service layer
│   │   │   ├── authService.ts
│   │   │   ├── walletService.ts
│   │   │   ├── transactionService.ts
│   │   │   ├── budgetService.ts
│   │   │   ├── userService.ts
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAuth.tsx
│   │   │   └── useCurrency.tsx
│   │   ├── state/              # State management
│   │   │   └── AppStateContext.tsx
│   │   ├── utils/              # Utility functions
│   │   │   ├── shared.ts
│   │   │   └── apiHelpers.ts
│   │   ├── config/             # Configuration
│   │   │   ├── firebase.ts
│   │   │   └── cloudinary.private.ts
│   │   ├── App.tsx             # Main app component
│   │   ├── App.css             # Global styles
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   ├── vercel.json             # Vercel deployment config
│   └── vite.config.ts          # Vite configuration
│
└── README.md                   # This file
```

---

## 🔧 System Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Firebase project
- Cloudinary account (optional, for image uploads)
- Git

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/mjml1485/CASH-1.git
cd CASH-1
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Start the backend:

```bash
npm run dev
```

The backend will run on `http://localhost:3001`

#### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

Start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

---

## ☁️ Cloud Configuration

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist IP addresses (or use `0.0.0.0/0` for development)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/CASH?retryWrites=true&w=majority`

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Get Firebase configuration:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
4. Generate Service Account Key:
   - Go to Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file

### Cloudinary Setup (Optional)

1. Create a Cloudinary account
2. Get credentials:
   - Cloud Name
   - API Key
   - API Secret
   - Upload Preset

---

## 🚀 Deployment

### Backend Deployment (Render)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create new Web Service
4. Connect GitHub repository
5. Configure:
   - **Name**: `cash-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add environment variables (see `backend/env.template`)
7. Deploy

**Backend URL**: `https://your-backend-name.onrender.com`

### Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables (see `frontend/env.template`)
5. Deploy

**Frontend URL**: `https://your-app-name.vercel.app`

### Post-Deployment

1. Update backend `FRONTEND_URL` in Render to match Vercel URL
2. Update frontend `VITE_CASH_API_URL` in Vercel to match Render URL
3. Test the connection

For detailed deployment instructions, see:
- `backend/DEPLOYMENT.md`
- `frontend/DEPLOYMENT.md`

---

## 🔐 Environment Variables

### Backend (.env)

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/CASH?retryWrites=true&w=majority
FRONTEND_URL=https://your-app.vercel.app
FIREBASE_API_KEY=your-firebase-api-key
SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Frontend (.env)

```env
VITE_CASH_API_URL=https://your-backend.onrender.com
VITE_CASH_FIREBASE_API_KEY=your-firebase-api-key
VITE_CASH_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_CASH_FIREBASE_PROJECT_ID=your-project-id
VITE_CASH_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_CASH_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_CASH_FIREBASE_APP_ID=your-app-id
VITE_CASH_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `GET /api/users/search` - Search users
- `POST /api/users/:userId/follow` - Follow user
- `DELETE /api/users/:userId/follow` - Unfollow user

### Wallets
- `GET /api/wallets` - Get all wallets
- `POST /api/wallets` - Create wallet
- `PUT /api/wallets/:id` - Update wallet
- `DELETE /api/wallets/:id` - Delete wallet

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Create personal wallet
- [ ] Create shared wallet
- [ ] Add collaborators to shared wallet
- [ ] Create transaction (income, expense, transfer)
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Create budget
- [ ] View spending breakdown
- [ ] Download analytics report
- [ ] Follow/unfollow users
- [ ] View notifications
- [ ] Update profile

---
