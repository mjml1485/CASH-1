import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS } from '../../utils/shared';
import { useCurrency } from '../../hooks/useCurrency';

export default function Wallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const [wallets, setWallets] = useState<any[]>(() => {
    const saved = sessionStorage.getItem('onboardingWallets');
    return saved ? JSON.parse(saved) : [];
  });
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [walletToDelete, setWalletToDelete] = useState<number | null>(null);

  const { currency } = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₱';

  useEffect(() => {
    sessionStorage.setItem('onboardingWallets', JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
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
  }, [location.state]);

  const handleBack = () => {
    navigate('/onboarding/currency');
  };

  const handleNext = () => {
    navigate('/onboarding/budget');
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
                onClick={() => navigate('/add-wallet', { state: { editMode: true, walletIndex: index, walletData: wallet, returnTo: '/onboarding/wallet' } })}
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
              onClick={() => navigate('/add-wallet', { state: { returnTo: '/onboarding/wallet' } })}
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
