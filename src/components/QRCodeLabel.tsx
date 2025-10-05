import { QRCodeSVG } from "qrcode.react";
import { MapPin } from "lucide-react";

interface QRCodeLabelProps {
  locationId: string;
  locationName: string;
  shareToken?: string;
  compact?: boolean;
}

export const QRCodeLabel = ({ locationId, locationName, shareToken, compact = false }: QRCodeLabelProps) => {
  const url = shareToken 
    ? `${window.location.origin}/location/${locationId}?token=${shareToken}`
    : `${window.location.origin}/location/${locationId}`;

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg border print:border-2 print:break-inside-avoid">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{locationName}</span>
        </div>
        <QRCodeSVG value={url} size={120} level="H" includeMargin />
        <p className="text-xs text-muted-foreground">Scan to view items</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-card rounded-xl border-2 print:border-4 print:break-inside-avoid max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{locationName}</h2>
        <p className="text-sm text-muted-foreground">Location QR Code</p>
      </div>
      
      <div className="p-6 bg-white rounded-lg">
        <QRCodeSVG value={url} size={256} level="H" includeMargin />
      </div>
      
      <div className="text-center space-y-1">
        <p className="font-medium">Scan to view inventory</p>
        <p className="text-xs text-muted-foreground break-all px-4">
          {url}
        </p>
      </div>
    </div>
  );
};