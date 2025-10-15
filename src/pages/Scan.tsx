import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ArrowLeft, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cropImageFromBoundingBox } from "@/lib/imageCropping";

const SPORTS_FACTS = [
  "⚾ The 1952 Topps Mickey Mantle is one of the most valuable baseball cards ever!",
  "🏀 A Michael Jordan rookie card sold for $738,000 in 2021!",
  "🏈 The T206 Honus Wagner is nicknamed 'The Holy Grail' of baseball cards.",
  "⚾ Topps has been making baseball cards since 1951.",
  "🎯 Card condition can dramatically affect value - PSA 10 cards are worth way more!",
  "🏀 Ken Griffey Jr.'s 1989 Upper Deck is an iconic rookie card.",
  "⚾ The first baseball cards were printed in the 1860s!",
  "🔥 Rookie cards are typically the most valuable in a player's career.",
  "💎 Some cards have serial numbers making them ultra-rare!",
  "📈 Sports card collecting has been booming since 2020!",
];

const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [captureStep, setCaptureStep] = useState<'front' | 'back' | 'ready'>('front');

  // Rotate fun facts while analyzing
  useEffect(() => {
    if (!uploading) return;
    
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % SPORTS_FACTS.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [uploading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0]; // Take only the first file

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Generate preview
    const preview = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    if (captureStep === 'front') {
      // Store first image
      setImagePreviews([preview]);
      setSelectedFiles([file]);
      setCaptureStep('back');
    } else if (captureStep === 'back') {
      // Store second image
      setImagePreviews([...imagePreviews, preview]);
      setSelectedFiles([...selectedFiles, file]);
      setCaptureStep('ready');
    }
  };

  const handleStartScan = async () => {
    if (selectedFiles.length !== 2) {
      toast({
        title: "Two images required",
        description: "Please capture both front and back images",
        variant: "destructive",
      });
      return;
    }
    await processImages(selectedFiles);
  };

  const handleReset = () => {
    setImagePreviews([]);
    setSelectedFiles([]);
    setCaptureStep('front');
  };

  const handleDeletePhoto = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    
    setImagePreviews(newPreviews);
    setSelectedFiles(newFiles);
    
    // Update capture step based on remaining photos
    if (newPreviews.length === 0) {
      setCaptureStep('front');
    } else if (newPreviews.length === 1) {
      setCaptureStep('back');
    } else {
      setCaptureStep('ready');
    }
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

      // Crop individual cards from bulk scan if bounding boxes are available
      const croppedFrontUrls: string[] = [];
      const croppedBackUrls: string[] = [];
      const detections = data.detections || [];
      const isSportsCards = userSource === 'sports-cards';
      
      for (let i = 0; i < detections.length; i++) {
        const detection = detections[i];
        
        // Crop from front image (first uploaded image)
        if (detection.bbox && imageUrls[0]) {
          try {
            const croppedBlob = await cropImageFromBoundingBox(imageUrls[0], detection.bbox);
            const fileName = `${user.id}/${Date.now()}_${i}_front.jpg`;
            
            const { error: uploadError } = await supabase.storage
              .from("item-images")
              .upload(fileName, croppedBlob, {
                contentType: "image/jpeg",
                upsert: false,
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from("item-images")
                .getPublicUrl(fileName);
              croppedFrontUrls.push(publicUrl);
            } else {
              croppedFrontUrls.push(imageUrls[0]); // Fallback
            }
          } catch (cropError) {
            console.error("Failed to crop front image:", cropError);
            croppedFrontUrls.push(imageUrls[0]);
          }
        } else {
          croppedFrontUrls.push(imageUrls[0]);
        }

        // Crop from back image (second uploaded image) for sports cards
        if (isSportsCards && detection.bbox && imageUrls[1]) {
          try {
            const croppedBlob = await cropImageFromBoundingBox(imageUrls[1], detection.bbox);
            const fileName = `${user.id}/${Date.now()}_${i}_back.jpg`;
            
            const { error: uploadError } = await supabase.storage
              .from("item-images")
              .upload(fileName, croppedBlob, {
                contentType: "image/jpeg",
                upsert: false,
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from("item-images")
                .getPublicUrl(fileName);
              croppedBackUrls.push(publicUrl);
            } else {
              croppedBackUrls.push(imageUrls[1]); // Fallback
            }
          } catch (cropError) {
            console.error("Failed to crop back image:", cropError);
            croppedBackUrls.push(imageUrls[1]);
          }
        } else if (isSportsCards && imageUrls[1]) {
          croppedBackUrls.push(imageUrls[1]);
        }
      }

      // Navigate to review with both original full scan and cropped images
      navigate('/review', { 
        state: { 
          detections: detections,
          originalImageUrls: imageUrls, // Full scan images for display
          croppedFrontUrls: croppedFrontUrls, // Individual card fronts
          croppedBackUrls: croppedBackUrls, // Individual card backs
          imageUrl: imageUrls[0] // Backwards compatibility
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
            <div className="text-center space-y-6 py-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 animate-ping" />
                </div>
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary drop-shadow-lg" />
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-pulse">
                  Analyzing Your Cards...
                </p>
                <p className="text-sm text-muted-foreground">
                  🔍 AI is detecting cards and extracting details
                </p>
              </div>

              {/* Rotating Fun Facts */}
              <div className="max-w-md mx-auto mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-2">DID YOU KNOW?</p>
                <p 
                  key={currentFactIndex}
                  className="text-sm text-foreground font-medium animate-fade-in"
                >
                  {SPORTS_FACTS[currentFactIndex]}
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
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Step indicator */}
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 text-center space-y-3">
              <p className="font-semibold text-primary mb-1">📸 Bulk Card Scanning</p>
              
              {/* Progress steps */}
              <div className="flex items-center justify-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  captureStep === 'front' ? 'bg-primary text-primary-foreground' : 
                  'bg-primary/30 text-primary'
                }`}>
                  {captureStep === 'front' ? '1' : '✓'}
                </div>
                <div className={`h-1 w-12 ${captureStep === 'front' ? 'bg-muted' : 'bg-primary'}`} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  captureStep === 'back' ? 'bg-primary text-primary-foreground' : 
                  captureStep === 'ready' ? 'bg-primary/30 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {captureStep === 'ready' ? '✓' : '2'}
                </div>
              </div>

              {captureStep === 'front' && (
                <>
                  <p className="text-sm text-muted-foreground">
                    <strong>Step 1:</strong> Capture all card <strong>fronts</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 Arrange cards in a grid and keep them in order
                  </p>
                </>
              )}
              
              {captureStep === 'back' && (
                <>
                  <p className="text-sm text-muted-foreground">
                    <strong>Step 2:</strong> Capture all card <strong>backs</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 Use the same order as the fronts for accurate matching
                  </p>
                </>
              )}

              {captureStep === 'ready' && (
                <>
                  <p className="text-sm text-muted-foreground">
                    ✅ Both photos captured! Ready to scan.
                  </p>
                </>
              )}
            </div>

            {/* Show previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-xs text-center text-muted-foreground font-medium">
                      {idx === 0 ? '✓ Front' : '✓ Back'}
                    </p>
                    <div className="relative">
                      <img 
                        src={preview} 
                        alt={idx === 0 ? 'Front' : 'Back'}
                        className="w-full aspect-[3/4] object-cover rounded-lg border-2 border-primary/20"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                        onClick={() => handleDeletePhoto(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {captureStep === 'ready' ? (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-28 flex-col gap-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all active:scale-95"
                  onClick={handleStartScan}
                >
                  <Camera className="h-12 w-12" />
                  <span>Scan Cards Now</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleReset}
                >
                  Start Over
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full h-40 flex-col gap-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all active:scale-95"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-16 w-16" />
                  <span>
                    {captureStep === 'front' ? 'Take Front Photo' : 'Take Back Photo'}
                  </span>
                  <span className="text-xs font-normal opacity-80">
                    {captureStep === 'front' ? '(All card fronts)' : '(All card backs)'}
                  </span>
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
                      // Re-add capture after click
                      setTimeout(() => input.setAttribute('capture', 'environment'), 100);
                    }
                  }}
                >
                  <Upload className="h-10 w-10" />
                  <span>Upload from Gallery</span>
                </Button>

                {imagePreviews.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={handleReset}
                  >
                    Start Over
                  </Button>
                )}
              </>
            )}

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