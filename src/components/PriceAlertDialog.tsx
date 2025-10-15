import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PriceAlertDialogProps {
  cardId: string;
}

export const PriceAlertDialog = ({ cardId }: PriceAlertDialogProps) => {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<string>("threshold");
  const [percentage, setPercentage] = useState<string>("5");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingAlert } = useQuery({
    queryKey: ['price-alert', cardId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const createAlert = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          card_id: cardId,
          alert_type: alertType,
          threshold_percentage: Number(percentage)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert', cardId] });
      toast({
        title: "Alert created",
        description: "You'll be notified when the price changes."
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteAlert = useMutation({
    mutationFn: async () => {
      if (!existingAlert) return;
      
      const { error } = await supabase
        .from('price_alerts')
        .update({ is_active: false })
        .eq('id', existingAlert.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert', cardId] });
      toast({
        title: "Alert removed",
        description: "You'll no longer receive price notifications."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (existingAlert) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => deleteAlert.mutate()}
        disabled={deleteAlert.isPending}
      >
        <BellOff className="h-4 w-4 mr-2" />
        Remove Alert
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Set Price Alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Price Alert</DialogTitle>
          <DialogDescription>
            Get notified when this card's price changes significantly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Alert Type</Label>
            <RadioGroup value={alertType} onValueChange={setAlertType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="threshold" id="threshold" />
                <Label htmlFor="threshold" className="font-normal">
                  Any change above threshold
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price_increase" id="increase" />
                <Label htmlFor="increase" className="font-normal">
                  Only increases
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price_decrease" id="decrease" />
                <Label htmlFor="decrease" className="font-normal">
                  Only decreases
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentage">Percentage Threshold</Label>
            <div className="flex items-center gap-2">
              <Input
                id="percentage"
                type="number"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="5"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => createAlert.mutate()}
            disabled={createAlert.isPending}
          >
            Create Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};