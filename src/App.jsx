import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { AppSettingsProvider } from '@/lib/AppSettingsContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

import { supabase } from '@/lib/supabase';

import PageNotFound from './lib/PageNotFound';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';

import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

const Program = lazy(() => import('@/pages/Program'));
const Nutrition = lazy(() => import('@/pages/Nutrition'));
const Progress = lazy(() => import('@/pages/Progress'));
const Profile = lazy(() => import('@/pages/Profile'));
const Kael = lazy(() => import('@/pages/Kael'));
const ProgressPhotos = lazy(() => import('@/pages/ProgressPhotos'));
const FormLab = lazy(() => import('@/pages/FormLab'));
const ProgramDay = lazy(() => import('@/pages/ProgramDay'));
const LiveWorkout = lazy(() => import('@/pages/LiveWorkout'));
const SubscriptionReturn = lazy(
  () => import('@/pages/SubscriptionReturn')
);

const PageLoader = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

/*
|--------------------------------------------------------------------------
| Onboarding Gate
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We do NOT use user.onboarded here.
|
| Supabase Auth's user object and your public.profiles row are separate
| things. The onboarding status belongs to the profile row.
|
| This gate:
| 1. Gets the authenticated Supabase user.
| 2. Reads profiles.onboarded.
| 3. Sends new users to /onboarding.
| 4. Sends completed users to the normal application.
|
*/

function OnboardingGate({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkProfile = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setCheckingProfile(false);
          setOnboarded(false);
        }
        return;
      }

      setCheckingProfile(true);
      setProfileError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('Failed to check onboarding profile:', error);
          setProfileError(error);
          setOnboarded(false);
          setCheckingProfile(false);
          return;
        }

        /*
         * No profile means this is effectively a new user.
         * They should go through onboarding.
         */
        if (!data) {
          setOnboarded(false);
        } else {
          setOnboarded(data.onboarded === true);
        }

        setCheckingProfile(false);
      } catch (error) {
        if (cancelled) return;

        console.error('Unexpected onboarding check error:', error);
        setProfileError(error);
        setOnboarded(false);
        setCheckingProfile(false);
      }
    };

    checkProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, location.pathname]);

  if (checkingProfile) {
    return <PageLoader />;
  }

  /*
   * If the profile check failed, don't silently dump the user into
   * the application. A missing/unknown onboarding state is treated
   * as incomplete.
   */
  if (profileError) {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  /*
   * NEW USER:
   * Every route except onboarding goes to onboarding.
   */
  if (!onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  /*
   * COMPLETED USER:
   * Don't let them return to onboarding accidentally.
   */
  if (onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| Authenticated Application
|--------------------------------------------------------------------------
*/

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }

    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <OnboardingGate>
        <Routes>
          {/* --------------------------------------------------------- */}
          {/* ONBOARDING                                                */}
          {/* --------------------------------------------------------- */}

          <Route
            path="/onboarding"
            element={<Onboarding />}
          />

          {/* --------------------------------------------------------- */}
          {/* SPECIAL ROUTES                                            */}
          {/* --------------------------------------------------------- */}

          <Route
            path="/live-workout"
            element={<LiveWorkout />}
          />

          <Route
            path="/subscription-return"
            element={<SubscriptionReturn />}
          />

          {/* --------------------------------------------------------- */}
          {/* MAIN APPLICATION                                           */}
          {/* --------------------------------------------------------- */}

          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/program"
              element={<Program />}
            />

            <Route
              path="/program/day/:dayIndex"
              element={<ProgramDay />}
            />

            <Route
              path="/nutrition"
              element={<Nutrition />}
            />

            <Route
              path="/progress"
              element={<Progress />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/kael"
              element={<Kael />}
            />

            <Route
              path="/photos"
              element={<ProgressPhotos />}
            />

            <Route
              path="/formlab"
              element={<FormLab />}
            />

            <Route
              path="/about"
              element={<About />}
            />

            <Route
              path="/contact"
              element={<Contact />}
            />
          </Route>

          {/* --------------------------------------------------------- */}
          {/* 404                                                        */}
          {/* --------------------------------------------------------- */}

          <Route
            path="*"
            element={<PageNotFound />}
          />
        </Routes>
      </OnboardingGate>
    </Suspense>
  );
};

/*
|--------------------------------------------------------------------------
| ROOT APP
|--------------------------------------------------------------------------
*/

function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>

          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}

/*
 * CRITICAL:
 * main.jsx does:
 *
 * import App from './App.jsx'
 *
 * Therefore App.jsx MUST have a default export.
 */
export default App;
