
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
}

export interface CustomStyle {
  id: string;
  label: string;
  category: string;
  suffix: string;
  image: string;
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
  { label: '1:1', width: 1024, height: 1024 },
  { label: '3:4', width: 896, height: 1152 },
  { label: '4:3', width: 1152, height: 896 },
  { label: '16:9', width: 1280, height: 720 },
  { label: '9:16', width: 720, height: 1280 },
];

export const MODEL_STYLES = [
  // NONE OPTION (FIRST)
  { id: 'none', label: 'None', category: 'Basic', suffix: '', image: 'https://gen.pollinations.ai/image/Clean%20minimalist%20void?model=zimage&width=256&height=384&nologo=true&seed=0&safe=true' },
  
  // NEW STYLES
  { id: 'cyberpunk', label: 'Cyberpunk', category: 'Thematic', suffix: ', cyberpunk aesthetic, neon rain, high tech low life, chrome reflections, futuristic city street, blue and pink volumetric lighting', image: 'https://gen.pollinations.ai/image/Cyberpunk%20street?model=zimage&width=256&height=384&nologo=true&seed=42&safe=true' },
  { id: 'steampunk', label: 'Steampunk', category: 'Thematic', suffix: ', steampunk aesthetic, brass gears, copper pipes, victorian fashion, steam engine atmosphere, warm sepia tones, intricate mechanical details', image: 'https://gen.pollinations.ai/image/Steampunk%20machine?model=zimage&width=256&height=384&nologo=true&seed=43&safe=true' },
  { id: 'watercolor', label: 'Watercolor', category: 'Artistic', suffix: ', watercolor painting, soft bleeding colors, textured paper, wet-on-wet technique, artistic splashes, dreamy atmosphere', image: 'https://gen.pollinations.ai/image/Watercolor%20flower?model=zimage&width=256&height=384&nologo=true&seed=44&safe=true' },
  { id: 'synthwave', label: 'Synthwave', category: 'Thematic', suffix: ', synthwave aesthetic, retro 80s style, neon grid, sunset, palm trees, purple and orange gradient, digital horizon', image: 'https://gen.pollinations.ai/image/Synthwave%20landscape?model=zimage&width=256&height=384&nologo=true&seed=45&safe=true' },
  { id: 'inkwash', label: 'Ink Wash', category: 'Artistic', suffix: ', sumi-e ink wash painting, expressive black brush strokes, negative space, minimalistic, traditional asian art style', image: 'https://gen.pollinations.ai/image/Ink%20wash%20mountain?model=zimage&width=256&height=384&nologo=true&seed=46&safe=true' },
  { id: 'lowpoly', label: 'Low Poly', category: 'Artistic', suffix: ', low poly 3d render, geometric shapes, flat shading, vibrant colors, minimal detail, sharp edges', image: 'https://gen.pollinations.ai/image/Low%20poly%20animal?model=zimage&width=256&height=384&nologo=true&seed=47&safe=true' },
  { id: 'pixelart', label: 'Pixel Art', category: 'Artistic', suffix: ', 16-bit pixel art, retro game sprite, limited color palette, dithering, blocky details, nostalgic', image: 'https://gen.pollinations.ai/image/Pixel%20art%20character?model=zimage&width=256&height=384&nologo=true&seed=48&safe=true' },
  { id: 'claymation', label: 'Claymation', category: 'Artistic', suffix: ', claymation style, plasticine texture, stop motion aesthetic, fingerprint details, soft lighting, handmade feel', image: 'https://gen.pollinations.ai/image/Claymation%20figure?model=zimage&width=256&height=384&nologo=true&seed=49&safe=true' },
  { id: 'graffiti', label: 'Graffiti', category: 'Artistic', suffix: ', street art graffiti, spray paint texture, vibrant urban colors, drip effects, mural style, concrete wall background', image: 'https://gen.pollinations.ai/image/Graffiti%20art?model=zimage&width=256&height=384&nologo=true&seed=50&safe=true' },
  { id: 'blueprint', label: 'Blueprint', category: 'Thematic', suffix: ', technical blueprint drawing, white lines on blue paper, schematic details, architectural measurements, grid background', image: 'https://gen.pollinations.ai/image/Blueprint%20schematic?model=zimage&width=256&height=384&nologo=true&seed=51&safe=true' },

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
  { id: 'horror', label: 'Horror Moody', category: 'Thematic', suffix: ', eerie shadows, distorted perspectives, creeping fog, desaturated tones, tense composition, low-key lighting', image: 'https://gen.pollinations.ai/image/Horror%20scene?model=zimage&width=256&height=384&nologo=true&seed=25&safe=true' },

  // TURBO OPTIMIZED STYLES (NEW / UPDATED)
  { id: 'realism_turbo', label: 'Realism (Turbo)', category: 'Turbo', suffix: ', photorealistic, ultra-detailed skin texture and pores, natural lighting, shot on Canon EOS R5 85mm f/1.8 lens, shallow depth of field, bokeh, 8K resolution, sharp focus, intricate details', image: 'https://gen.pollinations.ai/image/Hyper-realistic%20portrait%208k?model=zimage&width=256&height=384&nologo=true&seed=100&safe=true' },
  { id: 'cinematic_turbo', label: 'Cinematic (Turbo)', category: 'Turbo', suffix: ', cinematic composition, dramatic key light, high-end magazine cover, professional studio lighting, eye-level shot, leading lines, shallow depth of field, volumetric god rays', image: 'https://gen.pollinations.ai/image/Cinematic%20masterpiece%20lighting?model=zimage&width=256&height=384&nologo=true&seed=101&safe=true' },
  { id: 'oil_painting_turbo', label: 'Oil Painting (Turbo)', category: 'Turbo', suffix: ', oil painting on canvas, visible brush strokes, textured impasto, rich earthy palette, classical European portraiture, museum-grade fine art, expressive detail', image: 'https://gen.pollinations.ai/image/Classical%20oil%20painting?model=zimage&width=256&height=384&nologo=true&seed=102&safe=true' },
  { id: 'anime_turbo', label: 'Anime (Turbo)', category: 'Turbo', suffix: ', anime-style illustration, sharp line art, cel-shaded coloring, vibrant colors, dynamic perspective, studio-quality key visual, smoothmixanime', image: 'https://gen.pollinations.ai/image/High%20quality%20anime%20key%20visual?model=zimage&width=256&height=384&nologo=true&seed=103&safe=true' },
  { id: 'painterly_turbo', label: 'Painterly (Turbo)', category: 'Turbo', suffix: ', painterly style, high-end artbook illustration, rich color palette, epic atmosphere, soft god rays, intricate foliage', image: 'https://gen.pollinations.ai/image/Epic%20fantasy%20painterly%20art?model=zimage&width=256&height=384&nologo=true&seed=104&safe=true' },
  { id: 'watercolor_turbo', label: 'Watercolor (Turbo)', category: 'Turbo', suffix: ', watercolor painting, soft washes, delicate flowing lines, gentle pastel colors, peaceful magical mood, translucent layers', image: 'https://gen.pollinations.ai/image/Delicate%20watercolor%20landscape?model=zimage&width=256&height=384&nologo=true&seed=105&safe=true' },
  { id: 'vintage_turbo', label: 'Vintage (Turbo)', category: 'Turbo', suffix: ', vintage 35mm film, light grain, warm tones, nostalgic atmosphere, shot on Kodak Portra, 8k resolution, sharp focus', image: 'https://gen.pollinations.ai/image/Vintage%2035mm%20film%20photo?model=zimage&width=256&height=384&nologo=true&seed=106&safe=true' },
  { id: 'surreal_turbo', label: 'Surreal (Turbo)', category: 'Turbo', suffix: ', surreal dreamlike atmosphere, impossible geometry, floating ethereal elements, melting organic forms, vibrant contrasting dreamscape, otherworldly haze, layered transparent realities', image: 'https://gen.pollinations.ai/image/Surreal%20dreamscape%20impossible%20geometry?model=zimage&width=256&height=384&nologo=true&seed=107&safe=true' },
  { id: 'ghibli_turbo', label: 'Ghibli (Turbo)', category: 'Turbo', suffix: ', studio ghibli hand-drawn animation style, soft pastel whimsical palette, lush magical backgrounds, gentle glowing atmosphere, delicate line work', image: 'https://gen.pollinations.ai/image/Whimsical%20ghibli%20forest?model=zimage&width=256&height=384&nologo=true&seed=108&safe=true' },
  { id: 'minimalist_turbo', label: 'Minimalist (Turbo)', category: 'Turbo', suffix: ', minimalist negative space, clean geometric flat design, muted simple palette, uncluttered modern lines, bold symmetry', image: 'https://gen.pollinations.ai/image/Minimalist%20geometric%20design?model=zimage&width=256&height=384&nologo=true&seed=109&safe=true' },
  { id: 'isometric_turbo', label: 'Isometric (Turbo)', category: 'Turbo', suffix: ', isometric axonometric view, intricate layered perspective, precise mechanical details, technical blueprint clarity', image: 'https://gen.pollinations.ai/image/Isometric%20mechanical%20room?model=zimage&width=256&height=384&nologo=true&seed=110&safe=true' },
  { id: 'double_exposure', label: 'Double Exposure', category: 'Turbo', suffix: ', double exposure layered blend, transparent overlapping scenes, artistic multiple exposure effect, soft ghosting transitions', image: 'https://gen.pollinations.ai/image/Double%20exposure%20art?model=zimage&width=256&height=384&nologo=true&seed=111&safe=true' },
  { id: 'vector_graphic', label: 'Vector Graphic', category: 'Turbo', suffix: ', clean vector illustration, bold flat colors, sharp modern outlines, graphic design precision', image: 'https://gen.pollinations.ai/image/Clean%20vector%20graphic?model=zimage&width=256&height=384&nologo=true&seed=112&safe=true' },
  { id: 'pastel_gouache', label: 'Pastel Gouache', category: 'Turbo', suffix: ', soft pastel gouache painting, blended textured washes, delicate paper grain feel, gentle diffused edges', image: 'https://gen.pollinations.ai/image/Soft%20gouache%20painting?model=zimage&width=256&height=384&nologo=true&seed=113&safe=true' },
  { id: 'chiaroscuro', label: 'Chiaroscuro', category: 'Turbo', suffix: ', chiaroscuro dramatic light-shadow play, high contrast renaissance illumination, deep moody gradients', image: 'https://gen.pollinations.ai/image/Chiaroscuro%20lighting%20portrait?model=zimage&width=256&height=384&nologo=true&seed=114&safe=true' },
  { id: 'volumetric', label: 'Volumetric', category: 'Turbo', suffix: ', volumetric god rays, dappled sunlight haze, soft diffused fog layers, ethereal backlit mist', image: 'https://gen.pollinations.ai/image/Volumetric%20lighting%20mist?model=zimage&width=256&height=384&nologo=true&seed=115&safe=true' },
  { id: 'macro', label: 'Macro Photo', category: 'Turbo', suffix: ', macro extreme close-up, intricate micro textures, shallow depth of field bokeh, hyper-detailed surfaces', image: 'https://gen.pollinations.ai/image/Macro%20texture%20detail?model=zimage&width=256&height=384&nologo=true&seed=116&safe=true' },
  { id: 'papercraft', label: 'Papercraft', category: 'Turbo', suffix: ', paper craft collage texture, holographic iridescent shine, glossy reflective surfaces, translucent layered glass, nostalgic retro poster grain, cloud art soft blending, silhouette dramatic outline', image: 'https://gen.pollinations.ai/image/Intricate%20papercraft%20art?model=zimage&width=256&height=384&nologo=true&seed=117&safe=true' },
  { id: 'masterpiece', label: 'Masterpiece', category: 'Turbo', suffix: ', masterpiece, best quality, ultra-detailed, sharp focus, intricate details, 8K UHD, highly detailed textures, volumetric lighting', image: 'https://gen.pollinations.ai/image/Masterpiece%20ultra%20detailed?model=zimage&width=256&height=384&nologo=true&seed=118&safe=true' }
];
