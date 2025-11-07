import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, Loader2, Sparkles, RefreshCw } from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { trackMetaPixelEvent, MetaPixelEvents } from "@/lib/metaPixel";
import { cn } from "@/lib/utils";
interface SubscriptionData {
  plan_tier: string;
  subscribed: boolean;
  subscription_end: string | null;
}
interface UsageData {
  items_detected: number;
  bonus_items: number;
  period_end: string;
}
const plans = [{
  name: "Free",
  tier: "free",
  price: "$0",
  scans: 10,
  features: [{
    text: "10 cards total",
    available: true
  }, {
    text: "1 collection",
    available: true
  }, {
    text: "Basic AI detection",
    available: true
  }],
  priceId: null
}, {
  name: "Starter",
  tier: "starter",
  price: "$4.99",
  scans: 100,
  features: [{
    text: "100 tracked cards",
    available: true
  }, {
    text: "Multi-collection",
    available: true
  }, {
    text: "Real-time pricing",
    available: false
  }, {
    text: "Cloud backup",
    available: true
  }],
  priceId: "price_1SIMndIkzp5CYjx0zdF7dVPj"
}, {
  name: "Pro",
  tier: "pro",
  price: "$14.99",
  scans: 1000,
  features: [{
    text: "1,000 tracked cards",
    available: true
  }, {
    text: "Portfolio insights",
    available: false
  }, {
    text: "Price alerts",
    available: false
  }, {
    text: "CSV export",
    available: true
  }, {
    text: "Priority support",
    available: true
  }],
  priceId: "price_1SIMoGIkzp5CYjx0gUSVuXgU",
  recommended: true
}, {
  name: "Investor",
  tier: "investor",
  price: "$29.99",
  scans: 5000,
  features: [{
    text: "5,000 tracked cards",
    available: true
  }, {
    text: "Bulk upload",
    available: false
  }, {
    text: "Multi-user access",
    available: false
  }, {
    text: "API access",
    available: false
  }, {
    text: "Advanced analytics",
    available: false
  }],
  priceId: "price_1SIMoUIkzp5CYjx0EZ226dGX"
}];
const scanPacks = [{
  name: "Starter Pack",
  scans: 100,
  price: "$6.99",
  priceId: "price_scan_pack_100"
}, {
  name: "Value Pack",
  scans: 500,
  price: "$24.99",
  priceId: "price_scan_pack_500",
  popular: true
}, {
  name: "Power Pack",
  scans: 1000,
  price: "$39.99",
  priceId: "price_scan_pack_1000"
}];
const Subscription = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  
  // Real-time subscription data with React Query
  const { data: subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await api.get('/api/auth/subscription/');
      return {
        plan_tier: response.data.plan_tier || 'free',
        subscribed: response.data.subscribed || false,
        subscription_end: response.data.subscription_end || null,
        scans_used: response.data.scans_used || 0,
        scans_limit: response.data.scans_limit || 10,
        bonus_credits: response.data.bonus_credits || 0,
      } as SubscriptionData & { scans_used: number; scans_limit: number; bonus_credits: number };
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Real-time usage data with React Query
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const response = await api.get('/api/auth/subscription/usage/');
      return {
        items_detected: response.data.items_detected || 0,
        bonus_items: response.data.bonus_items || 0,
        period_end: response.data.period_end,
      } as UsageData;
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
  
  useEffect(() => {
    loadAvailablePlans();
  }, []);

  // Handle Stripe checkout redirects (success/cancel) and portal returns
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');
    const portalReturn = searchParams.get('portal_return');

    // Handle portal return - sync subscription from Stripe
    if (portalReturn === 'true') {
      const syncFromPortal = async () => {
        try {
          // Get user's subscription ID from backend and sync
          const subscriptionResponse = await api.get('/api/auth/subscription/');
          const stripeSubscriptionId = subscriptionResponse.data?.stripe_subscription_id;
          
          if (stripeSubscriptionId) {
            // Sync subscription from Stripe
            const syncResponse = await api.post('/api/auth/subscription/sync/', {
              subscription_id: stripeSubscriptionId
            });
            
            if (syncResponse.data?.synced) {
              console.log('Subscription synced successfully from Stripe portal');
            }
          }
        } catch (syncError: any) {
          console.warn('Failed to sync subscription from portal:', syncError);
        }
        
        // Refresh subscription data
        await refetchSubscription();
        await refetchUsage();
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
        
        // Remove query param from URL
        searchParams.delete('portal_return');
        setSearchParams(searchParams, { replace: true });
      };
      
      syncFromPortal();
    } else if (success === 'true' && sessionId) {
      // User successfully completed checkout - sync subscription from Stripe
      const syncSubscription = async () => {
        try {
          // First, try to sync subscription from Stripe using the session ID
          // This ensures the subscription is updated even if webhook hasn't fired yet
          const syncResponse = await api.post('/api/auth/subscription/sync/', {
            session_id: sessionId
          });
          
          if (syncResponse.data?.synced) {
            console.log('Subscription synced successfully from Stripe');
          }
        } catch (syncError: any) {
          console.warn('Failed to sync subscription from Stripe:', syncError);
          // Continue anyway - webhook might have already updated it
        }
        
        // Refresh subscription data
        await refetchSubscription();
        await refetchUsage();
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
        
        // Show success message
        toast({
          title: "Subscription activated! 🎉",
          description: "Your subscription has been successfully activated. Welcome to your new plan!",
        });
        
        // Remove query params from URL
        searchParams.delete('success');
        searchParams.delete('session_id');
        setSearchParams(searchParams, { replace: true });
      };
      
      syncSubscription();
    } else if (canceled === 'true') {
      // User canceled checkout
      toast({
        title: "Checkout canceled",
        description: "Your subscription was not changed. You can try again anytime.",
        variant: "default",
      });
      
      // Remove query params from URL
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, refetchSubscription, refetchUsage, queryClient]);

  // Real-time updates: Refetch data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - refetch all data
        refetchSubscription();
        refetchUsage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchSubscription, refetchUsage]);
  
  const loadAvailablePlans = async () => {
    try {
      const response = await api.get('/api/auth/subscription/plans/');
      if (response.data?.plans && response.data.plans.length > 0) {
        // Map backend plans to frontend format, preserving features from hardcoded plans
        const backendPlans = response.data.plans.map((p: any) => {
          const originalPlan = plans.find(pl => pl.tier === p.plan_tier);
          return {
            name: p.name,
            tier: p.plan_tier,
            price: p.price,
            scans: p.card_limit,
            features: originalPlan?.features || [],
            priceId: p.plan_id || null, // Free plan has null priceId
            recommended: p.is_default || false
          };
        });
        
        // Ensure free plan is included (backend should include it, but double-check)
        const hasFreePlan = backendPlans.some((p: any) => p.tier === 'free');
        if (!hasFreePlan) {
          // Add free plan from hardcoded plans
          backendPlans.unshift(plans[0]);
        }
        
        // Sort: free first, then by scans/amount
        backendPlans.sort((a: any, b: any) => {
          if (a.tier === 'free') return -1;
          if (b.tier === 'free') return 1;
          return (a.scans || 0) - (b.scans || 0);
        });
        
        setAvailablePlans(backendPlans);
        console.log('Loaded plans from backend:', backendPlans.map((p: any) => ({ name: p.name, tier: p.tier, priceId: p.priceId })));
      } else {
        console.warn('No plans from backend, using hardcoded plans');
        setAvailablePlans(plans);
      }
    } catch (error: any) {
      console.error('Error loading plans:', error);
      // Fallback to hardcoded plans
      setAvailablePlans(plans);
    }
  };
  // Manual refresh function
  const handleRefresh = () => {
    refetchSubscription();
    refetchUsage();
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
    toast({
      title: "Refreshing...",
      description: "Subscription data updated",
    });
  };
  const handleUpgrade = async (priceId: string | null | undefined) => {
    if (!priceId) {
      toast({
        title: "Error",
        description: "This plan is not available for checkout. Please try again later.",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure we're using a price ID from backend, not hardcoded
    if (availablePlans.length === 0) {
      toast({
        title: "Loading plans...",
        description: "Please wait for plans to load, then try again.",
        variant: "default"
      });
      // Try to reload plans
      await loadAvailablePlans();
      return;
    }
    
    // Verify the price ID exists in backend plans
    const planFromBackend = availablePlans.find(p => p.priceId === priceId);
    if (!planFromBackend && priceId !== null) {
      toast({
        title: "Plan not found",
        description: "This plan is not available. Please refresh the page and try again.",
        variant: "destructive"
      });
      // Reload plans
      await loadAvailablePlans();
      return;
    }
    
    try {
      console.log('Starting checkout for priceId:', priceId);
      setProcessingPlan(priceId);
      
      const response = await api.post('/api/auth/subscription/checkout/', {
          priceId
      });
      
      if (response.data?.url) {
        console.log('Opening checkout URL:', response.data.url);
        // Track subscription intent
        const selectedPlan = plansToDisplay.find(p => p.priceId === priceId) || plans.find(p => p.priceId === priceId);
        trackMetaPixelEvent(MetaPixelEvents.Subscribe, {
          value: parseFloat(selectedPlan?.price.replace('$', '') || '0'),
          currency: 'USD',
          predicted_ltv: parseFloat(selectedPlan?.price.replace('$', '') || '0') * 12
        });
        
        // Open checkout in same window (Stripe will redirect back to /subscription)
        window.location.href = response.data.url;
      } else {
        console.error('No URL in response');
        toast({
          title: "Error",
          description: response.data?.error || response.data?.message || "No checkout URL received",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Failed to create checkout session",
        variant: "destructive"
      });
    } finally {
      setProcessingPlan(null);
    }
  };
  const handleManageSubscription = async () => {
    try {
      setProcessingPlan('portal');
      const response = await api.post('/api/auth/subscription/portal/');
      if (response.data?.url) {
        // Open in same window so redirect works properly
        window.location.href = response.data.url;
      } else {
        const errorMsg = response.data?.error || response.data?.message || "No portal URL received";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
          duration: 10000, // Show longer for configuration errors
        });
      }
    } catch (error: any) {
      console.error('Error opening portal:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.response?.data?.detail || error?.message || "Failed to open customer portal";
      
      // Check if it's a portal configuration error or mode mismatch
      const isConfigError = errorMessage.includes('Customer Portal is not configured') || 
                            errorMessage.includes('Activate test link') ||
                            errorMessage.includes('billing/portal');
      
      const isModeMismatch = errorMessage.includes('mode mismatch') ||
                             errorMessage.includes('similar object exists in test mode') ||
                             errorMessage.includes('similar object exists in live mode') ||
                             errorMessage.includes('test mode key') ||
                             errorMessage.includes('live mode key');
      
      if (isModeMismatch) {
        // Show mode mismatch error
        toast({
          title: "API Key Mode Mismatch",
          description: (
            <div className="space-y-2 text-sm">
              <p className="font-medium">Your Stripe API key mode doesn't match your portal configuration.</p>
              <div className="space-y-1">
                <p className="text-xs">The error indicates:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2 text-xs">
                  {errorMessage.includes('test mode') && !errorMessage.includes('live mode key') && (
                    <li>Portal is configured in <strong>test mode</strong>, but you're using a <strong>live mode</strong> API key</li>
                  )}
                  {errorMessage.includes('live mode') && !errorMessage.includes('test mode key') && (
                    <li>Portal is configured in <strong>live mode</strong>, but you're using a <strong>test mode</strong> API key</li>
                  )}
                </ul>
                <p className="text-xs mt-2 font-medium">To fix:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-2 text-xs">
                  <li>Check your <code className="bg-muted px-1 rounded">STRIPE_SECRET_KEY</code> environment variable</li>
                  <li>Ensure it matches the mode where you configured the portal</li>
                  <li>Test mode keys start with <code className="bg-muted px-1 rounded">sk_test_</code></li>
                  <li>Live mode keys start with <code className="bg-muted px-1 rounded">sk_live_</code></li>
                </ol>
              </div>
            </div>
          ),
          variant: "destructive",
          duration: 20000,
        });
      } else if (isConfigError) {
        // Show a more user-friendly error with instructions
        // Split the error message into readable parts
        const errorLines = errorMessage.split('\n').filter(line => line.trim());
        const instructions = errorLines.slice(1).join('\n'); // Skip first line (title)
        
        toast({
          title: "Portal Not Configured",
          description: (
            <div className="space-y-2 text-sm">
              <p className="font-medium">Stripe Customer Portal needs to be set up in your Stripe Dashboard.</p>
              <div className="space-y-1">
                <p>Quick setup:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-2 text-xs">
                  <li>Go to <a href="https://dashboard.stripe.com/test/settings/billing/portal" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Stripe Billing Portal (Test Mode)</a></li>
                  <li>Click "Activate test link" or configure your portal settings</li>
                  <li>Save the configuration</li>
                </ol>
                <p className="text-xs mt-2 opacity-90">For live mode: <a href="https://dashboard.stripe.com/settings/billing/portal" target="_blank" rel="noopener noreferrer" className="text-primary underline">dashboard.stripe.com/settings/billing/portal</a></p>
              </div>
            </div>
          ),
          variant: "destructive",
          duration: 20000, // Show longer for important instructions
        });
      } else {
      toast({
        title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 10000,
      });
      }
    } finally {
      setProcessingPlan(null);
    }
  };
  const handleBuyScanPack = async () => {
    try {
      setProcessingPlan('scan-pack');
      // TODO: Implement scan pack purchase endpoint
      toast({
        title: "Coming Soon",
        description: "Scan pack purchases will be available soon",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Failed to create payment",
        variant: "destructive"
      });
    } finally {
      setProcessingPlan(null);
    }
  };
  const loading = subscriptionLoading || usageLoading;
  
  if (loading && !subscription && !usage) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  
  // Use available plans from backend, but always ensure free plan is included
  // IMPORTANT: Only use backend plans - they have the correct price IDs from database
  let plansToDisplay = availablePlans.length > 0 ? availablePlans : [];
  
  // If no plans loaded yet, show loading state or use hardcoded plans for display only
  // But don't allow checkout until backend plans are loaded
  if (plansToDisplay.length === 0) {
    // Use hardcoded plans for display, but they won't have valid price IDs for checkout
    plansToDisplay = plans;
  }
  
  // Ensure free plan is always included
  const hasFreePlan = plansToDisplay.some(p => p.tier === 'free');
  if (!hasFreePlan) {
    // Add free plan at the beginning
    plansToDisplay = [plans[0], ...plansToDisplay];
  }
  
  // Sort plans: free first, then by amount
  plansToDisplay = plansToDisplay.sort((a, b) => {
    if (a.tier === 'free') return -1;
    if (b.tier === 'free') return 1;
    return (a.scans || 0) - (b.scans || 0);
  });
  
  const currentPlan = plansToDisplay.find(p => p.tier === subscription?.plan_tier) || plansToDisplay[0];
  const scanLimit = (subscription?.scans_limit || currentPlan.scans) + (usage?.bonus_items || subscription?.bonus_credits || 0);
  const scansUsed = subscription?.scans_used || usage?.items_detected || 0;
  const scansRemaining = Math.max(0, scanLimit - scansUsed);
  const usagePercent = scanLimit > 0 ? scansUsed / scanLimit * 100 : 0;
  return <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Subscription</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        {/* Current Usage */}
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle>Your Card Limit</CardTitle>
            <CardDescription className="text-base font-medium">
              You're tracking {scansUsed}/{scanLimit} cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={usagePercent} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{scansUsed} tracked</span>
              <span className="font-medium text-foreground">{scansRemaining} slots remaining</span>
            </div>
            {(usage?.bonus_items || subscription?.bonus_credits) && (usage?.bonus_items || subscription?.bonus_credits || 0) > 0 && <Badge variant="secondary" className="mt-2">
                <Sparkles className="h-3 w-3 mr-1" />
                {usage?.bonus_items || subscription?.bonus_credits || 0} bonus cards
              </Badge>}
            {scansRemaining < scanLimit * 0.2 && scansRemaining > 0 && <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mt-2">
                Running low on card slots! Consider upgrading your plan.
              </p>}
          </CardContent>
        </Card>

        {/* Subscription Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Your current subscription information</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cards Used</TableHead>
                  <TableHead>Card Limit</TableHead>
                  <TableHead>Bonus Credits</TableHead>
                  <TableHead>Subscription End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {subscription?.plan_tier ? subscription.plan_tier.charAt(0).toUpperCase() + subscription.plan_tier.slice(1) : 'Free'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription?.subscribed ? "default" : "secondary"}>
                      {subscription?.subscribed ? "Active" : "Free Plan"}
                    </Badge>
                  </TableCell>
                  <TableCell>{scansUsed}</TableCell>
                  <TableCell>{scanLimit}</TableCell>
                  <TableCell>
                    {usage?.bonus_items || subscription?.bonus_credits || 0}
                    {(usage?.bonus_items || subscription?.bonus_credits || 0) > 0 && (
                      <Sparkles className="h-3 w-3 inline ml-1" />
                    )}
                  </TableCell>
                  <TableCell>
                    {subscription?.subscription_end 
                      ? new Date(subscription.subscription_end).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Upgrade Your Collection Game</h2>
            <p className="text-muted-foreground">Choose the plan that fits your collecting style</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plansToDisplay.map(plan => {
            const isCurrentPlan = plan.tier === subscription?.plan_tier;
            const isProcessing = processingPlan === plan.priceId;
            // Check if this plan has a valid price ID from backend
            const hasValidPriceId = availablePlans.length > 0 && availablePlans.some(p => p.priceId === plan.priceId && p.tier === plan.tier);
            const canUpgrade = plan.priceId && (hasValidPriceId || availablePlans.length === 0); // Allow if backend plans not loaded yet (will validate in handleUpgrade)
            return <Card key={plan.tier} className={cn("flex flex-col", isCurrentPlan && "ring-2 ring-primary", plan.recommended && "ring-2 ring-primary shadow-lg scale-105")}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="flex gap-2">
                        {plan.recommended && <Badge className="bg-primary text-primary-foreground">
                            Recommended
                          </Badge>}
                        {isCurrentPlan && <Badge variant="outline">Current</Badge>}
                      </div>
                    </div>
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-grow flex items-center justify-between gap-2">
                            <span>{feature.text}</span>
                            {!feature.available && <Badge variant="outline" className="text-xs h-5 px-1.5 flex-shrink-0">
                                Coming Soon
                              </Badge>}
                          </div>
                        </li>)}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    {plan.tier === 'free' ? <Button variant="outline" className="w-full" disabled>
                        Free Plan
                      </Button> : isCurrentPlan ? <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={processingPlan === 'portal'}>
                        {processingPlan === 'portal' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Manage
                      </Button> : <Button className="w-full" onClick={() => handleUpgrade(plan.priceId!)} disabled={isProcessing || !canUpgrade || !plan.priceId}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Upgrade
                      </Button>}
                  </CardFooter>
                </Card>;
          })}
          </div>
        </div>

        {/* Scan Pack Add-ons */}
        
      </main>
    </div>;
};
export default Subscription;