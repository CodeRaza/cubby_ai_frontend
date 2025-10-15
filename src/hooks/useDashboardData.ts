import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Location {
  id: string;
  name: string;
  itemCount: number;
}

interface SubscriptionStatus {
  plan_tier: string;
  scans_used: number;
  scans_limit: number;
  bonus_credits: number;
}

interface CardStats {
  total_cards: number;
  total_value: number;
  graded_count: number;
  weekly_change?: number;
  biggest_mover?: {
    name: string;
    change_percent: number;
  };
  sports_breakdown: Record<string, number>;
  top_cards: Array<{
    name: string;
    value: number;
    image_url: string;
    id: string;
    price_trend_7d?: number;
    is_graded?: boolean;
    special_attributes?: string[];
  }>;
}

// Fetch locations with item counts in a single optimized query
export const useLocations = () => {
  return useQuery({
    queryKey: ['dashboard-locations'],
    queryFn: async () => {
      const { data: locationsData, error: locError } = await supabase
        .from("locations")
        .select(`
          id, 
          name, 
          created_at,
          items:items(count)
        `)
        .order("created_at", { ascending: false });

      if (locError) throw locError;

      const locations: Location[] = (locationsData || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        itemCount: loc.items?.[0]?.count || 0,
      }));

      const totalItems = locations.reduce((sum, loc) => sum + loc.itemCount, 0);

      return { locations, totalItems };
    },
    staleTime: 30000, // 30 seconds
  });
};

// Fetch subscription status
export const useSubscription = () => {
  return useQuery({
    queryKey: ['dashboard-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check subscription status with Stripe (non-blocking)
      supabase.functions.invoke('check-subscription').catch(console.error);

      // Get subscription info from database
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;

      // Get usage info
      const { data: usageData, error: usageError } = await supabase
        .from('scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_end', new Date().toISOString())
        .maybeSingle();

      if (usageError) throw usageError;

      const planTier = subData?.plan_tier || 'free';
      const itemLimits: Record<string, number> = {
        free: 50,
        starter: 250,
        pro: 1000,
        power: 5000
      };

      return {
        plan_tier: planTier,
        scans_used: usageData?.items_detected || 0,
        scans_limit: itemLimits[planTier],
        bonus_credits: usageData?.bonus_items || 0
      } as SubscriptionStatus;
    },
    staleTime: 60000, // 1 minute
  });
};

// Check admin status
export const useAdminStatus = () => {
  return useQuery({
    queryKey: ['admin-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!roles;
    },
    staleTime: 300000, // 5 minutes
  });
};

// Fetch card stats for sports cards users
export const useCardStats = (enabled: boolean) => {
  return useQuery({
    queryKey: ['dashboard-card-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get all items for the user with card details
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select(`
          id, 
          name,
          image_url,
          card_details!inner(
            estimated_value, 
            sport, 
            is_graded,
            price_trend_7d,
            special_attributes
          )
        `)
        .eq("user_id", user.id)
        .eq("source_context", "sports-cards");

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        return { 
          total_cards: 0, 
          total_value: 0, 
          graded_count: 0, 
          sports_breakdown: {},
          top_cards: []
        } as CardStats;
      }

      // Calculate stats
      const total_cards = items.length;
      let total_value = 0;
      let graded_count = 0;
      const sports_breakdown: Record<string, number> = {};
      const cardsWithValues: Array<{ 
        id: string; 
        name: string; 
        value: number; 
        image_url: string;
        price_trend_7d?: number;
        is_graded?: boolean;
        special_attributes?: string[];
      }> = [];

      // Calculate weekly portfolio change
      let weekly_change = 0;
      let biggest_mover: { name: string; change_percent: number } | undefined;
      let max_change = 0;

      items.forEach((item: any) => {
        const cardDetail = item.card_details;
        if (cardDetail) {
          const value = Number(cardDetail.estimated_value) || 0;
          total_value += value;
          
          if (cardDetail.is_graded) graded_count++;
          
          if (cardDetail.sport) {
            sports_breakdown[cardDetail.sport] = (sports_breakdown[cardDetail.sport] || 0) + 1;
          }

          const trend_7d = Number(cardDetail.price_trend_7d) || 0;
          if (trend_7d !== 0) {
            const change_amount = (value * trend_7d) / (100 + trend_7d);
            weekly_change += change_amount;

            if (Math.abs(trend_7d) > Math.abs(max_change)) {
              max_change = trend_7d;
              biggest_mover = {
                name: item.name,
                change_percent: trend_7d
              };
            }
          }

          if (value > 0) {
            cardsWithValues.push({
              id: item.id,
              name: item.name,
              value: value,
              image_url: item.image_url || '',
              price_trend_7d: trend_7d,
              is_graded: cardDetail.is_graded,
              special_attributes: cardDetail.special_attributes || []
            });
          }
        }
      });

      // Get top 5 cards by value
      const top_cards = cardsWithValues
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return { 
        total_cards, 
        total_value, 
        graded_count,
        weekly_change: Math.abs(weekly_change) > 0.01 ? weekly_change : 0,
        biggest_mover,
        sports_breakdown,
        top_cards 
      } as CardStats;
    },
    enabled,
    staleTime: 60000, // 1 minute
  });
};
