import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import cubbyLogo from "@/assets/cubby-logo.png";

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setEmail(session.user.email || "");

      // Check if email is already confirmed
      if (session.user.email_confirmed_at) {
        // Check if user has locations
        const { data: locations } = await supabase
          .from("locations")
          .select("id")
          .limit(1);
        
        if (!locations || locations.length === 0) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      setChecking(false);
    };

    checkEmailConfirmation();

    // Poll for email confirmation every 3 seconds
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email_confirmed_at) {
        clearInterval(interval);
        
        const { data: locations } = await supabase
          .from("locations")
          .select("id")
          .limit(1);
        
        if (!locations || locations.length === 0) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (!email) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success("Confirmation email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend confirmation email");
    } finally {
      setResending(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent a confirmation link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in the email to confirm your account and continue to Cubby.
          </p>
          
          <div className="pt-4 space-y-3">
            <Button
              onClick={handleResendConfirmation}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend confirmation email
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
