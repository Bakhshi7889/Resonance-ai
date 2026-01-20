
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
  { id: 'zimage', name: 'Z-Frequency', description: 'Standard Image Engine' },
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
  { id: 'none', label: 'None', category: 'Basic', suffix: '', image: 'https://image.pollinations.ai/prompt/Clean%20minimalist%20void?model=zimage&width=256&height=384&nologo=true&seed=0' },
  
  // REALISTIC CATEGORY
  { id: 'realism', label: 'Realism', category: 'Realistic', suffix: ', RAW, hyper-realistic, 35mm film photography, warm color temperature, soft flash, slight grain, natural imperfections, editorial snapshot', image: 'https://image.pollinations.ai/prompt/Realistic%20portrait?model=zimage&width=256&height=384&nologo=true&seed=10' },
  { id: 'selfie', label: 'Phone Selfie', category: 'Realistic', suffix: ', smartphone front camera aesthetic, mild barrel distortion, natural skin texture with visible pores, soft selfie flash, 9:16 vertical feel', image: 'https://image.pollinations.ai/prompt/Phone%20selfie%20portrait?model=zimage&width=256&height=384&nologo=true&seed=1' },
  { id: 'documentary', label: 'Documentary', category: 'Realistic', suffix: ', documentary photography aesthetic, candid unposed subjects, natural environmental clutter, mixed harsh and soft shadows, authentic color', image: 'https://image.pollinations.ai/prompt/Documentary%20street%20scene?model=zimage&width=256&height=384&nologo=true&seed=2' },
  { id: 'cctv', label: 'CCTV Footage', category: 'Realistic', suffix: ', low-quality CCTV footage emulation, grainy desaturated colors, fisheye lens distortion, timestamp overlay, compressed video frame feel', image: 'https://image.pollinations.ai/prompt/CCTV%20security%20camera%20footage?model=zimage&width=256&height=384&nologo=true&seed=3' },
  { id: 'homevideo', label: 'Home Video', category: 'Realistic', suffix: ', extracted from shaky home video, slight chromatic aberration, warm indoor tungsten lighting, casual framing, visible dust particles', image: 'https://image.pollinations.ai/prompt/90s%20home%20video%20still?model=zimage&width=256&height=384&nologo=true&seed=4' },
  { id: 'drone', label: 'Drone Aerial', category: 'Realistic', suffix: ', aerial drone photography, wide-angle lens curvature, natural atmospheric haze, even sunlight, long shadows, high-altitude perspective', image: 'https://image.pollinations.ai/prompt/Drone%20view%20of%20cliffs?model=zimage&width=256&height=384&nologo=true&seed=11' },
  { id: 'clinical', label: 'Medical Photo', category: 'Realistic', suffix: ', clinical documentation style, harsh fluorescent overhead lighting, sterile white balance, detailed fabric weaves, precise composition', image: 'https://image.pollinations.ai/prompt/Medical%20photo%20of%20a%20plant?model=zimage&width=256&height=384&nologo=true&seed=12' },
  { id: 'travel', label: 'Travel Snapshot', category: 'Realistic', suffix: ', tourist handheld snapshot, slight horizon tilt, vibrant natural colors, lens flare from sun, authentic travel wear and tear', image: 'https://image.pollinations.ai/prompt/Travel%20photo%20of%20ruins?model=zimage&width=256&height=384&nologo=true&seed=13' },
  { id: 'forensic', label: 'Forensic Evidence', category: 'Realistic', suffix: ', crime scene documentation aesthetic, grid overlay, flat lighting, neutral color grading, visible markers, factual presentation', image: 'https://image.pollinations.ai/prompt/Evidence%20photo?model=zimage&width=256&height=384&nologo=true&seed=14' },
  { id: 'realestate', label: 'Real Estate', category: 'Realistic', suffix: ', wide-angle real estate interior shot, natural window light, room reflections, clean but lived-in details, no staging effects', image: 'https://image.pollinations.ai/prompt/Modern%20living%20room%20interior?model=zimage&width=256&height=384&nologo=true&seed=5' },
  { id: 'cinematic', label: 'Cinematic Noir', category: 'Realistic', suffix: ', cinematic contrast, soft highlight, volumetric lighting, rim light, golden hour, deep chiaroscuro, atmospheric fog', image: 'https://image.pollinations.ai/prompt/Cinematic%20movie%20shot?model=zimage&width=256&height=384&nologo=true&seed=6' },
  { id: 'vintage', label: 'Vintage Grain', category: 'Realistic', suffix: ', overexposed grainy polaroid, cross-processed film, warm tones, soft cinematic grain, muted colors, paparazzi aesthetic', image: 'https://image.pollinations.ai/prompt/Vintage%20film%20photo?model=zimage&width=256&height=384&nologo=true&seed=15' },
  { id: 'y2k', label: 'Y2K Digital', category: 'Realistic', suffix: ', early 2000s digital camera emulation, low megapixel resolution, chroma noise, overexposed highlights, pixelated edges, nostalgic texture', image: 'https://image.pollinations.ai/prompt/Y2K%20digital%20camera%20photo?model=zimage&width=256&height=384&nologo=true&seed=16' },
  { id: 'modernsmartphone', label: 'Modern Phone', category: 'Realistic', suffix: ', iPhone-style rear camera photo, shallow depth of field, natural HDR, subtle sharpening halos, unfiltered social media aesthetic', image: 'https://image.pollinations.ai/prompt/Smartphone%20HDR%20photo?model=zimage&width=256&height=384&nologo=true&seed=26' },

  // ARTISTIC CATEGORY
  { id: '3d', label: '3D Miniature', category: 'Artistic', suffix: ', isometric 3D cube-shaped miniature, volumetric lighting, realistic reflections, colored shadows, ultra-detailed', image: 'https://image.pollinations.ai/prompt/3d%20isometric%20room?model=zimage&width=256&height=384&nologo=true&seed=8' },
  { id: 'painterly', label: 'Painterly', category: 'Artistic', suffix: ', in the style of oil painting, illustration, soft brush strokes, warm tones, muted colors, high-key studio lighting', image: 'https://image.pollinations.ai/prompt/Oil%20painting%20portrait?model=zimage&width=256&height=384&nologo=true&seed=17' },
  { id: 'cartoon', label: 'Playful Cartoon', category: 'Artistic', suffix: ', lovely cartoon style, colorful ultra-minimalistic, smooth colors, symmetric, playful doodle, soft texture', image: 'https://image.pollinations.ai/prompt/Cartoon%20character?model=zimage&width=256&height=384&nologo=true&seed=18' },
  { id: 'surreal', label: 'Surreal Dream', category: 'Artistic', suffix: ', dreamlike haze, floating elements, impossible geometries, ethereal glow, muted psychedelic tones, atmospheric depth', image: 'https://image.pollinations.ai/prompt/Surreal%20dreamscape?model=zimage&width=256&height=384&nologo=true&seed=19' },
  { id: 'abstract', label: 'Abstract Block', category: 'Artistic', suffix: ', geometric abstraction, interlocking shapes, clean lines, balanced asymmetry, primary color blocks, flat depth', image: 'https://image.pollinations.ai/prompt/Abstract%20geometry?model=zimage&width=256&height=384&nologo=true&seed=20' },
  { id: 'minimalist', label: 'Minimalist', category: 'Artistic', suffix: ', minimalist composition, negative space dominant, monochromatic palette, clean silhouettes, soft ambient light', image: 'https://image.pollinations.ai/prompt/Minimalist%20nature?model=zimage&width=256&height=384&nologo=true&seed=21' },
  { id: 'fantasy', label: 'Magic Fantasy', category: 'Artistic', suffix: ', magical aura, enchanted glows, mythical elements, soft particle effects, warm fantasy tones, whimsical distortions', image: 'https://image.pollinations.ai/prompt/Fantasy%20forest?model=zimage&width=256&height=384&nologo=true&seed=22' },
  { id: 'anime', label: 'Anime Ghibli', category: 'Artistic', suffix: ', studio ghibli style, detailed hand-painted backgrounds, soft lighting, vibrant 2d animation aesthetic', image: 'https://image.pollinations.ai/prompt/Anime%20scenery?model=zimage&width=256&height=384&nologo=true&seed=7' },

  // THEMATIC CATEGORY
  { id: 'futuristic', label: 'Neon Future', category: 'Thematic', suffix: ', cosmic gradient, glowing edges, motion blur, clean grid, neon blue glow, atmospheric haze, 8K realism', image: 'https://image.pollinations.ai/prompt/Futuristic%20cityscape?model=zimage&width=256&height=384&nologo=true&seed=23' },
  { id: 'fashion', label: 'High Fashion', category: 'Thematic', suffix: ', glamorous makeup, smoky eyes, luxurious interior, satin textures, high-fashion editorial pose', image: 'https://image.pollinations.ai/prompt/High%20fashion%20model?model=zimage&width=256&height=384&nologo=true&seed=24' },
  { id: 'horror', label: 'Horror Moody', category: 'Thematic', suffix: ', eerie shadows, distorted perspectives, creeping fog, desaturated tones, tense composition, low-key lighting', image: 'https://image.pollinations.ai/prompt/Horror%20scene?model=zimage&width=256&height=384&nologo=true&seed=25' }
];
