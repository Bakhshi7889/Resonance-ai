
import { ImageGenerationParams } from '../types';

const BASE_URL = 'https://gen.pollinations.ai/image';
const USAGE_URL = 'https://enter.pollinations.ai/api/usage';
export const DEFAULT_KEY = 'pk_BnmABucSE1VNCWRT';
const DAILY_LIMIT = 3.0;
const IMAGE_COST = 0.0002;

export const getEffectiveKey = (customKey?: string) => {
    return (customKey && customKey.trim().length > 0) ? customKey : DEFAULT_KEY;
};

export const generateImageUrl = (params: ImageGenerationParams): string => {
  const { 
    prompt, model, width, height, seed, enhance, nologo, 
    negativePrompt, apiKey, safe, private: privateMode, transparent 
  } = params;
  
  const encodedPrompt = encodeURIComponent(prompt);
  const key = getEffectiveKey(apiKey);
  
  const queryObj: any = {
    model,
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    nologo: nologo.toString(),
    private: privateMode.toString(),
    key: key,
  };

  // Only append if true
  if (enhance) queryObj.enhance = 'true';
  if (safe) queryObj.safe = 'true';
  if (transparent) queryObj.transparent = 'true';

  if (negativePrompt) {
    queryObj.negative_prompt = negativePrompt;
  }

  const queryParams = new URLSearchParams(queryObj);

  return `${BASE_URL}/${encodedPrompt}?${queryParams.toString()}`;
};

export const getRandomSeed = () => Math.floor(Math.random() * 1000000);

// Usage Calculation Logic
export const getUsageStats = async (customKey?: string) => {
    const apiKey = getEffectiveKey(customKey);
    const logs: string[] = [];
    
    logs.push(`[Init] Key prefix: ${apiKey.substring(0, 5)}...`);

    // Default fallback state (Optimistic Free Tier)
    const fallbackStats = {
        remaining: DAILY_LIMIT,
        spent: 0,
        imagesLeft: Math.floor(DAILY_LIMIT / IMAGE_COST),
        resetTime: new Date(),
        isDefaultKey: apiKey === DEFAULT_KEY,
        logs
    };

    try {
        logs.push(`[Fetch] GET ${USAGE_URL}`);
        const response = await fetch(USAGE_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        logs.push(`[Response] Status: ${response.status}`);

        if (!response.ok) {
            const errText = await response.text();
            logs.push(`[Error] ${errText.substring(0, 100)}`);
            // Even on error, we return fallback but attached logs so user can see
            return fallbackStats;
        }

        const usageData = await response.json();
        logs.push(`[Data] Received ${Array.isArray(usageData) ? `Array(${usageData.length})` : typeof usageData}`);
        
        // Calculate reset time (3:32 AM today or yesterday)
        const now = new Date();
        const resetTime = new Date(now);
        resetTime.setHours(3, 32, 0, 0);
        
        // If current time is before 3:32 AM, the reset happened yesterday
        if (now < resetTime) {
            resetTime.setDate(resetTime.getDate() - 1);
        }

        let spent = 0;
        
        if (Array.isArray(usageData)) {
            spent = usageData.reduce((acc: number, item: any) => {
                const itemDate = new Date(item.created || item.date || item.timestamp);
                // Check if the item is after the last reset
                if (itemDate > resetTime) {
                    return acc + (Number(item.cost) || 0);
                }
                return acc;
            }, 0);
        } else {
            logs.push(`[Warn] Expected array, got ${typeof usageData}`);
        }
        
        logs.push(`[Calc] Spent: ${spent.toFixed(4)}`);

        const remaining = Math.max(0, DAILY_LIMIT - spent);
        const imagesLeft = Math.floor(remaining / IMAGE_COST);

        return {
            remaining,
            spent,
            imagesLeft,
            resetTime,
            isDefaultKey: apiKey === DEFAULT_KEY,
            logs
        };

    } catch (error: any) {
        logs.push(`[Exception] ${error.message || error}`);
        return fallbackStats;
    }
};
