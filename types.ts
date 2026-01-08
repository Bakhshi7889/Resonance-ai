
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

// Helper to generate preview URLs consistently
const getPreview = (prompt: string, model: string, suffix: string) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + suffix)}?model=${model}&width=256&height=384&nologo=true&seed=42`;

export const MODEL_STYLES = [
  // Flux Styles
  { id: 'flux-realism', model: 'flux', label: 'Realism', image: getPreview('A portrait of a woman', 'flux', ', RAW, hyper-realistic, 35mm film photography'), suffix: ', RAW, hyper-realistic, 35mm film photography, warm color temperature, soft on-camera flash, slight grain, natural imperfections, no retouching, editorial intimate snapshot' },
  { id: 'flux-candid', model: 'flux', label: 'Candid', image: getPreview('A woman laughing with friends', 'flux', ', spontaneous pose, mixed lighting'), suffix: ', Shot by a friend with a handheld DSLR or phone, spontaneous pose with natural movement, mixed lighting from environment, visible flyaway hairs and clothing wrinkles, soft focus on background elements, realistic shadows and reflections, no airbrushing, everyday authenticity' },
  { id: 'flux-selfie', model: 'flux', label: 'Selfie', image: getPreview('A woman taking a selfie', 'flux', ', smartphone front camera, natural skin texture'), suffix: ', Smartphone front camera aesthetic, mild barrel distortion, slightly off-center composition, natural skin texture with visible pores and freckles, casual expression, soft selfie flash mixed with ambient light, slight motion blur on edges, JPEG compression artifacts, low-res feel but sharp focus on face' },
  { id: 'polaroid', model: 'flux', label: 'Polaroid', image: getPreview('A woman sitting in a vintage car', 'flux', ', polaroid style'), suffix: ', raw photo, dynamic contrast, polaroid style' },
  { id: 'cinematic', model: 'flux', label: 'Cinematic', image: getPreview('A woman walking down a rainy city street at night', 'flux', ', cinematic lighting, sharp focus'), suffix: ', hyper-realistic, cinematic lighting, DSLR shot, sharp focus' },
  { id: 'cyberpunk', model: 'flux', label: 'Cyberpunk', image: getPreview('A woman cyborg in a neon city', 'flux', ', neon outline glow, cyberpunk luxury'), suffix: ', neon outline glow, cyberpunk luxury, digital render' },
  { id: 'ukiyo-e', model: 'flux', label: 'Ukiyo-e', image: getPreview('A woman in traditional robes watching the great wave', 'flux', ', ukiyo-e woodblock print style'), suffix: ', ukiyo-e woodblock print style, flat inked color planes, bold black linework' },
  { id: '3d-chibi', model: 'flux', label: '3D Chibi', image: getPreview('A cute chibi woman', 'flux', ', chibi style 3d render'), suffix: ', chibi style, 3D character render' },

  // Z-Image Styles
  { id: 'z-real', model: 'zimage', label: 'Realism', image: getPreview('A portrait of a woman', 'zimage', ', hyper-realistic 35mm film'), suffix: ', RAW, hyper-realistic, 35mm film photography, warm color temperature, soft on-camera flash, slight grain, natural imperfections, no retouching, editorial intimate snapshot' },
  { id: 'z-candid', model: 'zimage', label: 'Candid', image: getPreview('A woman walking in the street', 'zimage', ', spontaneous pose, mixed lighting'), suffix: ', Shot by a friend with a handheld DSLR or phone, spontaneous pose with natural movement, mixed lighting from environment, visible flyaway hairs and clothing wrinkles, soft focus on background elements, realistic shadows and reflections, no airbrushing, everyday authenticity' },
  { id: 'z-selfie', model: 'zimage', label: 'Selfie', image: getPreview('A woman taking a mirror selfie', 'zimage', ', smartphone aesthetic'), suffix: ', Smartphone front camera aesthetic, mild barrel distortion, slightly off-center composition, natural skin texture with visible pores and freckles, casual expression, soft selfie flash mixed with ambient light, slight motion blur on edges, JPEG compression artifacts, low-res feel but sharp focus on face' },
  { id: 'z-modern-phone', model: 'zimage', label: 'iPhone', image: getPreview('A woman holding a coffee cup', 'zimage', ', iphone camera photo'), suffix: ', iPhone-style rear camera photo, shallow depth of field with bokeh, natural HDR tone mapping, subtle sharpening halos around edges, dewy skin with imperfections like blemishes, soft window light illuminating face, slight vignette, 9:16 vertical aspect ratio, unfiltered social media aesthetic' },
  { id: 'z-noir', model: 'zimage', label: 'Film Noir', image: getPreview('A woman detective in rain', 'zimage', ', film noir style black and white'), suffix: ', Cinematic contrast, soft highlight on cheekbones, glossy lips, volumetric lighting, rim light, golden hour, deep chiaroscuro, atmospheric fog' },
  { id: 'z-vintage', model: 'zimage', label: 'Vintage', image: getPreview('A woman standing in front of an old house', 'zimage', ', vintage polaroid'), suffix: ', Overexposed grainy polaroid, cross-processed film, warm tones, soft cinematic grain, muted colors, film grain, paparazzi aesthetic' },
  { id: 'z-night', model: 'zimage', label: 'Night Mode', image: getPreview('A woman under city lights at night', 'zimage', ', night mode photo'), suffix: ', Nighttime phone camera capture, high ISO noise speckle in dark areas, edge-aware denoising smear on skin, warm streetlight glow with color fringing, handheld shake blur, compressed shadows, realistic lens flare from lights, moody unedited vibe' },
  { id: 'z-surreal', model: 'zimage', label: 'Surreal', image: getPreview('A woman floating among surreal islands', 'zimage', ', surreal dreamlike'), suffix: ', Dreamlike haze, floating elements, impossible geometries, ethereal glow, soft surreal distortions, muted psychedelic tones, atmospheric depth, subtle color bleed, no harsh edges' },
  { id: 'z-neon', model: 'zimage', label: 'Neon', image: getPreview('A woman with neon face paint', 'zimage', ', neon glow dark mode'), suffix: ', Dark mode, cosmic gradient, glowing edges, motion blur, clean grid, neon blue glow, atmospheric haze, high contrast, 8K realism' },
  { id: 'z-cyber', model: 'zimage', label: 'Cyberpunk', image: getPreview('A woman in a future city street', 'zimage', ', cyberpunk style'), suffix: ', Cyberpunk neon vibrancy, holographic projections, rain-slicked streets, high-tech gadgets, cool blue-purple tones, reflective surfaces, dynamic motion blur' },
  { id: 'z-cartoon', model: 'zimage', label: 'Cartoon', image: getPreview('A cartoon woman', 'zimage', ', cartoon style'), suffix: ', Exquisite 3D image, lovely cartoon style, colorful ultra-minimalistic, smooth colors, symmetric, playful doodle, soft texture, simple composition, sticker style logo' },
  { id: 'z-horror', model: 'zimage', label: 'Horror', image: getPreview('A woman standing in a dark forest', 'zimage', ', horror creepy'), suffix: ', Eerie shadows, distorted perspectives, creeping fog, desaturated tones, subtle horror elements, subtle tension' }
];
