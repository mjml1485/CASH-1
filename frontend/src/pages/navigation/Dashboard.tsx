import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaMoneyBill, FaEye } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS, DEFAULT_TEXT_COLOR } from '../../utils/shared';
import Navbar from '../components/Navbar';
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import { useCurrency } from '../../hooks/useCurrency';
import WalletSummaryModal from '../components/WalletSummaryModal';
import BudgetSummaryModal from '../components/BudgetSummaryModal';

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
  const [activePage, setActivePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements'>('Dashboard');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const { currency } = useCurrency();
  const [hiddenWallets, setHiddenWallets] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoad = useRef(true);
  const [showWalletSummaryModal, setShowWalletSummaryModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showBudgetSummaryModal, setShowBudgetSummaryModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const loadData = async (showLoading = false) => {
    // Don't show loading spinner on subsequent loads to prevent glitching
    if (showLoading || isInitialLoad.current) {
      setIsLoading(true);
    }

    try {
      const [walletsData, budgetsData] = await Promise.all([
        walletService.getWallets().catch(() => []),
        budgetService.getBudgets().catch(() => [])
      ]);

      setWallets(walletsData.map(w => ({
        id: w.id || w._id || '',
        name: w.name,
        balance: w.balance,
        type: w.walletType,
        plan: w.plan,
        color1: w.color1 || w.backgroundColor || '#e2e8f0',
        color2: w.color2 || w.backgroundColor || '#e2e8f0',
        textColor: w.textColor,
        backgroundColor: w.backgroundColor
      })));

      setBudgets(budgetsData.map(b => ({
        id: b.id || b._id || '',
        category: b.category,
        amount: b.amount,
        period: b.period,
        wallet: b.wallet,
        startDate: b.startDate ? new Date(b.startDate).toISOString() : undefined,
        endDate: b.endDate ? new Date(b.endDate).toISOString() : undefined,
        left: b.left,
        plan: b.plan
      })));
    } catch (err) {
      console.error('Failed to load data:', err);
      // Don't clear data on error, keep previous data visible
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    loadData(true); // Show loading on initial load
  }, []);

  // Only reload on location change if data-updated event fires, not on every location change
  useEffect(() => {
    const handler = () => loadData(false); // Don't show loading spinner
    window.addEventListener('data-updated', handler as EventListener);
    return () => {
      window.removeEventListener('data-updated', handler as EventListener);
    };
  }, []);


  const handleNavigateAddWallet = () => {
    navigate('/add-wallet', { state: { returnTo: '/dashboard' } });
  };

  const handleNavigateAddBudget = () => {
    navigate('/add-budget', { state: { returnTo: '/dashboard' } });
  };

  const handleNavbarChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => {
    setActivePage(page);
    if (page === 'Dashboard') navigate('/dashboard');
    if (page === 'Personal Plan') navigate('/personal');
    if (page === 'Shared Plan') navigate('/shared');
    if (page === 'Achievements') navigate('/achievements');
  };

  return (
    <div className="dashboard-container">
      <Navbar activePage={activePage} onPageChange={handleNavbarChange} />

      {isLoading && isInitialLoad.current ? (
        <div className="dashboard-content">
          {/* Loading Skeleton */}
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Wallets</h2>
            <div className="dashboard-cards-wrapper">
              <div className="dashboard-wallet-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line" style={{ width: '60%', height: '16px', marginBottom: '12px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '80%', height: '32px', marginBottom: '8px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '50%', height: '16px' }}></div>
              </div>
              <div className="dashboard-wallet-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line" style={{ width: '60%', height: '16px', marginBottom: '12px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '80%', height: '32px', marginBottom: '8px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '50%', height: '16px' }}></div>
              </div>
            </div>
          </section>
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Budgets</h2>
            <div className="dashboard-cards-wrapper">
              <div className="dashboard-budget-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line" style={{ width: '70%', height: '20px', marginBottom: '12px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '60%', height: '28px', marginBottom: '8px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '100%', height: '24px' }}></div>
              </div>
              <div className="dashboard-budget-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line" style={{ width: '70%', height: '20px', marginBottom: '12px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '60%', height: '28px', marginBottom: '8px' }}></div>
                <div className="dashboard-skeleton-line" style={{ width: '100%', height: '24px' }}></div>
              </div>
            </div>
          </section>
        </div>
      ) : (
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
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="dashboard-wallet-card"
                      style={{
                        background: `linear-gradient(135deg, ${wallet.color1} 0%, ${wallet.color2} 100%)`,
                        color: wallet.textColor || DEFAULT_TEXT_COLOR
                      }}
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setShowWalletSummaryModal(true);
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
                  {budgets.map((budget) => {
                    const derivedPlan: 'Personal' | 'Shared' = budget.plan
                      ? budget.plan
                      : (wallets.some(w => w.name === budget.wallet && w.plan === 'Shared') ? 'Shared' : 'Personal');
                    return (
                      <div
                        key={budget.id}
                        className="dashboard-budget-card"
                        onClick={() => {
                          setSelectedBudget(budget);
                          setShowBudgetSummaryModal(true);
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
                    );
                  })}
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
      )}

      <WalletSummaryModal
        isOpen={showWalletSummaryModal}
        onClose={() => setShowWalletSummaryModal(false)}
        wallet={selectedWallet}
      />

      <BudgetSummaryModal
        isOpen={showBudgetSummaryModal}
        onClose={() => setShowBudgetSummaryModal(false)}
        budget={selectedBudget}
      />

    </div>
  );
}
