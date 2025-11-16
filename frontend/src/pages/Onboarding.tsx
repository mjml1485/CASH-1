import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronDown, FaTimes } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS } from '../utils/shared';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'welcome' | 'currency' | 'wallet' | 'budget'>('welcome');
  const [wallets, setWallets] = useState<any[]>(() => {
    const saved = sessionStorage.getItem('onboardingWallets');
    return saved ? JSON.parse(saved) : [];
  });
  const [budgets, setBudgets] = useState<any[]>(() => {
    const saved = sessionStorage.getItem('onboardingBudgets');
    return saved ? JSON.parse(saved) : [];
  });
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [walletToDelete, setWalletToDelete] = useState<number | null>(null);
  const [showDeleteBudgetModal, setShowDeleteBudgetModal] = useState<boolean>(false);
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);
  
  useEffect(() => {
    sessionStorage.setItem('onboardingWallets', JSON.stringify(wallets));
  }, [wallets]);
  
  useEffect(() => {
    sessionStorage.setItem('onboardingBudgets', JSON.stringify(budgets));
  }, [budgets]);
  
  useEffect(() => {
    if (location.state?.step === 'wallet') {
      setStep('wallet');
      if (location.state?.walletData) {
        const newWallet = location.state.walletData;
        const editIndex = location.state.walletIndex;
        
        if (editIndex !== undefined && editIndex !== null) {
          setWallets(prev => {
            const updated = [...prev];
            updated[editIndex] = newWallet;
            return updated;
          });
        } else {
          const currentSaved = sessionStorage.getItem('onboardingWallets');
          const currentWallets = currentSaved ? JSON.parse(currentSaved) : [];
          
          const isDuplicate = currentWallets.some((w: any) => 
            w.name === newWallet.name && 
            w.balance === newWallet.balance && 
            w.plan === newWallet.plan &&
            w.walletType === newWallet.walletType
          );
          
          if (!isDuplicate) {
            setWallets(prev => {
              const stateHasDuplicate = prev.some(w => 
                w.name === newWallet.name && 
                w.balance === newWallet.balance && 
                w.plan === newWallet.plan &&
                w.walletType === newWallet.walletType
              );
              return stateHasDuplicate ? prev : [...prev, newWallet];
            });
          }
        }
      }
    } else if (location.state?.step === 'budget') {
      setStep('budget');
      if (location.state?.budgetData) {
        const newBudget = location.state.budgetData;
        const editIndex = location.state.budgetIndex;
        
        if (editIndex !== undefined && editIndex !== null) {
          setBudgets(prev => {
            const updated = [...prev];
            updated[editIndex] = newBudget;
            return updated;
          });
        } else {
          const currentSaved = sessionStorage.getItem('onboardingBudgets');
          const currentBudgets = currentSaved ? JSON.parse(currentSaved) : [];
          
          const isDuplicate = currentBudgets.some((b: any) => 
            b.category === newBudget.category && 
            b.amount === newBudget.amount && 
            b.period === newBudget.period &&
            b.walletName === newBudget.walletName
          );
          
          if (!isDuplicate) {
            setBudgets(prev => {
              const stateHasDuplicate = prev.some(b => 
                b.category === newBudget.category && 
                b.amount === newBudget.amount && 
                b.period === newBudget.period &&
                b.walletName === newBudget.walletName
              );
              return stateHasDuplicate ? prev : [...prev, newBudget];
            });
          }
        }
      }
    }
  }, [location.state]);
  const [currency, setCurrency] = useState(() => localStorage.getItem('selectedCurrency') || 'PHP');

  const handleGetStarted = () => {
    setStep('currency');
  };

  const handleCurrencyNext = () => {
    setStep('wallet');
  };

  const handleBack = () => {
    if (step === 'budget') {
      setStep('wallet');
    } else if (step === 'wallet') {
      setStep('currency');
    } else if (step === 'currency') {
      setStep('welcome');
    }
  };

  const handleWalletNext = () => {
    setStep('budget');
  };

  const handleBudgetNext = () => {
    sessionStorage.removeItem('onboardingWallets');
    sessionStorage.removeItem('onboardingBudgets');
  };

  const handleDeleteWallet = (index: number) => {
    setWalletToDelete(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteWallet = () => {
    if (walletToDelete !== null) {
      const updatedWallets = wallets.filter((_, i) => i !== walletToDelete);
      setWallets(updatedWallets);
      sessionStorage.setItem('onboardingWallets', JSON.stringify(updatedWallets));
      setWalletToDelete(null);
    }
    setShowDeleteModal(false);
  };

  const cancelDeleteWallet = () => {
    setWalletToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteBudget = (index: number) => {
    setBudgetToDelete(index);
    setShowDeleteBudgetModal(true);
  };

  const confirmDeleteBudget = () => {
    if (budgetToDelete !== null) {
      const updatedBudgets = budgets.filter((_, i) => i !== budgetToDelete);
      setBudgets(updatedBudgets);
      sessionStorage.setItem('onboardingBudgets', JSON.stringify(updatedBudgets));
      setBudgetToDelete(null);
    }
    setShowDeleteBudgetModal(false);
  };

  const cancelDeleteBudget = () => {
    setBudgetToDelete(null);
    setShowDeleteBudgetModal(false);
  };

  if (step === 'welcome') {
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <div className="onboarding-form-inner">
            <div className="onboarding-header">
              <h1 className="onboarding-title">WELCOME TO CASH</h1>
              <p className="onboarding-subtitle">A Cloud Access Synchronized Hub Expense Tracker</p>
            </div>
            <div className="onboarding-button-wrapper">
              <button className="onboarding-button-primary" type="button" onClick={handleGetStarted}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'currency') {
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <div className="onboarding-form-inner">
            <div className="onboarding-header">
              <h1 className="onboarding-title-normal">Choose Currency</h1>
              <p className="onboarding-subtitle-normal">Let's begin by selecting your preferred currency.</p>
            </div>
            <div className="onboarding-currency-wrapper">
              <div className="onboarding-currency-select">
                <select
                  value={currency}
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    setCurrency(newCurrency);
                    localStorage.setItem('selectedCurrency', newCurrency);
                  }}
                  className="onboarding-currency-dropdown"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                  <option value="CHF">CHF</option>
                  <option value="CNY">CNY</option>
                  <option value="INR">INR</option>
                </select>
                <FaChevronDown className="onboarding-currency-arrow" />
              </div>
            </div>
            <div className="onboarding-navigation-wrapper">
              <button className="onboarding-button-back" type="button" onClick={handleBack}>
                Back
              </button>
              <button className="onboarding-button-next" type="button" onClick={handleCurrencyNext}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'wallet') {
    const currencySymbol = CURRENCY_SYMBOLS[currency] || '₱';
    
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <div className="onboarding-form-inner">
            <div className="onboarding-header">
              <h1 className="onboarding-title-wallet">Add Wallet</h1>
              <p className="onboarding-subtitle-normal">Just add your wallets, and we'll help you keep a clear view of your balances. It's easy as that!</p>
            </div>
            <div className="onboarding-wallet-card-wrapper">
              {wallets.map((wallet, index) => (
                <div 
                  key={index} 
                  className="onboarding-wallet-created-card"
                  onClick={() => navigate('/add-wallet', { state: { editMode: true, walletIndex: index, walletData: wallet } })}
                >
                  <button
                    type="button"
                    className="onboarding-wallet-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWallet(index);
                    }}
                  >
                    <FaTimes />
                  </button>
                  <div className="onboarding-wallet-created-name">{wallet.name}</div>
                  <div className="onboarding-wallet-created-balance">
                    {currencySymbol}{formatAmount(wallet.balance)}
                  </div>
                  <div className="onboarding-wallet-created-type">{wallet.walletType || 'Wallet'}</div>
                  <div className="onboarding-wallet-created-plan">{wallet.plan || 'Personal'}</div>
                </div>
              ))}
              <button
                className="onboarding-wallet-card"
                type="button"
                onClick={() => navigate('/add-wallet')}
              >
                <span className="onboarding-wallet-plus">+</span>
              </button>
            </div>
            <div className="onboarding-navigation-wrapper">
              <button className="onboarding-button-back" type="button" onClick={handleBack}>
                Back
              </button>
              <button className="onboarding-button-next" type="button" onClick={handleWalletNext}>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="onboarding-delete-modal-overlay" onClick={cancelDeleteWallet}>
            <div className="onboarding-delete-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Wallet?</h3>
              <p>Are you sure you want to delete this wallet? This action cannot be undone.</p>
              <div className="onboarding-delete-modal-buttons">
                <button className="onboarding-delete-cancel" onClick={cancelDeleteWallet}>
                  Cancel
                </button>
                <button className="onboarding-delete-confirm" onClick={confirmDeleteWallet}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'budget') {
    const currencySymbol = CURRENCY_SYMBOLS[currency] || '₱';
    
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <div className="onboarding-form-inner">
            <div className="onboarding-header">
              <h1 className="onboarding-title-budget">Add Budget</h1>
              <p className="onboarding-subtitle-normal">Budgeting doesn't have to be a headache. I've got your back! Just tell me your budget, and I'll do the monitoring.</p>
            </div>
            <div className="onboarding-budget-card-wrapper">
              {budgets.map((budget, index) => (
                <div 
                  key={index} 
                  className="onboarding-budget-created-card"
                  onClick={() => navigate('/add-budget', { state: { editMode: true, budgetIndex: index, budgetData: budget } })}
                >
                  <button
                    type="button"
                    className="onboarding-budget-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBudget(index);
                    }}
                  >
                    <FaTimes />
                  </button>
                  <div className="onboarding-budget-created-category">{budget.category}</div>
                  <div className="onboarding-budget-created-amount">
                    {currencySymbol}{formatAmount(budget.amount)}
                  </div>
                  <div className="onboarding-budget-created-period">{budget.period}</div>
                  <div className="onboarding-budget-created-wallet">{budget.walletName || 'No wallet'}</div>
                </div>
              ))}
              <button
                className="onboarding-budget-card"
                type="button"
                onClick={() => {
                  navigate('/add-budget');
                }}
              >
                <span className="onboarding-budget-plus">+</span>
              </button>
            </div>
            <div className="onboarding-navigation-wrapper">
              <button className="onboarding-button-back" type="button" onClick={handleBack}>
                Back
              </button>
              <button className="onboarding-button-next" type="button" onClick={handleBudgetNext}>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Delete Budget Confirmation Modal */}
        {showDeleteBudgetModal && (
          <div className="onboarding-delete-modal-overlay" onClick={cancelDeleteBudget}>
            <div className="onboarding-delete-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Budget?</h3>
              <p>Are you sure you want to delete this budget? This action cannot be undone.</p>
              <div className="onboarding-delete-modal-buttons">
                <button className="onboarding-delete-cancel" onClick={cancelDeleteBudget}>
                  Cancel
                </button>
                <button className="onboarding-delete-confirm" onClick={confirmDeleteBudget}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
