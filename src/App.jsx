import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppSettingsProvider } from '@/lib/AppSettingsContext';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
// Lazy load heavy pages
const Program = lazy(() => import('@/pages/Program'));
const Nutrition = lazy(() => import('@/pages/Nutrition'));
const Progress = lazy(() => import('@/pages/Progress'));
const Profile = lazy(() => import('@/pages/Profile'));
const Kael = lazy(() => import('@/pages/Kael'));
const ProgressPhotos = lazy(() => import('@/pages/ProgressPhotos'));
const FormLab = lazy(() => import('@/pages/FormLab'));
const ProgramDay = lazy(() => import('@/pages/ProgramDay'));
const LiveWorkout = lazy(() => import('@/pages/LiveWorkout'));
const SubscriptionReturn = lazy(() => import('@/pages/SubscriptionReturn'));
// LiveWorkout is its own page outside AppLayout

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/live-workout" element={<LiveWorkout />} />
        <Route path="/subscription-return" element={<SubscriptionReturn />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/program" element={<Program />} />
          <Route path="/program/day/:dayIndex" element={<ProgramDay />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/kael" element={<Kael />} />
          <Route path="/photos" element={<ProgressPhotos />} />
          <Route path="/formlab" element={<FormLab />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


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
  )
}

export default App