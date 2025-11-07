import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

const publicPaths = [
  "/auth",
  "/confirm-email",
  "/terms-of-service",
  "/privacy-policy",
  "/reset-password",
  "/update-password",
  "/onboarding",
  "/for/homeowners",
  "/for/garage",
  "/for/movers",
  "/for/business",
  "/for/property",
  "/for/sports-cards"
];
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ConfirmEmail from "./pages/ConfirmEmail";
import Dashboard from "./pages/Dashboard";
import DashboardEmpty from "./pages/DashboardEmpty";
import Scan from "./pages/Scan";
import Review from "./pages/Review";
import Search from "./pages/Search";
import ItemDetail from "./pages/ItemDetail";
import LocationItems from "./pages/LocationItems";
import QRCodeSingle from "./pages/QRCodeSingle";
import QRCodeBulk from "./pages/QRCodeBulk";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import ApiUsage from "./pages/ApiUsage";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import Homeowners from "./pages/landing/Homeowners";
import Garage from "./pages/landing/Garage";
import Movers from "./pages/landing/Movers";
import Business from "./pages/landing/Business";
import Property from "./pages/landing/Property";
import SportsCards from "./pages/landing/SportsCards";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import Market from "./pages/Market";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const AppRouter = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: checkingAuth } = useAuth();

  useEffect(() => {
    // Handle redirects based on auth state
    if (!checkingAuth) {
      const currentPath = window.location.pathname;
      
      if (isAuthenticated) {
        // User is authenticated
        if (currentPath === "/auth") {
          navigate("/dashboard", { replace: true });
        }
        // Allow authenticated users to access dashboard and other protected routes
        // Allow authenticated users on onboarding and other public paths
      } else {
        // User is not authenticated
        // Protected routes that need auth - redirect to sports-cards flow
        const protectedRoutes = ["/dashboard", "/market", "/scan", "/review", "/search", "/item", "/location", "/qr-codes", "/subscription", "/admin", "/settings"];        
      }
    }
  }, [isAuthenticated, checkingAuth, navigate]);

  if (checkingAuth) {
    // Optional: show a splash or loading state while checking
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      {/* Root route - redirects based on auth */}
      <Route path="/" element={<Index />} />
      
      {/* Protected Routes — only accessible if token is present */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/empty" element={<ProtectedRoute><DashboardEmpty /></ProtectedRoute>} />
      <Route path="/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
      <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
      <Route path="/location/:locationId" element={<ProtectedRoute><LocationItems /></ProtectedRoute>} />
      <Route path="/qr-codes/:locationId" element={<ProtectedRoute><QRCodeSingle /></ProtectedRoute>} />
      <Route path="/qr-codes/bulk" element={<ProtectedRoute><QRCodeBulk /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/admin/api-usage" element={<ProtectedRoute><ApiUsage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Always available */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Add error logging
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
