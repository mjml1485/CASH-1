import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import Onboarding from './pages/Onboarding';
import AddWallet from './pages/AddWallet';
import AddBudget from './pages/AddBudget';

function App() {
  return (
    <div id="app-root">
      <BrowserRouter>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/add-wallet" element={<AddWallet />} />
            <Route path="/add-budget" element={<AddBudget />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
