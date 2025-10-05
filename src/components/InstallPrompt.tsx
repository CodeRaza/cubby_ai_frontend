import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Share } from "lucide-react";

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const hasSeenPrompt = localStorage.getItem('cubby-install-prompt-dismissed');
    
    if (!isInStandaloneMode && !hasSeenPrompt) {
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

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
        setShowPrompt(false);
        localStorage.setItem('cubby-install-prompt-dismissed', 'true');
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('cubby-install-prompt-dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in-up md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Install Cubby</h3>
              <p className="text-xs text-muted-foreground">Quick access from your home screen</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isIOS ? (
          <div className="space-y-2 text-xs text-muted-foreground mb-3">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-foreground">1.</span>
              Tap the <Share className="h-3 w-3 inline" /> share button below
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-foreground">2.</span>
              Select "Add to Home Screen"
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">
            Install Cubby for quick access and a better experience
          </p>
        )}

        {!isIOS && deferredPrompt && (
          <Button
            onClick={handleInstall}
            className="w-full bg-gradient-primary hover:opacity-90"
            size="sm"
          >
            Install Now
          </Button>
        )}
      </Card>
    </div>
  );
};
