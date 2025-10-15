import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DistributionItem {
  name: string;
  count: number;
  value: number;
}

interface CollectionDistributionProps {
  byPlayer: DistributionItem[];
  byYear: DistributionItem[];
  byCardType: DistributionItem[];
  byGrading: DistributionItem[];
}

export const CollectionDistribution = ({
  byPlayer,
  byYear,
  byCardType,
  byGrading,
}: CollectionDistributionProps) => {
  const renderDistribution = (items: DistributionItem[], title: string) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No {title.toLowerCase()} data available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.count} cards</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${item.value.toFixed(0)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-xl">🧮</span>
          Value Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="player" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="player" className="text-xs">
              Player
            </TabsTrigger>
            <TabsTrigger value="year" className="text-xs">
              Year
            </TabsTrigger>
            <TabsTrigger value="type" className="text-xs">
              Type
            </TabsTrigger>
            <TabsTrigger value="grading" className="text-xs">
              Grading
            </TabsTrigger>
          </TabsList>
          <TabsContent value="player" className="mt-4">
            {renderDistribution(byPlayer, "Player")}
          </TabsContent>
          <TabsContent value="year" className="mt-4">
            {renderDistribution(byYear, "Year")}
          </TabsContent>
          <TabsContent value="type" className="mt-4">
            {renderDistribution(byCardType, "Card Type")}
          </TabsContent>
          <TabsContent value="grading" className="mt-4">
            {renderDistribution(byGrading, "Grading")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
