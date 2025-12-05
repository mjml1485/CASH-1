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
import { FaCamera, FaSearch, FaTimes, FaArrowLeft, FaSignOutAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { fetchProfileBackend, updateProfileBackend, createOrUpdateProfileBackend, searchUsers, followUser, unfollowUser, getFollowing, getFollowers, removeFollower } from '../../services/userService';

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
  firebaseUid: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { signOut, currentUser } = useAuth();
  const [activePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements' | 'Profile'>('Profile');
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
  const [emailChangeStep, setEmailChangeStep] = useState<'password' | 'newEmail'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [showUsernameChangeModal, setShowUsernameChangeModal] = useState(false);
  const [usernameChangeStep, setUsernameChangeStep] = useState<'password' | 'newUsername'>('password');
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameChangeError, setUsernameChangeError] = useState<string | null>(null);
  const [usernameChangeSuccess, setUsernameChangeSuccess] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
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
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    (async () => {
      try {
        // Always fetch from backend first
        const backendProfile = await fetchProfileBackend();
        if (backendProfile) {
          setProfile({
            // uid removed to match UserProfile type
            id: backendProfile.id || 'current-user',
            name: backendProfile.name || currentUser.name || '',
            username: backendProfile.username || currentUser.email?.split('@')[0] || '',
            email: backendProfile.email || currentUser.email || '',
            bio: backendProfile.bio || '',
            joinedDate: backendProfile.joinedDate || 'November 2025',
            showEmail: typeof backendProfile.showEmail === 'boolean' ? backendProfile.showEmail : false,
            avatar: backendProfile.avatar || '',
            coverPhoto: backendProfile.header || '',
            // createdAt removed to match UserProfile type
            // updatedAt removed to match UserProfile type
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
                // uid removed to match UserProfile type
                id: newProfile.id || 'current-user',
                name: newProfile.name || currentUser.name || '',
                username: newProfile.username || defaultUsername,
                email: newProfile.email || currentUser.email || '',
                bio: newProfile.bio || '',
                joinedDate: newProfile.joinedDate || 'November 2025',
                showEmail: typeof newProfile.showEmail === 'boolean' ? newProfile.showEmail : false,
                avatar: newProfile.avatar || '',
                coverPhoto: newProfile.header || '',
                // createdAt removed to match UserProfile type
                // updatedAt removed to match UserProfile type
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

    // Load followers and following from API
    const loadFollowData = async () => {
      try {
        const [followersData, followingData] = await Promise.all([
          getFollowers().catch(() => []),
          getFollowing().catch(() => [])
        ]);
        setFollowers(followersData.map(u => ({
          firebaseUid: u.firebaseUid,
          name: u.name,
          email: u.email,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio
        })));
        setFollowing(followingData.map(u => ({
          firebaseUid: u.firebaseUid,
          name: u.name,
          email: u.email,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio
        })));
      } catch (err) {
        console.error('Failed to load follow data:', err);
      }
    };
    loadFollowData();
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

  // Step 1: Verify password, then Step 2: Ask for new email
  const handleVerifyPassword = async () => {
    setPasswordTouched(true);
    setEmailChangeError(null);
    setEmailChangeSuccess(null);
    if (!emailPassword) {
      setEmailChangeError('Password is required');
      return;
    }
    try {
      const { reauthenticate } = await import('../../services/authService');
      await reauthenticate(emailPassword);
      setEmailChangeStep('newEmail');
      setEmailChangeError(null);
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password' || err?.response?.status === 401) {
        setEmailChangeError('Password is incorrect.');
      } else if (err?.code === 'auth/too-many-requests') {
        setEmailChangeError('Too many failed attempts. Please try again later.');
      } else if (err?.code === 'auth/requires-recent-login') {
        setEmailChangeError('Please log out and log in again, then try changing your email.');
      } else {
        setEmailChangeError('Failed to verify password.');
      }
    }
  };

  const handleVerifyUsernamePassword = async () => {
    setPasswordTouched(true);
    setUsernameChangeError(null);
    setUsernameChangeSuccess(null);
    if (!usernamePassword) {
      setUsernameChangeError('Password is required');
      return;
    }
    try {
      const { reauthenticate } = await import('../../services/authService');
      await reauthenticate(usernamePassword);
      setUsernameChangeStep('newUsername');
      setUsernameChangeError(null);
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password' || err?.response?.status === 401) {
        setUsernameChangeError('Invalid password. Please try again.');
      } else if (err?.code === 'auth/too-many-requests') {
        setUsernameChangeError('Too many failed attempts. Please try again later.');
      } else if (err?.code === 'auth/requires-recent-login') {
        setUsernameChangeError('Please log out and log in again, then try changing your username.');
      } else {
        setUsernameChangeError('Failed to verify password. Please try again.');
      }
    }
  };

  const validateUsername = (username: string) => {
    // Basic username validation: alphanumeric + underscores, 3-30 chars
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
  };

  const handleUsernameChange = async () => {
    setUsernameTouched(true);
    setUsernameChangeError(null);
    setUsernameChangeSuccess(null);
    if (!newUsername.trim()) {
      setUsernameChangeError('Username is required');
      return;
    }
    if (!validateUsername(newUsername.trim())) {
      setUsernameChangeError('Username must be 3-30 characters and contain only letters, numbers, or underscores.');
      return;
    }
    const prevUsername = profile.username;
    // Optimistically apply the username so it updates immediately in the UI
    setProfile(prev => ({ ...prev, username: newUsername.trim() }));
    setEditedUsername(newUsername.trim());
    try {
      const { changeUsernameBackend } = await import('../../services/userService');
      await changeUsernameBackend({ newUsername: newUsername.trim(), password: usernamePassword });
      setUsernameChangeSuccess('Username changed successfully!');
      setTimeout(() => {
        setShowUsernameChangeModal(false);
        setUsernameChangeStep('password');
        setNewUsername('');
        setUsernamePassword('');
        setUsernameTouched(false);
        setPasswordTouched(false);
      }, 1200);
    } catch (err: any) {
      // Revert optimistic update on failure
      setProfile(prev => ({ ...prev, username: prevUsername }));
      setEditedUsername(prevUsername);
      if (err?.response?.status === 409) {
        setUsernameChangeError("Username isn't available. Please try again.");
      } else if (err?.response?.status === 401) {
        setUsernameChangeError('Invalid password. Please try again.');
      } else {
        setUsernameChangeError(err?.response?.data?.message || err?.message || 'Failed to change username. Please try again.');
      }
    }
  };

  const validateEmail = (email: string) => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = async () => {
    setEmailTouched(true);
    setEmailChangeError(null);
    setEmailChangeSuccess(null);
    if (!newEmail.trim()) {
      setEmailChangeError('Email is required');
      return;
    }
    if (!validateEmail(newEmail.trim())) {
      setEmailChangeError('Please enter a valid email address.');
      return;
    }
    try {
      const { changeEmailBackend } = await import('../../services/userService');
      const { updateEmail } = await import('../../services/authService');
      await changeEmailBackend({ newEmail: newEmail.trim(), password: emailPassword });
      await updateEmail(newEmail.trim());
      setEmailChangeSuccess('Email changed successfully! Please use your new email next time you log in.');
      setProfile(prev => ({ ...prev, email: newEmail.trim() }));
      setTimeout(() => {
        setShowEmailChangeModal(false);
        setEmailChangeStep('password');
        setNewEmail('');
        setEmailPassword('');
        setEmailTouched(false);
        setPasswordTouched(false);
      }, 1500);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setEmailChangeError('This email is already registered. Please use another.');
      } else if (err?.response?.status === 401) {
        setEmailChangeError('Password is incorrect.');
      } else if (err?.code === 'auth/invalid-email') {
        setEmailChangeError('Please enter a valid email address.');
      } else if (err?.code === 'auth/requires-recent-login') {
        setEmailChangeError('Please log out and log in again, then try changing your email.');
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const results = await searchUsers(query);
        // Filter out users already being followed
        const followingIds = new Set(following.map(f => f.firebaseUid));
        const filteredResults = results
          .filter((user: { firebaseUid: string }) => !followingIds.has(user.firebaseUid))
          .map((user: { firebaseUid: string; name?: string; username: string; email: string; avatar?: string; bio?: string }) => ({
            firebaseUid: user.firebaseUid,
            name: user.name || user.username || 'User',
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio
          }));
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleFollow = async (user: Connection) => {
    if (isLoadingFollow) return;
    setIsLoadingFollow(true);
    try {
      await followUser(user.firebaseUid);
      const newFollowing = [...following, user];
      setFollowing(newFollowing);
      setSearchResults(searchResults.filter(u => u.firebaseUid !== user.firebaseUid));
    } catch (err: any) {
      console.error('Follow failed:', err);
      alert(err?.response?.data?.message || 'Failed to follow user');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (isLoadingFollow) return;
    setIsLoadingFollow(true);
    try {
      await unfollowUser(userId);
      const newFollowing = following.filter(f => f.firebaseUid !== userId);
      setFollowing(newFollowing);
    } catch (err: any) {
      console.error('Unfollow failed:', err);
      alert(err?.response?.data?.message || 'Failed to unfollow user');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    if (isLoadingFollow) return;
    setIsLoadingFollow(true);
    try {
      await removeFollower(userId);
      const newFollowers = followers.filter(f => f.firebaseUid !== userId);
      setFollowers(newFollowers);
    } catch (err: any) {
      console.error('Remove follower failed:', err);
      alert(err?.response?.data?.message || 'Failed to remove follower');
    } finally {
      setIsLoadingFollow(false);
    }
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
          <div className="profile-cover profile-cover-relative">
            {coverPreview || profile.coverPhoto ? (
              <img src={coverPreview || profile.coverPhoto} alt="Cover" className="profile-cover-img" />
            ) : (
              <div className="profile-cover-placeholder"></div>
            )}
            {editMode && (
              <>
                <label className="profile-cover-upload profile-cover-upload-absolute">
                  <input
                    type="file"
                    accept="image/*"
                    className="profile-upload-input-hidden"
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
                <div className="profile-upload-url-block">
                  <label className="profile-upload-url-label">Header Image URL:</label>
                  <input
                    type="text"
                    placeholder="Paste image URL (e.g. from Cloudinary)"
                    value={coverPreview ?? profile.coverPhoto ?? ''}
                    onChange={e => setCoverPreview(e.target.value)}
                    className="profile-upload-url-input"
                  />
                  <div className="profile-upload-url-desc">Paste a direct image URL or use the camera icon to upload.</div>
                </div>
              </>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="profile-info-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large profile-avatar-large-relative">
                {avatarPreview || profile.avatar ? (
                  <img src={avatarPreview || profile.avatar} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-placeholder-large">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                {editMode && (
                  <>
                    <label className="profile-avatar-upload-btn profile-avatar-upload-btn-absolute">
                      <input
                        type="file"
                        accept="image/*"
                        className="profile-upload-input-hidden"
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
                    <div className="profile-upload-url-block">
                      <label className="profile-upload-url-label">Avatar Image URL:</label>
                      <input
                        type="text"
                        placeholder="Paste image URL (e.g. from Cloudinary)"
                        value={avatarPreview ?? profile.avatar ?? ''}
                        onChange={e => setAvatarPreview(e.target.value)}
                        className="profile-upload-url-input"
                      />
                      <div className="profile-upload-url-desc">Paste a direct image URL or use the camera icon to upload.</div>
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
                        className="profile-username-input profile-username-input-disabled"
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        placeholder="Enter your username"
                        disabled
                      />
                      <div className="profile-email-row-flex">
                        <input
                          type="email"
                          className="profile-email-input profile-email-input-disabled"
                          value={profile.email}
                          disabled
                        />
                      </div>
                            {/* Email Change Modal */}
                            {showEmailChangeModal && (
                              <div className="profile-modal-overlay" onClick={() => { setShowEmailChangeModal(false); setEmailChangeStep('password'); }}>
                                <div
                                  className="profile-modal profile-modal-custom"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="profile-modal-header profile-modal-header-flex">
                                    <h3 className="profile-modal-title-custom">Change Email</h3>
                                  </div>
                                  <div className="profile-modal-content profile-modal-content-flex" style={{overflow:'hidden'}}>
                                    {emailChangeStep === 'password' ? (
                                      <>
                                        <label className="profile-modal-label">Enter your password to continue</label>
                                        <div className="sign-up-wrapper-password">
                                          <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={emailPassword}
                                            onChange={e => { setEmailPassword(e.target.value); }}
                                            className={`sign-in-input${passwordTouched && !emailPassword ? ' input-error' : ''}`}
                                            placeholder="Enter your password"
                                            autoFocus
                                            onBlur={() => setPasswordTouched(true)}
                                          />
                                          <button
                                            type="button"
                                            className="sign-up-toggle-password"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                          >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                          </button>
                                        </div>
                                        {/* Only show error if password is wrong */}
                                        {emailChangeError && emailChangeError.toLowerCase().includes('incorrect') && (
                                          <div className="sign-up-error">Invalid password</div>
                                        )}
                                        <div className="sign-in-button-row" style={{marginTop:'18px',gap:'12px'}}>
                                            <button
                                              className="profile-cancel-btn profile-cancel-btn-light"
                                              onClick={() => { setShowEmailChangeModal(false); setEmailChangeStep('password'); setPasswordTouched(false); setEmailTouched(false); setEmailChangeError(null); setEmailChangeSuccess(null); setEmailPassword(''); setNewEmail(''); }}
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              className="sign-in-button-primary"
                                              onClick={handleVerifyPassword}
                                              disabled={!emailPassword}
                                              style={{width:'120px'}}
                                            >
                                              Next
                                            </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <label className="profile-modal-label">New Email</label>
                                        <input
                                          type="email"
                                          value={newEmail}
                                          onChange={e => { setNewEmail(e.target.value); }}
                                          className={`sign-in-input${emailTouched && (!newEmail.trim() || !validateEmail(newEmail.trim())) ? ' input-error' : ''}`}
                                          placeholder="Enter new email"
                                          autoFocus
                                          onBlur={() => setEmailTouched(true)}
                                        />
                                        {/* Only show tooltip for invalid email format */}
                                        {emailTouched && newEmail.trim() && !validateEmail(newEmail.trim()) && (
                                          <div className="sign-up-error" style={{margin:'8px 0 0 0',padding:'0',background:'none',border:'none',boxShadow:'none'}}>
                                            Please enter a valid email address.
                                          </div>
                                        )}
                                        {/* Only show error if email is already registered */}
                                        {emailChangeError && emailChangeError.toLowerCase().includes('already registered') && (
                                          <div className="sign-up-error">Email already registered. Please try again</div>
                                        )}
                                        {emailChangeSuccess && <p className="profile-save-success">{emailChangeSuccess}</p>}
                                        <div className="sign-in-button-row" style={{marginTop:'18px',gap:'12px'}}>
                                          <button
                                            className="profile-cancel-btn profile-cancel-btn-light"
                                            onClick={() => { setShowEmailChangeModal(false); setEmailChangeStep('password'); setPasswordTouched(false); setEmailTouched(false); setEmailChangeError(null); setEmailChangeSuccess(null); setEmailPassword(''); setNewEmail(''); }}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            className="sign-in-button-primary"
                                            onClick={handleEmailChange}
                                            disabled={!newEmail.trim() || !validateEmail(newEmail.trim())}
                                            style={{width:'120px'}}
                                          >
                                            Change Email
                                          </button>
                                        </div>
                                      </>
                                    )}
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
                <div className="profile-header-btn-col">
                  <div className="profile-header-btn-row">
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
                      className="profile-edit-btn profile-logout-btn"
                      onClick={handleLogout}
                      title="Sign out"
                    >
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>

                  {editMode && (
                    <div className="profile-change-buttons-col">
                      <button type="button" className="profile-edit-btn profile-edit-btn-small" onClick={() => {
                        setShowUsernameChangeModal(true);
                        setUsernameChangeStep('password');
                        setNewUsername('');
                        setUsernamePassword('');
                        setUsernameChangeError(null);
                        setUsernameChangeSuccess(null);
                        setUsernameTouched(false);
                        setPasswordTouched(false);
                      }}>Change</button>

                      <button type="button" className="profile-edit-btn profile-edit-btn-small" onClick={() => {
                        setShowEmailChangeModal(true);
                        setEmailChangeStep('password');
                        setNewEmail('');
                        setEmailPassword('');
                        setEmailChangeError(null);
                        setEmailChangeSuccess(null);
                        setPasswordTouched(false);
                        setEmailTouched(false);
                      }}>Change</button>
                    </div>
                  )}
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
      {/* Username Change Modal */}
      {showUsernameChangeModal && (
        <div className="profile-modal-overlay" onClick={() => { setShowUsernameChangeModal(false); setUsernameChangeStep('password'); }}>
          <div
            className="profile-modal profile-modal-custom"
            onClick={e => e.stopPropagation()}
          >
            <div className="profile-modal-header profile-modal-header-flex">
              <h3 className="profile-modal-title-custom">Change Username</h3>
            </div>
            <div className="profile-modal-content profile-modal-content-flex" style={{overflow:'hidden'}}>
              {usernameChangeStep === 'password' ? (
                <>
                  <label className="profile-modal-label">Enter your password to continue</label>
                  <div className="sign-up-wrapper-password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={usernamePassword}
                      onChange={e => { setUsernamePassword(e.target.value); }}
                      className={`sign-in-input${passwordTouched && !usernamePassword ? ' input-error' : ''}`}
                      placeholder="Enter your password"
                      autoFocus
                      onBlur={() => setPasswordTouched(true)}
                    />
                    <button
                      type="button"
                      className="sign-up-toggle-password"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {usernameChangeError && (
                    <div className="sign-up-error">{usernameChangeError}</div>
                  )}
                  <div className="sign-in-button-row" style={{marginTop:'18px',gap:'12px'}}>
                      <button
                        className="profile-cancel-btn profile-cancel-btn-light"
                        onClick={() => { setShowUsernameChangeModal(false); setUsernameChangeStep('password'); setPasswordTouched(false); setUsernameTouched(false); setUsernameChangeError(null); setUsernameChangeSuccess(null); setUsernamePassword(''); setNewUsername(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        className="sign-in-button-primary"
                        onClick={handleVerifyUsernamePassword}
                        disabled={!usernamePassword}
                        style={{width:'120px'}}
                      >
                        Next
                      </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="profile-modal-label">New Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => { setNewUsername(e.target.value); }}
                    className={`sign-in-input${usernameTouched && (!newUsername.trim() || !validateUsername(newUsername.trim())) ? ' input-error' : ''}`}
                    placeholder="Enter new username"
                    autoFocus
                    onBlur={() => setUsernameTouched(true)}
                  />
                  {usernameTouched && newUsername.trim() && !validateUsername(newUsername.trim()) && (
                    <div className="sign-up-error" style={{margin:'8px 0 0 0',padding:'0',background:'none',border:'none',boxShadow:'none'}}>
                      Username must be 3-30 characters and contain only letters, numbers, or underscores.
                    </div>
                  )}
                  {usernameChangeError && (
                    <div className="sign-up-error">{usernameChangeError}</div>
                  )}
                  {usernameChangeSuccess && <p className="profile-save-success">{usernameChangeSuccess}</p>}
                  <div className="sign-in-button-row" style={{marginTop:'18px',gap:'12px'}}>
                    <button
                      className="profile-cancel-btn profile-cancel-btn-light"
                      onClick={() => { setShowUsernameChangeModal(false); setUsernameChangeStep('password'); setPasswordTouched(false); setUsernameTouched(false); setUsernameChangeError(null); setUsernameChangeSuccess(null); setUsernamePassword(''); setNewUsername(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="sign-in-button-primary"
                      onClick={handleUsernameChange}
                      disabled={!newUsername.trim() || !validateUsername(newUsername.trim())}
                      style={{width:'160px'}}
                    >
                      Change Username
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
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
                  <div key={follower.firebaseUid} className="profile-user-item">
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
                      <p className="profile-user-email">@{follower.username}</p>
                      {follower.bio && <p className="profile-user-bio">{follower.bio}</p>}
                    </div>
                    <button className="profile-btn-remove" onClick={() => handleRemoveFollower(follower.firebaseUid)} disabled={isLoadingFollow}>
                      {isLoadingFollow ? '...' : 'Remove'}
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
                  <div key={user.firebaseUid} className="profile-user-item">
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
                      <p className="profile-user-email">@{user.username}</p>
                      {user.bio && <p className="profile-user-bio">{user.bio}</p>}
                    </div>
                    <button className="profile-btn-unfollow" onClick={() => handleUnfollow(user.firebaseUid)} disabled={isLoadingFollow}>
                      {isLoadingFollow ? '...' : 'Unfollow'}
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
                  <div key={user.firebaseUid} className="profile-user-item">
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
                      <p className="profile-user-email">@{user.username}</p>
                      {user.bio && <p className="profile-user-bio">{user.bio}</p>}
                    </div>
                    <button className="profile-btn-follow" onClick={() => handleFollow(user)} disabled={isLoadingFollow}>
                      {isLoadingFollow ? '...' : 'Follow'}
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
