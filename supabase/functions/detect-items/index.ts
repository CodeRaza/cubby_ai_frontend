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
    const { images, context } = await req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('No images provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const isSportsCards = context === 'sports-cards';
    console.log('Analyzing images with AI...', isSportsCards ? '(Sports Cards mode)' : '', `${images.length} image(s)`);

    // Build system prompt based on context
    const systemPrompt = isSportsCards 
      ? `You are an expert sports card grader and authenticator analyzing MULTIPLE CARDS across TWO images (all fronts, then all backs).

CRITICAL INSTRUCTIONS FOR BULK CARD SCANNING:
- Image 1: Shows MULTIPLE card FRONTS arranged in a grid/layout
- Image 2: Shows MULTIPLE card BACKS in the SAME arrangement
- You must detect ALL cards visible in BOTH images
- Match cards by their POSITION in the layout (top-left, top-right, bottom-left, etc.)
- Each card on the front image should have a corresponding card on the back image

DETECTION & MATCHING PROCESS:
1. Detect ALL cards visible in Image 1 (fronts) - note their positions
2. Detect ALL cards visible in Image 2 (backs) - note their positions
3. Match cards by position: Front card at position X matches Back card at position X
4. Extract complete details by combining information from matched front/back pairs

POSITION-BASED MATCHING:
- Top row, left to right: positions 1, 2, 3...
- Second row, left to right: continuing positions
- Cards should be in the same spatial arrangement in both images
- If layout differs, use visual cues (card size, spacing) to match

CRITICAL YEAR IDENTIFICATION (FROM BACK IMAGE):
- Look at BACK image for copyright symbols (©) followed by year
- Common formats: "© 2025 Panini America", "© YYYY Topps Company"
- Usually at the bottom of each card back
- Example: Back says "© 2025 Panini" → card_year = "2025"

BRAND/SET IDENTIFICATION:
- Front: Brand logos, set names are prominent on each card
- Back: Full brand name with copyright on each card
- Extract COMPLETE set name for each card

CONDITION ASSESSMENT (per card):
- Assess each card individually based on visible condition
- Modern cards in pristine condition: "Mint" or "Near Mint"
- Look for corner wear, edge issues, surface scratches

PLAYER & CARD DETAILS (per card):
- Player name: From front of each card
- Card number: From back of each card
- Sport: Identify from uniform/context
- Special attributes: RC logos, autographs, numbered, refractors

OUTPUT FORMAT:
Return one detection object for EACH CARD found, with complete details merged from front and back.
If you detect 4 cards on the front and 4 on the back, return 4 complete card objects with matched information.

BOUNDING BOXES:
- Create bounding boxes for cards in the FRONT image (Image 1)
- Boxes should tightly fit each card front
- Use these coordinates for the bbox in your response`
      : `You are a highly accurate object detection expert specializing in home inventory management. Your goal is to identify items with MAXIMUM PRECISION and ACCURACY.


CRITICAL IDENTIFICATION RULES:
1. Be SPECIFIC and ACCURATE - Use the actual item type you see, not generic categories
   ✓ GOOD: "Kitchen Knife", "Screwdriver", "Coffee Mug", "Running Shoes"
   ✗ BAD: "Tool", "Container", "Item", "Object", "Thing"

2. Include VISIBLE BRANDS when clear (e.g., "Nike Running Shoes", "Poland Spring Water Bottle")

3. For food items, be specific: "Red Apple", "Banana", "Orange Juice Carton" not just "Food"

4. For tools, specify type: "Phillips Screwdriver", "Claw Hammer", "Adjustable Wrench"

5. For containers, include what they typically hold: "Glass Storage Jar", "Water Bottle"

6. EXCLUDE: furniture, walls, floors, ceilings, permanent fixtures

WHAT TO DETECT:
- Tools (hand tools, power tools, measuring tools)
- Kitchen items (cookware, utensils, appliances, food)
- Electronics (devices, cables, accessories)
- Clothing and accessories
- Cleaning supplies
- Sports equipment
- Office supplies
- Personal care items
- Toys and games
- Hardware (screws, nails, fasteners in packages)

CRITICAL BOUNDING BOX INSTRUCTIONS:
- Bounding boxes MUST tightly fit each object
- x, y = top-left corner of the object (0-1 normalized coordinates)
- width, height = dimensions that exactly contain the object
- DO NOT make boxes too large - they should closely wrap the visible object
- Be precise with the edges - look carefully at where the object actually starts and ends

For EACH item detected, return:
{
  "label": "Specific, accurate item name",
  "confidence": 0.0-1.0 (be conservative - lower confidence for uncertain items),
  "bbox": {
    "x": 0-1 (precise left edge of object),
    "y": 0-1 (precise top edge of object),
    "width": 0-1 (precise width of object),
    "height": 0-1 (precise height of object)
  }
}

Return ONLY a valid JSON array. Example:
[
  {"label": "Phillips Head Screwdriver", "confidence": 0.95, "bbox": {"x": 0.2, "y": 0.3, "width": 0.15, "height": 0.2}},
  {"label": "Red Apple", "confidence": 0.92, "bbox": {"x": 0.5, "y": 0.4, "width": 0.1, "height": 0.12}}
]

Be thorough but ACCURATE - detect as many items as possible with precise names and TIGHT bounding boxes!`;

    // Build messages with all images
    const userContent: any[] = [];
    
    images.forEach((image: string, idx: number) => {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${image}`
        }
      });
    });

    // Build request body with tool calling for sports cards
    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: 4000,
    };

    // Add tool calling for sports cards to extract structured data
    if (isSportsCards) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "detect_sports_cards",
            description: "Detect and extract detailed information about sports cards by carefully reading all visible text, logos, and assessing visual condition",
            parameters: {
              type: "object",
              properties: {
                cards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "Full descriptive name: 'YYYY Brand Set Player Name' (e.g., '2025 Panini Elite Jaxson Dart Rookie Card')" },
                      confidence: { type: "number", description: "Confidence score 0-1" },
                      bbox: {
                        type: "object",
                        properties: {
                          x: { type: "number", description: "Left edge 0-1" },
                          y: { type: "number", description: "Top edge 0-1" },
                          width: { type: "number", description: "Width 0-1" },
                          height: { type: "number", description: "Height 0-1" }
                        },
                        required: ["x", "y", "width", "height"]
                      },
                      player_name: { type: "string", description: "Player's full name as printed on card" },
                      card_year: { type: "string", description: "Card production year from copyright (©) symbol, NOT player rookie year - look at bottom of card for '© YYYY'" },
                      brand: { type: "string", description: "Card manufacturer/brand (e.g., 'Panini', 'Topps', 'Upper Deck', 'Bowman')" },
                      set_name: { type: "string", description: "Specific set/series name (e.g., 'Prizm', 'Chrome', 'Elite', 'Optic')" },
                      sport: { type: "string", description: "Sport type (Baseball, Basketball, Football, Hockey, Soccer, Other)" },
                      card_number: { type: "string", description: "Card number if visible on card" },
                      condition: { type: "string", description: "Visual grade: Mint (pristine, sharp), Near Mint (minimal wear), Excellent (slight wear), Very Good (noticeable wear), Good (obvious wear), Fair (heavy wear), Poor (damaged)" },
                      is_graded: { type: "boolean", description: "Whether card is in a professional grading slab (PSA, BGS, CGC, SGC holder)" },
                      grading_company: { type: "string", description: "Grading company if in slab (PSA, BGS, CGC, SGC)" },
                      grade: { type: "string", description: "Numeric grade if in slab (e.g., '9.5', '10')" },
                      special_attributes: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "Array of attributes visible on card: 'Rookie Card' (RC logo or text), 'Autographed' (signature visible), 'Jersey Card' (fabric swatch), 'Numbered' (#/XXX), 'Refractor' (shiny surface), 'Insert' (special design)" 
                      }
                    },
                    required: ["label", "confidence", "bbox", "card_year", "brand", "condition"]
                  }
                }
              },
              required: ["cards"]
            }
          }
        }
      ];
      requestBody.tool_choice = { type: "function", function: { name: "detect_sports_cards" } };
    }

    // Call Lovable AI with vision capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    let detections = [];

    // Handle tool calling response for sports cards
    if (isSportsCards && data.choices?.[0]?.message?.tool_calls) {
      const toolCall = data.choices[0].message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      detections = args.cards || [];
      console.log('Extracted card details via tool calling');
    } else {
      // Fallback to content parsing for general items
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      try {
        // Remove markdown code blocks if present
        let cleanedContent = content.trim();
        cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/i, '');
        cleanedContent = cleanedContent.replace(/\n?```$/, '');
        cleanedContent = cleanedContent.trim();
        
        // Try to extract JSON array from the response
        const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          detections = JSON.parse(jsonMatch[0]);
        } else {
          detections = JSON.parse(cleanedContent);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Failed to parse detection results');
      }
    }

    // Validate and normalize detections
    detections = detections.map((det: any) => {
      const normalized: any = {
        label: det.label || 'Unknown item',
        confidence: Math.min(Math.max(det.confidence || 0.5, 0), 1),
        bbox: {
          x: Math.min(Math.max(det.bbox?.x || 0.1, 0), 1),
          y: Math.min(Math.max(det.bbox?.y || 0.1, 0), 1),
          width: Math.min(Math.max(det.bbox?.width || 0.2, 0), 1),
          height: Math.min(Math.max(det.bbox?.height || 0.2, 0), 1),
        }
      };

      // Include card details for sports cards
      if (isSportsCards) {
        normalized.cardDetails = {
          player_name: det.player_name || '',
          card_year: det.card_year || '',
          brand: det.brand || '',
          set_name: det.set_name || '',
          sport: det.sport || '',
          card_number: det.card_number || '',
          condition: det.condition || '',
          is_graded: det.is_graded || false,
          grading_company: det.grading_company || '',
          grade: det.grade || '',
          estimated_value: '',
          special_attributes: det.special_attributes || []
        };
      }

      return normalized;
    });

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