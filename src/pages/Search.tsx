import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, ArrowLeft, Camera, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  image_url: string | null;
  location: {
    name: string;
  } | null;
}

const Search = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(items);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredItems(
        items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query) ||
            item.location?.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, items]);

  const loadItems = async () => {
    const { data } = await supabase
      .from("items")
      .select(`
        *,
        location:locations(name)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setItems(data);
      setFilteredItems(data);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Search</h1>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No items found" : "No items yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                name={item.name}
                category={item.category || undefined}
                quantity={item.quantity}
                imageUrl={item.image_url || undefined}
                locationName={item.location?.name}
                onClick={() => navigate(`/item/${item.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3">
        <div className="container mx-auto flex items-center justify-around max-w-lg">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <div className="flex flex-col items-center gap-1">
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </div>
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => navigate("/scan")}
          >
            <Camera className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/search")}>
            <div className="flex flex-col items-center gap-1">
              <SearchIcon className="h-5 w-5" />
              <span className="text-xs">Search</span>
            </div>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Search;