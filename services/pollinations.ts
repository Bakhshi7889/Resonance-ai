
import { ImageGenerationParams, AccountState } from '../types';

const BASE_URL = 'https://gen.pollinations.ai';
export const DEFAULT_KEY = 'pk_3GSNVfV62GUnxKBe';

// Updated cost per image based on new pricing (0.0002 pollen/image)
const ESTIMATED_IMAGE_COST = 0.0002; 

export const getEffectiveKey = (customKey?: string) => {
    return (customKey && customKey.trim().length > 0) ? customKey : DEFAULT_KEY;
};

export const generateImageUrl = (params: ImageGenerationParams & { guidance?: number }): string => {
  const { 
    prompt, model, width, height, seed, enhance, nologo, 
    negativePrompt, apiKey, safe, private: privateMode, transparent,
    quality, guidance
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

  // Only append if true/exists
  if (enhance) queryObj.enhance = 'true';
  if (safe) queryObj.safe = 'true';
  if (transparent) queryObj.transparent = 'true';
  if (quality) queryObj.quality = quality;
  
  if (guidance && guidance !== 7.5) { 
      queryObj.guidance_scale = guidance.toString();
  }

  if (negativePrompt) {
    queryObj.negative_prompt = negativePrompt;
  }

  const queryParams = new URLSearchParams(queryObj);

  return `${BASE_URL}/image/${encodedPrompt}?${queryParams.toString()}`;
};

export const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const getAccountDetails = async (customKey?: string): Promise<AccountState> => {
    const apiKey = getEffectiveKey(customKey);
    
    try {
        const headers = {
            'Authorization': `Bearer ${apiKey}`
        };

        // Fetch Profile
        const profileReq = fetch(`${BASE_URL}/account/profile`, { headers });
        // Fetch Balance
        const balanceReq = fetch(`${BASE_URL}/account/balance`, { headers });

        const [profileRes, balanceRes] = await Promise.all([profileReq, balanceReq]);

        if (!profileRes.ok || !balanceRes.ok) {
            throw new Error('Failed to fetch account data');
        }

        const profile = await profileRes.json();
        const balanceData = await balanceRes.json();

        return {
            profile: profile,
            balance: balanceData.balance,
            isLoading: false,
            error: null
        };

    } catch (error: any) {
        return {
            profile: null,
            balance: null,
            isLoading: false,
            error: error.message || 'Unknown error'
        };
    }
};

export const getEstimatedImagesLeft = (balance: number | null): string => {
    if (balance === null || balance === undefined) return '...';
    // If balance is huge (e.g., unlimited or effectively infinite for display purposes)
    if (balance > 100000000) return 'Unlimited';
    
    const count = Math.floor(balance / ESTIMATED_IMAGE_COST);
    
    // Format large numbers (e.g. 50k, 1.2M)
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(0)}k`;
    }
    
    return count.toString();
};
