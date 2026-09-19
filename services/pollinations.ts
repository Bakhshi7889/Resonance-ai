import { addLog } from './logger';
import { ModelInfo } from '../types';

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
    if (safe === true) url += "&safe=true";
    else url += "&safe=false";
    
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
    // DreamShaper 8 LCM (0.0001 /gen)
    'lykon/dreamshaper-8-lcm': 0.0001,
    'dreamshaper': 0.0001,
    'sana': 0.0001,
    
    // FLUX.1 Schnell (0.002 /gen)
    'black-forest-labs/flux.1-schnell': 0.002,
    'flux': 0.002,
    'Spit-fires/flux-schnell': 0.002,
    'flux-schnell': 0.002,
    
    // Z-Image Turbo (0.004 /gen)
    'tongyi-mai/z-image-turbo': 0.004,
    'zimage': 0.004,
    'z-image': 0.004,
    'z-image-turbo': 0.004
};

export const CORE_IMAGE_MODELS: ModelInfo[] = [
    { 
        id: 'lykon/dreamshaper-8-lcm', 
        name: 'DreamShaper 8 LCM', 
        description: '300 RPM · Quest Requests ≈ 10K /pollen · 0.0001/gen', 
        paid_only: false, 
        price: 0.0001, 
        rpm: 300,
        questRate: '≈ 10K /pollen',
        type: 'image'
    },
    { 
        id: 'black-forest-labs/flux.1-schnell', 
        name: 'FLUX.1 Schnell', 
        description: '60 RPM · Quest Requests ≈ 500 /pollen · 0.002/gen', 
        paid_only: false, 
        price: 0.002, 
        rpm: 60,
        questRate: '≈ 500 /pollen',
        type: 'image'
    },
    { 
        id: 'tongyi-mai/z-image-turbo', 
        name: 'Z-Image Turbo', 
        description: '60 RPM · Quest Requests ≈ 250 /pollen · 0.004/gen', 
        paid_only: false, 
        price: 0.004, 
        rpm: 60,
        questRate: '≈ 250 /pollen',
        type: 'image'
    }
];

export const IMAGE_MODELS: ModelInfo[] = CORE_IMAGE_MODELS;

// Helper to filter out any "failure reel" model variants
export const isFailureReelModel = (nameOrTitle?: string | null): boolean => {
    if (!nameOrTitle) return false;
    const s = nameOrTitle.toLowerCase();
    return s.includes('failure reel') || s.includes('failure-reel') || (s.includes('failure') && s.includes('reel'));
};

export type CommunitySortOption = 'free' | 'health' | 'popular' | 'price' | 'name';

export const sortCommunityModels = (models: ModelInfo[], sortBy: CommunitySortOption = 'free'): ModelInfo[] => {
    const sorted = [...models];
    switch (sortBy) {
        case 'free':
            return sorted.sort((a, b) => {
                if (a.isFree && !b.isFree) return -1;
                if (!a.isFree && b.isFree) return 1;
                const healthA = a.health?.success_rate ?? 50;
                const healthB = b.health?.success_rate ?? 50;
                return healthB - healthA;
            });
        case 'health':
            return sorted.sort((a, b) => {
                const healthA = a.health?.success_rate ?? 0;
                const healthB = b.health?.success_rate ?? 0;
                return healthB - healthA;
            });
        case 'popular':
            return sorted.sort((a, b) => {
                const reqA = a.health?.requests ?? 0;
                const reqB = b.health?.requests ?? 0;
                return reqB - reqA;
            });
        case 'price':
            return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sorted;
    }
};

export const FALLBACK_FREE_COMMUNITY_MODELS: ModelInfo[] = [
    {
        id: 'community/NamanSoni78/Imagine-4',
        name: 'Imagine-4',
        description: 'Free community image model (TalkAiCompanion)',
        paid_only: false,
        price: 0,
        community: true,
        isFree: true,
        isUnstable: true,
        type: 'image'
    },
    {
        id: 'community/NamanSoni78/Z-Image-Turbo',
        name: 'Z-Image-Turbo',
        description: 'Free community turbo model (TalkAiCompanion)',
        paid_only: false,
        price: 0,
        community: true,
        isFree: true,
        isUnstable: true,
        type: 'image'
    }
];

