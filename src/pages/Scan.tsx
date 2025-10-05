import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await processImage(file);
  };

  const processImage = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user has available scans
      const { data: canScan, error: checkError } = await supabase.rpc(
        'can_user_scan',
        { p_user_id: user.id }
      );

      if (checkError) throw checkError;

      if (!canScan) {
        toast({
          title: "No scans remaining",
          description: "You've used all your scans for this period. Upgrade your plan or purchase a scan pack!",
          variant: "destructive",
        });
        setUploading(false);
        navigate('/dashboard');
        return;
      }

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);

      // Convert image to base64 for AI
      const base64 = await fileToBase64(file);

      // Call AI detection edge function
      const { data, error } = await supabase.functions.invoke('detect-items', {
        body: { image: base64 }
      });

      if (error) throw error;

      // Increment scan usage
      const { data: incremented, error: incrementError } = await supabase.rpc(
        'increment_scan_usage',
        { p_user_id: user.id }
      );

      if (incrementError || !incremented) {
        console.error('Failed to increment scan usage:', incrementError);
      }

      // Navigate to review with detection results
      navigate('/review', { 
        state: { 
          detections: data.detections || [],
          imageUrl: publicUrl 
        } 
      });

    } catch (error: any) {
      console.error('Error processing image:', error);
      toast({
        title: "Error processing image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Scan Items</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {imagePreview && (
          <div className="max-w-md mx-auto">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full rounded-xl shadow-lg"
            />
          </div>
        )}

        {uploading ? (
          <div className="text-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-semibold text-lg">Analyzing image...</p>
              <p className="text-sm text-muted-foreground">
                AI is detecting items in your photo
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6 px-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              size="lg"
              className="w-full h-40 flex-col gap-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all active:scale-95"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-16 w-16" />
              <span>Take Photo</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-28 flex-col gap-3 text-base shadow-lg hover:shadow-xl transition-all active:scale-95"
              onClick={() => {
                const input = fileInputRef.current;
                if (input) {
                  input.removeAttribute('capture');
                  input.click();
                }
              }}
            >
              <Upload className="h-10 w-10" />
              <span>Upload from Gallery</span>
            </Button>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
              <p className="font-medium mb-1">📱 Mobile Tip</p>
              <p>For best results, take photos in good lighting and include all items you want to catalog.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Scan;