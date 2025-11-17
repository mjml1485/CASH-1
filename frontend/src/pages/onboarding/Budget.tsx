import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS } from '../../utils/shared';

export default function Budget() {
  const navigate = useNavigate();
  const location = useLocation();
  const [budgets, setBudgets] = useState<any[]>(() => {
    const saved = sessionStorage.getItem('onboardingBudgets');
    return saved ? JSON.parse(saved) : [];
  });
  const [showDeleteBudgetModal, setShowDeleteBudgetModal] = useState<boolean>(false);
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);

  const currency = localStorage.getItem('selectedCurrency') || 'PHP';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₱';

  useEffect(() => {
    sessionStorage.setItem('onboardingBudgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
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
  }, [location.state]);

  const handleBack = () => {
    navigate('/onboarding/wallet');
  };

  const handleNext = () => {
    const onboardingWallets = sessionStorage.getItem('onboardingWallets');
    const onboardingBudgets = sessionStorage.getItem('onboardingBudgets');
    
    if (onboardingWallets) {
      const walletsData = JSON.parse(onboardingWallets);
      const formattedWallets = walletsData.map((wallet: any, index: number) => ({
        ...wallet,
        id: wallet.id || `wallet-${Date.now()}-${index}`,
        type: wallet.walletType || wallet.type,
        color1: wallet.backgroundColor || wallet.color1,
        color2: wallet.backgroundColor || wallet.color2
      }));
      sessionStorage.setItem('wallets', JSON.stringify(formattedWallets));
    }
    
    if (onboardingBudgets) {
      const budgetsData = JSON.parse(onboardingBudgets);
      const formattedBudgets = budgetsData.map((budget: any, index: number) => ({
        ...budget,
        id: budget.id || `budget-${Date.now()}-${index}`,
        wallet: budget.walletName || budget.wallet,
        plan: budget.walletPlan || budget.plan,
        left: budget.amount
      }));
      sessionStorage.setItem('budgets', JSON.stringify(formattedBudgets));
    }
    
    sessionStorage.removeItem('onboardingWallets');
    sessionStorage.removeItem('onboardingBudgets');
    
    navigate('/dashboard');
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
                onClick={() => navigate('/add-budget', { state: { editMode: true, budgetIndex: index, budgetData: budget, returnTo: '/onboarding/budget' } })}
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
                <div className="onboarding-budget-created-wallet">
                  {(() => {
                    const plan = budget.walletPlan || budget.plan;
                    const name = budget.walletName || budget.wallet;
                    if (plan === 'Shared') return 'Shared';
                    if (plan === 'Personal') return 'Personal';
                    return name || 'Personal';
                  })()}
                </div>
              </div>
            ))}
            <button
              className="onboarding-budget-card"
              type="button"
              onClick={() => navigate('/add-budget', { state: { returnTo: '/onboarding/budget' } })}
            >
              <span className="onboarding-budget-plus">+</span>
            </button>
          </div>
          <div className="onboarding-navigation-wrapper">
            <button className="onboarding-button-back" type="button" onClick={handleBack}>
              Back
            </button>
            <button className="onboarding-button-next" type="button" onClick={handleNext}>
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
