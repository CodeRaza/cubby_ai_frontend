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
  realized_gains: number;
  unrealized_gains: number;
  total_cost: number;
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

interface CollectionStats {
  location_id: string;
  total_value: number;
  card_count: number;
  weekly_change: number;
  weekly_change_percent: number;
  top_mover?: {
    name: string;
    change_amount: number;
  };
  sparkline_data: number[];
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
          location_id,
          cost,
          sold,
          sold_price,
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
          realized_gains: 0,
          unrealized_gains: 0,
          total_cost: 0,
          sports_breakdown: {},
          top_cards: []
        } as CardStats;
      }

      // Calculate stats
      const total_cards = items.length;
      let total_value = 0;
      let graded_count = 0;
      let realized_gains = 0;
      let unrealized_gains = 0;
      let total_cost = 0;
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

          // Calculate P&L
          const cost = Number(item.cost) || 0;
          console.log('Processing item:', {
            name: item.name,
            cost,
            value,
            sold: item.sold,
            sold_price: item.sold_price
          });

          if (cost > 0) {
            total_cost += cost;
            
            if (item.sold && item.sold_price) {
              // Realized gains from sold items
              const soldPrice = Number(item.sold_price);
              realized_gains += soldPrice - cost;
              console.log('Realized gain:', soldPrice - cost);
            } else if (value > 0) {
              // Unrealized gains from unsold items with estimated value
              unrealized_gains += value - cost;
              console.log('Unrealized gain:', value - cost);
            }
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

      console.log('Final P&L calculations:', {
        realized_gains,
        unrealized_gains,
        total_cost,
        total_value
      });

      return {
        total_cards, 
        total_value, 
        graded_count,
        weekly_change: Math.abs(weekly_change) > 0.01 ? weekly_change : 0,
        biggest_mover,
        realized_gains,
        unrealized_gains,
        total_cost,
        sports_breakdown,
        top_cards 
      } as CardStats;
    },
    enabled,
    staleTime: 60000, // 1 minute
  });
};

// Fetch collection-level stats for each location
export const useCollectionStats = (enabled: boolean) => {
  return useQuery({
    queryKey: ['collection-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all locations first
      const { data: locations, error: locError } = await supabase
        .from("locations")
        .select("id, name")
        .eq("user_id", user.id);

      if (locError) throw locError;

      const { data: items, error } = await supabase
        .from("items")
        .select(`
          id,
          name,
          location_id,
          card_details!inner(
            estimated_value,
            price_trend_7d
          )
        `)
        .eq("user_id", user.id)
        .eq("source_context", "sports-cards");

      if (error) throw error;

      // Group by location and calculate stats
      const locationStats: Record<string, CollectionStats> = {};

      if (items && items.length > 0) {
        items.forEach((item: any) => {
          const locationId = item.location_id;
          if (!locationId) return;

          const cardDetail = item.card_details;
          const value = Number(cardDetail?.estimated_value) || 0;
          const trend_7d = Number(cardDetail?.price_trend_7d) || 0;

          if (!locationStats[locationId]) {
            locationStats[locationId] = {
              location_id: locationId,
              total_value: 0,
              card_count: 0,
              weekly_change: 0,
              weekly_change_percent: 0,
              sparkline_data: [],
              top_mover: undefined
            };
          }

          locationStats[locationId].total_value += value;
          locationStats[locationId].card_count += 1;

          if (trend_7d !== 0 && value > 0) {
            const change_amount = (value * trend_7d) / (100 + trend_7d);
            locationStats[locationId].weekly_change += change_amount;

            // Track top mover
            if (!locationStats[locationId].top_mover || 
                Math.abs(change_amount) > Math.abs(locationStats[locationId].top_mover!.change_amount)) {
              locationStats[locationId].top_mover = {
                name: item.name,
                change_amount: change_amount
              };
            }
          }
        });

      // Calculate percentages and generate sparkline data
      Object.values(locationStats).forEach(stats => {
        if (stats.total_value > 0) {
          stats.weekly_change_percent = (stats.weekly_change / stats.total_value) * 100;
        }
        stats.sparkline_data = generateSparklineData(stats.total_value, stats.weekly_change_percent);
      });
    }

    // Force dummy data for specific collections (overrides real data for demo purposes)
    const baseballCardsLocation = locations?.find(loc => loc.name === "Baseball Cards");
    if (baseballCardsLocation) {
      locationStats[baseballCardsLocation.id] = {
        location_id: baseballCardsLocation.id,
        total_value: 8720,
        card_count: 31,
        weekly_change: 215,
        weekly_change_percent: 2.5,
        top_mover: {
          name: "Derek Jeter RC",
          change_amount: 75
        },
        sparkline_data: generateSparklineData(8720, 2.5)
      };
    }

    // Force dummy data for Basketball Cards collection with negative performance
    const basketballCardsLocation = locations?.find(loc => loc.name === "Basketball Cards");
    if (basketballCardsLocation) {
      locationStats[basketballCardsLocation.id] = {
        location_id: basketballCardsLocation.id,
        total_value: 6450,
        card_count: 24,
        weekly_change: -185,
        weekly_change_percent: -2.8,
        top_mover: {
          name: "LeBron James Base",
          change_amount: -95
        },
        sparkline_data: generateSparklineData(6450, -2.8)
      };
    }

    return Object.values(locationStats);
    },
    enabled,
    staleTime: 60000,
  });
};

// Helper function to generate sparkline data
function generateSparklineData(currentValue: number, weeklyChangePercent: number): number[] {
  const points = 30;
  const data: number[] = [];
  const weeklyChange = weeklyChangePercent / 100;
  
  // Calculate the starting value (30 days ago) based on the weekly trend
  // If weeklyChangePercent is +2.5%, then 30 days ago value was lower
  // If weeklyChangePercent is -2.5%, then 30 days ago value was higher
  const totalChange = weeklyChange * 4.3; // Approximate 30-day from 7-day
  const startValue = currentValue / (1 + totalChange);
  
  // Generate a smooth curve from past (startValue) to present (currentValue)
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const value = startValue + (currentValue - startValue) * progress;
    const noise = (Math.random() - 0.5) * currentValue * 0.015; // Add small variance
    data.push(Math.max(0, value + noise));
  }
  
  return data;
}
