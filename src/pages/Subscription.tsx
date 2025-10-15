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
    text: "10 scans total",
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
    text: "100 scans/month",
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
  priceId: "price_1SIMizIkzp5CYjx0oAuXFFUr"
}, {
  name: "Pro",
  tier: "pro",
  price: "$14.99",
  scans: 1000,
  features: [{
    text: "1,000 scans/month",
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
  priceId: "price_1SIMjUIkzp5CYjx0JkRYkHxe",
  recommended: true
}, {
  name: "Investor",
  tier: "investor",
  price: "$29.99",
  scans: 5000,
  features: [{
    text: "5,000 scans/month",
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
  priceId: "price_1SIMjfIkzp5CYjx04YefG59z"
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
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  useEffect(() => {
    loadSubscriptionData();
  }, []);
  const loadSubscriptionData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check subscription status
      console.log('Calling check-subscription function...');
      const {
        data: subData,
        error: subError
      } = await supabase.functions.invoke('check-subscription');
      console.log('check-subscription response:', {
        data: subData,
        error: subError
      });
      if (subError) {
        console.error('Subscription check error:', subError);
        throw new Error(subError.message || 'Failed to check subscription');
      }
      setSubscription(subData);

      // Get usage data
      const {
        data: usageData,
        error: usageError
      } = await supabase.from('scan_usage').select('*').eq('user_id', user.id).gte('period_end', new Date().toISOString()).maybeSingle();
      if (usageError) {
        console.error('Usage data error:', usageError);
        throw usageError;
      }
      setUsage(usageData);
    } catch (error: any) {
      console.error('Error loading subscription:', error);
      toast({
        title: "Error loading subscription",
        description: error.message || 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleUpgrade = async (priceId: string) => {
    try {
      console.log('Starting checkout for priceId:', priceId);
      setProcessingPlan(priceId);
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId
        }
      });
      console.log('Checkout response:', {
        data,
        error
      });
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
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive"
      });
    } finally {
      setProcessingPlan(null);
    }
  };
  const handleManageSubscription = async () => {
    try {
      setProcessingPlan('portal');
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening portal:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingPlan(null);
    }
  };
  const handleBuyScanPack = async () => {
    try {
      setProcessingPlan('scan-pack');
      const {
        data,
        error
      } = await supabase.functions.invoke('create-payment');
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
        variant: "destructive"
      });
    } finally {
      setProcessingPlan(null);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  const currentPlan = plans.find(p => p.tier === subscription?.plan_tier) || plans[0];
  const scanLimit = currentPlan.scans + (usage?.bonus_items || 0);
  const scansUsed = usage?.items_detected || 0;
  const scansRemaining = Math.max(0, scanLimit - scansUsed);
  const usagePercent = scanLimit > 0 ? scansUsed / scanLimit * 100 : 0;
  return <div className="min-h-screen bg-background">
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
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle>Your Scan Usage</CardTitle>
            <CardDescription className="text-base font-medium">
              You've used {scansUsed}/{scanLimit} scans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={usagePercent} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{scansUsed} used</span>
              <span className="font-medium text-foreground">{scansRemaining} remaining</span>
            </div>
            {usage?.bonus_items && usage.bonus_items > 0 && <Badge variant="secondary" className="mt-2">
                <Sparkles className="h-3 w-3 mr-1" />
                {usage.bonus_items} bonus scans
              </Badge>}
            {scansRemaining < scanLimit * 0.2 && scansRemaining > 0 && <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mt-2">
                Running low on scans! Consider upgrading your plan.
              </p>}
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Upgrade Your Collection Game</h2>
            <p className="text-muted-foreground">Choose the plan that fits your collecting style</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => {
            const isCurrentPlan = plan.tier === subscription?.plan_tier;
            const isProcessing = processingPlan === plan.priceId;
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
                      </Button> : <Button className="w-full" onClick={() => handleUpgrade(plan.priceId!)} disabled={isProcessing}>
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