import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/auth/Signup';
import Signin from './pages/auth/Signin';
import Forgot from './pages/auth/Forgot';
import ResetPassword from './pages/auth/ResetPassword';
import Welcome from './pages/onboarding/Welcome';
import Currency from './pages/onboarding/Currency';
import Wallet from './pages/onboarding/Wallet';
import Budget from './pages/onboarding/Budget';
import AddWallet from './pages/components/AddWallet';
import AddBudget from './pages/components/AddBudget';
import Dashboard from './pages/navigation/Dashboard';
import Personal from './pages/navigation/Personal';
import Shared from './pages/navigation/Shared';
import Profile from './pages/navigation/Profile';
import UserProfile from './pages/navigation/UserProfile';
import ProtectedRoute from './pages/components/ProtectedRoute';

function App() {
  return (
    <div id="app-root">
      <BrowserRouter>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/onboarding/welcome" 
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding/currency" 
              element={
                <ProtectedRoute>
                  <Currency />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding/wallet" 
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding/budget" 
              element={
                <ProtectedRoute>
                  <Budget />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-wallet" 
              element={
                <ProtectedRoute>
                  <AddWallet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-budget" 
              element={
                <ProtectedRoute>
                  <AddBudget />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/personal" 
              element={
                <ProtectedRoute>
                  <Personal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shared" 
              element={
                <ProtectedRoute>
                  <Shared />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/:userId" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
