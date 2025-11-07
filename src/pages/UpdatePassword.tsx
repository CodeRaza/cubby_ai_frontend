import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import cubbyLogo from "@/assets/cubby-logo.png";

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if user has a valid token or reset token
    const checkSession = async () => {
      const token = localStorage.getItem('access_token');
      const resetToken = searchParams.get('token');
      
      if (token || resetToken) {
        setValidSession(true);
      } else {
        toast({
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        });
        navigate("/reset-password");
      }
    };
    checkSession();
  }, [navigate, toast, searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password
      passwordSchema.parse(password);

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const resetToken = searchParams.get('token');
      const uid = searchParams.get('uid');
      
      if (resetToken && uid) {
        // Password reset flow
        await api.post('/api/auth/password/reset/confirm/', {
          uid: uid,
          token: resetToken,
          new_password: password,
          confirm_password: confirmPassword
        });
        
        toast({
          title: "Password reset",
          description: "Your password has been reset successfully. Please log in with your new password.",
        });
        
        setTimeout(() => navigate("/auth"), 2000);
      } else {
        // Regular password change (requires authentication)
        await api.post('/api/auth/profile/password/change/', {
          new_password: password,
          confirm_password: confirmPassword
        });
        
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        });
        
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid password",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!validSession) {
    return null;
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
            Set your new password
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Update Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
