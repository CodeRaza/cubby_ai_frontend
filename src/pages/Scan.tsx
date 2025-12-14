import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ArrowLeft, Loader2, X } from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { cropImageFromBoundingBox } from "@/lib/imageCropping";
import { useAuth } from "@/lib/auth";

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

type ScanMode = 'single' | 'bulk';

const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [captureStep, setCaptureStep] = useState<'front' | 'back' | 'ready'>('front');
  const [scanMode, setScanMode] = useState<ScanMode>('single');

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

    // For bulk mode, accept multiple files
    if (scanMode === 'bulk') {
      const validFiles: File[] = [];
      const validPreviews: string[] = [];
      const errors: string[] = [];

      // Validate all files
      files.forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Not an image file`);
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: File too large (max 10MB)`);
          return;
        }
        validFiles.push(file);
        validPreviews.push(URL.createObjectURL(file));
      });

      // Show errors if any
      if (errors.length > 0) {
        toast({
          title: "Some files were skipped",
          description: errors.join('; '),
          variant: "destructive",
        });
      }

      // Add valid files to existing selection
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setImagePreviews(prev => [...prev, ...validPreviews]);
        setCaptureStep('ready');
      }

      // Reset input to allow selecting more files
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Single mode: accept one file at a time
    const file = files[0];

    // Quick validation (don't block UI)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file only",
        variant: "destructive",
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 10MB",
        variant: "destructive",
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Use URL.createObjectURL for faster preview (doesn't block)
    const previewUrl = URL.createObjectURL(file);

    // Process in next tick to avoid blocking
    requestAnimationFrame(() => {
    if (captureStep === 'front') {
      // Store first image
        setImagePreviews([previewUrl]);
      setSelectedFiles([file]);
      setCaptureStep('back');
    } else if (captureStep === 'back') {
      // Store second image
        setImagePreviews(prev => [...prev, previewUrl]);
        setSelectedFiles(prev => [...prev, file]);
      setCaptureStep('ready');
    }
    });
  };

  const handleStartScan = async () => {
    if (scanMode === 'single') {
    if (selectedFiles.length !== 2) {
      toast({
        title: "Two images required",
        description: "Please capture both front and back images",
        variant: "destructive",
      });
      return;
    }
    await processImages(selectedFiles);
    } else {
      // Bulk mode: process all images and auto-save
      if (selectedFiles.length === 0) {
        toast({
          title: "No images selected",
          description: "Please select at least one image",
          variant: "destructive",
        });
        return;
      }
      await processBulkImages(selectedFiles);
    }
  };

  const handleReset = () => {
    // Clean up object URLs to free memory
    imagePreviews.forEach(preview => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    
    setImagePreviews([]);
    setSelectedFiles([]);
    setCaptureStep(scanMode === 'bulk' ? 'ready' : 'front');
    
    // Reset file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (index: number) => {
    // Revoke object URL to free memory
    const urlToRevoke = imagePreviews[index];
    if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRevoke);
    }
    
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    
    setImagePreviews(newPreviews);
    setSelectedFiles(newFiles);
    
    // Reset file input to allow re-uploading
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Update capture step based on remaining photos
    if (scanMode === 'bulk') {
      // In bulk mode, stay in ready state if any images remain
      if (newPreviews.length === 0) {
        setCaptureStep('ready'); // Reset to ready state (will show select button)
      }
    } else {
      // Single mode logic
    if (newPreviews.length === 0) {
      setCaptureStep('front');
    } else if (newPreviews.length === 1) {
      setCaptureStep('back');
    } else {
      setCaptureStep('ready');
      }
    }
  };

  // Process bulk images and auto-save cards
  const processBulkImages = async (files: File[]) => {
    setUploading(true);
    try {
      if (!user) {
        throw new Error("Not authenticated. Please log in.");
      }

      const userSource = sessionStorage.getItem('user_source') || '';
      const savedCards: any[] = [];
      const errors: string[] = [];

      // Get default collection
      const collectionsResponse = await api.get("/api/cards/collections/");
      const collections = Array.isArray(collectionsResponse.data) 
        ? collectionsResponse.data 
        : (collectionsResponse.data.results || []);
      const defaultCollection = collections.length > 0 ? collections[0].id : null;

      if (!defaultCollection) {
        toast({
          title: "Collection required",
          description: "Please create a collection first",
          variant: "destructive",
        });
        setUploading(false);
        navigate('/dashboard');
        return;
      }

      // Process each image separately (one at a time)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`Processing image ${i + 1}/${files.length}: ${file.name}`);
          
          // Upload single image - backend accepts single image per request
          const formData = new FormData();
          formData.append('images', file);  // Backend uses getlist('images'), so this works
          if (userSource) {
            formData.append('context', userSource);
          }

          // Pre-check subscription usage before detection for this image
          try {
            const subResp = await api.get('/api/auth/subscription/');
            const scansUsed = subResp.data.scans_used || 0;
            const scansLimit = subResp.data.scans_limit || 10;
            const bonus = subResp.data.bonus_credits || 0;
            const remaining = Math.max(0, scansLimit + bonus - scansUsed);

            if (remaining <= 0) {
              toast({
                title: 'Item limit reached',
                description: 'You have no remaining free scans. Upgrade to add more items.',
                variant: 'destructive',
              });
              setUploading(false);
              navigate('/subscription');
              return;
            }
          } catch (err) {
            console.warn('Subscription check failed, continuing to detection', err);
          }

          let response;
          try {
            response = await api.post('/api/cards/scans/detect/', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              timeout: 90000, // 90 seconds per image (Gemini can take time)
            });
          } catch (uploadError: any) {
            // Handle server-side paywall response
            if (uploadError?.response?.status === 402 || uploadError?.response?.data?.detail?.toLowerCase?.()?.includes('limit')) {
              toast({
                title: 'Item limit reached',
                description: uploadError?.response?.data?.detail || 'Your plan limit prevents detection. Upgrade to add more items.',
                variant: 'destructive',
              });
              setUploading(false);
              navigate('/subscription');
              return;
            }
            console.error(`Error uploading image ${i + 1}:`, uploadError);
            errors.push(`Card ${i + 1}: Upload failed - ${uploadError?.message || 'Unknown error'}`);
            continue; // Continue to next file
          }

          // Process job results
          if (response.data.job_ids && response.data.job_ids.length > 0) {
            const jobIds = response.data.job_ids;
            const results = await pollScanJobs(jobIds);

            // Process each job result
            for (const jobResult of results) {
              if (jobResult.status === 'done' && jobResult.result) {
                // Check if this is a duplicate by cert_number
                // Only treat as duplicate if cert_number is present and valid
                if (jobResult.result.duplicate === true) {
                  const certNum = jobResult.result.cert_number;
                  // Only show duplicate error if cert_number is actually present and valid
                  if (certNum && certNum.trim() && certNum.trim().length >= 4) {
                    toast({
                      title: "Card already exists",
                      description: jobResult.result.message || `A card with certification number ${certNum} already exists in your collection`,
                      variant: "default",
                    });
                    errors.push(`Card ${i + 1}: Already exists (Cert #${certNum})`);
                    continue; // Skip saving this card, continue to next job result
                  } else {
                    // Invalid or missing cert_number, don't treat as duplicate
                    // Continue processing this card normally
                    console.log(`Card ${i + 1}: Duplicate flag set but cert_number invalid/missing: ${certNum}, processing anyway`);
                  }
                }
                
                const cardData = jobResult.result.card_data || {};
                const dbCard = jobResult.result.database_card || {};

                // Upload image
                try {
                  const imageFormData = new FormData();
                  imageFormData.append('image', file);
                  const imageResponse = await api.post('/api/cards/images/upload/', imageFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  const imageUrl = imageResponse.data.image_url;

                  // Prepare card data
                  const estimatedValue = cardData.market_price || cardData.estimated_value || 0;
                  const cardPayload: any = {
                    name: cardData.player_name || dbCard.name || `Card ${i + 1}`,
                    player: cardData.player_name || '',
                    year: cardData.card_year || null,
                    value: estimatedValue,
                    grading: cardData.is_graded && cardData.grade
                      ? `${cardData.grading_company || 'PSA'} ${cardData.grade}`
                      : null,
                    collection: defaultCollection,
                    image_url: imageUrl,
                    cost: 0,
                    acquired_date: null,
                    special_attributes: cardData.special_attributes || [],
                    is_graded: cardData.is_graded || false,
                    card_details_data: {
                      player_name: cardData.player_name || '',
                      card_year: cardData.card_year || null,
                      brand: cardData.brand || '',
                      set_name: cardData.set_name || '',
                      sport: cardData.sport || '',
                      card_number: cardData.card_number || '',
                      parallel_name: cardData.parallel_name || '',
                      condition: cardData.condition || '',
                      is_graded: cardData.is_graded || false,
                      grading_company: cardData.grading_company || '',
                      grade: cardData.grade ? String(cardData.grade) : '',
                      cert_number: cardData.cert_number || '',
                      estimated_value: parseFloat(String(estimatedValue)) || 0,
                      price_source: cardData.price_source || '',
                      special_attributes: cardData.special_attributes || [],
                    }
                  };

                  // Save card (check for duplicate cert_number)
                  try {
                    const cardResponse = await api.post('/api/cards/cards/', cardPayload);
                    savedCards.push(cardResponse.data);
                  } catch (saveError: any) {
                    if (saveError?.response?.status === 409 && saveError?.response?.data?.duplicate) {
                      // Duplicate cert_number
                      const certNum = saveError.response.data.cert_number || 'this certification number';
                      toast({
                        title: "Card already exists",
                        description: saveError.response.data.detail || `A card with certification number ${certNum} already exists in your collection`,
                        variant: "default",
                      });
                      errors.push(`Card ${i + 1}: Already exists (Cert #${certNum})`);
                      // Continue to next job result, don't break the loop
                    } else {
                      // Re-throw non-duplicate errors
                      throw saveError;
                    }
                  }
                } catch (imageError: any) {
                  console.error(`Error uploading image for card ${i + 1}:`, imageError);
                  errors.push(`Card ${i + 1}: Image upload failed - ${imageError?.message || 'Unknown error'}`);
                  // Continue to next job result, don't break the loop
                }
              } else if (jobResult.status === 'failed') {
                errors.push(`Card ${i + 1}: ${jobResult.result?.error || 'Processing failed'}`);
                // Continue to next job result
              }
            }
          } else {
            // No job IDs returned
            errors.push(`Card ${i + 1}: No job IDs returned from scan`);
          }
        } catch (error: any) {
          console.error(`Error processing image ${i + 1}:`, error);
          errors.push(`Card ${i + 1}: ${error?.message || 'Unknown error'}`);
          // Continue to next file - don't break the loop
        }
      }

      // Show results
      if (savedCards.length > 0) {
        // Invalidate dashboard and subscription queries for real-time update
        queryClient.invalidateQueries({ queryKey: ['dashboard-locations'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-card-stats'] });
        queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
        
        toast({
          title: "Cards saved successfully",
          description: `Saved ${savedCards.length} card(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "No cards saved",
          description: errors.join('; ') || "Failed to process images",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error processing bulk images:', error);
      toast({
        title: "Error processing images",
        description: error?.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const processImages = async (files: File[]) => {
    setUploading(true);
    try {
      if (!user) {
        throw new Error("Not authenticated. Please log in.");
      }

      // Get source from sessionStorage
      const userSource = sessionStorage.getItem('user_source') || '';

      // For single card mode: only process the FIRST image (front) for detection
      // The second image (back) will be attached to the card later
      const frontImage = files[0];
      const backImage = files.length > 1 ? files[1] : null;

      // Before calling detection, check subscription usage server-side
      try {
        const subResp = await api.get('/api/auth/subscription/');
        const scansUsed = subResp.data.scans_used || 0;
        const scansLimit = subResp.data.scans_limit || 10;
        const bonus = subResp.data.bonus_credits || 0;
        const remaining = Math.max(0, scansLimit + bonus - scansUsed);

        if (remaining <= 0) {
          toast({
            title: 'Item limit reached',
            description: 'You have no remaining free scans. Upgrade to add more items.',
            variant: 'destructive',
          });
          setUploading(false);
          navigate('/subscription');
          return;
        }
      } catch (err) {
        // If subscription check fails, continue — detection endpoint has its own safeguards
        console.warn('Subscription check failed, continuing to detection', err);
      }

      // Create FormData for file upload - only send front image for detection
      const formData = new FormData();
      formData.append('images', frontImage); // Only front image for card detection
      if (userSource) {
        formData.append('context', userSource);
      }

      // Upload front image to Django backend for detection
      let response;
      try {
        response = await api.post('/api/cards/scans/detect/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout
        });
      } catch (err: any) {
        // Handle server-side paywall response (402) returned when detection is blocked
        if (err?.response?.status === 402 || err?.response?.data?.detail?.toLowerCase()?.includes('limit')) {
          toast({
            title: 'Item limit reached',
            description: err?.response?.data?.detail || 'Your plan limit prevents detection. Upgrade to add more items.',
            variant: 'destructive',
          });
          setUploading(false);
          navigate('/subscription');
          return;
        }
        throw err;
      }

      // If we get detections directly, use them
      if (response.data.detections && response.data.detections.length > 0) {
        const detections = response.data.detections;
        const detectionCount = detections.length;
        
        // Check if user has available items remaining
        const limitResponse = await api.post('/api/cards/scans/check-limit/', {
          item_count: detectionCount
        });

        if (!limitResponse.data.can_add) {
        toast({
          title: "Item limit reached",
          description: `You need ${detectionCount} items but don't have enough remaining. Upgrade your plan!`,
          variant: "destructive",
        });
        setUploading(false);
        navigate('/subscription');
        return;
      }

        // Create blob URLs for preview (already have them from selectedFiles)
        const imageUrls = imagePreviews; // Use the blob URLs we already created

      // Crop individual cards from bulk scan if bounding boxes are available
      const croppedFrontUrls: string[] = [];
      const croppedBackUrls: string[] = [];
      const isSportsCards = userSource === 'sports-cards';
      
      for (let i = 0; i < detections.length; i++) {
        const detection = detections[i];
        
        // Crop from front image (first uploaded image)
        if (detection.bbox && imageUrls[0]) {
          try {
            const croppedBlob = await cropImageFromBoundingBox(imageUrls[0], detection.bbox);
              // Upload cropped image to backend
              const cropFormData = new FormData();
              cropFormData.append('image', croppedBlob, `cropped_${i}_front.jpg`);
              
              // For now, use blob URL directly (backend can handle uploads later)
              const cropUrl = URL.createObjectURL(croppedBlob);
              croppedFrontUrls.push(cropUrl);
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
              const cropUrl = URL.createObjectURL(croppedBlob);
              croppedBackUrls.push(cropUrl);
          } catch (cropError) {
            console.error("Failed to crop back image:", cropError);
            croppedBackUrls.push(imageUrls[1]);
          }
        } else if (isSportsCards && imageUrls[1]) {
          croppedBackUrls.push(imageUrls[1]);
        }
      }

        // Navigate to review with detections
        // For single card mode, include back image if available
      navigate('/review', { 
        state: { 
          detections: detections,
            originalImageUrls: imageUrls,
            croppedFrontUrls: croppedFrontUrls,
            croppedBackUrls: croppedBackUrls,
            imageUrl: imageUrls[0],
            backImageUrl: backImage ? imageUrls[1] : null, // Pass back image URL for single card
            backImageFile: backImage || null // Pass back image file for upload
          } 
        });
        return;
      }

      // If we get job_ids, poll for results
      if (response.data.job_ids && response.data.job_ids.length > 0) {
        // Poll for scan job completion
        const jobIds = response.data.job_ids;
        const results = await pollScanJobs(jobIds);
        
        // Convert scan job results into detections format
        const allDetections: any[] = [];
        const failedJobs: any[] = [];
        
        results.forEach((jobResult: any) => {
          // Check if job failed
          if (jobResult.status === 'failed') {
            failedJobs.push(jobResult);
            console.warn(`Scan job ${jobResult.id} failed: ${jobResult.result?.error || 'Unknown error'}`);
            return;
          }
          
          if (jobResult.status === 'done' && jobResult.result) {
            // If detections already exist (from AI detection), use them
            if (jobResult.result.detections && Array.isArray(jobResult.result.detections)) {
              allDetections.push(...jobResult.result.detections);
            } 
            // Otherwise, convert card_data into detection format
            else if (jobResult.result.card_data || jobResult.result.database_card || jobResult.result.best_item) {
              const cardData = jobResult.result.card_data || {};
              const dbCard = jobResult.result.database_card || {};
              const bestItem = jobResult.result.best_item || {};
              
              // Build card name/label from available data
              const labelParts = [];
              if (cardData.player_name) labelParts.push(cardData.player_name);
              if (cardData.card_year) labelParts.push(String(cardData.card_year));
              if (cardData.card_set) labelParts.push(cardData.card_set);
              if (cardData.grade && cardData.is_graded) {
                labelParts.push(`${cardData.grading_company || 'PSA'} ${cardData.grade}`);
              }
              
              const label = labelParts.length > 0 
                ? labelParts.join(' ') 
                : (bestItem.title || dbCard.card_details?.player_name || 'Card');
              
              // Create detection from card data
              const detection: any = {
                label: label,
                confidence: 1.0, // Since we successfully extracted it
                cardData: cardData,
                cardDetails: {
                  player_name: cardData.player_name || dbCard.card_details?.player_name || '',
                  card_year: String(cardData.card_year || dbCard.card_details?.card_year || ''),
                  brand: cardData.brand || dbCard.card_details?.brand || '',
                  set_name: cardData.set_name || cardData.card_set || dbCard.card_details?.set_name || '',
                  sport: cardData.sport || dbCard.card_details?.sport || '',
                  card_number: cardData.card_number || dbCard.card_details?.card_number || '',
                  parallel_name: cardData.parallel_name || dbCard.card_details?.parallel_name || '',
                  condition: cardData.condition || dbCard.card_details?.condition || '',
                  is_graded: cardData.is_graded || dbCard.card_details?.is_graded || false,
                  grading_company: cardData.grading_company || dbCard.card_details?.grading_company || '',
                  grade: cardData.grade ? String(cardData.grade) : (dbCard.card_details?.grade ? String(dbCard.card_details.grade) : ''),
                  cert_number: cardData.cert_number || dbCard.card_details?.cert_number || '',
                  estimated_value: cardData.market_price ? String(cardData.market_price) : (cardData.estimated_value ? String(cardData.estimated_value) : (dbCard.card_details?.estimated_value ? String(dbCard.card_details.estimated_value) : (dbCard.value ? String(dbCard.value) : (bestItem.price?.value ? String(bestItem.price.value) : '')))),
                  price_source: cardData.price_source || dbCard.card_details?.price_source || '',
                  special_attributes: cardData.special_attributes || [],
                },
                source: jobResult.result.source || 'unknown',
                bestItem: bestItem,
                databaseCard: dbCard,
              };
              
              allDetections.push(detection);
            }
          }
        });

        if (allDetections.length === 0) {
          if (failedJobs.length > 0) {
            const errorMsg = failedJobs[0].result?.error || 'Unknown error occurred';
            // Don't mention eBay errors - they're non-fatal, user can still save card data
            if ('ebay' in errorMsg.toLowerCase() || 'retryerror' in errorMsg.toLowerCase() || 'ebay search failed' in errorMsg.toLowerCase()) {
              throw new Error('Card detected but pricing unavailable. You can still save the card with extracted information.');
            }
            throw new Error(`Card scanning failed: ${errorMsg}. Please try again with a clearer image.`);
          }
          throw new Error('No cards detected in images. Please ensure the image contains a clear card with visible text or QR code.');
        }

        // Check limit
        const limitResponse = await api.post('/api/cards/scans/check-limit/', {
          item_count: allDetections.length
        });

        if (!limitResponse.data.can_add) {
          toast({
            title: "Item limit reached",
            description: `You need ${allDetections.length} items but don't have enough remaining. Upgrade your plan!`,
            variant: "destructive",
          });
          setUploading(false);
          navigate('/subscription');
          return;
        }

        // Navigate to review
        // For single card mode, include back image if available
        navigate('/review', { 
          state: { 
            detections: allDetections,
            originalImageUrls: imagePreviews,
            croppedFrontUrls: imagePreviews,
            croppedBackUrls: imagePreviews.length > 1 ? [imagePreviews[1]] : [],
            imageUrl: imagePreviews[0],
            backImageUrl: backImage ? imagePreviews[1] : null, // Pass back image URL for single card
            backImageFile: backImage || null // Pass back image file for upload
          } 
        });
      } else {
        throw new Error('No detections or job IDs returned from server');
      }

    } catch (error: any) {
      console.error('Error processing images:', error);
      toast({
        title: "Error processing images",
        description: error?.response?.data?.error || error?.response?.data?.detail || error?.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper function to poll scan jobs
  // Increased timeout: 120 attempts × 3 seconds = 6 minutes (with enhanced OCR, jobs can take longer)
  const pollScanJobs = async (jobIds: string[], maxAttempts = 120): Promise<any[]> => {
    const pollInterval = 3000; // 3 seconds (increased from 2s for less frequent polling)
    const startTime = Date.now();
    let attempts = 0;
    const maxTimeoutMs = 10 * 60 * 1000; // 10 minutes absolute max
    
    while (attempts < maxAttempts) {
      // Absolute timeout check (10 minutes)
      if (Date.now() - startTime > maxTimeoutMs) {
        // Get current status of all jobs before timing out
        try {
          const promises = jobIds.map(jobId => 
            api.get(`/api/cards/scans/${jobId}/`).catch(() => ({ data: { status: 'unknown', id: jobId } }))
          );
          const responses = await Promise.all(promises);
          const jobs = responses.map(r => r.data);
          
          // If any jobs are done, return partial results
          const doneJobs = jobs.filter((j: any) => j.status === 'done' || j.status === 'failed');
          if (doneJobs.length > 0) {
            console.warn(`Timeout reached, but ${doneJobs.length}/${jobs.length} jobs completed. Returning partial results.`);
            return jobs; // Return all jobs (done ones will be processed, pending ones will be skipped)
          }
        } catch (e) {
          console.error('Error getting final job status:', e);
        }
        
        throw new Error(`Scan jobs timed out after ${Math.round(maxTimeoutMs / 1000)} seconds. Some jobs may still be processing in the background.`);
      }
      
      try {
        const promises = jobIds.map(jobId => 
          api.get(`/api/cards/scans/${jobId}/`, {
            timeout: 10000 // 10 second timeout per request
          })
        );
        
        const responses = await Promise.all(promises);
        const jobs = responses.map(r => r.data);
        
        // Check if all jobs are done (including failed ones)
        const allDone = jobs.every((job: any) => 
          job.status === 'done' || job.status === 'failed'
        );
        
        if (allDone) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`✅ All scan jobs completed in ${elapsed}s`);
          return jobs;
        }
        
        // Log progress for long-running jobs (every 10 attempts = 30 seconds)
        if (attempts % 10 === 0 && attempts > 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const statusCounts: Record<string, number> = {};
          jobs.forEach((j: any) => {
            statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
          });
          const statusStr = Object.entries(statusCounts)
            .map(([status, count]) => `${status}: ${count}`)
            .join(', ');
          console.log(`⏳ Scanning in progress... (${elapsed}s elapsed, attempt ${attempts}/${maxAttempts}): ${statusStr}`);
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error: any) {
        console.error('Error polling scan jobs:', error);
        
        // If it's a timeout error, continue polling (network might be slow)
        if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          console.warn('Request timeout during polling, continuing...');
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    // Final check before throwing timeout
    try {
      const promises = jobIds.map(jobId => 
        api.get(`/api/cards/scans/${jobId}/`).catch(() => ({ data: { status: 'unknown', id: jobId } }))
      );
      const responses = await Promise.all(promises);
      const jobs = responses.map(r => r.data);
      
      // If any jobs completed, return them
      const doneJobs = jobs.filter((j: any) => j.status === 'done' || j.status === 'failed');
      if (doneJobs.length > 0) {
        console.warn(`Max attempts reached, but ${doneJobs.length}/${jobs.length} jobs completed.`);
        return jobs;
      }
    } catch (e) {
      console.error('Error in final check:', e);
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    throw new Error(`Scan jobs timed out after ${elapsed} seconds (max ${Math.round(maxAttempts * pollInterval / 1000)}s). Some jobs may still be processing - try refreshing later.`);
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
            {/* Mode Toggle */}
            <div className="bg-card border rounded-lg p-2 shadow-sm">
              <p className="text-xs text-muted-foreground mb-2 text-center">Scanning Mode</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setScanMode('single');
                    handleReset();
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
                    scanMode === 'single'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Single Card
                </button>
                <button
                  onClick={() => {
                    setScanMode('bulk');
                    handleReset();
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
                    scanMode === 'bulk'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Bulk Upload
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture={scanMode === 'single' ? "environment" : undefined}
              multiple={scanMode === 'bulk'}
              onChange={handleFileSelect}
              className="hidden"
              // Add loading state prevention
              onClick={(e) => {
                // Reset value to allow re-selecting same file
                (e.target as HTMLInputElement).value = '';
              }}
            />
            
            {/* Step indicator */}
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 text-center space-y-3">
              <p className="font-semibold text-primary mb-1">
                {scanMode === 'single' ? '📸 Single Card Scanning' : '📦 Bulk Card Upload'}
              </p>
              
              {scanMode === 'single' ? (
                <>
                  {/* Progress steps for single mode */}
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
                        <strong>Step 1:</strong> Capture card <strong>front</strong>
                  </p>
                </>
              )}
              
              {captureStep === 'back' && (
                <>
                  <p className="text-sm text-muted-foreground">
                        <strong>Step 2:</strong> Capture card <strong>back</strong>
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
                </>
              ) : (
                <>
                  {/* Bulk mode instructions */}
                  <p className="text-sm text-muted-foreground">
                    Upload multiple card images (front OR back only)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 Cards will be automatically saved without review
                  </p>
                  {selectedFiles.length > 0 && (
                    <p className="text-sm font-medium text-primary">
                      {selectedFiles.length} image(s) selected
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Show previews */}
            {imagePreviews.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {scanMode === 'bulk' 
                      ? `${selectedFiles.length} image(s) ready to scan`
                      : 'Uploaded images'
                    }
                  </p>
                  {scanMode === 'bulk' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                          fileInputRef.current?.click();
                        }, 0);
                      }}
                      type="button"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Add More
                    </Button>
                  )}
                </div>
                <div className={`grid gap-3 ${scanMode === 'single' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-xs text-center text-muted-foreground font-medium">
                        {scanMode === 'single' 
                          ? (idx === 0 ? '✓ Front' : '✓ Back')
                          : `Card ${idx + 1}`
                        }
                    </p>
                    <div className="relative">
                      <img 
                        src={preview} 
                          alt={scanMode === 'single' ? (idx === 0 ? 'Front' : 'Back') : `Card ${idx + 1}`}
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
              </div>
            )}
            
            {(captureStep === 'ready' || (scanMode === 'bulk' && selectedFiles.length > 0)) ? (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-28 flex-col gap-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all active:scale-95"
                  onClick={handleStartScan}
                >
                  <Camera className="h-12 w-12" />
                  <span>{scanMode === 'bulk' ? `Scan & Save ${selectedFiles.length} Card(s)` : 'Scan Cards Now'}</span>
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
                {scanMode === 'bulk' && selectedFiles.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedFiles.length} image(s) selected
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                          fileInputRef.current?.click();
                        }, 0);
                      }}
                      type="button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add More Images
                    </Button>
                  </div>
                )}
                
                <Button
                  size="lg"
                  className="w-full h-40 flex-col gap-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all active:scale-95"
                  onClick={(e) => {
                    e.preventDefault();
                    // Use setTimeout to prevent blocking
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 0);
                  }}
                  type="button"
                >
                  <Camera className="h-16 w-16" />
                  <span>
                    {scanMode === 'bulk' 
                      ? (selectedFiles.length === 0 ? 'Select Multiple Images' : `Add More Images (${selectedFiles.length} selected)`)
                      : (captureStep === 'front' ? 'Take Front Photo' : 'Take Back Photo')
                    }
                  </span>
                  {scanMode === 'single' && (
                  <span className="text-xs font-normal opacity-80">
                      {captureStep === 'front' ? '(Card front)' : '(Card back)'}
                  </span>
                  )}
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = fileInputRef.current;
                    if (input) {
                      // Use setTimeout to prevent blocking
                      setTimeout(() => {
                      input.removeAttribute('capture');
                      input.click();
                      // Re-add capture after click
                      setTimeout(() => input.setAttribute('capture', 'environment'), 100);
                      }, 0);
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
                {scanMode === 'single' ? (
                  <>
                    <li>• Capture both front and back photos clearly</li>
                <li>• Use good lighting, avoid glare on reflective surfaces</li>
                <li>• The back photo contains the copyright year needed for accuracy</li>
                    <li>• You'll review and edit details before saving</li>
                  </>
                ) : (
                  <>
                    <li>• Upload multiple card images (front OR back only)</li>
                    <li>• Use good lighting for clear images</li>
                    <li>• Cards will be automatically saved without review</li>
                    <li>• Each image will be processed separately</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Scan;