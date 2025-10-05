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
        const redirect = searchParams.get('redirect');
        navigate(redirect || "/dashboard");
      }
    };
    checkUser();
  }, [navigate, searchParams]);

  const handleSuccess = () => {
    const redirect = searchParams.get('redirect');
    navigate(redirect || "/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="text-center mb-8 space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary shadow-xl">
          <img src={cubbyLogo} alt="Cubby" className="w-12 h-12 object-contain" />
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
      <AuthForm onSuccess={handleSuccess} />
    </div>
  );
};

export default Auth;