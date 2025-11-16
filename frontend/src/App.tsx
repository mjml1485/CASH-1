import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/auth/Signup';
import Signin from './pages/auth/Signin';
import Welcome from './pages/onboarding/Welcome';
import Currency from './pages/onboarding/Currency';
import Wallet from './pages/onboarding/Wallet';
import Budget from './pages/onboarding/Budget';
import AddWallet from './components/AddWallet';
import AddBudget from './components/AddBudget';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div id="app-root">
      <BrowserRouter>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding/welcome" element={<Welcome />} />
            <Route path="/onboarding/currency" element={<Currency />} />
            <Route path="/onboarding/wallet" element={<Wallet />} />
            <Route path="/onboarding/budget" element={<Budget />} />
            <Route path="/add-wallet" element={<AddWallet />} />
            <Route path="/add-budget" element={<AddBudget />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
