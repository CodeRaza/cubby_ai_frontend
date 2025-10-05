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
            content: `You are an expert at identifying objects in images for inventory management. 
            Analyze images and identify all distinct items visible. For each item, provide:
            1. A clear, specific name (e.g., "WD-40 Spray Can" not just "spray")
            2. A confidence score between 0 and 1
            
            Return ONLY a valid JSON array with this exact structure:
            [{"label": "Item Name", "confidence": 0.95}]
            
            Focus on:
            - Packaged goods with visible labels
            - Tools and equipment
            - Containers and boxes
            - Appliances and electronics
            
            Ignore:
            - Backgrounds, walls, shelves (unless they're the main subject)
            - Vague objects without clear identity
            
            Be specific and practical for inventory purposes.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify all items in this image that should be cataloged in an inventory system. Return only the JSON array.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let detections;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        detections = JSON.parse(jsonMatch[0]);
      } else {
        detections = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: return a generic detection
      detections = [{
        label: "Item",
        confidence: 0.5
      }];
    }

    console.log('Detected items:', detections);

    return new Response(
      JSON.stringify({ detections }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in detect-items function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        detections: [] 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});