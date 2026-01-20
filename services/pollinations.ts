import { ImageGenerationParams, AccountState, UsageRecord } from '../types';

const BASE_URL = 'https://gen.pollinations.ai';
const ESTIMATED_IMAGE_COST = 0.0002; 

// The system core key used for out-of-the-box functionality
export const HIDDEN_DEFAULT_KEY = 'pk_3GSNVfV62GUnxKBe';

/**
 * Resolves the active API key with strict fallback.
 */
export const getEffectiveKey = (userKey?: string) => {
    const trimmed = userKey?.trim();
    if (trimmed && trimmed.length > 5) return trimmed;
    return HIDDEN_DEFAULT_KEY;
};

export const generateImageUrl = (params: ImageGenerationParams): string => {
  const { 
    prompt, model, width, height, seed, enhance, nologo, 
    negative_prompt, private: privateMode,
    quality, apiKey: userKey
  } = params;
  
  const encodedPrompt = encodeURIComponent(prompt);
  const key = getEffectiveKey(userKey);
  
  const queryObj: any = {
    model,
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    nologo: nologo.toString(),
    private: privateMode.toString(),
    key: key,
    safe: 'true'
  };

  if (enhance) queryObj.enhance = 'true';
  if (quality) queryObj.quality = quality;
  
  if (negative_prompt) {
    queryObj.negative_prompt = negative_prompt;
  }

  const queryParams = new URLSearchParams(queryObj);
  return `${BASE_URL}/image/${encodedPrompt}?${queryParams.toString()}`;
};

export const getRandomSeed = () => Math.floor(Math.random() * 2147483647);

export const getAccountDetails = async (userKey?: string): Promise<AccountState> => {
    const apiKey = getEffectiveKey(userKey);
    try {
        const queryParams = `?key=${apiKey}`;
        
        const [profileRes, balanceRes, usageRes] = await Promise.all([
            fetch(`${BASE_URL}/account/profile${queryParams}`),
            fetch(`${BASE_URL}/account/balance${queryParams}`),
            fetch(`${BASE_URL}/account/usage${queryParams}&limit=10`)
        ]);
        
        const profile = profileRes.ok ? await profileRes.json() : null;
        const balanceData = balanceRes.ok ? await balanceRes.json() : { balance: 0 };
        const usageData = usageRes.ok ? await usageRes.json() : { usage: [] };

        return { 
            profile, 
            balance: balanceData.balance, 
            usage: Array.isArray(usageData.usage) ? usageData.usage : [],
            isLoading: false, 
            error: null 
        };
    } catch (error: any) {
        return { 
            profile: null, 
            balance: null, 
            usage: [],
            isLoading: false, 
            error: error.message || 'Sync Error' 
        };
    }
};

export const getEstimatedImagesLeft = (balance: number | null): string => {
    if (balance === null || balance === undefined || balance === 0) return '0';
    const count = Math.floor(balance / ESTIMATED_IMAGE_COST);
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k`;
    return count.toString();
};

export const getAuthUrl = (redirectUrl: string) => {
    const params = new URLSearchParams({
        redirect_url: redirectUrl,
        permissions: 'profile,balance,usage',
        models: 'zimage',
        expiry: '30'
    });
    return `https://enter.pollinations.ai/authorize?${params.toString()}`;
};