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
  LucideIcon
} from "lucide-react";

export interface LocationType {
  id: string;
  name: string;
  icon: LucideIcon;
  keywords: string[];
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

export const getLocationIcon = (locationName: string): LucideIcon => {
  const normalizedName = locationName.toLowerCase();
  
  const match = PREDEFINED_LOCATIONS.find(type => 
    type.keywords.some(keyword => normalizedName.includes(keyword))
  );
  
  return match?.icon || Box;
};
