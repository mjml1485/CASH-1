import Wallet from '../models/Wallet.js';

/**
 * Get user role for a wallet
 * @param {Object} wallet - The wallet object
 * @param {string} userUid - User's Firebase UID
 * @param {string} userEmail - User's email
 * @returns {string} - 'Owner', 'Editor', 'Viewer', or null if no access
 */
export function getUserRoleForWallet(wallet, userUid, userEmail) {
  // Check if user is the owner
  if (wallet.userId === userUid) {
    return 'Owner';
  }
  
  // Check collaborators
  if (wallet.collaborators && wallet.collaborators.length > 0) {
    const collab = wallet.collaborators.find(c => c.email === userEmail);
    if (collab) {
      return collab.role; // 'Owner', 'Editor', or 'Viewer'
    }
  }
  
  return null; // No access
}

/**
 * Check if user can edit (Owner or Editor)
 * @param {Object} wallet - The wallet object
 * @param {string} userUid - User's Firebase UID
 * @param {string} userEmail - User's email
 * @returns {boolean}
 */
export function canEditWallet(wallet, userUid, userEmail) {
  const role = getUserRoleForWallet(wallet, userUid, userEmail);
  return role === 'Owner' || role === 'Editor';
}

/**
 * Check if user is owner
 * @param {Object} wallet - The wallet object
 * @param {string} userUid - User's Firebase UID
 * @param {string} userEmail - User's email
 * @returns {boolean}
 */
export function isOwner(wallet, userUid, userEmail) {
  const role = getUserRoleForWallet(wallet, userUid, userEmail);
  return role === 'Owner';
}

/**
 * Get user role for a wallet by wallet name
 * @param {string} walletName - Wallet name
 * @param {string} userUid - User's Firebase UID
 * @param {string} userEmail - User's email
 * @returns {Promise<string|null>} - 'Owner', 'Editor', 'Viewer', or null
 */
export async function getUserRoleForWalletByName(walletName, userUid, userEmail) {
  const wallet = await Wallet.findOne({ name: walletName });
  if (!wallet) return null;
  return getUserRoleForWallet(wallet, userUid, userEmail);
}

