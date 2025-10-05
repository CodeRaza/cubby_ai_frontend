import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeLabel } from "@/components/QRCodeLabel";

const QRCodeSingle = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState("");
  const [shareToken, setShareToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocation();
  }, [locationId]);

  const loadLocation = async () => {
    try {
      const { data } = await supabase
        .from("locations")
        .select("name, share_token")
        .eq("id", locationId)
        .single();

      if (data) {
        setLocationName(data.name);
        setShareToken(data.share_token || "");
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
          <h1 className="text-xl font-bold">QR Code Label</h1>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <QRCodeLabel 
          locationId={locationId!} 
          locationName={locationName}
          shareToken={shareToken}
        />
        
        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>Print this label and attach it to your {locationName.toLowerCase()}</p>
          <p className="mt-2">Anyone who scans will get view-only access after signing up</p>
        </div>
      </main>
    </div>
  );
};

export default QRCodeSingle;