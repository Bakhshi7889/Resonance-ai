import { addLog } from './logger';
import { getEffectiveKey } from './pollinations';

export const enhancePrompt = async (
    prompt: string, 
    model: string = 'zimage', 
    apiKey?: string,
    onChunk?: (chunk: string) => void
): Promise<string> => {
    const effectiveKey = getEffectiveKey(apiKey);
    addLog('info', 'Enhancing prompt with Google Gemini 2.5 Flash Lite via Pollinations', { original: prompt, model });
    
    let instructions = "";

    if (model === 'zimage') {
        instructions = `
        Model: Z-Image Turbo (6B-parameter ultra-fast synthesis).
        Style: Hyper-realistic, cinematic, and texture-heavy.
        Goal: Generate a long, descriptive prompt (100-200 words) that reads like a professional cinematographer's shot list.
        
        Key Elements to Include:
        - START: Always start with "A photo of..." or "A studio product photo of...".
        - SUBJECT: Intricate physical details, clothing materials (silk, worn leather, brushed metal), and specific micro-expressions.
        - ENVIRONMENT: Atmospheric depth, particles in the air (dust motes, rain droplets), and complex background layering.
        - LIGHTING: Specific sources (flickering neon, harsh rim light, soft volumetric god rays) and color grading (teal and orange, high-contrast monochrome).
        - CAMERA: Technical specs (Shot on ARRI Alexa, 35mm anamorphic lens, f/1.4, deep depth of field).
        
        Rules:
        - NO negative prompts.
        - NO buzzwords like "masterpiece" or "4k". Use descriptive technical terms instead.
        - Output ONLY the final enhanced prompt.
        `;
    } else if (model === 'flux') {
        instructions = `
        Model: Flux.1 Schnell (12B distilled high-speed model).
        Style: Natural, clean, and highly accurate to the user's intent.
        Goal: A concise, punchy natural language paragraph (40-70 words).
        
        Key Elements to Include:
        - FRONT-LOADING: Put the most important visual anchor in the first 10 words.
        - SUBJECT: Clear action and pose.
        - COMPOSITION: Rule of thirds, centered, or wide-angle perspective.
        - LIGHTING: Natural lighting conditions (overcast day, golden hour, moonlight).
        - ATMOSPHERE: The overall "vibe" (nostalgic, clinical, vibrant, moody).
        
        Rules:
        - Use full sentences. Avoid comma-separated tags.
        - Output ONLY the final enhanced prompt.
        `;
    } else if (model === 'flux-2-dev') {
        instructions = `
        Model: Flux.2 [dev] (32B state-of-the-art neural architecture).
        Style: Extreme precision, complex scene handling, and perfect text rendering.
        Goal: A highly structured, front-loaded description (80-120 words).
        
        Key Elements to Include:
        - FRONT-LOADING: Start with the absolute core subject. The model weighs early words significantly more.
        - PRECISION: Use HEX codes for colors or specific technical specs sparingly.
        - TEXT: If text is implied, specify the exact font style and placement in quotes.
        - COMPLEXITY: Describe spatial relationships clearly but concisely.
        
        Rules:
        - Keep the total length under 120 words to avoid API errors.
        - Focus on high-impact visual details rather than microscopic technical lists.
        - Output ONLY the final enhanced prompt.
        `;
    } else if (model === 'imagen-4') {
        instructions = `
        Model: Imagen 4 (Google's latest high-fidelity vision model).
        Style: Absolute photorealism, "real camera shots".
        Goal: Follow the OFFICIAL Google Prompt Structure for maximum realism.
        
        Official Formula:
        "A photo of [detailed subject + action], [composition], [lens + settings], [lighting], [film style], 4K HDR beautiful photo taken by a professional photographer"
        
        Key Requirements:
        - START: Always start the prompt with exactly "A photo of ...".
        - STRUCTURE: Subject + Action/Description + Location/Context + Composition + Photography Modifiers.
        - MODIFIERS (Use 2-4 max from this official list):
            * 35mm portrait, depth of field, black and white film
            * macro lens, 60mm, high detail, precise focusing, controlled lighting
            * wide angle 10mm, long exposure, sharp focus
            * fast shutter speed, movement tracking
            * low angle shot with a shallow depth of field (f/1.8)
            * Fujifilm, pronounced grain, cinematic lighting effect
            * natural lighting, golden hour backlighting creating long shadows
            * medium-full shot, center-framed, studio photo, bokeh
            * polaroid portrait, soft focus
            * 4K HDR beautiful photo, taken by a professional photographer
        
        Pro Tips:
        - Be specific and positive (e.g., "empty road" instead of "no people").
        - Keep total length under 150 words.
        - For products/cars: use "studio photo, controlled lighting" + "medium-full shot, center-framed".
        
        Rules:
        - Output ONLY the final enhanced prompt.
        `;
    } else if (model === 'grok-imagine') {
        instructions = `
        Model: Grok Imagine (X.AI's creative vision engine).
        Style: Natural, photorealistic, and cinematic.
        Goal: Follow the PROVEN Grok Imagine formula for best results.
        
        Official Formula:
        "[Subject + action/pose in one natural sentence], [environment and mood], [lighting and atmosphere details]. Shot on [specific camera], [lens], [framing and depth of field], [film or photo style], photorealistic, natural textures, subtle film grain, sharp focus, no AI artifacts."
        
        Key Requirements:
        - NATURAL LANGUAGE: Use full, natural English sentences. Avoid keyword spam.
        - CAMERA GEAR (Pick one): Canon EOS R5, Sony A7R IV, Fujifilm XT5, iPhone 16 Pro.
        - MAGIC CLOSER: You MUST ALWAYS end the prompt with exactly: "photorealistic, natural textures, subtle film grain, sharp focus, no AI artifacts."
        - FOR CARS/PRODUCTS: Add "professional automotive photography" or "studio product shot" immediately after the camera gear.
        
        Pro Tips:
        - Keep the whole prompt to 1-2 sentences max (under 150 words).
        - Focus on subtle imperfections to remove "AI gloss".
        - Use specific lighting (e.g., "soft window light", "dramatic sunset reflections").
        
        Rules:
        - Output ONLY the final enhanced prompt.
        `;
    } else if (model === 'dirtberry') {
        instructions = `
        Model: Dirtberry (Alpha model for quick realistic image generation).
        Style: RAW, candid, professional DSLR photography.
        Goal: Follow the battle-tested r/StableDiffusion photorealism formula.
        
        Official Formula:
        [STYLE OF PHOTO] photo of a [SUBJECT + key details], [IMPORTANT FEATURES], [MORE DETAILS], [POSE OR ACTION], [FRAMING], [SETTING/BACKGROUND], [LIGHTING], [CAMERA ANGLE], [CAMERA PROPERTIES + LENS], [QUALITY BOOSTERS]
        
        Step-by-Step Recipe:
        1. STYLE: RAW photo / candid photograph / professional photograph / cinematic film still.
        2. SUBJECT: Extremely specific (e.g., "red Ferrari 488 GTB sports car with carbon fiber accents").
        3. FEATURES: Material, color, condition (e.g., "glossy paint, chrome exhaust").
        4. DETAILS: Textures, reflections, small elements.
        5. POSE/ACTION: What the subject is doing.
        6. FRAMING: Close-up, wide angle, three-quarter view, etc.
        7. SETTING: Specific background and time of day.
        8. LIGHTING: Natural sunlight, dramatic side lighting, etc.
        9. ANGLE: Low angle, eye level, overhead.
        10. CAMERA: Shot on Canon EOS R5, 50mm f/1.8 lens, 1/1000s, f/2.8.
        11. BOOSTERS: 8K, UHD, natural lighting, sharp focus, film grain, RAW photo.
        
        Rules:
        - Emphasize raw, unpolished, and visceral details.
        - Output ONLY the final enhanced prompt.
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${effectiveKey}`
            },
            body: JSON.stringify({
                model: 'gemini-fast',
                messages: [
                    { role: 'system', content: `You are an elite AI prompt architect. ${instructions}` },
                    { role: 'user', content: `Original Idea: ${prompt}` }
                ],
                temperature: 0.85,
                top_p: 1,
                max_tokens: 4096,
                stream: !!onChunk
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        if (onChunk) {
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');
            
            const decoder = new TextDecoder();
            let fullText = "";
            let buffer = "";
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Keep the last partial line in the buffer
                buffer = lines.pop() || "";
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
                    
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmedLine.substring(6));
                            const content = data.choices?.[0]?.delta?.content || "";
                            if (content) {
                                fullText += content;
                                // Strip thinking tags from the stream
                                const stripped = fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                                if (stripped) onChunk(stripped);
                            }
                        } catch (e) {
                            // Only log if it's not a partial JSON error, but since we have a buffer now, 
                            // any error here is likely a real issue with the chunk content.
                            console.error('Error parsing stream chunk', e, trimmedLine);
                        }
                    }
                }
            }
            
            // Process any remaining data in buffer if it looks like a complete line
            if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
                try {
                    const data = JSON.parse(buffer.trim().substring(6));
                    const content = data.choices?.[0]?.delta?.content || "";
                    if (content) {
                        fullText += content;
                    }
                } catch (e) {
                    // Ignore errors for the very last bit if it's still incomplete
                }
            }
            return fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        } else {
            const data = await response.json();
            let enhancedText = data.choices?.[0]?.message?.content?.trim();
            if (!enhancedText) throw new Error('Empty response from Step 3.5 Flash');
            
            // Strip thinking tags
            enhancedText = enhancedText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            
            addLog('info', 'Prompt enhancement successful');
            return enhancedText;
        }
    } catch (error: any) {
        addLog('error', 'Prompt enhancement failed', error.message);
        throw error;
    }
};
