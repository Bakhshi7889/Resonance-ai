
export interface ImageGenerationParams {
  prompt: string;
  model: string;
  width: number;
  height: number;
  seed: number;
  enhance: boolean;
  nologo: boolean;
  negative_prompt?: string;
  apiKey?: string;
  safe: boolean;
  private: boolean;
  quality?: 'low' | 'hd';
  styleIds?: string[];
  styleSuffix?: string;
}

export interface HistoryItem extends ImageGenerationParams {
  id: string;
  batchId?: string; // Links images generated in the same request
  timestamp: number;
  startTime?: number; // When the generation was initiated
  url: string;
  prompt: string;
  styleSuffix?: string; // The specific keywords added by the style
  styleName?: string; // The name of the style used
}

export interface CustomStyle {
  id: string;
  label: string;
  category: string;
  suffix: string;
  image: string;
  modelId?: string; // The model this style is optimized for
}

export interface AppSettings {
  model: string;
  width: number;
  height: number;
  enhance: boolean;
  privateMode: boolean;
  negativePrompt: string;
  imageCount: number;
  activeStyles: string[];
  hiddenStyleIds: string[];
  favoriteStyleIds: string[];
  styleOrder: string[]; // New: Manual order of styles
  customStyles: CustomStyle[];
  apiKey: string;
  quality: 'low' | 'hd';
  infiniteMode: boolean;
  seed: number;
  visualSafety: boolean;
}

export interface AccountProfile {
  name?: string;
  email?: string;
  tier?: 'anonymous' | 'seed' | 'flower' | 'nectar';
  createdAt?: string;
}

export interface UsageRecord {
  timestamp: string;
  model: string;
  cost_usd: number;
  type: string;
}

export interface AccountState {
  profile: AccountProfile | null;
  balance: number | null;
  usage: UsageRecord[];
  isLoading: boolean;
  error: string | null;
  user: any | null; // Supabase user
}

export enum AppRoute {
  GENERATOR = 'generator',
  HISTORY = 'history',
  PREFERENCES = 'preferences',
  STYLE_LIBRARY = 'style_library',
  CREATE_STYLE = 'create_style',
  CREATE_PRESET = 'create_preset',
  COMMUNITY = 'community',
  LEADERBOARD = 'leaderboard'
}

export const AVAILABLE_MODELS = [
  { id: 'zimage', name: 'Z-Image', description: 'Poly-modal Synthesis' },
  { id: 'flux', name: 'Flux Schnell', description: 'High-speed Latent Diffusion' },
  { id: 'flux-2-dev', name: 'Flux.2 Dev', description: 'Alpha Neural Architecture' },
];

export const ASPECT_RATIOS = [
  { label: '1:1', width: 1536, height: 1536 },
  { label: '3:4', width: 1312, height: 1760 },
  { label: '4:3', width: 1760, height: 1312 },
  { label: '16:9', width: 2048, height: 1152 },
  { label: '9:16', width: 1152, height: 2048 },
];

