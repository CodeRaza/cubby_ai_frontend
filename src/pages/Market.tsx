import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketFilters } from "@/components/market/MarketFilters";
import { TrendingCardsFeed } from "@/components/market/TrendingCardsFeed";
import { CardDetailsModal } from "@/components/market/CardDetailsModal";

export interface MarketCard {
  id: string;
  name: string;
  player: string;
  year: number;
  brand: string;
  sport: string;
  imageUrl: string;
  currentPrice: number;
  change24h: number;
  changePercent: number;
  avgPrice: number;
  lastSale: number;
  volume24h: number;
  isGraded?: boolean;
  grade?: number;
  gradingCompany?: string;
}

// Sample trending data
const sampleTrendingCards: MarketCard[] = [
  {
    id: "1",
    name: "2018 Panini Prizm Base",
    player: "Luka Dončić",
    year: 2018,
    brand: "Panini Prizm",
    sport: "Basketball",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
    currentPrice: 285.00,
    change24h: 15.50,
    changePercent: 5.75,
    avgPrice: 275.00,
    lastSale: 290.00,
    volume24h: 45,
    isGraded: true,
    grade: 9.5,
    gradingCompany: "PSA"
  },
  {
    id: "2",
    name: "2003 Topps Chrome Refractor",
    player: "LeBron James",
    year: 2003,
    brand: "Topps Chrome",
    sport: "Basketball",
    imageUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400",
    currentPrice: 1250.00,
    change24h: -45.00,
    changePercent: -3.47,
    avgPrice: 1295.00,
    lastSale: 1240.00,
    volume24h: 12,
    isGraded: true,
    grade: 10,
    gradingCompany: "BGS"
  },
  {
    id: "3",
    name: "1989 Upper Deck Rookie",
    player: "Ken Griffey Jr.",
    year: 1989,
    brand: "Upper Deck",
    sport: "Baseball",
    imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400",
    currentPrice: 125.00,
    change24h: 8.25,
    changePercent: 7.07,
    avgPrice: 120.00,
    lastSale: 128.00,
    volume24h: 28,
    isGraded: false
  },
  {
    id: "4",
    name: "2020 Prizm Draft Picks",
    player: "Justin Herbert",
    year: 2020,
    brand: "Panini Prizm",
    sport: "Football",
    imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400",
    currentPrice: 95.00,
    change24h: 12.00,
    changePercent: 14.46,
    avgPrice: 88.00,
    lastSale: 98.00,
    volume24h: 35,
    isGraded: true,
    grade: 9,
    gradingCompany: "PSA"
  }
];

const Market = () => {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    sport: "all",
    grading: "all",
    yearFrom: "",
    yearTo: ""
  });

  const toggleWatchlist = (cardId: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const filteredCards = sampleTrendingCards.filter(card => {
    if (filters.sport !== "all" && card.sport !== filters.sport) return false;
    if (filters.grading === "graded" && !card.isGraded) return false;
    if (filters.grading === "raw" && card.isGraded) return false;
    if (filters.yearFrom && card.year < parseInt(filters.yearFrom)) return false;
    if (filters.yearTo && card.year > parseInt(filters.yearTo)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Market</h1>
              <p className="text-sm text-muted-foreground">Sports card market trends</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <MarketFilters filters={filters} onFilterChange={setFilters} />

        {/* Market Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-2xl font-bold">$2.4M</p>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+12.5%</span>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Sale Price</p>
              <p className="text-2xl font-bold">$187</p>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+3.2%</span>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sales Today</p>
              <p className="text-2xl font-bold">1,247</p>
              <div className="flex items-center gap-1 text-sm text-red-600">
                <TrendingDown className="h-3 w-3" />
                <span>-5.8%</span>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Watchlist</p>
              <p className="text-2xl font-bold">{watchlist.size}</p>
              <p className="text-sm text-muted-foreground">cards tracked</p>
            </div>
          </Card>
        </div>

        {/* Trending Cards Feed */}
        <TrendingCardsFeed
          cards={filteredCards}
          watchlist={watchlist}
          onToggleWatchlist={toggleWatchlist}
          onCardClick={setSelectedCard}
        />
      </main>

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          isWatchlisted={watchlist.has(selectedCard.id)}
          onToggleWatchlist={toggleWatchlist}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

export default Market;
