import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, TrendingUp, TrendingDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(searchParams.get('view') === 'watchlist');
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sport: "all",
    grading: "all",
    yearFrom: "",
    yearTo: ""
  });

  // Load watchlist from database
  useEffect(() => {
    loadWatchlist();
  }, []);

  // Update URL when watchlist view changes
  useEffect(() => {
    if (showWatchlistOnly) {
      setSearchParams({ view: 'watchlist' });
    } else {
      setSearchParams({});
    }
  }, [showWatchlistOnly, setSearchParams]);

  const loadWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('watchlist')
      .select('card_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading watchlist:', error);
      return;
    }

    setWatchlist(new Set(data?.map(w => w.card_id) || []));
  };

  const toggleWatchlist = async (cardId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to add cards to your watchlist",
        variant: "destructive"
      });
      return;
    }

    const isWatchlisted = watchlist.has(cardId);
    const card = sampleTrendingCards.find(c => c.id === cardId);

    if (isWatchlisted) {
      // Remove from watchlist
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove from watchlist",
          variant: "destructive"
        });
        return;
      }

      setWatchlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });

      toast({
        title: "Removed from watchlist",
        description: `${card?.player} removed from your watchlist`
      });
    } else {
      // Add to watchlist
      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          card_id: cardId,
          player: card?.player,
          card_name: card?.name,
          sport: card?.sport
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add to watchlist",
          variant: "destructive"
        });
        return;
      }

      setWatchlist(prev => new Set([...prev, cardId]));

      toast({
        title: "Added to watchlist",
        description: `${card?.player} added to your watchlist`
      });
    }
  };

  const filteredCards = sampleTrendingCards.filter(card => {
    // Filter by watchlist if enabled
    if (showWatchlistOnly && !watchlist.has(card.id)) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        card.player.toLowerCase().includes(query) ||
        card.name.toLowerCase().includes(query) ||
        card.brand.toLowerCase().includes(query) ||
        card.sport.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
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
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by player, card name, brand, or sport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 border-b">
          <Button
            variant={!showWatchlistOnly ? "default" : "ghost"}
            onClick={() => setShowWatchlistOnly(false)}
            className="rounded-b-none"
          >
            All Cards
          </Button>
          <Button
            variant={showWatchlistOnly ? "default" : "ghost"}
            onClick={() => setShowWatchlistOnly(true)}
            className="rounded-b-none"
          >
            <Star className="h-4 w-4 mr-2" />
            Watchlist ({watchlist.size})
          </Button>
        </div>

        {/* Market Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 relative overflow-hidden">
            <Badge className="absolute top-2 right-2 bg-primary/10 text-primary border-primary/20 animate-pulse">
              Coming Soon
            </Badge>
            <div className="space-y-1 opacity-50">
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-2xl font-bold blur-sm">$2.4M</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground blur-sm">
                <TrendingUp className="h-3 w-3" />
                <span>+12.5%</span>
              </div>
            </div>
          </Card>
          <Card className="p-4 relative overflow-hidden">
            <Badge className="absolute top-2 right-2 bg-primary/10 text-primary border-primary/20 animate-pulse">
              Coming Soon
            </Badge>
            <div className="space-y-1 opacity-50">
              <p className="text-sm text-muted-foreground">Avg Sale Price</p>
              <p className="text-2xl font-bold blur-sm">$187</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground blur-sm">
                <TrendingUp className="h-3 w-3" />
                <span>+3.2%</span>
              </div>
            </div>
          </Card>
          <Card className="p-4 relative overflow-hidden">
            <Badge className="absolute top-2 right-2 bg-primary/10 text-primary border-primary/20 animate-pulse">
              Coming Soon
            </Badge>
            <div className="space-y-1 opacity-50">
              <p className="text-sm text-muted-foreground">Sales Today</p>
              <p className="text-2xl font-bold blur-sm">1,247</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground blur-sm">
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

        {/* Filters */}
        <MarketFilters filters={filters} onFilterChange={setFilters} />

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
