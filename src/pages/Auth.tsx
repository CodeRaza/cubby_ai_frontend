import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { Package } from "lucide-react";
import cubbyLogo from "@/assets/cubby-logo.png";
import { trackMetaPixelEvent, MetaPixelEvents } from "@/lib/metaPixel";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [source, setSource] = useState("");

  useEffect(() => {
    // Get and store source parameter
    const sourceParam = searchParams.get('source');
    const storedSource = sessionStorage.getItem('user_source') || '';
    
    if (sourceParam) {
      sessionStorage.setItem('user_source', sourceParam);
      setSource(sourceParam);
    } else if (storedSource) {
      setSource(storedSource);
    }

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
    // Add delay to ensure session is fully established before checking locations
    setTimeout(async () => {
      // Check if user has any locations (first-time user check)
      const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .limit(1);
      
      const redirect = searchParams.get('redirect');
      
      // Track sign-up conversion
      const isNewUser = !locations || locations.length === 0;
      if (isNewUser) {
        trackMetaPixelEvent(MetaPixelEvents.CompleteRegistration);
      }
      
      // If new user with no locations, send to onboarding
      if (isNewUser) {
        navigate("/onboarding");
      } else {
        navigate(redirect || "/dashboard");
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary)/0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.05),transparent_50%)]" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8 space-y-6">
          <div className="inline-flex items-center justify-center w-40 h-40 animate-float">
            <img 
              src={cubbyLogo} 
              alt="Cubby" 
              className="w-full h-full object-contain drop-shadow-2xl" 
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {source === 'sports-cards' ? 'Cubby for Collectors' : 'Cubby'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {source === 'sports-cards' 
                ? 'Catalog and track your card collection with AI'
                : 'Your smart home inventory'
              }
            </p>
          </div>
        </div>
        
        <div className="animate-scale-in">
          <AuthForm 
            onSuccess={handleSuccess} 
            defaultMode={searchParams.get('mode') === 'signup' ? 'signup' : 'login'}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;