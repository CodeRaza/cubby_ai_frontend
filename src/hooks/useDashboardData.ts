import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuth } from "@/lib/auth";

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

// Fetch locations (collections) with item counts
export const useLocations = () => {
  return useQuery({
    queryKey: ['dashboard-locations'],
    queryFn: async () => {
      const response = await api.get("/api/cards/collections/");
      
      // Handle both paginated and non-paginated responses
      const collectionsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      
      // Map collections to locations format
      const locations: Location[] = collectionsData.map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        itemCount: collection.card_count || 0,
      }));

      const totalItems = locations.reduce((sum, loc) => sum + loc.itemCount, 0);

      return { locations, totalItems };
    },
    staleTime: 10000, // 10 seconds - data is considered fresh for 10s
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};

// Fetch subscription status
export const useSubscription = () => {
  return useQuery({
    queryKey: ['dashboard-subscription'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/auth/subscription/');
        const data = response.data;

      return {
          plan_tier: data.plan_tier || 'free',
          scans_used: data.scans_used || 0,
          scans_limit: data.scans_limit || 10,
          bonus_credits: data.bonus_credits || 0
        } as SubscriptionStatus;
      } catch (error: any) {
        // If 401, user is not authenticated - return null
        if (error?.response?.status === 401) {
          return null;
        }
        // For other errors, return default free plan
        return {
          plan_tier: 'free',
          scans_used: 0,
          scans_limit: 10,
          bonus_credits: 0
      } as SubscriptionStatus;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Auto-refetch every 60 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Check admin status
export const useAdminStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['admin-status'],
    queryFn: async () => {
      // For now, return false - admin check can be implemented via Django user.is_staff
      // or a separate admin endpoint
      return false;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
};

// Fetch card stats for sports cards users
export const useCardStats = (enabled: boolean) => {
  return useQuery({
    queryKey: ['dashboard-card-stats'],
    queryFn: async () => {
      const response = await api.get('/api/cards/dashboard/stats/cards/');
      return response.data as CardStats;
    },
    enabled,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Fetch collection-level stats for each location
export const useCollectionStats = (enabled: boolean) => {
  return useQuery({
    queryKey: ['collection-stats'],
    queryFn: async () => {
      const response = await api.get('/api/cards/dashboard/stats/collections/');
      return response.data as CollectionStats[];
    },
    enabled,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
