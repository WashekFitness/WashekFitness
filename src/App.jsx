```jsx
import React, {
  Suspense,
  lazy,
  useEffect,
  useState,
} from 'react';

import { Toaster } from '@/components/ui/toaster';

import {
  QueryClientProvider,
} from '@tanstack/react-query';

import {
  queryClientInstance,
} from '@/lib/query-client';

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import {
  AppSettingsProvider,
} from '@/lib/AppSettingsContext';

import PageNotFound from './lib/PageNotFound';

import {
  AuthProvider,
  useAuth,
} from '@/lib/AuthContext';

import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';

import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

import { supabase } from '@/lib/supabase';

const Program = lazy(
  () => import('@/pages/Program')
);

const Nutrition = lazy(
  () => import('@/pages/Nutrition')
);

const Progress = lazy(
  () => import('@/pages/Progress')
);

const Profile = lazy(
  () => import('@/pages/Profile')
);

const Kael = lazy(
  () => import('@/pages/Kael')
);

const ProgressPhotos = lazy(
  () => import('@/pages/ProgressPhotos')
);

const FormLab = lazy(
  () => import('@/pages/FormLab')
);

const ProgramDay = lazy(
  () => import('@/pages/ProgramDay')
);

const LiveWorkout = lazy(
  () => import('@/pages/LiveWorkout')
);

const SubscriptionReturn = lazy(
  () => import('@/pages/SubscriptionReturn')
);

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

/*
 * ============================================================
 * ONBOARDING GATE
 * ============================================================
 *
 * IMPORTANT:
 *
 * Do NOT use:
 *
 *     user.onboarded
 *
 * Auth users and profile rows are separate things.
 *
 * The onboarding flag is stored in:
 *
 *     public.profiles.onboarded
 *
 * Therefore we query the profiles table directly.
 *
 * This fixes the bug where a brand-new user was being sent
 * directly to the dashboard/app.
 * ============================================================
 */

function OnboardingGate({
  children,
}) {
  const {
    user,
    isLoadingAuth,
  } = useAuth();

  const location = useLocation();

  const [
    profileStatus,
    setProfileStatus,
  ] = useState('loading');

  const [
    profileError,
    setProfileError,
  ] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileStatus() {
      if (isLoadingAuth) {
        return;
      }

      if (!user) {
        if (!cancelled) {
          setProfileStatus(
            'unauthenticated'
          );
        }

        return;
      }

      setProfileStatus('loading');
      setProfileError(null);

      try {
        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .select('id, onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        /*
         * No profile row means the user has not completed
         * onboarding yet.
         */
        if (!data) {
          setProfileStatus(
            'needs_onboarding'
          );

          return;
        }

        if (data.onboarded === true) {
          setProfileStatus(
            'onboarded'
          );
        } else {
          setProfileStatus(
            'needs_onboarding'
          );
        }
      } catch (error) {
        console.error(
          'Failed to load onboarding profile:',
          error
        );

        if (!cancelled) {
          setProfileError(error);
          setProfileStatus(
            'error'
          );
        }
      }
    }

    loadProfileStatus();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    isLoadingAuth,
  ]);

  /*
   * Auth is still initializing.
   */
  if (isLoadingAuth) {
    return <PageLoader />;
  }

  /*
   * Let AuthenticatedApp handle unauthenticated users.
   */
  if (!user) {
    return children;
  }

  /*
   * We have a signed-in user but haven't checked the
   * profile yet.
   *
   * VERY IMPORTANT:
   *
   * If they are already trying to go to /onboarding,
   * keep them there while we check.
   *
   * This prevents the app from flashing the dashboard.
   */
  if (
    profileStatus === 'loading'
  ) {
    if (
      location.pathname ===
      '/onboarding'
    ) {
      return children;
    }

    return <PageLoader />;
  }

  /*
   * If the profile lookup failed, do NOT automatically
   * send the user into the application.
   *
   * This avoids treating an actual database/RLS error as
   * proof that onboarding has been completed.
   */
  if (
    profileStatus === 'error'
  ) {
    console.error(
      'Onboarding profile error:',
      profileError
    );

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">
            We couldn't load your profile
          </h1>

          <p className="text-muted-foreground mb-6">
            Please refresh the page and try
            again.
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  /*
   * BRAND-NEW USER:
   *
   * Force onboarding before any application route.
   */
  if (
    profileStatus ===
      'needs_onboarding' &&
    location.pathname !==
      '/onboarding'
  ) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    );
  }

  /*
   * COMPLETED USER:
   *
   * Don't let them go back through onboarding.
   */
  if (
    profileStatus ===
      'onboarded' &&
    location.pathname ===
      '/onboarding'
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}

/*
 * ============================================================
 * AUTHENTICATED APPLICATION
 * ============================================================
 */

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth();

  if (
    isLoadingPublicSettings ||
    isLoadingAuth
  ) {
    return <PageLoader />;
  }

  if (authError) {
    if (
      authError.type ===
      'user_not_registered'
    ) {
      return (
        <UserNotRegisteredError />
      );
    }

    if (
      authError.type ===
      'auth_required'
    ) {
      navigateToLogin();

      return null;
    }
  }

  return (
    <Suspense
      fallback={<PageLoader />}
    >
      <OnboardingGate>
        <Routes>
          {/*
           * ==================================================
           * ONBOARDING
           * ==================================================
           */}
          <Route
            path="/onboarding"
            element={<Onboarding />}
          />

          {/*
           * ==================================================
           * SPECIAL ROUTES
           * ==================================================
           */}
          <Route
            path="/live-workout"
            element={<LiveWorkout />}
          />

          <Route
            path="/subscription-return"
            element={
              <SubscriptionReturn />
            }
          />

          {/*
           * ==================================================
           * MAIN APPLICATION
           * ==================================================
           */}
          <Route
            element={<AppLayout />}
          >
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
              element={
                <ProgressPhotos />
              }
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
 * ============================================================
 * ROOT APP
 * ============================================================
 */

function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <QueryClientProvider
          client={
            queryClientInstance
          }
        >
          <Router>
            <AuthenticatedApp />
          </Router>

          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}

export default App;
```
