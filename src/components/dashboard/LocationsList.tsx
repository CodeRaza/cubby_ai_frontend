import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Plus, Camera, Home, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Location {
  id: string;
  name: string;
  itemCount: number;
}

interface LocationsListProps {
  locations: Location[];
  source: string;
  isLoading?: boolean;
  onOpenDialog: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const LocationsList = memo(({ 
  locations, 
  source, 
  isLoading,
  onOpenDialog,
  onRename,
  onDelete 
}: LocationsListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="text-center py-12 px-6">
          <div className="mb-4">
            {source === 'sports-cards' ? (
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50" />
            ) : (
              <Home className="h-12 w-12 mx-auto text-muted-foreground/50" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {source === 'sports-cards' ? 'No collections yet' : 'No locations yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {source === 'sports-cards' 
              ? 'Create your first collection to start cataloging your cards. Collections help you organize by sport, set, or type.'
              : 'Create your first location to start organizing and scanning items. Locations help you track where everything is stored.'
            }
          </p>
          <Button onClick={onOpenDialog} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {source === 'sports-cards' ? 'Create Your First Collection' : 'Create Your First Location'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/qr-codes/bulk")}
        >
          <Camera className="h-4 w-4 mr-2" />
          Print All QR Codes
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {locations.map((location) => (
          <LocationCard
            key={location.id}
            id={location.id}
            name={location.name}
            itemCount={location.itemCount}
            onClick={() => navigate(`/location/${location.id}`)}
            onQRClick={(e) => {
              e.stopPropagation();
              navigate(`/qr-codes/${location.id}`);
            }}
            onRenameClick={(e) => {
              e.stopPropagation();
              onRename(location.id, location.name);
            }}
            onDeleteClick={(e) => {
              e.stopPropagation();
              onDelete(location.id, location.name);
            }}
          />
        ))}
      </div>
    </>
  );
});

LocationsList.displayName = 'LocationsList';
