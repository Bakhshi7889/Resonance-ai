import { addLog } from './logger';

const DEFAULT_API_KEY = 'pk_N2YEvo5VHzELOFio';

export const getEffectiveKey = (key?: string) => key || DEFAULT_API_KEY;

export const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const generateImageUrl = async (params: any) => {
    const { prompt, width, height, seed, model, nologo, negative_prompt, safe, apiKey, enhance } = params;
    const effectiveKey = getEffectiveKey(apiKey);
    
    // Direct URL with API Key for high-quality/private features
    const baseUrl = "https://gen.pollinations.ai/image";
    const encodedPrompt = encodeURIComponent(prompt);
    
    let url = `${baseUrl}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model || 'flux'}`;
    if (nologo) url += "&nologo=true";
    if (negative_prompt) url += `&negative_prompt=${encodeURIComponent(negative_prompt)}`;
    if (safe) url += "&safe=true";
    if (enhance) url += "&enhance=true";
    
    // User's personal key for generation (if provided) or the default app API key
    url += `&key=${effectiveKey}`;
    
    return url;
};

export const getAuthUrl = (redirectUri: string) => {
    const params = new URLSearchParams({
        redirect_url: redirectUri,
        app_key: 'pk_N2YEvo5VHzELOFio', // Updated app key
        models: 'flux,openai,gptimage,zimage,grok-imagine,qwen-image,klein', // Suggested models
    });
    return `https://enter.pollinations.ai/authorize?${params.toString()}`;
};

export const getAccountDetails = async (apiKey?: string) => {
    const effectiveKey = getEffectiveKey(apiKey);
    try {
        addLog('info', 'Initiating account sync via Pollinations API...');
        // Use the gen.pollinations.ai API for account details
        const response = await fetch('https://gen.pollinations.ai/account/balance', {
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
    'flux': 0.001,
    'zimage': 0.002,
    'klein': 0.01
};

export const IMAGE_MODELS: ModelInfo[] = [
    { 
        id: 'flux', 
        name: 'Flux Schnell', 
        description: '1K Speed Optimized', 
        paid_only: false, 
        price: 0.001, 
        type: 'image'
    },
    { 
        id: 'zimage', 
        name: 'Z-Image Turbo', 
        description: '500 Neural Synthesis', 
        paid_only: true, 
        price: 0.002, 
        type: 'image'
    },
    { 
        id: 'klein', 
        name: 'FLUX.2 Klein 4B', 
        description: 'ALPHA 100 Precision', 
        paid_only: true, 
        price: 0.01, 
        type: 'image'
    }
];

export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    paid_only: boolean;
    price: number;
    base_model?: string;
    type?: string;
}

export const getImageModels = async (hasCustomKey: boolean = false, apiKey?: string): Promise<ModelInfo[]> => {
    return IMAGE_MODELS;
};

export const getEstimatedImagesLeft = (balance: number | null, model: string = 'flux', customPrice?: number) => {
    if (balance === null) return 0;
    const price = customPrice !== undefined ? customPrice : (MODEL_PRICING[model] || 0.001);
    return Math.floor(balance / price);
};
