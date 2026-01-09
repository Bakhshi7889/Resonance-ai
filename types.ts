
export interface ImageGenerationParams {
  prompt: string;
  model: string;
  width: number;
  height: number;
  seed: number;
  enhance: boolean;
  nologo: boolean;
  negativePrompt?: string;
  apiKey?: string;
  safe: boolean;
  private: boolean;
  transparent: boolean;
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
  guidance: number;
  privateMode: boolean;
  negativePrompt: string;
  imageCount: number;
  activeStyle: string;
  apiKey: string;
  safe: boolean;
  transparent: boolean;
}

export enum AppRoute {
  GENERATOR = 'generator',
  HISTORY = 'history',
  PREFERENCES = 'preferences',
  CREATE_PRESET = 'create_preset',
  STYLE_LIBRARY = 'style_library'
}

export const AVAILABLE_MODELS = [
  { id: 'flux', name: 'Flux Schnell', description: 'Fastest, state-of-the-art', image: 'https://image.pollinations.ai/prompt/A%20portrait%20of%20a%20woman%20shot%20on%2035mm%20camera?model=flux&width=256&height=256&seed=101&nologo=true' },
  { id: 'zimage', name: 'Z-Image', description: 'High fidelity artistic', image: 'https://image.pollinations.ai/prompt/A%20portrait%20of%20a%20woman%20shot%20on%2035mm%20camera?model=zimage&width=256&height=256&seed=101&nologo=true' },
];

export const ASPECT_RATIOS = [
  { label: '1:1', width: 1024, height: 1024 },
  { label: '3:4', width: 768, height: 1024 },
  { label: '4:3', width: 1024, height: 768 },
  { label: '16:9', width: 1280, height: 720 },
  { label: '9:16', width: 720, height: 1280 },
];

