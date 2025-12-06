import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft } from 'react-icons/fa';
import { getUserProfile, followUser, unfollowUser } from '../../services/userService';

interface PublicUserProfile {
  firebaseUid: string;
  name: string;
  username: string;
  email: string | null;
  bio: string;
  avatar: string;
  header: string;
  followersCount: number;
  followingCount: number;
  relationship: 'none' | 'following' | 'followed_by' | 'friends';
  isOwnProfile: boolean;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError('User not found');
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        if (data.isOwnProfile) {
          // Redirect to own profile page
          navigate('/profile', { replace: true });
          return;
        }
        setProfile(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, navigate]);

  const handleTabChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan') => {
    const target = page === 'Dashboard' ? '/dashboard' : page === 'Personal Plan' ? '/personal' : '/shared';
    navigate(target);
  };

  const handleFollow = async () => {
    if (!profile || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      await followUser(profile.firebaseUid);
      // Update relationship
      setProfile(prev => {
        if (!prev) return prev;
        const newRelationship = prev.relationship === 'followed_by' ? 'friends' : 'following';
        return {
          ...prev,
          relationship: newRelationship,
          followersCount: prev.followersCount + 1
        };
      });
    } catch (err: any) {
      console.error('Follow failed:', err);
      alert(err?.response?.data?.message || 'Failed to follow user');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      await unfollowUser(profile.firebaseUid);
      // Update relationship
      setProfile(prev => {
        if (!prev) return prev;
        const newRelationship = prev.relationship === 'friends' ? 'followed_by' : 'none';
        return {
          ...prev,
          relationship: newRelationship,
          followersCount: Math.max(0, prev.followersCount - 1)
        };
      });
    } catch (err: any) {
      console.error('Unfollow failed:', err);
      alert(err?.response?.data?.message || 'Failed to unfollow user');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const getFollowButton = () => {
    if (!profile) return null;

    switch (profile.relationship) {
      case 'friends':
        return (
          <button 
            className="user-profile-btn user-profile-btn-friends" 
            onClick={handleUnfollow}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? '...' : '✓ Friends'}
          </button>
        );
      case 'following':
        return (
          <button 
            className="user-profile-btn user-profile-btn-following" 
            onClick={handleUnfollow}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? '...' : 'Following'}
          </button>
        );
      case 'followed_by':
        return (
          <button 
            className="user-profile-btn user-profile-btn-follow-back" 
            onClick={handleFollow}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? '...' : 'Follow back'}
          </button>
        );
      default:
        return (
          <button 
            className="user-profile-btn user-profile-btn-follow" 
            onClick={handleFollow}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? '...' : 'Follow'}
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar activePage="Profile" onPageChange={handleTabChange} />
        <div className="user-profile-loading">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <Navbar activePage="Profile" onPageChange={handleTabChange} />
        <div className="user-profile-error">
          <p>{error || 'User not found'}</p>
          <button className="user-profile-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar activePage="Profile" onPageChange={handleTabChange} />

      <div className="profile-content">
        <button className="user-profile-back-link" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        <div className="profile-card-main">
          {/* Cover Photo */}
          <div className="profile-cover profile-cover-relative">
            {profile.header ? (
              <img src={profile.header} alt="Cover" className="profile-cover-img" />
            ) : (
              <div className="profile-cover-placeholder"></div>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="profile-info-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large profile-avatar-large-relative">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-placeholder-large">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-header-row">
                <div className="profile-name-email-section">
                  <h1 className="profile-name">{profile.name || 'User'}</h1>
                  <p className="profile-username">@{profile.username || 'username'}</p>
                  {profile.email && <p className="profile-email-display">{profile.email}</p>}
                </div>
                <div className="profile-header-btn-col">
                  {getFollowButton()}
                </div>
              </div>

              <p className="profile-bio">{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="profile-stats-row">
            <div className="profile-stat-card">
              <div className="profile-stat-number">{profile.followingCount}</div>
              <div className="profile-stat-label">Following</div>
            </div>
            <div className="profile-stat-divider"></div>
            <div className="profile-stat-card">
              <div className="profile-stat-number">{profile.followersCount}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

