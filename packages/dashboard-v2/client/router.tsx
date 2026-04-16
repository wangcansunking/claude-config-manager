import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ConfigLayout from './pages/config/layout';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/dashboard'));
const Recommended = lazy(() => import('./pages/recommended'));
const Plugins = lazy(() => import('./pages/config/plugins'));
const McpServers = lazy(() => import('./pages/config/mcp'));
const Skills = lazy(() => import('./pages/config/skills'));
const Commands = lazy(() => import('./pages/config/commands'));
const Settings = lazy(() => import('./pages/config/settings'));
const Profiles = lazy(() => import('./pages/profiles'));
const Activity = lazy(() => import('./pages/activity'));

function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--input-bg)' }} />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }} />)}
      </div>
    </div>
  );
}

function ConfigWrapper() {
  return (
    <ConfigLayout>
      <Outlet />
    </ConfigLayout>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommended" element={<Recommended />} />
        <Route path="/config" element={<ConfigWrapper />}>
          <Route index element={<Navigate to="/config/plugins" replace />} />
          <Route path="plugins" element={<Plugins />} />
          <Route path="mcp" element={<McpServers />} />
          <Route path="skills" element={<Skills />} />
          <Route path="commands" element={<Commands />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/activity" element={<Activity />} />
        {/* Legacy redirects */}
        <Route path="/plugins" element={<Navigate to="/config/plugins" replace />} />
        <Route path="/mcp-servers" element={<Navigate to="/config/mcp" replace />} />
        <Route path="/skills" element={<Navigate to="/config/skills" replace />} />
        <Route path="/commands" element={<Navigate to="/config/commands" replace />} />
        <Route path="/settings" element={<Navigate to="/config/settings" replace />} />
        <Route path="/sessions" element={<Navigate to="/activity" replace />} />
        <Route path="/export-import" element={<Navigate to="/profiles" replace />} />
        <Route path="/metrics" element={<Navigate to="/" replace />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
