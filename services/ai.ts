
import { addLog } from './logger';

export const enhancePrompt = async (prompt: string, model: string = 'zimage', apiKey?: string): Promise<string> => {
    addLog('info', 'Enhancing prompt with Step 3.5 Flash via Pollinations', { original: prompt, model });
    
    let instructions = "";

    if (model === 'zimage') {
        instructions = `
        Model: Z-Image Turbo (6B-parameter fast text-to-image).
        Goal: Long, highly detailed positive-only prompts structured like a camera director’s shot list.
        Structure: 
        1. Subject + Appearance + Action
        2. Environment & Context
        3. Lighting & Mood
        4. Camera/Style Technicals
        5. Constraints & Cleanup (e.g., "fully clothed, modest outfit, safe for work, no nudity, sharp focus, correct anatomy, no extra limbs, plain background, no logos")
        
        Rules:
        - NO negative prompts.
        - Focus on photorealism, crisp details, and precise instruction following.
        - Describe materials, textures, and exact color palettes.
        - If text is needed, describe placement, font, and exact wording in quotes.
        - Output ONLY the enhanced prompt.
        `;
    } else if (model === 'flux') {
        instructions = `
        Model: Flux.1 Schnell (12B distilled fast model).
        Goal: Clear, natural-language prompts (30-80 words).
        Structure: Subject + Action + Style + Context.
        
        Rules:
        - Use full descriptive sentences, not comma-separated tags.
        - Word order matters: Put the most important elements first (Subject > Action > Style > Context).
        - Describe lighting (e.g., "golden hour", "Rembrandt lighting"), camera (e.g., "85mm lens, f/2.8"), and atmosphere.
        - NO negative prompts.
        - Output ONLY the enhanced prompt.
        `;
    } else if (model === 'flux-2-dev') {
        instructions = `
        Model: Flux.2 [dev] (32B open-weight model).
        Goal: Structured, positive, front-loaded natural language.
        Structure: Subject + Action + Style + Context.
        
        Rules:
        - Front-load the most important details (early tokens are weighted heaviest).
        - Use full descriptive sentences or natural phrasing.
        - For extreme precision, you can use a JSON-like structure or very specific technical descriptions (HEX colors, exact camera specs).
        - Describe textures (e.g., "hyperrealistic skin-like textures"), lighting, and composition.
        - NO negative prompts.
        - Output ONLY the enhanced prompt.
        `;
    } else {
        instructions = `
        Goal: Transform the simple idea into a hyper-detailed, evocative, and technically precise image prompt.
        Structure: Subject, intricate appearance, environment, lighting, camera, and mood.
        Output ONLY the enhanced prompt.
        `;
    }

    try {
        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'step-3.5-flash',
                messages: [
                    { role: 'system', content: `You are an elite AI prompt architect. ${instructions}` },
                    { role: 'user', content: `Original Idea: ${prompt}` }
                ],
                temperature: 1,
                top_p: 1,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const enhancedText = data.choices?.[0]?.message?.content?.trim();
        
        if (!enhancedText) {
            throw new Error('Empty response from Step 3.5 Flash');
        }

        addLog('info', 'Prompt enhancement successful');
        return enhancedText;
    } catch (error: any) {
        addLog('error', 'Prompt enhancement failed', error.message);
        throw error;
    }
};
