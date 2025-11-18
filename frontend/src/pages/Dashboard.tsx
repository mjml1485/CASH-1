import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaWallet, FaMoneyBill, FaEye } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS } from '../utils/shared';
import Navbar from '../components/Navbar';

interface Wallet {
  id: string;
  name: string;
  balance: string;
  type: string;
  plan: 'Personal' | 'Shared';
  color1: string;
  color2: string;
  textColor?: string;
  backgroundColor?: string;
}

interface Budget {
  id: string;
  category: string;
  amount: string;
  period: string;
  wallet: string;
  startDate?: string;
  endDate?: string;
  left?: string;
  plan?: 'Personal' | 'Shared';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements'>('Dashboard');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currency] = useState(localStorage.getItem('selectedCurrency') || 'PHP');
  const [hiddenWallets, setHiddenWallets] = useState<Set<string>>(new Set());

  const loadData = () => {
    const storedWallets = sessionStorage.getItem('wallets');
    const storedBudgets = sessionStorage.getItem('budgets');
    
    if (storedWallets) {
      setWallets(JSON.parse(storedWallets));
    } else {
      setWallets([]);
    }
    
    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    } else {
      setBudgets([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [location]);

  const handleNavigateAddWallet = () => {
    navigate('/add-wallet', { state: { returnTo: '/dashboard' } });
  };

  const handleNavigateAddBudget = () => {
    navigate('/add-budget', { state: { returnTo: '/dashboard' } });
  };

  return (
    <div className="dashboard-container">
      <Navbar activePage={activePage} onPageChange={setActivePage} />
      
      <div className="dashboard-content">
        {/* Wallets Section */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Wallets</h2>
          <div className="dashboard-cards-wrapper">
            {wallets.length === 0 ? (
              <div className="dashboard-empty-state">
                <FaWallet className="dashboard-empty-icon" />
                <p className="dashboard-empty-text">No wallets found</p>
                <button
                  className="dashboard-add-link"
                  onClick={handleNavigateAddWallet}
                >
                  Add Wallet
                </button>
              </div>
            ) : (
              <>
                {wallets.map((wallet, index) => (
                  <div
                    key={wallet.id}
                    className="dashboard-wallet-card"
                    style={{
                      background: `linear-gradient(135deg, ${wallet.color1} 0%, ${wallet.color2} 100%)`,
                      color: wallet.textColor || '#ffffff'
                    }}
                    onClick={() => {
                      navigate('/add-wallet', {
                        state: {
                          returnTo: '/dashboard',
                          editMode: true,
                          walletIndex: index,
                          walletData: wallet
                        }
                      });
                    }}
                  >
                    <div className="dashboard-wallet-header">
                      <span className="dashboard-wallet-label">Balance</span>
                      <button 
                        className="dashboard-wallet-eye"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHiddenWallets(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(wallet.id)) {
                              newSet.delete(wallet.id);
                            } else {
                              newSet.add(wallet.id);
                            }
                            return newSet;
                          });
                        }}
                      >
                        <FaEye />
                      </button>
                    </div>
                    <div className="dashboard-wallet-balance">
                      {hiddenWallets.has(wallet.id) 
                        ? '••••••' 
                        : `${CURRENCY_SYMBOLS[currency]} ${formatAmount(wallet.balance)}`
                      }
                    </div>
                    <div className="dashboard-wallet-name">{wallet.name}</div>
                    <div className="dashboard-wallet-type">{wallet.plan} Wallet</div>
                    <div className="dashboard-wallet-icon">
                      <FaWallet />
                    </div>
                  </div>
                ))}
                <button
                  className="dashboard-add-card"
                  onClick={handleNavigateAddWallet}
                >
                  <span className="dashboard-add-plus">+</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Budgets Section */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Budgets</h2>
          <div className="dashboard-cards-wrapper">
            {budgets.length === 0 ? (
              <div className="dashboard-empty-state">
                <FaMoneyBill className="dashboard-empty-icon" />
                <p className="dashboard-empty-text">No budgets found</p>
                <button
                  className="dashboard-add-link"
                  onClick={handleNavigateAddBudget}
                >
                  Add Budget
                </button>
              </div>
            ) : (
              <>
                {budgets.map((budget, index) => {
                  const derivedPlan: 'Personal' | 'Shared' = budget.plan
                    ? budget.plan
                    : (wallets.some(w => w.name === budget.wallet && w.plan === 'Shared') ? 'Shared' : 'Personal');
                  return (
                  <div 
                    key={budget.id} 
                    className="dashboard-budget-card"
                    onClick={() => {
                      navigate('/add-budget', {
                        state: {
                          returnTo: '/dashboard',
                          editMode: true,
                          budgetIndex: index,
                          budgetData: budget,
                          budgetPlan: derivedPlan
                        }
                      });
                    }}
                  >
                    <div className="dashboard-budget-category">{budget.category}</div>
                    <div className="dashboard-budget-amount">
                      {CURRENCY_SYMBOLS[currency]} {formatAmount(budget.left || budget.amount)}
                    </div>
                    <div className="dashboard-budget-left">left</div>
                    {(() => {
                      const amount = parseFloat(budget.amount || '0') || 0;
                      const left = parseFloat(budget.left || budget.amount || '0') || 0;
                      const pct = amount > 0 ? Math.min(Math.max((left / amount) * 100, 0), 100) : 0;
                      const pctStep = Math.round(pct / 5) * 5; 
                      const widthClass = `progress-w-${pctStep}`;
                      return (
                        <div className="dashboard-progress-pill">
                          <div className={`dashboard-progress-remaining ${widthClass}`} />
                          <div className="dashboard-progress-label">{derivedPlan}</div>
                        </div>
                      );
                    })()}
                  </div>
                );})}
                <button
                  className="dashboard-add-card"
                  onClick={handleNavigateAddBudget}
                >
                  <span className="dashboard-add-plus">+</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Bottom Sections Grid */}
        <div className="dashboard-bottom-grid">
          <section className="dashboard-box">
            <h3 className="dashboard-box-title">Recent Transactions</h3>
            <div className="dashboard-box-empty">
              <p>No transactions found</p>
            </div>
          </section>

          <section className="dashboard-box">
            <h3 className="dashboard-box-title">Spending Breakdown</h3>
            <div className="dashboard-box-empty"></div>
          </section>

          <section className="dashboard-box">
            <h3 className="dashboard-box-title">Achievements</h3>
            <div className="dashboard-box-empty"></div>
          </section>
        </div>
      </div>

    </div>
  );
}
