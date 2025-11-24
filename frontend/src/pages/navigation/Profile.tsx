import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../config/cloudinary.private';

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaCamera, FaSearch, FaTimes, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { fetchProfileBackend, updateProfileBackend, createOrUpdateProfileBackend } from '../../services/userService';

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
  const { signOut, currentUser } = useAuth();
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
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null);
  const [editedBio, setEditedBio] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
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
    if (!currentUser) return;

    (async () => {
      try {
        // Always fetch from backend first
        const backendProfile = await fetchProfileBackend();
        if (backendProfile) {
          setProfile({
            uid: backendProfile.uid || currentUser.uid || '',
            name: backendProfile.name || currentUser.name || '',
            email: backendProfile.email || currentUser.email || '',
            username: backendProfile.username || currentUser.email?.split('@')[0] || '',
            bio: backendProfile.bio || '',
            showEmail: typeof backendProfile.showEmail === 'boolean' ? backendProfile.showEmail : false,
            avatar: backendProfile.avatar || '',
            coverPhoto: backendProfile.header || '',
            createdAt: backendProfile.createdAt,
            updatedAt: backendProfile.updatedAt
          });
        } else {
          // If no profile exists, create one with default values
          try {
            const defaultUsername = currentUser.email?.split('@')[0] || 'user';
            await createOrUpdateProfileBackend({
              name: currentUser.name || defaultUsername,
              username: defaultUsername
            });
            // Fetch again after creation
            const newProfile = await fetchProfileBackend();
            if (newProfile) {
              setProfile({
                uid: newProfile.uid || currentUser.uid || '',
                name: newProfile.name || currentUser.name || '',
                email: newProfile.email || currentUser.email || '',
                username: newProfile.username || defaultUsername,
                bio: newProfile.bio || '',
                showEmail: typeof newProfile.showEmail === 'boolean' ? newProfile.showEmail : false,
                avatar: newProfile.avatar || '',
                coverPhoto: newProfile.header || '',
                createdAt: newProfile.createdAt,
                updatedAt: newProfile.updatedAt
              });
            }
          } catch (createErr) {
            console.error('Failed to create profile:', createErr);
            // Fallback to current user data
            setProfile(prev => ({
              ...prev,
              name: currentUser.name || prev.name || '',
              email: currentUser.email || prev.email || '',
              username: prev.username || currentUser.email?.split('@')[0] || '',
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        // Only use currentUser as fallback, not sessionStorage
        setProfile(prev => ({
          ...prev,
          name: currentUser.name || prev.name || '',
          email: currentUser.email || prev.email || '',
          username: prev.username || currentUser.email?.split('@')[0] || '',
        }));
      }
    })();

    // Followers/Following can stay in sessionStorage for now (social features)
    const storedFollowers = sessionStorage.getItem('followers');
    const storedFollowing = sessionStorage.getItem('following');
    if (storedFollowers) setFollowers(JSON.parse(storedFollowers));
    if (storedFollowing) setFollowing(JSON.parse(storedFollowing));
  }, [currentUser]);

  const handleTabChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => {
    const target = page === 'Dashboard' ? '/dashboard' : page === 'Personal Plan' ? '/personal' : page === 'Shared Plan' ? '/shared' : '/achievements';
    navigate(target);
  };

  const handleSaveBio = async () => {
    if (!editedName.trim()) { setSaveError('Name is required'); return; }
    if (!editedUsername.trim()) { setSaveError('Username is required'); return; }

    try {
      // Save to backend first
      await updateProfileBackend({
        name: editedName.trim(),
        username: editedUsername.trim(),
        bio: editedBio,
        showEmail: editedShowEmail,
        avatar: avatarPreview !== null ? avatarPreview : profile.avatar,
        coverPhoto: coverPreview !== null ? coverPreview : profile.coverPhoto,
      });
      
      // Fetch updated profile from backend
      const backendProfile = await fetchProfileBackend();
      if (backendProfile) {
        setProfile({
          ...profile,
          name: backendProfile.name || editedName.trim(),
          email: backendProfile.email || profile.email,
          username: backendProfile.username || editedUsername.trim(),
          bio: backendProfile.bio || editedBio,
          showEmail: typeof backendProfile.showEmail === 'boolean' ? backendProfile.showEmail : editedShowEmail,
          avatar: backendProfile.avatar || (avatarPreview !== null ? avatarPreview : profile.avatar),
          coverPhoto: backendProfile.header || (coverPreview !== null ? coverPreview : profile.coverPhoto),
        });
      } else {
        // Fallback to local state if fetch fails
        setProfile({
          ...profile,
          name: editedName.trim(),
          username: editedUsername.trim(),
          bio: editedBio,
          showEmail: editedShowEmail,
          avatar: avatarPreview !== null ? avatarPreview : profile.avatar,
          coverPhoto: coverPreview !== null ? coverPreview : profile.coverPhoto,
        });
      }
      setSaveError(null);
      setEditMode(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSaveError('Username already exists. Please choose another.');
      } else {
        console.error('Failed to save profile:', err);
        setSaveError(err?.response?.data?.message || err?.message || 'Failed to save profile');
      }
    }
  };

  const handleEmailChange = async () => {
    setEmailChangeError(null);
    setEmailChangeSuccess(null);
    if (!newEmail.trim() || !newEmail.includes('@') || !newEmail.includes('.')) {
      setEmailChangeError('A valid email is required');
      return;
    }
    if (!emailPassword) {
      setEmailChangeError('Password is required');
      return;
    }
    try {
      const { changeEmailBackend } = await import('../../services/userService');
      await changeEmailBackend({ newEmail: newEmail.trim(), password: emailPassword });
      setEmailChangeSuccess('Email changed successfully! Please use your new email next time you log in.');
      setProfile(prev => ({ ...prev, email: newEmail.trim() }));
      setShowEmailChangeModal(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setEmailChangeError('Email already exists. Please use another.');
      } else if (err?.response?.status === 401) {
        setEmailChangeError('Password is incorrect.');
      } else {
        setEmailChangeError('Failed to change email.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditedBio(profile.bio);
    setEditedName(profile.name);
    setEditedUsername(profile.username);
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

  const handleLogout = async () => {
    try {
      await signOut();
      sessionStorage.clear();
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      sessionStorage.clear();
      navigate('/signin');
    }
  };

  return (
    <div className="profile-page">
      <Navbar activePage={activePage} onPageChange={handleTabChange} />

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card-main">
          {/* Cover Photo */}
          <div className="profile-cover" style={{ position: 'relative' }}>
            {coverPreview || profile.coverPhoto ? (
              <img src={coverPreview || profile.coverPhoto} alt="Cover" className="profile-cover-img" />
            ) : (
              <div className="profile-cover-placeholder"></div>
            )}
            {editMode && (
              <>
                <label className="profile-cover-upload" style={{ position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', color: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 18 }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        try {
                          const url = await uploadToCloudinary(e.target.files[0]);
                          setCoverPreview(url);
                        } catch (err) {
                          alert('Upload failed.');
                        }
                      }
                    }}
                  />
                  <FaCamera />
                </label>
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontWeight: 500, fontSize: 13 }}>Header Image URL:</label>
                  <input
                    type="text"
                    placeholder="Paste image URL (e.g. from Cloudinary)"
                    value={coverPreview ?? profile.coverPhoto ?? ''}
                    onChange={e => setCoverPreview(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, marginTop: 2 }}
                  />
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Paste a direct image URL or use the camera icon to upload.</div>
                </div>
              </>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="profile-info-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large" style={{ position: 'relative' }}>
                {avatarPreview || profile.avatar ? (
                  <img src={avatarPreview || profile.avatar} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-placeholder-large">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                {editMode && (
                  <>
                    <label className="profile-avatar-upload-btn" style={{ position: 'absolute', bottom: 8, right: 8, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', color: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 18 }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            try {
                              const url = await uploadToCloudinary(e.target.files[0]);
                              setAvatarPreview(url);
                            } catch (err) {
                              alert('Upload failed.');
                            }
                          }
                        }}
                      />
                      <FaCamera />
                    </label>
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontWeight: 500, fontSize: 13 }}>Avatar Image URL:</label>
                      <input
                        type="text"
                        placeholder="Paste image URL (e.g. from Cloudinary)"
                        value={avatarPreview ?? profile.avatar ?? ''}
                        onChange={e => setAvatarPreview(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, marginTop: 2 }}
                      />
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Paste a direct image URL or use the camera icon to upload.</div>
                    </div>
                  </>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="email"
                          className="profile-email-input"
                          value={profile.email}
                          disabled
                          style={{ background: '#f5f5f5', color: '#888' }}
                        />
                        <button type="button" className="profile-edit-btn" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => {
                          setShowEmailChangeModal(true);
                          setNewEmail('');
                          setEmailPassword('');
                          setEmailChangeError(null);
                          setEmailChangeSuccess(null);
                        }}>Change</button>
                      </div>
                            {/* Email Change Modal */}
                            {showEmailChangeModal && (
                              <div className="profile-modal-overlay" onClick={() => setShowEmailChangeModal(false)}>
                                <div
                                  className="profile-modal"
                                  onClick={e => e.stopPropagation()}
                                  style={{ maxWidth: 400, padding: 28, borderRadius: 18, background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
                                >
                                  <div className="profile-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                    <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Change Email</h3>
                                    <button className="profile-modal-close" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }} onClick={() => setShowEmailChangeModal(false)}><FaTimes /></button>
                                  </div>
                                  <div className="profile-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <label style={{ fontWeight: 500, marginBottom: 2 }}>New Email</label>
                                    <input
                                      type="email"
                                      value={newEmail}
                                      onChange={e => setNewEmail(e.target.value)}
                                      className="profile-email-input"
                                      placeholder="Enter new email"
                                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15, marginBottom: 6 }}
                                    />
                                    <label style={{ fontWeight: 500, marginBottom: 2 }}>Password</label>
                                    <input
                                      type="password"
                                      value={emailPassword}
                                      onChange={e => setEmailPassword(e.target.value)}
                                      className="profile-email-input"
                                      placeholder="Enter your password"
                                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15, marginBottom: 6 }}
                                    />
                                    {emailChangeError && <p className="profile-save-error" style={{ color: '#fc8181', fontWeight: 500, margin: '6px 0 0 0' }}>{emailChangeError}</p>}
                                    {emailChangeSuccess && <p style={{ color: 'green', fontWeight: 500, margin: '6px 0 0 0' }}>{emailChangeSuccess}</p>}
                                    <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'flex-end' }}>
                                      <button
                                        className="profile-edit-btn"
                                        style={{ background: 'linear-gradient(90deg, #6b73ff 0%, #000dff 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 15, boxShadow: '0 2px 8px rgba(107,115,255,0.08)' }}
                                        onClick={handleEmailChange}
                                      >
                                        Change Email
                                      </button>
                                      <button
                                        className="profile-cancel-btn"
                                        style={{ background: '#f3f4f6', color: '#333', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 500, fontSize: 15 }}
                                        onClick={() => setShowEmailChangeModal(false)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
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
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="profile-edit-btn" onClick={() => {
                    if (editMode) {
                      handleSaveBio();
                    } else {
                      setEditMode(true);
                      setEditedBio(profile.bio);
                      setEditedName(profile.name);
                      setEditedUsername(profile.username);
                      setEditedShowEmail(profile.showEmail);
                    }
                  }}>
                    {editMode ? 'Save' : 'Edit Profile'}
                  </button>
                  <button 
                    className="profile-edit-btn" 
                    onClick={handleLogout}
                    style={{ 
                      backgroundColor: '#dc3545', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px'
                    }}
                    title="Sign out"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
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

          {/* Stats Row */}
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
