import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setOpen(false);
      }
    }
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // Don't show if can't install (not iOS and no install prompt)
  if (!isIOS && !deferredPrompt) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3"
        >
          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline text-xs sm:text-sm">Install App</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1">Install Cubby</h4>
            <p className="text-xs text-muted-foreground">
              Add to your home screen for quick access
            </p>
          </div>

          {isIOS ? (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>Tap the <Share className="h-3 w-3 inline" /> share button at the bottom of Safari</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>Scroll down and select "Add to Home Screen"</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>Tap "Add" in the top right corner</span>
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Install for quick access and offline support
              </p>
              {deferredPrompt && (
                <Button
                  onClick={handleInstall}
                  className="w-full"
                  size="sm"
                >
                  Install Now
                </Button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
