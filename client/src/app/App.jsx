import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.jsx';
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage.jsx';
import { LandingPage } from '../features/landing/LandingPage.jsx';
import { DashboardLayout } from '../components/DashboardLayout.jsx';

const OverviewPage = lazy(() => import('../features/overview/OverviewPage.jsx').then((module) => ({ default: module.OverviewPage })));
const PapersPage = lazy(() => import('../features/papers/PapersPage.jsx').then((module) => ({ default: module.PapersPage })));
const ChatPage = lazy(() => import('../features/chat/ChatPage.jsx').then((module) => ({ default: module.ChatPage })));

export default function App() {
  return (
    <Suspense fallback={<main className="center-page">화면을 불러오는 중입니다.</main>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/app/overview" element={<OverviewPage />} />
            <Route path="/app/papers" element={<PapersPage />} />
            <Route path="/app/chat" element={<ChatPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
