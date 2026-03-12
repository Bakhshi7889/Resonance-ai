
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
  isFeatured?: boolean; // If true, show golden outline
  order?: number; // For manual sorting
}

export interface DirectMessage {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  content: string;
  is_read: boolean;
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
  styleOrder: string[]; 
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
  LEADERBOARD = 'leaderboard',
  MESSAGES = 'messages'
}

export const AVAILABLE_MODELS = [
  { id: 'flux', name: 'Flux Schnell', description: 'High-speed Latent Diffusion' },
  { id: 'flux-2-dev', name: 'Flux.2 Dev', description: 'Alpha Neural Architecture' },
  { id: 'dirtberry', name: 'Dirtberry', description: 'Organic Texture Synthesis' },
  { id: 'zimage', name: 'Z-Image Turbo', description: 'Poly-modal Synthesis' },
  { id: 'imagen-4', name: 'Imagen 4', description: 'Google DeepMind Vision' },
  { id: 'grok-imagine', name: 'Grok Imagine', description: 'X.AI Creative Engine' },
];

export const ASPECT_RATIOS = [
  { label: '1:1', width: 1536, height: 1536 },
  { label: '3:4', width: 1312, height: 1760 },
  { label: '4:3', width: 1760, height: 1312 },
  { label: '16:9', width: 2048, height: 1152 },
  { label: '9:16', width: 1152, height: 2048 },
];
