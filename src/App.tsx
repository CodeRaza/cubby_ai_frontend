import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Review from "./pages/Review";
import Search from "./pages/Search";
import ItemDetail from "./pages/ItemDetail";
import LocationItems from "./pages/LocationItems";
import QRCodeSingle from "./pages/QRCodeSingle";
import QRCodeBulk from "./pages/QRCodeBulk";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import Homeowners from "./pages/landing/Homeowners";
import Garage from "./pages/landing/Garage";
import Movers from "./pages/landing/Movers";
import Business from "./pages/landing/Business";
import Property from "./pages/landing/Property";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Legal Pages */}
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          
          {/* Landing Pages */}
          <Route path="/for/homeowners" element={<Homeowners />} />
          <Route path="/for/garage" element={<Garage />} />
          <Route path="/for/movers" element={<Movers />} />
          <Route path="/for/business" element={<Business />} />
          <Route path="/for/property" element={<Property />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/review" element={<Review />} />
          <Route path="/search" element={<Search />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/location/:locationId" element={<LocationItems />} />
          <Route path="/qr-codes/:locationId" element={<QRCodeSingle />} />
          <Route path="/qr-codes/bulk" element={<QRCodeBulk />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
