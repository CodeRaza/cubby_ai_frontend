import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePricingQueueStatus = (cardDetailsId?: string) => {
  return useQuery({
    queryKey: ['pricing-queue-status', cardDetailsId],
    queryFn: async () => {
      if (!cardDetailsId) return null;

      const { data, error } = await supabase
        .from('pricing_queue')
        .select('id, status, priority, created_at, processed_at')
        .eq('card_details_id', cardDetailsId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!cardDetailsId,
    refetchInterval: (query) => {
      // Refetch every 10 seconds if there's a pending/processing job
      const jobData = query.state.data;
      return jobData?.status === 'pending' || jobData?.status === 'processing' ? 10000 : false;
    }
  });
};