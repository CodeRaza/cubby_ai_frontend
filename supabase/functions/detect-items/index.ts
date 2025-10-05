import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing image with AI...');

    // Call Lovable AI with vision capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at identifying objects in images for home inventory management. 
            
Analyze the image and identify ALL items that would be useful to catalog in a home inventory (tools, household items, products, food, etc.). Do not include furniture, walls, or structural elements.

For EACH item you detect, provide:
1. label: A detailed, specific name (include brand if visible, e.g., "DeWalt 20V Cordless Drill" not just "drill")
2. confidence: A score from 0 to 1 indicating how confident you are in the detection
3. bbox: An object with x, y, width, height (all values between 0 and 1, relative to image dimensions)
   - x: horizontal position from left edge (0 = left, 1 = right)
   - y: vertical position from top edge (0 = top, 1 = bottom)
   - width: width of bounding box (0 to 1)
   - height: height of bounding box (0 to 1)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "label": "DeWalt 20V Cordless Drill",
    "confidence": 0.98,
    "bbox": {"x": 0.2, "y": 0.3, "width": 0.15, "height": 0.2}
  }
]

Be thorough - detect as many items as possible!`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let detections = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        detections = JSON.parse(jsonMatch[0]);
      } else {
        detections = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse detection results');
    }

    // Validate and normalize detections
    detections = detections.map((det: any) => ({
      label: det.label || 'Unknown item',
      confidence: Math.min(Math.max(det.confidence || 0.5, 0), 1),
      bbox: {
        x: Math.min(Math.max(det.bbox?.x || 0.1, 0), 1),
        y: Math.min(Math.max(det.bbox?.y || 0.1, 0), 1),
        width: Math.min(Math.max(det.bbox?.width || 0.2, 0), 1),
        height: Math.min(Math.max(det.bbox?.height || 0.2, 0), 1),
      }
    }));

    console.log(`Detected ${detections.length} items`);

    return new Response(
      JSON.stringify({ detections }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in detect-items function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during detection',
        detections: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});