export const MODEL_STYLES = [
  {
    "id": "flux-realism",
    "model": "flux",
    "label": "Realism",
    "image": "https://image.pollinations.ai/prompt/A%20portrait%20of%20a%20woman%2C%20RAW%2C%20hyper-realistic%2C%2035mm%20film%20photography?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", RAW, hyper-realistic, 35mm film photography, warm color temperature, soft on-camera flash, slight grain, natural imperfections, no retouching, editorial aesthetic"
  },
  {
    "id": "flux-candid",
    "model": "flux",
    "label": "Candid",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20laughing%20with%20friends%2C%20spontaneous%20pose%2C%20mixed%20lighting?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Shot with a handheld DSLR or phone, mixed lighting from environment, soft focus on background elements, realistic shadows and reflections, no airbrushing, everyday authenticity"
  },
  {
    "id": "flux-selfie",
    "model": "flux",
    "label": "Selfie",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20taking%20a%20selfie%2C%20smartphone%20front%20camera%2C%20natural%20skin%20texture?model=flux&width=256&height=384&nologo=true&seed=301555&key=pk_BnmABucSE1VNCWRT&enhance=true",
    "suffix": ", Smartphone front camera aesthetic, mild barrel distortion, slightly off-center composition, soft flash mixed with ambient light, slight motion blur on edges, JPEG compression artifacts, low-res feel"
  },
  {
    "id": "polaroid",
    "model": "flux",
    "label": "Polaroid",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20sitting%20in%20a%20vintage%20car%2C%20polaroid%20style?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", raw photo, dynamic contrast, polaroid style"
  },
  {
    "id": "cinematic",
    "model": "flux",
    "label": "Cinematic",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20walking%20down%20a%20rainy%20city%20street%20at%20night%2C%20cinematic%20lighting%2C%20sharp%20focus?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", hyper-realistic, cinematic lighting, DSLR shot, sharp focus"
  },
  {
    "id": "cyberpunk",
    "model": "flux",
    "label": "Cyberpunk",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20cyborg%20in%20a%20neon%20city%2C%20neon%20outline%20glow%2C%20cyberpunk%20luxury?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", neon outline glow, cyberpunk luxury, digital render"
  },
  {
    "id": "ukiyo-e",
    "model": "flux",
    "label": "Ukiyo-e",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20in%20traditional%20robes%20watching%20the%20great%20wave%2C%20ukiyo-e%20woodblock%20print%20style?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", ukiyo-e woodblock print style, flat inked color planes, bold black linework"
  },
  {
    "id": "3d-chibi",
    "model": "flux",
    "label": "3D Chibi",
    "image": "https://image.pollinations.ai/prompt/A%20cute%20chibi%20woman%2C%20chibi%20style%203d%20render?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", chibi style, 3D render, cute proportions"
  },
  {
    "id": "z-real",
    "model": "zimage",
    "label": "Realism",
    "image": "https://image.pollinations.ai/prompt/A%20portrait%20of%20a%20woman%2C%20hyper-realistic%2035mm%20film?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", RAW, hyper-realistic, 35mm film photography, warm color temperature, soft on-camera flash, slight grain, natural imperfections, no retouching, editorial aesthetic"
  },
  {
    "id": "z-candid",
    "model": "zimage",
    "label": "Candid",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20walking%20in%20the%20street%2C%20spontaneous%20pose%2C%20mixed%20lighting?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Shot with a handheld DSLR or phone, mixed lighting from environment, soft focus on background elements, realistic shadows and reflections, no airbrushing, everyday authenticity"
  },
  {
    "id": "z-selfie",
    "model": "zimage",
    "label": "Selfie",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20taking%20a%20mirror%20selfie%2C%20smartphone%20aesthetic?model=zimage&width=256&height=384&nologo=true&seed=478505&key=pk_BnmABucSE1VNCWRT&enhance=true",
    "suffix": ", Smartphone front camera aesthetic, mild barrel distortion, slightly off-center composition, soft flash mixed with ambient light, slight motion blur on edges, JPEG compression artifacts, low-res feel"
  },
  {
    "id": "z-modern-phone",
    "model": "zimage",
    "label": "iPhone",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20holding%20a%20coffee%20cup%2C%20iphone%20camera%20photo?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", iPhone-style rear camera photo, shallow depth of field with bokeh, natural HDR tone mapping, subtle sharpening halos around edges, soft window light, slight vignette, 9:16 vertical aspect ratio, unfiltered social media aesthetic"
  },
  {
    "id": "z-noir",
    "model": "zimage",
    "label": "Film Noir",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20detective%20in%20rain%2C%20film%20noir%20style%20black%20and%20white?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Cinematic contrast, volumetric lighting, rim light, golden hour, deep chiaroscuro, atmospheric fog, black and white photography"
  },
  {
    "id": "z-vintage",
    "model": "zimage",
    "label": "Vintage",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20standing%20in%20front%20of%20an%20old%20house%2C%20vintage%20polaroid?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Overexposed grainy polaroid, cross-processed film, warm tones, soft cinematic grain, muted colors, film grain, vintage aesthetic"
  },
  {
    "id": "z-night",
    "model": "zimage",
    "label": "Night Mode",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20under%20city%20lights%20at%20night%2C%20night%20mode%20photo?model=zimage&width=256&height=384&nologo=true&seed=768299&key=pk_BnmABucSE1VNCWRT&enhance=true",
    "suffix": ", Nighttime phone camera capture, high ISO noise speckle in dark areas, edge-aware denoising smear on details, warm streetlight glow with color fringing, handheld shake blur, compressed shadows, realistic lens flare from lights, moody unedited vibe"
  },
  {
    "id": "z-surreal",
    "model": "zimage",
    "label": "Surreal",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20floating%20among%20surreal%20islands%2C%20surreal%20dreamlike?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Dreamlike haze, floating elements, impossible geometries, ethereal glow, soft surreal distortions, muted psychedelic tones, atmospheric depth, subtle color bleed, no harsh edges"
  },
  {
    "id": "z-neon",
    "model": "zimage",
    "label": "Neon",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20with%20neon%20face%20paint%2C%20neon%20glow%20dark%20mode?model=zimage&width=256&height=384&nologo=true&seed=674342&key=pk_BnmABucSE1VNCWRT&enhance=true",
    "suffix": ", Dark mode, cosmic gradient, glowing edges, motion blur, clean grid, neon blue glow, atmospheric haze, high contrast, 8K realism"
  },
  {
    "id": "z-cyber",
    "model": "zimage",
    "label": "Cyberpunk",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20in%20a%20future%20city%20street%2C%20cyberpunk%20style?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Cyberpunk neon vibrancy, holographic projections, rain-slicked streets, high-tech gadgets, cool blue-purple tones, reflective surfaces, dynamic motion blur"
  },
  {
    "id": "z-cartoon",
    "model": "zimage",
    "label": "Cartoon",
    "image": "https://image.pollinations.ai/prompt/A%20cartoon%20woman%2C%20cartoon%20style?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Exquisite 3D image, lovely cartoon style, colorful ultra-minimalistic, smooth colors, symmetric, playful doodle, soft texture, simple composition, sticker style logo"
  },
  {
    "id": "z-horror",
    "model": "zimage",
    "label": "Horror",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20standing%20in%20a%20dark%20forest%2C%20horror%20creepy?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Eerie shadows, distorted perspectives, creeping fog, desaturated tones, subtle horror elements, subtle tension"
  }
];
