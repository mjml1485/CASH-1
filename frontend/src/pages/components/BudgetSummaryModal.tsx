import { useState, useEffect } from 'react';
import { FaTimes, FaMoneyBill } from 'react-icons/fa';
import { formatAmount, CURRENCY_SYMBOLS } from '../../utils/shared';
import * as transactionService from '../../services/transactionService';
import { useCurrency } from '../../hooks/useCurrency';
import type { Transaction } from '../../services/transactionService';

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

interface BudgetSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
}

export default function BudgetSummaryModal({ isOpen, onClose, budget }: BudgetSummaryModalProps) {
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && budget) {
      loadTransactions();
    }
  }, [isOpen, budget]);

  const loadTransactions = async () => {
    if (!budget) return;
    setLoading(true);
    try {
      const allTransactions = await transactionService.getTransactions();
      // Filter transactions for this budget category
      const budgetTransactions = allTransactions.filter(t =>
        t.category === budget.category
      ).slice(0, 10); // Show last 10 transactions
      setTransactions(budgetTransactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !budget) return null;

  const amount = parseFloat(budget.amount || '0');
  const left = parseFloat(budget.left || budget.amount || '0');
  const spent = amount - left;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content budget-summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Budget Summary</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="receipt-container">
          {/* Receipt Header */}
          <div className="receipt-header">
            <div className="receipt-logo">
              <FaMoneyBill />
            </div>
            <div className="receipt-title">
              <h3>{budget.category}</h3>
              <p>{budget.plan} Budget</p>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="receipt-body">
            <div className="receipt-section">
              <div className="receipt-row">
                <span>Period:</span>
                <span>{budget.period}</span>
              </div>
              <div className="receipt-row">
                <span>Wallet:</span>
                <span>{budget.wallet}</span>
              </div>
              <div className="receipt-row">
                <span>Total Budget:</span>
                <span>{CURRENCY_SYMBOLS[currency]} {formatAmount(budget.amount)}</span>
              </div>
              <div className="receipt-row">
                <span>Spent:</span>
                <span>{CURRENCY_SYMBOLS[currency]} {formatAmount(spent.toString())}</span>
              </div>
              <div className="receipt-row">
                <span>Remaining:</span>
                <span className="receipt-balance">
                  {CURRENCY_SYMBOLS[currency]} {formatAmount(budget.left || budget.amount)}
                </span>
              </div>
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
                          {CURRENCY_SYMBOLS[currency]} {formatAmount(tx.amount)}
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