export const MODEL_STYLES = [
  // NONE OPTION
  { id: 'none', label: 'None', category: 'Basic', suffix: '', image: 'https://gen.pollinations.ai/image/Clean%20minimalist%20void?model=zimage&width=256&height=384&nologo=true&seed=0&safe=true', modelId: 'zimage' },
  
  // FLUX.1 SCHNELL STYLES
  { id: 'flux_cinematic', label: 'Cinematic', category: 'Flux Schnell', suffix: ', cinematic photography with dramatic lighting, shallow depth of field, 85mm lens, f/1.4', image: 'https://gen.pollinations.ai/image/Cinematic%20photography%20dramatic%20lighting?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_studio', label: 'Studio', category: 'Flux Schnell', suffix: ', studio lighting, Rembrandt lighting, 85mm lens, f/1.4, shallow depth of field', image: 'https://gen.pollinations.ai/image/Studio%20Rembrandt%20lighting?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_golden', label: 'Golden Hour', category: 'Flux Schnell', suffix: ', golden hour lighting, cinematic photography style, warm color tones', image: 'https://gen.pollinations.ai/image/Golden%20hour%20cinematic?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_canon', label: 'Canon R5', category: 'Flux Schnell', suffix: ', shot on Canon EOS R5 with 85mm f/1.4 lens, 4K resolution, ultra sharp focus, shallow depth of field', image: 'https://gen.pollinations.ai/image/Shot%20on%20Canon%20EOS%20R5?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_lifestyle', label: 'Lifestyle', category: 'Flux Schnell', suffix: ', soft diffused natural daylight, shallow depth of field, warm color tones, lifestyle photography style', image: 'https://gen.pollinations.ai/image/Soft%20diffused%20natural%20daylight?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_commercial', label: 'Commercial', category: 'Flux Schnell', suffix: ', dramatic side lighting creating reflections, commercial advertising photography, 4K resolution', image: 'https://gen.pollinations.ai/image/Commercial%20advertising%20photography?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_sunset', label: 'Sunset Rim', category: 'Flux Schnell', suffix: ', warm sunset light creating rim lighting, lens flare from sun, shallow depth of field with bokeh', image: 'https://gen.pollinations.ai/image/Warm%20sunset%20rim%20lighting?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_smartphone', label: 'Smartphone', category: 'Flux Schnell', suffix: ', IMG_1025.HEIC photorealistic, natural color grading, authentic documentary style', image: 'https://gen.pollinations.ai/image/Smartphone%20HEIC%20photo?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_kodak', label: 'Kodak Portra', category: 'Flux Schnell', suffix: ', Kodak Portra 400 film stock, soft natural window light, visible skin texture and pores', image: 'https://gen.pollinations.ai/image/Kodak%20Portra%20400%20film?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },
  { id: 'flux_artstation', label: 'Artstation', category: 'Flux Schnell', suffix: ', photorealistic digital art trending on Artstation 8k HD high definition detailed realistic, intricate detail, cinematic lighting with volumetric rays', image: 'https://gen.pollinations.ai/image/Digital%20art%20Artstation?model=flux&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux' },

  // FLUX.2 DEV STYLES
  { id: 'flux2_bokeh', label: '85mm Bokeh', category: 'Flux.2 Dev', suffix: ', shot on 85mm lens at f/2.0 for shallow depth of field, soft bokeh background', image: 'https://gen.pollinations.ai/image/85mm%20lens%20bokeh?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_studio', label: 'Studio Soft', category: 'Flux.2 Dev', suffix: ', soft diffused studio lighting from above, even and realistic shadows', image: 'https://gen.pollinations.ai/image/Soft%20diffused%20studio%20lighting?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_golden', label: 'Golden Ambient', category: 'Flux.2 Dev', suffix: ', golden hour ambient light with warm tones, natural outdoor realism', image: 'https://gen.pollinations.ai/image/Golden%20hour%20ambient%20light?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_overcast', label: 'Overcast', category: 'Flux.2 Dev', suffix: ', overcast natural light, even and soft, photorealistic atmosphere', image: 'https://gen.pollinations.ai/image/Overcast%20natural%20light?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_sunlight', label: 'Hard Sunlight', category: 'Flux.2 Dev', suffix: ', hard directional sunlight creating long shadows, dramatic photorealism', image: 'https://gen.pollinations.ai/image/Hard%20directional%20sunlight?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_editorial', label: 'Editorial', category: 'Flux.2 Dev', suffix: ', editorial photography style, dramatic and moody, shot on 70mm at f/2.8', image: 'https://gen.pollinations.ai/image/Editorial%20photography%20style?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_lifestyle', label: 'Lifestyle', category: 'Flux.2 Dev', suffix: ', lifestyle photography, natural and relatable, soft natural lighting', image: 'https://gen.pollinations.ai/image/Lifestyle%20photography%20natural?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_product', label: '4K Product', category: 'Flux.2 Dev', suffix: ', 4K product photography style, sharp edges, high-detail surface texture', image: 'https://gen.pollinations.ai/image/4K%20product%20photography?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_hyper', label: 'Hyper-Real', category: 'Flux.2 Dev', suffix: ', hyperrealistic, ultra-detailed texture, natural light, 50mm lens', image: 'https://gen.pollinations.ai/image/Hyperrealistic%20ultra-detailed?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },
  { id: 'flux2_film', label: '35mm Film', category: 'Flux.2 Dev', suffix: ', 35mm film look, volumetric lighting, atmospheric fog, cinematic realism', image: 'https://gen.pollinations.ai/image/35mm%20film%20look?model=flux-2-dev&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'flux-2-dev' },

  // Z-IMAGE TURBO STYLES
  { id: 'zimage_skin', label: 'Skin Detail', category: 'Z-Image Turbo', suffix: ', photorealistic, highly detailed skin, no distortion', image: 'https://gen.pollinations.ai/image/Highly%20detailed%20skin?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_dslr', label: 'DSLR Portrait', category: 'Z-Image Turbo', suffix: ', soft window light, 50mm lens, f/1.8, shallow depth of field, sharp eyes, realistic skin texture', image: 'https://gen.pollinations.ai/image/DSLR%20portrait%20soft%20light?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_product', label: 'Studio Product', category: 'Z-Image Turbo', suffix: ', soft diffused lighting, subtle shadow, ultra sharp, high resolution, no text cut off', image: 'https://gen.pollinations.ai/image/Studio%20product%20diffused%20lighting?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_landscape', label: 'Cinematic', category: 'Z-Image Turbo', suffix: ', cinematic composition, ultra high resolution, realistic colors, subtle lens flare', image: 'https://gen.pollinations.ai/image/Cinematic%20composition%20landscape?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_material', label: 'Material Realism', category: 'Z-Image Turbo', suffix: ', cinematic photorealistic, soft window daylight + warm indoor fill, subtle rim light, realistic shadows, detailed textures (fabric, skin, metal)', image: 'https://gen.pollinations.ai/image/Material%20realism%20textures?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_anatomy', label: 'Anatomical', category: 'Z-Image Turbo', suffix: ', accurate hands with five fingers, no extra fingers, no fused fingers', image: 'https://gen.pollinations.ai/image/Accurate%20hands%20anatomy?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_headshot', label: 'Headshot', category: 'Z-Image Turbo', suffix: ', 85mm lens look, soft window light from the left, neutral gray background, subtle smile', image: 'https://gen.pollinations.ai/image/Professional%20headshot%2085mm?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_wide', label: 'Wide Golden', category: 'Z-Image Turbo', suffix: ', wide-angle, golden light hitting the distant peaks, low fog, realistic colors', image: 'https://gen.pollinations.ai/image/Wide-angle%20golden%20light?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_production', label: 'Clean Production', category: 'Z-Image Turbo', suffix: ', ultra sharp, high resolution, detailed textures (fabric, skin, metal), no text, no watermark, no logo', image: 'https://gen.pollinations.ai/image/Clean%20production%20photo?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_boost', label: 'Natural Boost', category: 'Z-Image Turbo', suffix: ', natural light headshot photo style, 85mm lens look, highly detailed skin, realistic shadows', image: 'https://gen.pollinations.ai/image/Natural%20light%20boost?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_core', label: 'Core Photoreal', category: 'Z-Image Turbo', suffix: ', realistic photography, 50mm lens, shallow depth of field, soft diffused daylight, sharp focus, 4K quality, detailed but natural textures', image: 'https://gen.pollinations.ai/image/Core%20photorealism%20DSLR?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_commercial', label: 'Commercial', category: 'Z-Image Turbo', suffix: ', studio product photo, soft shadow, subtle reflection, bright neutral background, soft box lighting from top left, extremely sharp details, no hands, no people', image: 'https://gen.pollinations.ai/image/Commercial%20studio%20product?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_canon', label: 'Canon DSLR', category: 'Z-Image Turbo', suffix: ', Shot on Canon 5D with 85mm lens in studio garage or outdoor setting, soft natural afternoon light, natural metallic/rubber texture, sharp focus', image: 'https://gen.pollinations.ai/image/Shot%20on%20Canon%205D?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_leica', label: 'Leica Analog', category: 'Z-Image Turbo', suffix: ', Shot on Leica M6 with Kodak Portra 400 film grain, natural window light creating soft shadows', image: 'https://gen.pollinations.ai/image/Shot%20on%20Leica%20M6?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_night', label: 'Night Outdoor', category: 'Z-Image Turbo', suffix: ', soft-lit outdoor night background, blurred colorful distant lights, intricate details, sharp focus', image: 'https://gen.pollinations.ai/image/Night%20outdoor%20soft-lit?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_natgeo', label: 'Nat Geo', category: 'Z-Image Turbo', suffix: ', golden hour sunlight casting soft shadows, background slightly blurred, natural textures, National Geographic style documentary photography', image: 'https://gen.pollinations.ai/image/National%20Geographic%20style?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_macro', label: 'Macro Detail', category: 'Z-Image Turbo', suffix: ', hyper-detailed close-up, intricate depth of field blurring background, 8K, captured on Nikon Z8 with 105mm macro lens', image: 'https://gen.pollinations.ai/image/Macro%20detail%20close-up?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_candid', label: 'Candid Night', category: 'Z-Image Turbo', suffix: ', realistic nighttime outdoor shot, soft flash highlights on subject, background dim and slightly blurred, high realism, clean textures and accurate color tones', image: 'https://gen.pollinations.ai/image/Candid%20night%20realism?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
  { id: 'zimage_fashion', label: 'High-Fashion', category: 'Z-Image Turbo', suffix: ', soft studio-controlled lighting creates sharp contrasts and clean highlights, modern premium minimal style, emphasizing material texture', image: 'https://gen.pollinations.ai/image/High-fashion%20studio%20realism?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true', modelId: 'zimage' },
];
