import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SearchResult, AIInsight, BusinessData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility to strip Markdown code blocks from JSON strings.
 * Gemini sometimes wraps JSON in ```json ... ``` despite responseMimeType.
 */
const cleanJsonString = (str: string): string => {
  if (!str) return "[]";
  let cleaned = str.trim();
  // Remove markdown code blocks
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
  }
  return cleaned.trim();
};

/**
 * Uses Gemini 2.5 Flash with Maps Grounding to find businesses.
 */
export const searchBusinesses = async (query: string, locationName: string): Promise<SearchResult[]> => {
  try {
    // Step 1: Grounding Request
    const prompt = `Find at least 5 "${query}" in "${locationName}". List their names, exact addresses, ratings, and websites if available.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const groundedText = response.text;
    if (!groundedText) return [];

    // Step 2: Extraction & Formatting
    const formattingPrompt = `
        Based on the following search results:
        "${groundedText}"

        Extract a list of businesses into a valid JSON Array.
        Each item must match this structure exactly:
        [
          {
            "name": "Business Name",
            "address": "Full Address",
            "rating": 4.5,
            "userRatingCount": 100,
            "phone": "555-0123",
            "website": "https://example.com",
            "lat": 0.0,
            "lng": 0.0
          }
        ]

        Important: 
        1. If specific coordinates are missing, estimate them based on the address in ${locationName}.
        2. Ensure the output is strictly valid JSON.
    `;

    const jsonResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattingPrompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    const cleanText = cleanJsonString(jsonResponse.text || "[]");
    let parsed: any[] = [];
    
    try {
        parsed = JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error during Search:", e);
        return [];
    }
    
    // Validate and map
    if (!Array.isArray(parsed)) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return parsed.map((item: any, index: number) => ({
        id: `search-${Date.now()}-${index}`,
        business_data: {
            name: item.name || "Unknown Business",
            address: item.address || "Unknown Address",
            rating: typeof item.rating === 'number' ? item.rating : 0,
            userRatingCount: typeof item.userRatingCount === 'number' ? item.userRatingCount : 0,
            phone: item.phone || "",
            website: item.website || "",
        },
        location: {
            lat: item.lat || 0,
            lng: item.lng || 0
        }
    }));

  } catch (error) {
    console.error("Gemini Search Service Error:", error);
    return [];
  }
};

/**
 * Uses Gemini 2.5 Flash to analyze a specific prospect.
 */
export const analyzeProspect = async (business: BusinessData): Promise<AIInsight> => {
    // Default fallback in case of failure
    const defaultInsight: AIInsight = {
        score: 0,
        analysis_summary: "AI analysis unavailable at this moment.",
        suggested_offer: "Manual review recommended."
    };

    try {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER, description: "Suitability score (0-100)." },
                analysis_summary: { type: Type.STRING, description: "2 sentences max analysis." },
                suggested_offer: { type: Type.STRING, description: "1 sentence sales hook." }
            },
            required: ["score", "analysis_summary", "suggested_offer"]
        };

        const prompt = `
          Act as a B2B Sales Expert.
          Analyze this prospect for a Digital Marketing Agency.

          Data:
          Name: ${business.name}
          Rating: ${business.rating} (${business.userRatingCount} reviews)
          Website: ${business.website || "No website"}
          Address: ${business.address}

          Logic:
          - No website? High score (needs web design).
          - Low rating? High score (needs reputation mgmt).
          - High rating + good site? Low score (bad prospect).
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const cleanText = cleanJsonString(response.text || "{}");
        const result = JSON.parse(cleanText);
        
        return {
            score: typeof result.score === 'number' ? result.score : 0,
            analysis_summary: result.analysis_summary || "Analysis incomplete.",
            suggested_offer: result.suggested_offer || "Check business details manually."
        };

    } catch (error) {
        console.error("Gemini Analysis Service Error:", error);
        return defaultInsight;
    }
};