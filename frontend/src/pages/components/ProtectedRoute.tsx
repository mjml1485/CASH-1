import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { fetchProfileBackend } from '../../services/userService';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Cache onboarding status to avoid re-checking on every navigation
const onboardingStatusCache = new Map<string, { status: boolean; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!loading && currentUser) {
      // Check cache first
      const cached = onboardingStatusCache.get(currentUser.uid);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Use cached value
        setOnboardingStatus(cached.status);
        setCheckingOnboarding(false);
        hasCheckedRef.current = true;
        return;
      }

      // Only check if we haven't checked yet or cache expired
      if (!hasCheckedRef.current || !cached) {
        const checkOnboarding = async () => {
          try {
            const profile = await fetchProfileBackend();
            const status = profile?.onboardingCompleted || false;
            setOnboardingStatus(status);
            // Cache the result
            onboardingStatusCache.set(currentUser.uid, { status, timestamp: now });
            hasCheckedRef.current = true;
          } catch (err) {
            console.error('Failed to check onboarding status:', err);
            setOnboardingStatus(false);
            onboardingStatusCache.set(currentUser.uid, { status: false, timestamp: now });
          } finally {
            setCheckingOnboarding(false);
          }
        };
        checkOnboarding();
      } else {
        setCheckingOnboarding(false);
      }
    } else if (!loading && !currentUser) {
      setCheckingOnboarding(false);
      hasCheckedRef.current = false;
    }
  }, [currentUser, loading]); // Removed location.pathname to avoid re-checking on every navigation

  // Listen for onboarding status updates (only when status actually changes)
  useEffect(() => {
    const handleOnboardingUpdate = async () => {
      if (currentUser) {
        try {
          const profile = await fetchProfileBackend();
          const status = profile?.onboardingCompleted || false;
          setOnboardingStatus(status);
          // Update cache
          onboardingStatusCache.set(currentUser.uid, { status, timestamp: Date.now() });
        } catch (err) {
          console.error('Failed to refresh onboarding status:', err);
        }
      }
    };

    window.addEventListener('onboarding-status-updated', handleOnboardingUpdate);
    return () => {
      window.removeEventListener('onboarding-status-updated', handleOnboardingUpdate);
    };
  }, [currentUser]);

  // Only show loading on initial auth check, not on navigation
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // While checking onboarding status initially, show nothing to prevent flash
  if (checkingOnboarding && onboardingStatus === null) {
    return null;
  }

  // Check if user is trying to access onboarding pages
  const isOnboardingPage = location.pathname.startsWith('/onboarding');

  // Pages that are allowed during onboarding (part of onboarding flow)
  const onboardingAllowedPages = ['/add-wallet', '/add-budget'];
  const isOnboardingAllowedPage = onboardingAllowedPages.includes(location.pathname);

  // If onboarding is completed and user tries to access onboarding, redirect to dashboard
  if (onboardingStatus === true && isOnboardingPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // If onboarding is not completed and user tries to access non-onboarding pages
  // (except pages allowed during onboarding), redirect to onboarding
  if (onboardingStatus === false && !isOnboardingPage && !isOnboardingAllowedPage) {
    return <Navigate to="/onboarding/welcome" replace />;
  }

  return <>{children}</>;
}

