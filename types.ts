
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
  batchId?: string;
  timestamp: number;
  url: string;
  prompt: string;
  styleSuffix?: string; // The specific keywords added by the style
  // ... extends ImageGenerationParams
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
}

export enum AppRoute {
  GENERATOR = 'generator',
  HISTORY = 'history',
  PREFERENCES = 'preferences'
}

export const AVAILABLE_MODELS = [
  { id: 'zimage', name: 'Z-Image', description: 'Poly-modal Synthesis' },
];

export const ASPECT_RATIOS = [
  { label: '1:1', width: 1024, height: 1024 },
  { label: '3:4', width: 768, height: 1024 },
  { label: '4:3', width: 1024, height: 768 },
  { label: '16:9', width: 1280, height: 720 },
  { label: '9:16', width: 720, height: 1280 },
];

export const MODEL_STYLES = [
  // NONE OPTION (FIRST)
  { id: 'none', label: 'None', category: 'Basic', suffix: '', image: 'https://gen.pollinations.ai/image/Clean%20minimalist%20void?model=zimage&width=256&height=384&nologo=true&seed=0&safe=true' },
  
  // REALISTIC CATEGORY
  { id: 'realism', label: 'Realism', category: 'Realistic', suffix: ', RAW, hyper-realistic, 35mm film photography, warm color temperature, soft flash, slight grain, natural imperfections, editorial snapshot', image: 'https://gen.pollinations.ai/image/Realistic%20portrait?model=zimage&width=256&height=384&nologo=true&seed=10&safe=true' },
  { id: 'selfie', label: 'Phone Selfie', category: 'Realistic', suffix: ', smartphone front camera aesthetic, mild barrel distortion, natural skin texture with visible pores, soft selfie flash, 9:16 vertical feel', image: 'https://gen.pollinations.ai/image/Phone%20selfie%20portrait?model=zimage&width=256&height=384&nologo=true&seed=1&safe=true' },
  { id: 'documentary', label: 'Documentary', category: 'Realistic', suffix: ', documentary photography aesthetic, candid unposed subjects, natural environmental clutter, mixed harsh and soft shadows, authentic color', image: 'https://gen.pollinations.ai/image/Documentary%20street%20scene?model=zimage&width=256&height=384&nologo=true&seed=2&safe=true' },
  { id: 'cctv', label: 'CCTV Footage', category: 'Realistic', suffix: ', low-quality CCTV footage emulation, grainy desaturated colors, fisheye lens distortion, timestamp overlay, compressed video frame feel', image: 'https://gen.pollinations.ai/image/CCTV%20security%20camera%20footage?model=zimage&width=256&height=384&nologo=true&seed=3&safe=true' },
  { id: 'homevideo', label: 'Home Video', category: 'Realistic', suffix: ', extracted from shaky home video, slight chromatic aberration, warm indoor tungsten lighting, casual framing, visible dust particles', image: 'https://gen.pollinations.ai/image/90s%20home%20video%20still?model=zimage&width=256&height=384&nologo=true&seed=4&safe=true' },
  { id: 'drone', label: 'Drone Aerial', category: 'Realistic', suffix: ', aerial drone photography, wide-angle lens curvature, natural atmospheric haze, even sunlight, long shadows, high-altitude perspective', image: 'https://gen.pollinations.ai/image/Drone%20view%20of%20cliffs?model=zimage&width=256&height=384&nologo=true&seed=11&safe=true' },
  { id: 'clinical', label: 'Medical Photo', category: 'Realistic', suffix: ', clinical documentation style, harsh fluorescent overhead lighting, sterile white balance, detailed fabric weaves, precise composition', image: 'https://gen.pollinations.ai/image/Medical%20photo%20of%20a%20plant?model=zimage&width=256&height=384&nologo=true&seed=12&safe=true' },
  { id: 'travel', label: 'Travel Snapshot', category: 'Realistic', suffix: ', tourist handheld snapshot, slight horizon tilt, vibrant natural colors, lens flare from sun, authentic travel wear and tear', image: 'https://gen.pollinations.ai/image/Travel%20photo%20of%20ruins?model=zimage&width=256&height=384&nologo=true&seed=13&safe=true' },
  { id: 'forensic', label: 'Forensic Evidence', category: 'Realistic', suffix: ', crime scene documentation aesthetic, grid overlay, flat lighting, neutral color grading, visible markers, factual presentation', image: 'https://gen.pollinations.ai/image/Evidence%20photo?model=zimage&width=256&height=384&nologo=true&seed=14&safe=true' },
  { id: 'realestate', label: 'Real Estate', category: 'Realistic', suffix: ', wide-angle real estate interior shot, natural window light, room reflections, clean but lived-in details, no staging effects', image: 'https://gen.pollinations.ai/image/Modern%20living%20room%20interior?model=zimage&width=256&height=384&nologo=true&seed=5&safe=true' },
  { id: 'cinematic', label: 'Cinematic Noir', category: 'Realistic', suffix: ', cinematic contrast, soft highlight, volumetric lighting, rim light, golden hour, deep chiaroscuro, atmospheric haze', image: 'https://gen.pollinations.ai/image/Cinematic%20movie%20shot?model=zimage&width=256&height=384&nologo=true&seed=6&safe=true' },
  { id: 'vintage', label: 'Vintage Grain', category: 'Realistic', suffix: ', overexposed grainy polaroid, cross-processed film, warm tones, soft cinematic grain, muted colors, paparazzi aesthetic', image: 'https://gen.pollinations.ai/image/Vintage%20film%20photo?model=zimage&width=256&height=384&nologo=true&seed=15&safe=true' },
  { id: 'y2k', label: 'Y2K Digital', category: 'Realistic', suffix: ', early 2000s digital camera emulation, low megapixel resolution, chroma noise, overexposed highlights, pixelated edges, nostalgic texture', image: 'https://gen.pollinations.ai/image/Y2K%20digital%20camera%20photo?model=zimage&width=256&height=384&nologo=true&seed=16&safe=true' },
  { id: 'modernsmartphone', label: 'Modern Phone', category: 'Realistic', suffix: ', iPhone-style rear camera photo, shallow depth of field, natural HDR, subtle sharpening halos, unfiltered social media aesthetic', image: 'https://gen.pollinations.ai/image/Smartphone%20HDR%20photo?model=zimage&width=256&height=384&nologo=true&seed=26&safe=true' },

  // ARTISTIC CATEGORY
  { id: '3d', label: '3D Miniature', category: 'Artistic', suffix: ', isometric 3D cube-shaped miniature, volumetric lighting, realistic reflections, colored shadows, ultra-detailed', image: 'https://gen.pollinations.ai/image/3d%20isometric%20room?model=zimage&width=256&height=384&nologo=true&seed=8&safe=true' },
  { id: 'painterly', label: 'Painterly', category: 'Artistic', suffix: ', in the style of oil painting, illustration, soft brush strokes, warm tones, muted colors, high-key studio lighting', image: 'https://gen.pollinations.ai/image/Oil%20painting%20portrait?model=zimage&width=256&height=384&nologo=true&seed=17&safe=true' },
  { id: 'cartoon', label: 'Playful Cartoon', category: 'Artistic', suffix: ', lovely cartoon style, colorful ultra-minimalistic, smooth colors, symmetric, playful doodle, soft texture', image: 'https://gen.pollinations.ai/image/Cartoon%20character?model=zimage&width=256&height=384&nologo=true&seed=18&safe=true' },
  { id: 'surreal', label: 'Surreal Dream', category: 'Artistic', suffix: ', dreamlike haze, floating elements, impossible geometries, ethereal glow, muted psychedelic tones, atmospheric depth', image: 'https://gen.pollinations.ai/image/Surreal%20dreamscape?model=zimage&width=256&height=384&nologo=true&seed=19&safe=true' },
  { id: 'abstract', label: 'Abstract Block', category: 'Artistic', suffix: ', geometric abstraction, interlocking shapes, clean lines, balanced asymmetry, primary color blocks, flat depth', image: 'https://gen.pollinations.ai/image/Abstract%20geometry?model=zimage&width=256&height=384&nologo=true&seed=20&safe=true' },
  { id: 'minimalist', label: 'Minimalist', category: 'Artistic', suffix: ', minimalist composition, negative space dominant, monochromatic palette, clean silhouettes, soft ambient light', image: 'https://gen.pollinations.ai/image/Minimalist%20nature?model=zimage&width=256&height=384&nologo=true&seed=21&safe=true' },
  { id: 'fantasy', label: 'Magic Fantasy', category: 'Artistic', suffix: ', magical aura, enchanted glows, mythical elements, soft particle effects, warm fantasy tones, whimsical distortions', image: 'https://gen.pollinations.ai/image/Fantasy%20forest?model=zimage&width=256&height=384&nologo=true&seed=22&safe=true' },
  { id: 'anime', label: 'Anime Ghibli', category: 'Artistic', suffix: ', studio ghibli style, detailed hand-painted backgrounds, soft lighting, vibrant 2d animation aesthetic', image: 'https://gen.pollinations.ai/image/Anime%20scenery?model=zimage&width=256&height=384&nologo=true&seed=7&safe=true' },

  // THEMATIC CATEGORY
  { id: 'futuristic', label: 'Neon Future', category: 'Thematic', suffix: ', cosmic gradient, glowing edges, motion blur, clean grid, neon blue glow, atmospheric haze, 8K realism', image: 'https://gen.pollinations.ai/image/Futuristic%20cityscape?model=zimage&width=256&height=384&nologo=true&seed=23&safe=true' },
  { id: 'fashion', label: 'High Fashion', category: 'Thematic', suffix: ', glamorous makeup, smoky eyes, luxurious interior, satin textures, high-fashion editorial pose', image: 'https://gen.pollinations.ai/image/High%20fashion%20model?model=zimage&width=256&height=384&nologo=true&seed=24&safe=true' },
  { id: 'horror', label: 'Horror Moody', category: 'Thematic', suffix: ', eerie shadows, distorted perspectives, creeping fog, desaturated tones, tense composition, low-key lighting', image: 'https://gen.pollinations.ai/image/Horror%20scene?model=zimage&width=256&height=384&nologo=true&seed=25&safe=true' }
];
