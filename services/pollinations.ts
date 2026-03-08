import { addLog } from './logger';

export const getEffectiveKey = (key?: string) => key || 'sk_fH3vuxg5ULiDIzbVK7y6ejUg4eK1f0VF';

export const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const generateImageUrl = async (params: any) => {
    try {
        // Try the proxy first (for paid features/private generations)
        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            body: JSON.stringify(params),
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
            const data = await response.json();
            return data.url;
        }
    } catch (e) {
        // Proxy failed, fall back to direct URL
        addLog('warn', 'Generation proxy unavailable, falling back to direct URL');
    }

    // Direct URL Fallback (Free Tier / No Proxy)
    const { prompt, width, height, seed, model, nologo, negative_prompt, safe } = params;
    const baseUrl = "https://image.pollinations.ai/prompt";
    const encodedPrompt = encodeURIComponent(prompt);
    
    let url = `${baseUrl}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model || 'flux'}`;
    if (nologo) url += "&nologo=true";
    if (negative_prompt) url += `&negative=${encodeURIComponent(negative_prompt)}`;
    if (safe) url += "&safe=true";
    
    return url;
};

export const getAuthUrl = (redirectUri: string) => {
    return `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUri)}`;
};

export const getAccountDetails = async () => {
    try {
        addLog('info', 'Initiating account sync via Netlify API...');
        const response = await fetch('/.netlify/functions/account');
        
        // Check if the response is actually JSON
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            addLog('warn', 'Sync server unavailable or returned non-JSON response. This is expected in local development if Netlify functions are not running.');
            return { profile: null, balance: 0, usage: [], isLoading: false, error: null };
        }

        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        addLog('info', 'Sync complete', { balance: data.balance });
        return { ...data, isLoading: false, error: null };
    } catch (e: any) {
        addLog('error', 'Critical sync error', e.message);
        return { profile: null, balance: null, usage: [], isLoading: false, error: e.message };
    }
};

export const getEstimatedImagesLeft = (balance: number | null) => {
    if (balance === null) return 0;
    // Based on latest docs: 0.0002 Pollen per image
    return Math.floor(balance / 0.0002);
};
