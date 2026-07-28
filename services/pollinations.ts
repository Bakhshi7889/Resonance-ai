import { addLog } from './logger';

const DEFAULT_API_KEY = 'pk_2yctpceb1LwUL1Vr';

export const getEffectiveKey = (key?: string) => key || DEFAULT_API_KEY;

export const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const generateImageUrl = async (params: any) => {
    const { prompt, width, height, seed, model, nologo, safe, apiKey } = params;
    const effectiveKey = getEffectiveKey(apiKey);
    
    // Direct URL with API Key for high-quality/private features
    const baseUrl = "https://gen.pollinations.ai/image";
    const encodedPrompt = encodeURIComponent(prompt);
    
    let url = `${baseUrl}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model || 'flux'}`;
    if (nologo) url += "&nologo=true";
    if (safe) url += "&safe=true";
    
    // User's personal key for generation (if provided) or the default app API key
    url += `&key=${effectiveKey}`;
    
    return url;
};

export const getAuthUrl = (redirectUri: string) => {
    const params = new URLSearchParams({
        redirect_url: redirectUri,
        redirect_uri: redirectUri,
        response_type: 'code',
        client_id: DEFAULT_API_KEY,
        app_key: DEFAULT_API_KEY,
        scope: 'profile usage balance',
        models: JSON.stringify(['sana', 'Spit-fires/flux-schnell', 'flux', 'zimage', 'openai']),
    });
    return `https://enter.pollinations.ai/authorize?${params.toString()}`;
};

export interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export const initiateDeviceCodeFlow = async (): Promise<DeviceCodeResponse | null> => {
    try {
        const response = await fetch('https://enter.pollinations.ai/api/device/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: DEFAULT_API_KEY, scope: 'profile usage balance' })
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error('Device code flow initiation failed:', e);
        return null;
    }
};

export const pollDeviceCodeToken = async (deviceCode: string): Promise<string | null> => {
    try {
        const response = await fetch('https://enter.pollinations.ai/api/device/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: DEFAULT_API_KEY,
                device_code: deviceCode,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.access_token || data.api_key || null;
    } catch (e) {
        return null;
    }
};

export const getAccountDetails = async (apiKey?: string) => {
    const effectiveKey = getEffectiveKey(apiKey);
    try {
        addLog('info', 'Initiating complete account sync via Pollinations API...');
        const headers = { 'Authorization': `Bearer ${effectiveKey}` };
        const baseUrl = 'https://gen.pollinations.ai';

        const [profileRes, balanceRes, usageRes, questsRes, keyRes, dailyUsageRes] = await Promise.all([
            fetch(`${baseUrl}/account/profile`, { headers }).catch(() => null),
            fetch(`${baseUrl}/account/balance`, { headers }).catch(() => null),
            fetch(`${baseUrl}/account/usage?limit=15`, { headers }).catch(() => null),
            fetch(`${baseUrl}/account/quests`, { headers }).catch(() => null),
            fetch(`${baseUrl}/account/key`, { headers }).catch(() => null),
            fetch(`${baseUrl}/account/usage/daily`, { headers }).catch(() => null)
        ]);

        let profile = null;
        let balance = null;
        let usage = [];
        let quests = [];
        let keyInfo = null;
        let dailyUsage = [];

        if (profileRes && profileRes.ok) {
            profile = await profileRes.json();
        }
        if (balanceRes && balanceRes.ok) {
            const balanceData = await balanceRes.json();
            balance = balanceData.balance !== undefined ? balanceData.balance : balanceData.total;
        }
        if (usageRes && usageRes.ok) {
            const usageData = await usageRes.json();
            usage = usageData.usage || usageData || [];
        }
        if (questsRes && questsRes.ok) {
            quests = await questsRes.json().catch(() => []);
        }
        if (keyRes && keyRes.ok) {
            keyInfo = await keyRes.json().catch(() => null);
        }
        if (dailyUsageRes && dailyUsageRes.ok) {
            dailyUsage = await dailyUsageRes.json().catch(() => []);
        }

        addLog('info', 'Sync complete', { balance, profileExists: !!profile, usageCount: usage.length });
        return { 
            profile, 
            balance, 
            usage,
            quests,
            keyInfo,
            dailyUsage,
            isLoading: false, 
            error: null 
        };
    } catch (e: any) {
        const errorMsg = e instanceof Error ? e.message : String(e || 'Unknown error');
        addLog('error', 'Critical sync error during account sync', errorMsg);
        return { profile: null, balance: null, usage: [], quests: [], keyInfo: null, dailyUsage: [], isLoading: false, error: errorMsg };
    }
};

export const MODEL_PRICING: Record<string, number> = {
    'sana': 0.0001,
    'Spit-fires/flux-schnell': 0.001,
    'flux': 0.001,
    'zimage': 0.004
};

export const IMAGE_MODELS: ModelInfo[] = [
    { 
        id: 'sana', 
        name: 'Sana', 
        description: 'Near-instant images at rock-bottom cost; simpler detail than premium models', 
        paid_only: false, 
        price: 0.0001, 
        type: 'image'
    },
    { 
        id: 'Spit-fires/flux-schnell', 
        name: 'Flux Schnell half price', 
        description: 'Spit-fires/flux-schnell - Fast high-quality image generation (Safe for regular usage)', 
        paid_only: false, 
        price: 0.001, 
        type: 'image'
    },
    { 
        id: 'zimage', 
        name: 'Z-Image Turbo', 
        description: 'Instant, budget-friendly images with crisp upscaled output', 
        paid_only: false, 
        price: 0.004, 
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
    url?: string;
}

export const getImageModels = async (hasCustomKey: boolean = false, apiKey?: string): Promise<ModelInfo[]> => {
    try {
        const baseUrl = "https://gen.pollinations.ai";
        const headers: Record<string, string> = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const res = await fetch(`${baseUrl}/image/models`, { headers }).catch(() => null) ||
                    await fetch(`${baseUrl}/models`, { headers }).catch(() => null);

        if (res && res.ok) {
            const remoteModels = await res.json();
            if (Array.isArray(remoteModels) && remoteModels.length > 0) {
                // Merge remote models without removing default model definitions
                const mergedMap = new Map<string, ModelInfo>();
                IMAGE_MODELS.forEach(m => mergedMap.set(m.id, m));

                remoteModels.forEach((rm: any) => {
                    const id = rm.id || rm.name;
                    if (!id) return;
                    const existing = mergedMap.get(id);
                    mergedMap.set(id, {
                        id,
                        name: rm.name || existing?.name || id,
                        description: rm.description || existing?.description || `Pollinations model (${id})`,
                        paid_only: Boolean(rm.paid_only ?? rm.paidOnly ?? existing?.paid_only),
                        price: rm.price !== undefined ? Number(rm.price) : (MODEL_PRICING[id] || existing?.price || 0.001),
                        type: rm.type || existing?.type || 'image',
                        base_model: rm.base_model || rm.baseModel || existing?.base_model
                    });
                });

                return Array.from(mergedMap.values());
            }
        }
    } catch (e) {
        console.warn('Failed to fetch dynamic model catalog, using default catalog:', e);
    }
    return IMAGE_MODELS;
};

export const getEstimatedImagesLeft = (balance: number | null, model: string = 'flux', customPrice?: number) => {
    if (balance === null) return 0;
    const price = customPrice !== undefined ? customPrice : (MODEL_PRICING[model] || 0.001);
    return Math.floor(balance / price);
};

