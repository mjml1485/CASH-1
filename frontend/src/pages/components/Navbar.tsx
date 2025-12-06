import { useState, useEffect, useRef } from 'react';
import { FaBell, FaUser, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, followBackFromNotification, unfollowUser } from '../../services/userService';

interface UserNotification {
  _id: string;
  userId: string;
  type: 'follow' | 'follow_back';
  actorId: string;
  actorName: string;
  actorUsername: string;
  read: boolean;
  createdAt: string;
  relationship: 'none' | 'following' | 'followed_by' | 'friends';
}

interface NavbarProps {
  activePage: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Profile';
  onPageChange: (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan') => void;
}

export default function Navbar({ activePage, onPageChange }: NavbarProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [unfollowTarget, setUnfollowTarget] = useState<UserNotification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount()
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  // When opening notifications: capture unread IDs for highlighting, then mark all as read
  const handleOpenNotifications = async () => {
    if (!showNotifications) {
      // Capture which notifications are currently unread for highlighting
      const unreadIds = new Set(notifications.filter(n => !n.read).map(n => n._id));
      setHighlightedIds(unreadIds);
      
      // Mark all as read in the background
      if (unreadIds.size > 0) {
        try {
          await markAllNotificationsAsRead();
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        } catch (err) {
          console.error('Failed to mark all as read:', err);
        }
      }
    } else {
      // When closing, clear highlights
      setHighlightedIds(new Set());
    }
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = (notification: UserNotification) => {
    setShowNotifications(false);
    setHighlightedIds(new Set());
    navigate(`/user/${notification.actorId}`);
  };

  const handleFollowBack = async (notification: UserNotification) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await followBackFromNotification(notification._id);
      // Reload notifications to update relationship
      await loadNotifications();
    } catch (err: any) {
      console.error('Failed to follow back:', err);
      alert(err?.response?.data?.message || 'Failed to follow back');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollowClick = (e: React.MouseEvent, notification: UserNotification) => {
    e.stopPropagation();
    setUnfollowTarget(notification);
    setShowUnfollowModal(true);
  };

  const handleConfirmUnfollow = async () => {
    if (!unfollowTarget || isLoading) return;
    setIsLoading(true);
    try {
      await unfollowUser(unfollowTarget.actorId);
      // Reload notifications to update relationship
      await loadNotifications();
      setShowUnfollowModal(false);
      setUnfollowTarget(null);
    } catch (err: any) {
      console.error('Failed to unfollow:', err);
      alert(err?.response?.data?.message || 'Failed to unfollow');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationButton = (notification: UserNotification) => {
    // Show Follow back only if they follow you but you don't follow them
    if (notification.relationship === 'followed_by') {
      return (
        <button 
          className="navbar-notification-follow-back"
          onClick={(e) => {
            e.stopPropagation();
            handleFollowBack(notification);
          }}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Follow back'}
        </button>
      );
    }
    
    // Show Friends/Following button with unfollow option
    if (notification.relationship === 'friends' || notification.relationship === 'following') {
      return (
        <button 
          className="navbar-notification-friends"
          onClick={(e) => handleUnfollowClick(e, notification)}
          disabled={isLoading}
        >
          {notification.relationship === 'friends' ? '✓ Friends' : 'Following'}
        </button>
      );
    }
    
    // If relationship is 'none', they unfollowed you - no button needed
    return null;
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">CASH</div>
        <div className="navbar-menu">
          <button
            className={`navbar-link ${activePage === 'Dashboard' ? 'active' : ''}`}
            onClick={() => onPageChange('Dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`navbar-link ${activePage === 'Personal Plan' ? 'active' : ''}`}
            onClick={() => onPageChange('Personal Plan')}
          >
            Personal Plan
          </button>
          <button
            className={`navbar-link ${activePage === 'Shared Plan' ? 'active' : ''}`}
            onClick={() => onPageChange('Shared Plan')}
          >
            Shared Plan
          </button>
        </div>
        <div className="navbar-actions">
          <div className="navbar-notification-wrapper" ref={notificationRef}>
            <button 
              className={`navbar-icon ${unreadCount > 0 ? 'navbar-icon-has-notifications' : ''}`} 
              aria-label="Notifications"
              onClick={handleOpenNotifications}
            >
              <FaBell />
              {unreadCount > 0 && <span className="navbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="navbar-notifications-dropdown">
                <div className="navbar-notifications-header">
                  <h3>Notifications</h3>
                  <button className="navbar-notifications-close" onClick={() => { setShowNotifications(false); setHighlightedIds(new Set()); }}>
                    <FaTimes />
                  </button>
                </div>
                <div className="navbar-notifications-content">
                  {notifications.length === 0 ? (
                    <div className="navbar-notifications-empty">
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification._id} 
                        className={`navbar-notification-item ${highlightedIds.has(notification._id) ? 'navbar-notification-unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="navbar-notification-item-content">
                          <p className="navbar-notification-text">
                            <strong>@{notification.actorUsername}</strong> followed you
                          </p>
                          <span className="navbar-notification-time">{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                        {renderNotificationButton(notification)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="navbar-icon" aria-label="Profile" onClick={() => navigate('/profile')}>
            <FaUser />
          </button>
        </div>
      </nav>

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && unfollowTarget && (
        <div className="wallet-modal-overlay" role="dialog" aria-modal="true">
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="wallet-modal-title">Unfollow @{unfollowTarget.actorUsername}?</h3>
            <p className="wallet-confirm-text">
              Are you sure you want to unfollow <strong>{unfollowTarget.actorName}</strong>? You will no longer be friends.
            </p>
            <div className="wallet-confirm-actions">
              <button 
                className="wallet-modal-btn secondary" 
                onClick={() => { setShowUnfollowModal(false); setUnfollowTarget(null); }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="wallet-modal-btn" 
                onClick={handleConfirmUnfollow}
                disabled={isLoading}
              >
                {isLoading ? 'Unfollowing...' : 'Unfollow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
