export interface ImageGenerationParams {
  prompt: string;
  model: string;
  width: number;
  height: number;
  seed: number;
  enhance: boolean;
  nologo: boolean;
  negativePrompt?: string;
  quality?: string;
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
  quality: string;
  imageCount: number;
  activeStyle: string;
}

export enum AppRoute {
  GENERATOR = 'generator',
  HISTORY = 'history',
  PREFERENCES = 'preferences',
  CREATE_PRESET = 'create_preset'
}

export const AVAILABLE_MODELS = [
  { id: 'flux', name: 'Flux Schnell', description: 'Fastest, state-of-the-art', image: 'https://picsum.photos/id/20/300/400' },
  { id: 'zimage', name: 'Z-Image', description: 'High fidelity artistic', image: 'https://picsum.photos/id/34/300/400' },
];

export const ASPECT_RATIOS = [
  { label: '1:1', width: 1024, height: 1024 },
  { label: '3:4', width: 768, height: 1024 },
  { label: '4:3', width: 1024, height: 768 },
  { label: '16:9', width: 1280, height: 720 },
  { label: '9:16', width: 720, height: 1280 },
];

export const MODEL_STYLES = [
  // Flux Styles - Realism First
  { id: 'flux-realism', model: 'flux', label: 'Realism', suffix: ', RAW, hyper-realistic, 35mm film photography, warm color temperature, soft on-camera flash, slight grain, natural imperfections, no retouching, editorial intimate snapshot' },
  { id: 'flux-candid', model: 'flux', label: 'Candid', suffix: ', Shot by a friend with a handheld DSLR or phone, spontaneous pose with natural movement, mixed lighting from environment, visible flyaway hairs and clothing wrinkles, soft focus on background elements, realistic shadows and reflections, no airbrushing, everyday authenticity' },
  { id: 'flux-selfie', model: 'flux', label: 'Selfie', suffix: ', Smartphone front camera aesthetic, mild barrel distortion, slightly off-center composition, natural skin texture with visible pores and freckles, casual expression, soft selfie flash mixed with ambient light, slight motion blur on edges, JPEG compression artifacts, low-res feel but sharp focus on face' },
  { id: 'polaroid', model: 'flux', label: 'Polaroid', suffix: ', raw photo, dynamic contrast, polaroid style' },
  { id: 'cinematic', model: 'flux', label: 'Cinematic', suffix: ', hyper-realistic, cinematic lighting, DSLR shot, sharp focus' },
  { id: 'cyberpunk', model: 'flux', label: 'Cyberpunk', suffix: ', neon outline glow, cyberpunk luxury, digital render' },
  { id: 'ukiyo-e', model: 'flux', label: 'Ukiyo-e', suffix: ', ukiyo-e woodblock print style, flat inked color planes, bold black linework' },
  { id: '3d-chibi', model: 'flux', label: '3D Chibi', suffix: ', chibi style, 3D character render' },

  // Z-Image Styles - Realism First
  { id: 'z-real', model: 'zimage', label: 'Realism', suffix: ', RAW, hyper-realistic, 35mm film photography, warm color temperature, soft on-camera flash, slight grain, natural imperfections, no retouching, editorial intimate snapshot' },
  { id: 'z-candid', model: 'zimage', label: 'Candid', suffix: ', Shot by a friend with a handheld DSLR or phone, spontaneous pose with natural movement, mixed lighting from environment, visible flyaway hairs and clothing wrinkles, soft focus on background elements, realistic shadows and reflections, no airbrushing, everyday authenticity' },
  { id: 'z-selfie', model: 'zimage', label: 'Selfie', suffix: ', Smartphone front camera aesthetic, mild barrel distortion, slightly off-center composition, natural skin texture with visible pores and freckles, casual expression, soft selfie flash mixed with ambient light, slight motion blur on edges, JPEG compression artifacts, low-res feel but sharp focus on face' },
  { id: 'z-modern-phone', model: 'zimage', label: 'iPhone', suffix: ', iPhone-style rear camera photo, shallow depth of field with bokeh, natural HDR tone mapping, subtle sharpening halos around edges, dewy skin with imperfections like blemishes, soft window light illuminating face, slight vignette, 9:16 vertical aspect ratio, unfiltered social media aesthetic' },
  { id: 'z-noir', model: 'zimage', label: 'Film Noir', suffix: ', Cinematic contrast, soft highlight on cheekbones, glossy lips, volumetric lighting, rim light, golden hour, deep chiaroscuro, atmospheric fog' },
  { id: 'z-vintage', model: 'zimage', label: 'Vintage', suffix: ', Overexposed grainy polaroid, cross-processed film, warm tones, soft cinematic grain, muted colors, film grain, paparazzi aesthetic' },
  { id: 'z-night', model: 'zimage', label: 'Night Mode', suffix: ', Nighttime phone camera capture, high ISO noise speckle in dark areas, edge-aware denoising smear on skin, warm streetlight glow with color fringing, handheld shake blur, compressed shadows, realistic lens flare from lights, moody unedited vibe' },
  { id: 'z-surreal', model: 'zimage', label: 'Surreal', suffix: ', Dreamlike haze, floating elements, impossible geometries, ethereal glow, soft surreal distortions, muted psychedelic tones, atmospheric depth, subtle color bleed, no harsh edges' },
  { id: 'z-neon', model: 'zimage', label: 'Neon', suffix: ', Dark mode, cosmic gradient, glowing edges, motion blur, clean grid, neon blue glow, atmospheric haze, high contrast, 8K realism' },
  { id: 'z-cyber', model: 'zimage', label: 'Cyberpunk', suffix: ', Cyberpunk neon vibrancy, holographic projections, rain-slicked streets, high-tech gadgets, cool blue-purple tones, reflective surfaces, dynamic motion blur' },
  { id: 'z-cartoon', model: 'zimage', label: 'Cartoon', suffix: ', Exquisite 3D image, lovely cartoon style, colorful ultra-minimalistic, smooth colors, symmetric, playful doodle, soft texture, simple composition, sticker style logo' },
  { id: 'z-horror', model: 'zimage', label: 'Horror', suffix: ', Eerie shadows, distorted perspectives, creeping fog, desaturated tones, subtle horror elements, tense composition, low-key lighting' }
];