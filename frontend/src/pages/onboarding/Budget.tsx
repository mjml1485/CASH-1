import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS } from '../../utils/shared';
import { useCurrency } from '../../hooks/useCurrency';
import { markOnboardingCompleted } from '../../services/userService';
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';

export default function Budget() {
    const navigate = useNavigate();
    const location = useLocation();
    const [budgets, setBudgets] = useState<any[]>(() => {
        const saved = sessionStorage.getItem('onboardingBudgets');
        return saved ? JSON.parse(saved) : [];
    });
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);

    const { currency } = useCurrency();
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
                    b.wallet === newBudget.wallet
                );

                if (!isDuplicate) {
                    setBudgets(prev => {
                        const stateHasDuplicate = prev.some(b =>
                            b.category === newBudget.category &&
                            b.amount === newBudget.amount &&
                            b.wallet === newBudget.wallet
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

    const handleNext = async () => {
        try {
            // Save all wallets and budgets to backend
            const savedWallets = sessionStorage.getItem('onboardingWallets');
            const wallets = savedWallets ? JSON.parse(savedWallets) : [];

            // Create wallets
            for (const wallet of wallets) {
                await walletService.createWallet({
                    name: wallet.name,
                    balance: wallet.balance,
                    plan: wallet.plan,
                    walletType: wallet.walletType,
                    backgroundColor: wallet.backgroundColor,
                    textColor: wallet.textColor,
                    color1: wallet.color1 || wallet.backgroundColor,
                    color2: wallet.color2 || wallet.backgroundColor,
                    template: wallet.template || 'Default',
                    collaborators: wallet.collaborators || []
                });
            }

            // Create budgets
            for (const budget of budgets) {
                await budgetService.createBudget({
                    category: budget.category,
                    amount: budget.amount,
                    period: budget.period,
                    wallet: budget.wallet,
                    plan: budget.plan,
                    startDate: budget.startDate,
                    endDate: budget.endDate,
                    left: budget.left || budget.amount,
                    collaborators: budget.collaborators || []
                });
            }

            // Mark onboarding as completed
            await markOnboardingCompleted();

            // Dispatch event to notify that onboarding is complete
            window.dispatchEvent(new Event('onboarding-status-updated'));

            // Clear session storage
            sessionStorage.removeItem('onboardingWallets');
            sessionStorage.removeItem('onboardingBudgets');

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to complete onboarding:', err);
            alert('Failed to save data. Please try again.');
        }
    };

    const handleDeleteBudget = (index: number) => {
        setBudgetToDelete(index);
        setShowDeleteModal(true);
    };

    const confirmDeleteBudget = () => {
        if (budgetToDelete !== null) {
            const updatedBudgets = budgets.filter((_, i) => i !== budgetToDelete);
            setBudgets(updatedBudgets);
            sessionStorage.setItem('onboardingBudgets', JSON.stringify(updatedBudgets));
            setBudgetToDelete(null);
        }
        setShowDeleteModal(false);
    };

    const cancelDeleteBudget = () => {
        setBudgetToDelete(null);
        setShowDeleteModal(false);
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                <div className="onboarding-form-inner">
                    <div className="onboarding-header">
                        <h1 className="onboarding-title-wallet">Add Budget</h1>
                        <p className="onboarding-subtitle-normal">Set up your budgets to track spending and stay on top of your finances!</p>
                    </div>
                    <div className="onboarding-wallet-card-wrapper">
                        {budgets.map((budget, index) => (
                            <div
                                key={index}
                                className="onboarding-wallet-created-card"
                                onClick={() => navigate('/add-budget', { state: { editMode: true, budgetIndex: index, budgetData: budget, returnTo: '/onboarding/budget' } })}
                            >
                                <button
                                    type="button"
                                    className="onboarding-wallet-delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBudget(index);
                                    }}
                                >
                                    <FaTimes />
                                </button>
                                <div className="onboarding-wallet-created-name">{budget.category}</div>
                                <div className="onboarding-wallet-created-balance">
                                    {currencySymbol}{formatAmount(budget.amount)}
                                </div>
                                <div className="onboarding-wallet-created-type">{budget.period || 'Monthly'}</div>
                                <div className="onboarding-wallet-created-plan">{budget.wallet || 'Wallet'}</div>
                            </div>
                        ))}
                        <button
                            className="onboarding-wallet-card"
                            type="button"
                            onClick={() => navigate('/add-budget', { state: { returnTo: '/onboarding/budget' } })}
                        >
                            <span className="onboarding-wallet-plus">+</span>
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

            {showDeleteModal && (
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
