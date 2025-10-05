import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeLabel } from "@/components/QRCodeLabel";

interface Location {
  id: string;
  name: string;
}

const QRCodeBulk = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");

      if (data) {
        setLocations(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">All QR Code Labels</h1>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print All
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {locations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No locations to print</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2">
            {locations.map((location) => (
              <QRCodeLabel
                key={location.id}
                locationId={location.id}
                locationName={location.name}
                compact
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>Print these labels and attach them to your locations</p>
          <p className="mt-2">Scanning requires login to view inventory</p>
        </div>
      </main>

      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodeBulk;