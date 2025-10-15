import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

interface TopMover {
  id: string;
  name: string;
  currentValue: number;
  changeAmount: number;
  changePercent: number;
}

interface DistributionItem {
  name: string;
  count: number;
  value: number;
}

interface CollectionDetails {
  totalValue: number;
  cardCount: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  chartData: Array<{ date: string; value: number }>;
  topMovers: TopMover[];
  distribution: {
    byPlayer: DistributionItem[];
    byYear: DistributionItem[];
    byCardType: DistributionItem[];
    byGrading: DistributionItem[];
  };
}

export const useCollectionDetails = (locationId: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['collection-details', locationId],
    queryFn: async () => {
      if (!locationId) return null;

      // Get all items with card details for this location
      const { data: items, error } = await supabase
        .from("items")
        .select(`
          id,
          name,
          source_context,
          card_details!inner(
            estimated_value,
            player_name,
            card_year,
            brand,
            is_graded,
            grading_company,
            grade,
            price_trend_7d,
            price_trend_30d,
            special_attributes
          )
        `)
        .eq("location_id", locationId)
        .eq("source_context", "sports-cards");

      if (error) throw error;

      if (!items || items.length === 0) {
        return null;
      }

      // Calculate total value and counts
      let totalValue = 0;
      let weeklyValueChange = 0;
      let monthlyValueChange = 0;
      const cardCount = items.length;

      items.forEach((item: any) => {
        const value = item.card_details?.estimated_value || 0;
        const trend7d = item.card_details?.price_trend_7d || 0;
        const trend30d = item.card_details?.price_trend_30d || 0;
        
        totalValue += value;
        weeklyValueChange += (value * trend7d) / 100;
        monthlyValueChange += (value * trend30d) / 100;
      });

      const weeklyChangePercent = totalValue > 0 ? (weeklyValueChange / (totalValue - weeklyValueChange)) * 100 : 0;
      const monthlyChangePercent = totalValue > 0 ? (monthlyValueChange / (totalValue - monthlyValueChange)) * 100 : 0;

      // Generate 30-day chart data (simulated based on current trends)
      const chartData = [];
      for (let i = 30; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        // Interpolate value based on monthly trend
        const dayProgress = (30 - i) / 30;
        const interpolatedChange = monthlyValueChange * dayProgress;
        const value = totalValue - monthlyValueChange + interpolatedChange;
        chartData.push({ date, value: Math.max(0, value) });
      }

      // Calculate top movers (top 5 gainers/losers)
      const itemsWithChange = items.map((item: any) => {
        const value = item.card_details?.estimated_value || 0;
        const trend7d = item.card_details?.price_trend_7d || 0;
        const changeAmount = (value * trend7d) / 100;
        return {
          id: item.id,
          name: item.name,
          currentValue: value,
          changeAmount,
          changePercent: trend7d,
        };
      });

      const topMovers = itemsWithChange
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 5);

      // Calculate distributions
      const playerMap = new Map<string, { count: number; value: number }>();
      const yearMap = new Map<string, { count: number; value: number }>();
      const typeMap = new Map<string, { count: number; value: number }>();
      const gradingMap = new Map<string, { count: number; value: number }>();

      items.forEach((item: any) => {
        const value = item.card_details?.estimated_value || 0;
        
        // By player
        const player = item.card_details?.player_name || "Unknown";
        if (!playerMap.has(player)) {
          playerMap.set(player, { count: 0, value: 0 });
        }
        const playerData = playerMap.get(player)!;
        playerData.count++;
        playerData.value += value;

        // By year
        const year = item.card_details?.card_year ? String(item.card_details.card_year) : "Unknown";
        if (!yearMap.has(year)) {
          yearMap.set(year, { count: 0, value: 0 });
        }
        const yearData = yearMap.get(year)!;
        yearData.count++;
        yearData.value += value;

        // By card type (using special_attributes or brand)
        const type = item.card_details?.special_attributes?.[0] || item.card_details?.brand || "Base";
        if (!typeMap.has(type)) {
          typeMap.set(type, { count: 0, value: 0 });
        }
        const typeData = typeMap.get(type)!;
        typeData.count++;
        typeData.value += value;

        // By grading
        const grading = item.card_details?.is_graded
          ? `${item.card_details.grading_company || "Graded"} ${item.card_details.grade || ""}`
          : "Ungraded";
        if (!gradingMap.has(grading)) {
          gradingMap.set(grading, { count: 0, value: 0 });
        }
        const gradingData = gradingMap.get(grading)!;
        gradingData.count++;
        gradingData.value += value;
      });

      const toDistribution = (map: Map<string, { count: number; value: number }>) => {
        return Array.from(map.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
      };

      return {
        totalValue,
        cardCount,
        weeklyChange: weeklyValueChange,
        weeklyChangePercent,
        monthlyChange: monthlyValueChange,
        monthlyChangePercent,
        chartData,
        topMovers,
        distribution: {
          byPlayer: toDistribution(playerMap),
          byYear: toDistribution(yearMap),
          byCardType: toDistribution(typeMap),
          byGrading: toDistribution(gradingMap),
        },
      } as CollectionDetails;
    },
    enabled: enabled && !!locationId,
    staleTime: 60000, // 1 minute
  });
};
