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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check for sports cards context
    const userSource = sessionStorage.getItem('user_source') || '';
    const isSportsCards = userSource === 'sports-cards';

    // For sports cards, require exactly 2 images (front and back)
    if (isSportsCards && files.length !== 2) {
      toast({
        title: "Two images required",
        description: "Please select both front and back images of your cards",
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select image files only",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB each)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Each image must be smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
    }

    // Show previews
    const previews: string[] = [];
    for (const file of files) {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      previews.push(preview);
    }
    setImagePreviews(previews);
    setSelectedFiles(files);

    await processImages(files);
  };

  const processImages = async (files: File[]) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload all images to storage
      const imageUrls: string[] = [];
      const base64Images: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);

        // Convert to base64 for AI
        const base64 = await fileToBase64(file);
        base64Images.push(base64);
      }

      // Call AI detection edge function with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000)
      );

      // Get source from sessionStorage to pass to AI
      const userSource = sessionStorage.getItem('user_source') || '';
      
      const functionPromise = supabase.functions.invoke('detect-items', {
        body: { 
          images: base64Images, // Send array of images
          context: userSource
        }
      });

      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise
      ]) as any;

      if (error) throw error;

      if (!data || !data.detections) {
        throw new Error('No detections returned from AI');
      }

      const detectionCount = data.detections?.length || 0;
      
      // Check if user has available items remaining
      const { data: canAdd, error: checkError } = await supabase.rpc(
        'can_user_add_items',
        { 
          p_user_id: user.id,
          p_item_count: detectionCount
        }
      );

      if (checkError) throw checkError;

      if (!canAdd) {
        toast({
          title: "Item limit reached",
          description: `You need ${detectionCount} items but don't have enough remaining. Upgrade your plan!`,
          variant: "destructive",
        });
        setUploading(false);
        navigate('/subscription');
        return;
      }

      // Navigate to review with detection results (use first image URL for display)
      navigate('/review', { 
        state: { 
          detections: data.detections || [],
          imageUrl: imageUrls[0] // Primary image for display
        } 
      });

    } catch (error: any) {
      toast({
        title: "Error processing images",
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
        {uploading ? (
          <div className="space-y-6">
            <div className="text-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-semibold text-lg">Analyzing images...</p>
                <p className="text-sm text-muted-foreground">
                  AI is detecting items and extracting details
                </p>
              </div>
            </div>
            {imagePreviews.length > 0 && (
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-sm text-center text-muted-foreground font-medium">
                      {idx === 0 ? 'Front' : 'Back'}
                    </p>
                    <img 
                      src={preview} 
                      alt={`Preview ${idx + 1}`}
                      className="w-full max-h-64 object-contain rounded-xl shadow-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6 px-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 text-center space-y-2">
              <p className="font-semibold text-primary mb-1">📸 Bulk Card Scanning</p>
              <p className="text-sm text-muted-foreground">
                Upload <strong>2 photos</strong>:
              </p>
              <ol className="text-sm text-left space-y-1 max-w-sm mx-auto">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>All card <strong>fronts</strong> arranged in order</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>All card <strong>backs</strong> in the same order</span>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground pt-1">
                💡 Keep cards in the same position/order for accurate matching
              </p>
            </div>
            
            <Button
              size="lg"
              className="w-full h-40 flex-col gap-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all active:scale-95"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-16 w-16" />
              <span>Take 2 Photos</span>
              <span className="text-xs font-normal opacity-80">(All Fronts, Then All Backs)</span>
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

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center space-y-2">
              <p className="font-medium mb-1">📱 Best Practices</p>
              <ul className="text-left space-y-1 max-w-sm mx-auto">
                <li>• Arrange cards in a grid (2x2, 3x3, etc.)</li>
                <li>• Use good lighting, avoid glare on reflective surfaces</li>
                <li>• Keep the same arrangement for front and back photos</li>
                <li>• The back photo contains the copyright year needed for accuracy</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Scan;