import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import cubbyLogo from "@/assets/cubby-logo.png";
import { trackMetaPixelEvent, MetaPixelEvents } from "@/lib/metaPixel";
import { useAuth } from "@/lib/auth";
import api from "@/lib/axios";


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

  }, [navigate, searchParams]);

  const { checkAuth } = useAuth();
  
  const handleSuccess = async () => {
    try {
      console.log('handleSuccess called');
      
      // Immediately check auth status (token should be in localStorage from AuthForm)
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found after login');
        return;
      }

      console.log('Token found, checking auth...');
      
      // Check if user is authenticated by getting profile
      const isAuthed = await checkAuth();
      console.log('Auth check result:', isAuthed);
      
      if (!isAuthed) {
        console.error('Authentication check failed');
        return;
      }

      // Wait a moment for React state to update
      await new Promise(resolve => setTimeout(resolve, 300));

      const redirect = searchParams.get('redirect');
      console.log('Redirect param:', redirect);
      
      // Check if user has any collections (first-time user check)
      const onboardingCompleted = sessionStorage.getItem('onboarding_completed') === 'true';
      
      try {
        const { data: response } = await api.get("/api/cards/collections/");
        
        // Handle both DRF paginated format ({"results": []}) and list format ([])
        let collections: any[] = [];
        if (Array.isArray(response)) {
          collections = response;
        } else if (Array.isArray(response?.results)) {
          collections = response.results;
        } else if (response?.data && Array.isArray(response.data)) {
          collections = response.data;
        }
        
        const isNewUser = !collections || collections.length === 0;
        console.log('Collections found:', collections?.length || 0, 'isNewUser:', isNewUser, 'onboardingCompleted:', onboardingCompleted);
        
        if (isNewUser && !onboardingCompleted) {
          console.log('Redirecting to onboarding (new user, onboarding not completed)');
          trackMetaPixelEvent(MetaPixelEvents.CompleteRegistration);
          navigate("/onboarding", { replace: true });
        } else {
          console.log('Redirecting to dashboard:', redirect || "/dashboard");
          navigate(redirect || "/dashboard", { replace: true });
        }
      } catch (collectionError: any) {
        // If collections endpoint fails, still redirect (might be 401, 403, or network error)
        console.log('Collections check error:', collectionError);
        
        // If onboarding was completed, go to dashboard even if collections check fails
        if (onboardingCompleted) {
          console.log('Onboarding completed, redirecting to dashboard despite collections error');
          navigate(redirect || "/dashboard", { replace: true });
        } else {
          // If collections check fails and no onboarding flag, check if user might be new
          // But still redirect to dashboard to avoid loops
          console.log('Collections endpoint error, redirecting to dashboard anyway');
          navigate(redirect || "/dashboard", { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Error during authentication:', error);
      // Even on error, if we have a token, try to redirect
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('Error occurred but token exists, attempting redirect');
          const redirect = searchParams.get('redirect');
          navigate(redirect || "/dashboard", { replace: true });
      } else {
        console.error('No token available for redirect');
      }
    }
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
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {source === 'sports-cards' ? 'Cubby for Card Collectors' : 'Cubby'}
            </h1>
            {source === 'sports-cards' && (
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-primary">📸</span>
                  <span>Scan with AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-primary">💰</span>
                  <span>Market Prices</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-primary">📊</span>
                  <span>Track Portfolio</span>
                </div>
              </div>
            )}
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