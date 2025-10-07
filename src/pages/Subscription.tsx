import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackMetaPixelEvent, MetaPixelEvents } from "@/lib/metaPixel";

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

const plans = [
  {
    name: "Free",
    tier: "free",
    price: "$0",
    items: 50,
    features: ["50 items/month", "1 room", "Basic AI detection"],
    priceId: null,
  },
  {
    name: "Starter",
    tier: "starter",
    price: "$1.99",
    items: 250,
    features: ["250 items/month", "Multi-room", "Standard AI detection"],
    priceId: "price_1SFPP4DbbgzShd5sKL2jNab1",
  },
  {
    name: "Pro",
    tier: "pro",
    price: "$4.99",
    items: 1000,
    features: ["1000 items/month", "Expiry reminders", "Cloud backup", "CSV export", "Priority AI"],
    priceId: "price_1SFPPSDbbgzShd5sq0LHAVEy",
  },
  {
    name: "Power",
    tier: "power",
    price: "$9.99",
    items: 5000,
    features: ["5000 items/month", "Multi-user (up to 3)", "API access", "Advanced export"],
    priceId: "price_1SFPPjDbbgzShd5sxjhWBBYJ",
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check subscription status
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
      if (subError) throw subError;
      setSubscription(subData);

      // Get usage data
      const { data: usageData, error: usageError } = await supabase
        .from('scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_end', new Date().toISOString())
        .single();

      if (usageError && usageError.code !== 'PGRST116') throw usageError;
      setUsage(usageData);

    } catch (error: any) {
      console.error('Error loading subscription:', error);
      toast({
        title: "Error loading subscription",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      console.log('Starting checkout for priceId:', priceId);
      setProcessingPlan(priceId);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Opening checkout URL:', data.url);
        // Track subscription intent
        const selectedPlan = plans.find(p => p.priceId === priceId);
        trackMetaPixelEvent(MetaPixelEvents.Subscribe, {
          value: parseFloat(selectedPlan?.price.replace('$', '') || '0'),
          currency: 'USD',
          predicted_ltv: parseFloat(selectedPlan?.price.replace('$', '') || '0') * 12
        });
        
        window.open(data.url, '_blank');
      } else {
        console.error('No URL in response');
        toast({
          title: "Error",
          description: "No checkout URL received",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setProcessingPlan('portal');
      
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening portal:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleBuyScanPack = async () => {
    try {
      setProcessingPlan('scan-pack');
      
      const { data, error } = await supabase.functions.invoke('create-payment');
      if (error) throw error;

      if (data?.url) {
        // Track item pack purchase
        trackMetaPixelEvent(MetaPixelEvents.Purchase, {
          value: 1.99,
          currency: 'USD',
          content_name: 'Item Pack',
          content_type: 'product',
          num_items: 100
        });
        
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = plans.find(p => p.tier === subscription?.plan_tier) || plans[0];
  const itemLimit = currentPlan.items + (usage?.bonus_items || 0);
  const itemsUsed = usage?.items_detected || 0;
  const itemsRemaining = Math.max(0, itemLimit - itemsUsed);
  const usagePercent = itemLimit > 0 ? (itemsUsed / itemLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Subscription</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        {/* Current Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              {itemsRemaining} of {itemLimit} items remaining this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={usagePercent} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{itemsUsed} used</span>
              <span>{itemsRemaining} remaining</span>
            </div>
            {usage?.bonus_items && usage.bonus_items > 0 && (
              <Badge variant="secondary" className="mt-2">
                <Sparkles className="h-3 w-3 mr-1" />
                {usage.bonus_items} bonus items
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.tier === subscription?.plan_tier;
              const isProcessing = processingPlan === plan.priceId;

              return (
                <Card key={plan.tier} className={isCurrentPlan ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge>Current</Badge>
                      )}
                    </div>
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {plan.tier === 'free' ? (
                      <Button variant="outline" className="w-full" disabled>
                        Free Plan
                      </Button>
                    ) : isCurrentPlan ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleManageSubscription}
                        disabled={processingPlan === 'portal'}
                      >
                        {processingPlan === 'portal' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Manage
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleUpgrade(plan.priceId!)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Upgrade
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Scan Pack Add-on */}
        <Card>
          <CardHeader>
            <CardTitle>Need more items?</CardTitle>
            <CardDescription>
              Purchase additional items without changing your plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Item Pack</p>
                <p className="text-sm text-muted-foreground">+100 items</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$1.99</p>
                <p className="text-xs text-muted-foreground">one-time</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={handleBuyScanPack}
              disabled={processingPlan === 'scan-pack'}
            >
              {processingPlan === 'scan-pack' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Purchase Item Pack
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Subscription;
