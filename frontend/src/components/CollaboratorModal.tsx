import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import type { Collaborator } from '../utils/shared';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  collaborators: Collaborator[];
  onAddCollaborator: (input: string) => void;
  onRemoveCollaborator: (id: string) => void;
  onRoleChange: (id: string, role: string) => void;
  ownerName?: string;
  ownerEmail?: string;
  variant?: 'wallet' | 'budget';
}

export default function CollaboratorModal({
  isOpen,
  onClose,
  title,
  collaborators,
  onAddCollaborator,
  onRemoveCollaborator,
  onRoleChange,
  ownerName = 'FirstName LastName',
  ownerEmail = 'useroneeeeeeeee@gmail.com',
  variant = 'wallet'
}: CollaboratorModalProps) {
  const [collaboratorInput, setCollaboratorInput] = useState<string>('');

  const handleAddClick = () => {
    if (collaboratorInput.trim()) {
      onAddCollaborator(collaboratorInput.trim());
      setCollaboratorInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddClick();
    }
  };

  if (!isOpen) return null;

  if (variant === 'wallet') {
    return (
      <div className="wallet-modal-overlay">
        <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="wallet-modal-title">Share '{title}'</h2>
          
          <div className="wallet-modal-input-wrapper">
            <input
              type="text"
              className="wallet-modal-input"
              placeholder="Add collaborators (email or username)"
              value={collaboratorInput}
              onChange={(e) => setCollaboratorInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            {collaboratorInput.trim() && (
              <button
                type="button"
                className="wallet-modal-add-btn"
                onClick={handleAddClick}
              >
                Add
              </button>
            )}
          </div>

          <div className="wallet-modal-section">
            <h3 className="wallet-modal-section-title">People with access</h3>
            
            <div className="wallet-modal-person">
              <div className="wallet-modal-person-avatar">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#e2e8f0"/>
                  <path d="M16 10C17.1046 10 18 10.8954 18 12C18 13.1046 17.1046 14 16 14C14.8954 14 14 13.1046 14 12C14 10.8954 14.8954 10 16 10Z" fill="#4a5568"/>
                  <path d="M16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16Z" fill="#4a5568"/>
                  <path d="M22 22C22 19.7909 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22V24H22V22Z" fill="#4a5568"/>
                </svg>
              </div>
              <div className="wallet-modal-person-info">
                <div className="wallet-modal-person-name">{ownerName}</div>
                <div className="wallet-modal-person-email">{ownerEmail}</div>
              </div>
              <div className="wallet-modal-person-role">Owner</div>
            </div>

            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="wallet-modal-person">
                <div className="wallet-modal-person-avatar">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#e2e8f0"/>
                    <path d="M16 10C17.1046 10 18 10.8954 18 12C18 13.1046 17.1046 14 16 14C14.8954 14 14 13.1046 14 12C14 10.8954 14.8954 10 16 10Z" fill="#4a5568"/>
                    <path d="M16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16Z" fill="#4a5568"/>
                    <path d="M22 22C22 19.7909 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22V24H22V22Z" fill="#4a5568"/>
                  </svg>
                </div>
                <div className="wallet-modal-person-info">
                  <div className="wallet-modal-person-name">{collaborator.name}</div>
                  <div className="wallet-modal-person-email">{collaborator.email}</div>
                </div>
                <div className="wallet-modal-person-role-select">
                  <select
                    value={collaborator.role}
                    onChange={(e) => onRoleChange(collaborator.id, e.target.value)}
                    className="wallet-modal-role-dropdown"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                  </select>
                  <FaChevronDown className="wallet-modal-role-arrow" />
                </div>
                <button
                  className="wallet-modal-remove"
                  type="button"
                  onClick={() => onRemoveCollaborator(collaborator.id)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="wallet-modal-footer">
            <button className="wallet-modal-done" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-modal-overlay">
      <div className="budget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="budget-modal-header">
          <h2>Manage Collaborators</h2>
          <button 
            type="button" 
            className="budget-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="budget-modal-content">
          <p className="budget-modal-subtitle">
            Add people to share this budget with. Changes will reflect in both wallet and budget.
          </p>
          
          <div className="budget-collaborator-input-wrapper">
            <input
              type="text"
              placeholder="Enter name or email"
              value={collaboratorInput}
              onChange={(e) => setCollaboratorInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="budget-collaborator-input"
            />
            <button
              type="button"
              onClick={handleAddClick}
              className="budget-add-collaborator-btn"
              disabled={!collaboratorInput.trim()}
            >
              Add
            </button>
          </div>

          <div className="budget-collaborators-list-modal">
            <div className="budget-collaborator-item-modal owner">
              <div className="budget-collaborator-info-modal">
                <span className="budget-collaborator-name-modal">You (Owner)</span>
                <span className="budget-collaborator-email-modal">Current User</span>
              </div>
              <span className="budget-collaborator-role-modal">Owner</span>
            </div>

            {collaborators.map((collaborator: Collaborator) => (
              <div key={collaborator.id} className="budget-collaborator-item-modal">
                <div className="budget-collaborator-info-modal">
                  <span className="budget-collaborator-name-modal">{collaborator.name}</span>
                  <span className="budget-collaborator-email-modal">{collaborator.email}</span>
                </div>
                <div className="budget-collaborator-actions">
                  <select
                    value={collaborator.role}
                    onChange={(e) => onRoleChange(collaborator.id, e.target.value)}
                    className="budget-role-select"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onRemoveCollaborator(collaborator.id)}
                    className="budget-remove-btn"
                    title="Remove collaborator"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="budget-modal-done-btn"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
