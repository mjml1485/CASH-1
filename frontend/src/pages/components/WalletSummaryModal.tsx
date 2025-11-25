import { useState, useEffect } from 'react';
import { FaTimes, FaWallet } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS } from '../../utils/shared';
import * as transactionService from '../../services/transactionService';
import { useCurrency } from '../../hooks/useCurrency';
import type { Transaction } from '../../services/transactionService';

interface WalletSummary {
  id: string;
  name: string;
  balance: string;
  type: string;
  plan: 'Personal' | 'Shared';
  color1: string;
  color2: string;
  textColor?: string;
  backgroundColor?: string;
  walletType?: string;
  description?: string;
  currency?: string;
}

interface WalletSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletSummary | null;
}

export default function WalletSummaryModal({ isOpen, onClose, wallet }: WalletSummaryModalProps) {
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && wallet) {
      loadTransactions();
    }
  }, [isOpen, wallet]);

  const loadTransactions = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const allTransactions = await transactionService.getTransactions();
      // Filter transactions for this wallet
      const walletTransactions = allTransactions.filter(t =>
        t.walletFrom === wallet.name || t.walletTo === wallet.name
      ).slice(0, 10); // Show last 10 transactions
      setTransactions(walletTransactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !wallet) return null;

  const walletCurrency = wallet.currency || currency;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wallet-summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Wallet Summary</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="receipt-container">
          {/* Receipt Header */}
          <div className="receipt-header">
            <div className="receipt-logo">
              <FaWallet />
            </div>
            <div className="receipt-title">
              <h3>{wallet.name}</h3>
              <p>{wallet.plan} Wallet</p>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="receipt-body">
            <div className="receipt-section">
              <div className="receipt-row">
                <span>Wallet Type:</span>
                <span>{wallet.walletType || wallet.type}</span>
              </div>
              <div className="receipt-row">
                <span>Balance:</span>
                <span className="receipt-balance">
                  {CURRENCY_SYMBOLS[walletCurrency]} {formatAmount(wallet.balance)}
                </span>
              </div>
              {wallet.description && (
                <div className="receipt-row">
                  <span>Description:</span>
                  <span>{wallet.description}</span>
                </div>
              )}
            </div>

            {/* Transactions Section */}
            <div className="receipt-section">
              <h4 className="receipt-section-title">Recent Transactions</h4>
              {loading ? (
                <p>Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p>No transactions found</p>
              ) : (
                <div className="receipt-transactions">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="receipt-transaction">
                      <div className="transaction-info">
                        <span className="transaction-category">{tx.category}</span>
                        <span className="transaction-date">
                          {new Date(tx.dateISO).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="transaction-amount">
                        <span className={`amount-${tx.type.toLowerCase()}`}>
                          {tx.type === 'Income' ? '+' : tx.type === 'Expense' ? '-' : ''}
                          {CURRENCY_SYMBOLS[walletCurrency]} {formatAmount(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="receipt-footer">
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}