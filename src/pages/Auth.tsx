import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { Package } from "lucide-react";
import cubbyLogo from "@/assets/cubby-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has any locations (first-time user check)
        const { data: locations } = await supabase
          .from("locations")
          .select("id")
          .limit(1);
        
        const redirect = searchParams.get('redirect');
        
        // If new user with no locations, send to onboarding
        if (!locations || locations.length === 0) {
          navigate("/onboarding");
        } else {
          navigate(redirect || "/dashboard");
        }
      }
    };
    checkUser();
  }, [navigate, searchParams]);

  const handleSuccess = async () => {
    // Check if user has any locations (first-time user check)
    const { data: locations } = await supabase
      .from("locations")
      .select("id")
      .limit(1);
    
    const redirect = searchParams.get('redirect');
    
    // If new user with no locations, send to onboarding
    if (!locations || locations.length === 0) {
      navigate("/onboarding");
    } else {
      navigate(redirect || "/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="text-center mb-8 space-y-4">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl">
          <img src={cubbyLogo} alt="Cubby" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Cubby
          </h1>
          <p className="text-muted-foreground mt-2">
            Your smart home inventory
          </p>
        </div>
      </div>
      <AuthForm 
        onSuccess={handleSuccess} 
        defaultMode={searchParams.get('mode') === 'signup' ? 'signup' : 'login'}
      />
    </div>
  );
};

export default Auth;