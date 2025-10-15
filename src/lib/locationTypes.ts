import { 
  Box, 
  Refrigerator, 
  Home, 
  Bed, 
  ShoppingBag, 
  Warehouse,
  PackageOpen,
  Archive,
  Wine,
  Container,
  FileBox,
  Trophy,
  Shield,
  Star,
  LucideIcon
} from "lucide-react";

export interface LocationType {
  id: string;
  name: string;
  icon: LucideIcon;
  keywords: string[];
  emoji?: string;
}

export const PREDEFINED_LOCATIONS: LocationType[] = [
  {
    id: "garage",
    name: "Garage",
    icon: Warehouse,
    keywords: ["garage", "carport", "car port"]
  },
  {
    id: "pantry",
    name: "Pantry",
    icon: PackageOpen,
    keywords: ["pantry", "food storage"]
  },
  {
    id: "kitchen",
    name: "Kitchen Cabinets",
    icon: Refrigerator,
    keywords: ["kitchen", "cabinet", "cupboard"]
  },
  {
    id: "closet",
    name: "Bedroom Closet",
    icon: Bed,
    keywords: ["closet", "bedroom", "wardrobe"]
  },
  {
    id: "storage",
    name: "Storage Room",
    icon: Archive,
    keywords: ["storage", "store room", "utility"]
  },
  {
    id: "basement",
    name: "Basement",
    icon: Box,
    keywords: ["basement", "cellar"]
  },
  {
    id: "attic",
    name: "Attic",
    icon: Home,
    keywords: ["attic", "loft"]
  },
  {
    id: "shed",
    name: "Shed",
    icon: Container,
    keywords: ["shed", "outhouse", "garden house"]
  },
  {
    id: "wine",
    name: "Wine Cellar",
    icon: Wine,
    keywords: ["wine", "cellar"]
  },
  {
    id: "supplies",
    name: "Office Supplies",
    icon: FileBox,
    keywords: ["office", "supplies", "desk"]
  },
  {
    id: "shopping",
    name: "Shopping Bags",
    icon: ShoppingBag,
    keywords: ["bag", "shopping", "grocery"]
  }
];

export const SPORTS_COLLECTIONS: LocationType[] = [
  {
    id: "baseball",
    name: "Baseball Cards",
    icon: Trophy,
    keywords: ["baseball"],
    emoji: "⚾"
  },
  {
    id: "basketball",
    name: "Basketball Cards",
    icon: Trophy,
    keywords: ["basketball"],
    emoji: "🏀"
  },
  {
    id: "football",
    name: "Football Cards",
    icon: Trophy,
    keywords: ["football"],
    emoji: "🏈"
  },
  {
    id: "hockey",
    name: "Hockey Cards",
    icon: Trophy,
    keywords: ["hockey"],
    emoji: "🏒"
  },
  {
    id: "soccer",
    name: "Soccer Cards",
    icon: Trophy,
    keywords: ["soccer"],
    emoji: "⚽"
  },
  {
    id: "golf",
    name: "Golf Cards",
    icon: Trophy,
    keywords: ["golf"],
    emoji: "⛳"
  },
  {
    id: "rookie",
    name: "Rookie Cards",
    icon: Star,
    keywords: ["rookie"],
    emoji: "⭐"
  },
  {
    id: "graded",
    name: "Graded Cards",
    icon: Shield,
    keywords: ["graded", "psa", "bgs"],
    emoji: "🛡️"
  }
];

export const getLocationIcon = (locationName: string): LucideIcon => {
  const normalizedName = locationName.toLowerCase();
  
  // Check sports collections first
  const sportsMatch = SPORTS_COLLECTIONS.find(type => 
    type.keywords.some(keyword => normalizedName.includes(keyword))
  );
  
  if (sportsMatch) return sportsMatch.icon;
  
  // Then check regular locations
  const match = PREDEFINED_LOCATIONS.find(type => 
    type.keywords.some(keyword => normalizedName.includes(keyword))
  );
  
  return match?.icon || Box;
};

export const getLocationEmoji = (locationName: string): string | undefined => {
  const normalizedName = locationName.toLowerCase();
  
  const sportsMatch = SPORTS_COLLECTIONS.find(type => 
    type.keywords.some(keyword => normalizedName.includes(keyword))
  );
  
  return sportsMatch?.emoji;
};
