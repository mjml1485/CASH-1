import { useState, useEffect, useRef } from 'react';
import { FaBell, FaUser, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, followBackFromNotification } from '../../services/userService';

interface UserNotification {
  _id: string;
  userId: string;
  type: 'follow' | 'follow_back';
  actorId: string;
  actorName: string;
  actorUsername: string;
  read: boolean;
  createdAt: string;
}

interface NavbarProps {
  activePage: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements' | 'Profile';
  onPageChange: (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => void;
}

export default function Navbar({ activePage, onPageChange }: NavbarProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
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

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const handleFollowBack = async (notification: UserNotification) => {
    try {
      await followBackFromNotification(notification._id);
      // Reload notifications to update state
      await loadNotifications();
    } catch (err: any) {
      console.error('Failed to follow back:', err);
      alert(err?.response?.data?.message || 'Failed to follow back');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
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

  return (
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
        <button
          className={`navbar-link ${activePage === 'Achievements' ? 'active' : ''}`}
          onClick={() => onPageChange('Achievements')}
        >
          Achievements
        </button>
      </div>
      <div className="navbar-actions">
        <div className="navbar-notification-wrapper" ref={notificationRef}>
          <button 
            className={`navbar-icon ${unreadCount > 0 ? 'navbar-icon-has-notifications' : ''}`} 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
          <FaBell />
            {unreadCount > 0 && <span className="navbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="navbar-notifications-dropdown">
              <div className="navbar-notifications-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="navbar-mark-all-read" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                )}
                <button className="navbar-notifications-close" onClick={() => setShowNotifications(false)}>
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
                      className={`navbar-notification-item ${!notification.read ? 'navbar-notification-unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="navbar-notification-item-content">
                        <p className="navbar-notification-text">
                          <strong>@{notification.actorUsername}</strong> followed you
                        </p>
                        <span className="navbar-notification-time">{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                      {!notification.read && (
                        <button 
                          className="navbar-notification-follow-back"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowBack(notification);
                          }}
                        >
                          Follow back
        </button>
                      )}
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
  );
}
