import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthFormProps {
  onSuccess: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthForm = ({ onSuccess, defaultMode = 'login' }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Call Django backend login endpoint (accepts email or username)
        const res = await api.post(
          "/api/auth/login/",
          { username: email, password } // Can be email or username
        );

        if (res.status !== 200) {
          throw new Error(res.data?.detail || "Login failed");
        }

        const { access, refresh } = res.data;
        if (!access) throw new Error("No access token returned from server");

        // Persist tokens and set default Authorization header
        localStorage.setItem("access_token", access);
        if (refresh) localStorage.setItem("refresh_token", refresh);
        api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

        toast({ title: "Signed in", description: "Welcome back!" });
        onSuccess();
      } else {
        // Call Django backend register endpoint
        // Use email as username if no separate username provided
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6); // Generate unique username
        const res = await api.post(
          "/api/auth/register/",
          { username, email, password },
          { withCredentials: false }
        );

        if (res.status !== 201 && res.status !== 200) {
          throw new Error(res.data?.detail || "Registration failed");
        }

        const { access, refresh } = res.data;
        if (access) {
          localStorage.setItem("access_token", access);
          if (refresh) localStorage.setItem("refresh_token", refresh);
          api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        }

        // Send welcome email (non-blocking)
        import('@/lib/resend').then(({ sendWelcomeEmail }) => {
          sendWelcomeEmail(email, username).catch(err => 
            console.error('Failed to send welcome email:', err)
          );
        });

        toast({ title: "Account created", description: "Welcome — your account was created." });
        onSuccess();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({ 
        title: "Authentication error", 
        description: error?.response?.data?.detail || error?.message || String(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md card-shadow border-border/50 backdrop-blur-sm bg-card/95">
      <CardHeader className="space-y-3 pb-6">
        <CardTitle className="text-3xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
          {isLogin ? "Welcome back" : "Start Your Collection"}
        </CardTitle>
        <CardDescription className="text-center text-base space-y-1">
          {isLogin ? (
            <>
              <p>Sign in to access your card portfolio</p>
              <p className="text-xs text-muted-foreground/80">Track prices, scan cards, and manage your collection</p>
            </>
          ) : (
            <>
              <p>Create your free account to start scanning cards</p>
              <p className="text-xs text-muted-foreground/80">AI-powered identification • Real-time market prices • Portfolio tracking</p>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {isLogin ? "Email or Username" : "Email"}
            </Label>
            <Input
              id="email"
              type={isLogin ? "text" : "email"}
              placeholder={isLogin ? "you@example.com or username" : "you@example.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-11 font-semibold shadow-lg hover:shadow-xl transition-all" 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Sign in" : "Create account"}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 transition-all hover:bg-muted/50"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Button>
          {isLogin && (
            <div className="text-center pt-2">
              <Link 
                to="/reset-password" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};