export const fetchCommunityModels = async (apiKey?: string): Promise<ModelInfo[]> => {
    try {
        const baseUrl = "https://gen.pollinations.ai";
        const headers: Record<string, string> = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const res = await fetch(`${baseUrl}/image/models`, { headers }).catch(() => null) ||
                    await fetch(`${baseUrl}/models`, { headers }).catch(() => null);

        if (res && res.ok) {
            const remoteModels = await res.json();
            if (Array.isArray(remoteModels)) {
                const communityOnly = remoteModels.filter((rm: any) => {
                    const id = rm.name || rm.id || '';
                    const title = rm.title || rm.name || '';

                    // Strict filter: Exclude failure reel models
                    if (isFailureReelModel(id) || isFailureReelModel(title)) {
                        return false;
                    }

                    // Must be a community model
                    const isCommunity = rm.community === true || id.startsWith('community/');
                    if (!isCommunity) return false;

                    // Must be image model (exclude pure video/audio endpoints)
                    const isVideo = rm.output_modalities?.includes('video') || rm.type === 'video' || (rm.pricing && rm.pricing.completionVideoSeconds);
                    if (isVideo) return false;

                    // Calculate token/image cost
                    const priceNum = rm.pricing?.completionImageTokens !== undefined 
                        ? Number(rm.pricing.completionImageTokens) 
                        : (rm.price !== undefined ? Number(rm.price) : 0);

                    // REMOVE ALL PAID COMMUNITY MODELS:
                    // Only keep models that are strictly 0-cost and not paid_only
                    const isPaid = rm.paid_only === true || priceNum > 0;
                    if (isPaid) {
                        return false;
                    }

                    return true;
                });

                const parsedList: ModelInfo[] = communityOnly.map((rm: any) => {
                    const id = rm.name || rm.id;

                    return {
                        id,
                        name: rm.title || id.replace('community/', ''),
                        description: rm.description || `${rm.publisher ? `${rm.publisher} · ` : ''}Free Community AI Model`,
                        paid_only: false,
                        price: 0,
                        community: true,
                        isFree: true,
                        isUnstable: true, // Community models are unstable / third-party hosted
                        health: rm.health ? {
                            status: rm.health.status,
                            success_rate: rm.health.success_rate !== undefined ? Math.round(rm.health.success_rate) : undefined,
                            requests: rm.health.requests
                        } : undefined,
                        rpm: rm.per_user_rpm || undefined,
                        publisher: rm.publisher || undefined,
                        type: 'image'
                    };
                });

                return sortCommunityModels(parsedList.length > 0 ? parsedList : FALLBACK_FREE_COMMUNITY_MODELS, 'health');
            }
        }
    } catch (e) {
        console.warn('Failed to fetch dynamic community models, using fallback free models:', e);
    }
    return FALLBACK_FREE_COMMUNITY_MODELS;
};

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
                const mergedMap = new Map<string, ModelInfo>();
                CORE_IMAGE_MODELS.forEach(m => mergedMap.set(m.id, m));

                remoteModels.forEach((rm: any) => {
                    const id = rm.name || rm.id;
                    if (!id) return;
                    if (isFailureReelModel(id) || isFailureReelModel(rm.title)) return;
                    
                    const existing = mergedMap.get(id);
                    const isCommunity = rm.community === true || id.startsWith('community/');
                    const priceNum = rm.pricing?.completionImageTokens !== undefined 
                        ? Number(rm.pricing.completionImageTokens) 
                        : (rm.price !== undefined ? Number(rm.price) : (MODEL_PRICING[id] || existing?.price || 0.001));

                    const isFree = !rm.paid_only && priceNum === 0;
                    const isPaid = rm.paid_only === true || priceNum > 0;

                    // Remove all paid community models completely
                    if (isCommunity && isPaid) {
                        return;
                    }

                    mergedMap.set(id, {
                        id,
                        name: rm.title || existing?.name || id,
                        description: rm.description || existing?.description || `Pollinations model (${id})`,
                        paid_only: isPaid,
                        price: priceNum,
                        type: rm.type || existing?.type || 'image',
                        base_model: rm.base_model || rm.baseModel || existing?.base_model,
                        community: isCommunity,
                        isFree: isFree,
                        isUnstable: isCommunity,
                        rpm: rm.per_user_rpm || existing?.rpm,
                        questRate: existing?.questRate,
                        health: rm.health ? {
                            status: rm.health.status,
                            success_rate: rm.health.success_rate !== undefined ? Math.round(rm.health.success_rate) : undefined,
                            requests: rm.health.requests
                        } : undefined,
                        publisher: rm.publisher || existing?.publisher
                    });
                });

                return Array.from(mergedMap.values());
            }
        }
    } catch (e) {
        console.warn('Failed to fetch dynamic model catalog, using default catalog:', e);
    }
    return CORE_IMAGE_MODELS;
};

export const getEstimatedImagesLeft = (balance: number | null, model: string = 'black-forest-labs/flux.1-schnell', customPrice?: number) => {
    if (balance === null) return 0;
    const price = customPrice !== undefined ? customPrice : (MODEL_PRICING[model] || 0.002);
    if (price === 0) return 99999;
    return Math.floor(balance / price);
};

