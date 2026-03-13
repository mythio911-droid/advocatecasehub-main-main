import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import RequestAccess from "./pages/RequestAccess";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import CaseManagement from "./pages/CaseManagement";
import CauseList from "./pages/CauseList";
import ClientManagement from "./pages/ClientManagement";
import Documents from "./pages/Documents";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import TeamManagement from "./pages/TeamManagement";
import NotificationDashboard from "./pages/NotificationDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile?.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (userProfile?.status === 'pending') return <Navigate to="/pending-approval" replace />;
  if (userProfile?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/request-access" element={<RequestAccess />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/cases" element={<ProtectedRoute><CaseManagement /></ProtectedRoute>} />
            <Route path="/cause-list" element={<ProtectedRoute><CauseList /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientManagement /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="/team" element={<AdminRoute><TeamManagement /></AdminRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationDashboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
