import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      // Authenticated users go to dashboard
      navigate("/dashboard", { replace: true });
    } else {
      
      navigate('/auth', { replace: true });
    }
  }, [navigate, isAuthenticated]);
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
};

export default Index;
