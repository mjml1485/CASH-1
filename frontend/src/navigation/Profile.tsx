import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaCamera, FaSearch, FaTimes, FaArrowLeft } from 'react-icons/fa';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  avatar?: string;
  coverPhoto?: string;
  joinedDate: string;
  showEmail: boolean;
}

interface Connection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

const ALL_USERS: Connection[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', bio: 'Budget enthusiast 💰' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', bio: 'Saving for the future' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', bio: 'Finance blogger' },
  { id: '4', name: 'David Lee', email: 'david@example.com', bio: 'Investment tracker' },
  { id: '5', name: 'Emma Davis', email: 'emma@example.com', bio: 'Money management coach' },
  { id: '6', name: 'Frank Wilson', email: 'frank@example.com', bio: 'Crypto trader' },
  { id: '7', name: 'Grace Taylor', email: 'grace@example.com', bio: 'Personal finance advisor' },
];

export default function Profile() {
  const navigate = useNavigate();
  const [activePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements'>('Dashboard');
  const [profile, setProfile] = useState<UserProfile>({
    id: 'current-user',
    name: '',
    username: '',
    email: '',
    bio: '',
    joinedDate: 'November 2025',
    showEmail: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [editedBio, setEditedBio] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedShowEmail, setEditedShowEmail] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Connection[]>([]);

  useEffect(() => {
    const storedProfile = sessionStorage.getItem('profile');
    if (storedProfile) {
      try {
        const prof = JSON.parse(storedProfile);
        setProfile(prev => ({ ...prev, ...prof }));
      } catch {}
    } else {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setProfile(prev => ({
          ...prev,
          name: userData.name || '',
          username: userData.username || userData.email?.split('@')[0] || '',
          email: userData.email || '',
        }));
      }
    }

    const storedFollowers = sessionStorage.getItem('followers');
    const storedFollowing = sessionStorage.getItem('following');
    if (storedFollowers) setFollowers(JSON.parse(storedFollowers));
    if (storedFollowing) setFollowing(JSON.parse(storedFollowing));
  }, []);

  const handleTabChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => {
    const target = page === 'Dashboard' ? '/dashboard' : page === 'Personal Plan' ? '/personal' : page === 'Shared Plan' ? '/shared' : '/achievements';
    navigate(target);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBio = () => {
    if (!editedName.trim()) { setSaveError('Name is required'); return; }
    if (!editedUsername.trim()) { setSaveError('Username is required'); return; }
    if (!editedEmail.trim() || !editedEmail.includes('@') || !editedEmail.includes('.')) { setSaveError('A valid email is required'); return; }

    const updated = {
      ...profile,
      name: editedName.trim(),
      username: editedUsername.trim(),
      email: editedEmail.trim(),
      bio: editedBio,
      showEmail: editedShowEmail,
    } as UserProfile;
    setProfile(updated);
    sessionStorage.setItem('profile', JSON.stringify(updated));
    const currentUser = { name: updated.name, email: updated.email, username: updated.username, joinedDate: profile.joinedDate };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    setSaveError(null);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedBio(profile.bio);
    setEditedName(profile.name);
    setEditedUsername(profile.username);
    setEditedEmail(profile.email);
    setEditedShowEmail(profile.showEmail);
    setEditMode(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = ALL_USERS.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      ).filter(user => !following.some(f => f.id === user.id));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleFollow = (user: Connection) => {
    const newFollowing = [...following, user];
    setFollowing(newFollowing);
    sessionStorage.setItem('following', JSON.stringify(newFollowing));
    setSearchResults(searchResults.filter(u => u.id !== user.id));
  };

  const handleUnfollow = (userId: string) => {
    const newFollowing = following.filter(f => f.id !== userId);
    setFollowing(newFollowing);
    sessionStorage.setItem('following', JSON.stringify(newFollowing));
  };

  const handleRemoveFollower = (userId: string) => {
    const newFollowers = followers.filter(f => f.id !== userId);
    setFollowers(newFollowers);
    sessionStorage.setItem('followers', JSON.stringify(newFollowers));
  };

  return (
    <div className="profile-page">
      <Navbar activePage={activePage} onPageChange={handleTabChange} />

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card-main">
          {/* Cover Photo */}
          <div className="profile-cover">
            {coverPreview || profile.coverPhoto ? (
              <img src={coverPreview || profile.coverPhoto} alt="Cover" className="profile-cover-img" />
            ) : (
              <div className="profile-cover-placeholder"></div>
            )}
            {editMode && (
              <label className="profile-cover-upload">
                <input type="file" accept="image/*" onChange={handleCoverChange} hidden />
                <FaCamera />
              </label>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="profile-info-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                {avatarPreview || profile.avatar ? (
                  <img src={avatarPreview || profile.avatar} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-placeholder-large">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                {editMode && (
                  <label className="profile-avatar-upload-btn">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                    <FaCamera />
                  </label>
                )}
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-header-row">
                <div className="profile-name-email-section">
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        className="profile-name-input"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter your name"
                      />
                      <input
                        type="text"
                        className="profile-username-input"
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        placeholder="Enter your username"
                      />
                      <input
                        type="email"
                        className="profile-email-input"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                      <label className="profile-email-visibility">
                        <input
                          type="checkbox"
                          checked={editedShowEmail}
                          onChange={(e) => setEditedShowEmail(e.target.checked)}
                        />
                        <span>Show email on profile</span>
                      </label>
                    </>
                  ) : (
                    <>
                      <h1 className="profile-name">{profile.name || 'User'}</h1>
                      <p className="profile-username">@{profile.username || 'username'}</p>
                      {profile.showEmail && <p className="profile-email-display">{profile.email}</p>}
                    </>
                  )}
                </div>
                <button className="profile-edit-btn" onClick={() => {
                  if (editMode) {
                    handleSaveBio();
                  } else {
                    setEditMode(true);
                    setEditedBio(profile.bio);
                    setEditedName(profile.name);
                    setEditedUsername(profile.username);
                    setEditedEmail(profile.email);
                    setEditedShowEmail(profile.showEmail);
                  }
                }}>
                  {editMode ? 'Save' : 'Edit Profile'}
                </button>
              </div>

              {editMode ? (
                <div className="profile-bio-edit">
                  <textarea
                    className="profile-bio-textarea"
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                  <button className="profile-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                </div>
              ) : (
                <p className="profile-bio">{profile.bio || 'No bio yet. Click Edit Profile to add one!'}</p>
              )}

              {editMode && saveError && (
                <p className="profile-save-error">{saveError}</p>
              )}
            </div>
          </div>

          {/* Stats Full-Width Row */}
          <div className="profile-stats-row">
            <div className="profile-stat-card" onClick={() => setShowFollowingModal(true)}>
              <div className="profile-stat-number">{following.length}</div>
              <div className="profile-stat-label">Following</div>
            </div>
            <div className="profile-stat-divider"></div>
            <div className="profile-stat-card" onClick={() => setShowFollowersModal(true)}>
              <div className="profile-stat-number">{followers.length}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
          </div>
        </div>

        {/* Connect Section */}
        <div className="profile-connect-section">
          <h3 className="profile-section-title">Connect with Others</h3>
          <button className="profile-search-btn" onClick={() => setShowSearchModal(true)}>
            <FaSearch />
            <span>Search and follow users</span>
          </button>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="profile-modal-overlay" onClick={() => setShowFollowersModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Followers</h3>
              <button className="profile-modal-close" onClick={() => setShowFollowersModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="profile-modal-content">
              {followers.length === 0 ? (
                <div className="profile-modal-empty">
                  <p>No followers yet</p>
                  <span>When people follow you, they'll appear here</span>
                </div>
              ) : (
                followers.map((follower) => (
                  <div key={follower.id} className="profile-user-item">
                    <div className="profile-user-avatar">
                      {follower.avatar ? (
                        <img src={follower.avatar} alt={follower.name} />
                      ) : (
                        <div className="profile-user-avatar-placeholder">
                          {follower.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="profile-user-info">
                      <p className="profile-user-name">{follower.name}</p>
                      <p className="profile-user-email">{follower.email}</p>
                      {follower.bio && <p className="profile-user-bio">{follower.bio}</p>}
                    </div>
                    <button className="profile-btn-remove" onClick={() => handleRemoveFollower(follower.id)}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="profile-modal-overlay" onClick={() => setShowFollowingModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Following</h3>
              <button className="profile-modal-close" onClick={() => setShowFollowingModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="profile-modal-content">
              {following.length === 0 ? (
                <div className="profile-modal-empty">
                  <p>Not following anyone yet</p>
                  <span>Search for users to follow and build your network</span>
                </div>
              ) : (
                following.map((user) => (
                  <div key={user.id} className="profile-user-item">
                    <div className="profile-user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <div className="profile-user-avatar-placeholder">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="profile-user-info">
                      <p className="profile-user-name">{user.name}</p>
                      <p className="profile-user-email">{user.email}</p>
                      {user.bio && <p className="profile-user-bio">{user.bio}</p>}
                    </div>
                    <button className="profile-btn-unfollow" onClick={() => handleUnfollow(user.id)}>
                      Unfollow
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="profile-modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <button className="profile-modal-back" onClick={() => setShowSearchModal(false)}>
                <FaArrowLeft />
              </button>
              <h3>Discover Users</h3>
            </div>
            <div className="profile-search-box">
              <FaSearch className="profile-search-icon" />
              <input
                type="text"
                className="profile-search-input"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="profile-modal-content">
              {searchQuery.trim() === '' ? (
                <div className="profile-modal-empty">
                  <p>Start typing to search</p>
                  <span>Find and connect with other CASH users</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="profile-modal-empty">
                  <p>No users found</p>
                  <span>Try a different search term</span>
                </div>
              ) : (
                searchResults.map((user) => (
                  <div key={user.id} className="profile-user-item">
                    <div className="profile-user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <div className="profile-user-avatar-placeholder">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="profile-user-info">
                      <p className="profile-user-name">{user.name}</p>
                      <p className="profile-user-email">{user.email}</p>
                      {user.bio && <p className="profile-user-bio">{user.bio}</p>}
                    </div>
                    <button className="profile-btn-follow" onClick={() => handleFollow(user)}>
                      Follow
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
