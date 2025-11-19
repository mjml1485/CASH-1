import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './auth/Signup';
import Signin from './auth/Signin';
import Welcome from './onboarding/Welcome';
import Currency from './onboarding/Currency';
import Wallet from './onboarding/Wallet';
import Budget from './onboarding/Budget';
import AddWallet from './components/AddWallet';
import AddBudget from './components/AddBudget';
import Dashboard from './navigation/Dashboard';
import Personal from './navigation/Personal';
import Shared from './navigation/Shared';
import Achievements from './navigation/Achievements';

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
            <Route path="/personal" element={<Personal />} />
            <Route path="/shared" element={<Shared />} />
            <Route path="/achievements" element={<Achievements />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
