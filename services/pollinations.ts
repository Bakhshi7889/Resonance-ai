import { addLog } from './logger';

const DEFAULT_API_KEY = 'sk_fH3vuxg5ULiDIzbVK7y6ejUg4eK1f0VF';

export const getEffectiveKey = (key?: string) => key || DEFAULT_API_KEY;

export const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const generateImageUrl = async (params: any) => {
    const { prompt, width, height, seed, model, nologo, negative_prompt, safe, apiKey } = params;
    const effectiveKey = getEffectiveKey(apiKey);
    
    // Direct URL with API Key for high-quality/private features
    const baseUrl = "https://gen.pollinations.ai/image";
    const encodedPrompt = encodeURIComponent(prompt);
    
    let url = `${baseUrl}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model || 'flux'}`;
    if (nologo) url += "&nologo=true";
    if (negative_prompt) url += `&negative=${encodeURIComponent(negative_prompt)}`;
    if (safe) url += "&safe=true";
    
    // Pollinations allows passing the API key as a query param
    url += `&key=${effectiveKey}`;
    
    return url;
};

export const getAuthUrl = (redirectUri: string) => {
    return `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUri)}`;
};

export const getAccountDetails = async (apiKey?: string) => {
    const effectiveKey = getEffectiveKey(apiKey);
    try {
        addLog('info', 'Initiating account sync via Pollinations API...');
        const response = await fetch(`https://gen.pollinations.ai/account/balance?key=${effectiveKey}`, {
            headers: {
                'Authorization': `Bearer ${effectiveKey}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        addLog('info', 'Sync complete', { balance: data.balance });
        return { 
            profile: null, 
            balance: data.balance, 
            usage: [], 
            isLoading: false, 
            error: null 
        };
    } catch (e: any) {
        const errorMsg = e instanceof Error ? e.message : String(e || 'Unknown error');
        addLog('error', 'Critical sync error', errorMsg);
        return { profile: null, balance: null, usage: [], isLoading: false, error: errorMsg };
    }
};

export const MODEL_PRICING: Record<string, number> = {
    'zimage': 0.002,
    'flux': 0.001,
    'flux-2-dev': 0.001
};

export const getEstimatedImagesLeft = (balance: number | null, model: string = 'flux') => {
    if (balance === null) return 0;
    const price = MODEL_PRICING[model] || 0.001;
    return Math.floor(balance / price);
};
