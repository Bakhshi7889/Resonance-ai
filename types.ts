
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
  quality?: string; // 'medium' | 'hd'
  upscale?: boolean; // If true, double the resolution
  styleId?: string; // Track which style was used
  styleLabel?: string; // Track style name
  styleSuffix?: string; // Track the actual prompt suffix added
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
  quality: string;
  upscale: boolean;
  isUnlocked: boolean; 
  infiniteMode: boolean; // New: Toggles vertical infinite scroll layout
}

export interface AccountProfile {
  name?: string;
  email?: string;
  tier?: 'anonymous' | 'seed' | 'flower' | 'nectar';
  createdAt?: string;
}

export interface AccountBalance {
  balance: number; // Pollen count
}

export interface AccountState {
  profile: AccountProfile | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
}

export enum AppRoute {
  GENERATOR = 'generator',
  HISTORY = 'history',
  PREFERENCES = 'preferences',
  CREATE_PRESET = 'create_preset',
  STYLE_LIBRARY = 'style_library'
}

export const AVAILABLE_MODELS = [
  { id: 'flux', name: 'Flux Schnell', description: 'State-of-the-art accuracy', image: 'https://image.pollinations.ai/prompt/A%20portrait%20of%20a%20woman%20shot%20on%2035mm%20camera?model=flux&width=256&height=256&seed=101&nologo=true' },
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
    "suffix": ", raw photo, dynamic contrast, polaroid style, faded colors, vintage aesthetic"
  },
  {
    "id": "cinematic",
    "model": "flux",
    "label": "Cinematic",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20walking%20down%20a%20rainy%20city%20street%20at%20night%2C%20cinematic%20lighting%2C%20sharp%20focus?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", hyper-realistic, cinematic lighting, DSLR shot, sharp focus, volumetric lighting, film grain"
  },
  {
    "id": "cyberpunk",
    "model": "flux",
    "label": "Cyberpunk",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20cyborg%20in%20a%20neon%20city%2C%20neon%20outline%20glow%2C%20cyberpunk%20luxury?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", neon outline glow, cyberpunk luxury, digital render, futuristic city, neon lights, high tech"
  },
  {
    "id": "ukiyo-e",
    "model": "flux",
    "label": "Ukiyo-e",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20in%20traditional%20robes%20watching%20the%20great%20wave%2C%20ukiyo-e%20woodblock%20print%20style?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", ukiyo-e woodblock print style, flat inked color planes, bold black linework, traditional japanese art"
  },
  {
    "id": "3d-chibi",
    "model": "flux",
    "label": "3D Chibi",
    "image": "https://image.pollinations.ai/prompt/A%20cute%20chibi%20woman%2C%20chibi%20style%203d%20render?model=flux&width=256&height=384&nologo=true&seed=42",
    "suffix": ", chibi style, 3D render, cute proportions, clay material, isometric view"
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
    "image": "https://image.pollinations.ai/prompt/A%20woman%20standing%20in%20front%20of%20an%20old%20house%2C%20vintage%20photo?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", vintage photography, sepia tones, film grain, scratches, dust, 1950s aesthetic, soft focus"
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
    "image": "https://image.pollinations.ai/prompt/A%20cartoon%20woman%2C%20flat%20cartoon%20style?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", flat 2D cartoon art, vivid colors, simple shading, bold outlines, expressive character design, vector art style, cell shaded"
  },
  {
    "id": "z-horror",
    "model": "zimage",
    "label": "Horror",
    "image": "https://image.pollinations.ai/prompt/A%20woman%20standing%20in%20a%20dark%20forest%2C%20horror%20creepy?model=zimage&width=256&height=384&nologo=true&seed=42",
    "suffix": ", Eerie shadows, distorted perspectives, creeping fog, desaturated tones, subtle horror elements, subtle tension, dark atmosphere"
  }
];

export const NSFW_STYLES = [
  // ... (Same as before, omitted for brevity but presumed present)
  // Realism Enhancers
  {
    "id": "nsfw-realism",
    "model": "any",
    "label": "Hyper Real",
    "image": "https://image.pollinations.ai/prompt/extreme%20close%20up%20photo%20of%20a%20person%2C%20highly%20detailed%20skin%20pores?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", highly detailed skin pores, realistic sweat sheen, subtle freckles and veins, natural body hair, soft subsurface scattering, ultra-realistic epidermis with minor imperfections like stretch marks or cellulite for authenticity, cinematic volumetric lighting, soft golden hour glow casting realistic shadows on curves, high dynamic range with subtle rim light highlighting contours, natural ambient occlusion in intimate areas, accurate human proportions with gravity-affected breasts and hips, soft tissue deformation from movement, realistic muscle tension and relaxed folds, detailed genital anatomy with natural variations in shape and texture"
  },
  // ... (Rest of NSFW_STYLES)
  {
    "id": "nsfw-doggy",
    "model": "any",
    "label": "Doggy",
    "image": "https://image.pollinations.ai/prompt/a%20person%20kneeling%2C%20arched%20back%2C%20from%20behind?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", from behind in doggy position, arched back with hips raised, hands gripping sheets, realistic thrusting motion with skin contact ripples, sweat-slicked bodies in intimate rear view, detailed glute and thigh tension"
  },
  {
    "id": "nsfw-missionary",
    "model": "any",
    "label": "Missionary",
    "image": "https://image.pollinations.ai/prompt/a%20couple%20face%20to%20face%20in%20bed%2C%20intimate?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", face-to-face missionary pose, legs wrapped around partner, deep eye contact with parted lips, bodies pressed together showing chest compression and hip alignment, subtle muscle flexing during penetration"
  },
  {
    "id": "nsfw-hidden",
    "model": "any",
    "label": "Hidden Cam",
    "image": "https://image.pollinations.ai/prompt/blurry%20grainy%20photo%20through%20a%20doorframe?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", candid hidden camera angle, partially obscured by doorframe or curtain, unaware expression with natural unguarded pose, low-light grainy realism like surveillance footage, subtle environmental details like shadows from blinds"
  },
  {
    "id": "nsfw-leaked",
    "model": "any",
    "label": "Leaked",
    "image": "https://image.pollinations.ai/prompt/smartphone%20selfie%20in%20a%20messy%20mirror?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", amateur leaked video still, smartphone camera quality with slight blur and artifacts, casual setting like hotel room with messy bed, authentic expressions of surprise or playfulness, visible timestamps or watermarks for realism"
  },
  {
    "id": "nsfw-edgy-roleplay",
    "model": "any",
    "label": "Edgy Play",
    "image": "https://image.pollinations.ai/prompt/intense%20cinematic%20scene%2C%20dramatic%20lighting%2C%20tension?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", intense role-play scenario with restrained wrists and dominant grip, feigned struggle expression but consensual undertones, torn clothing remnants clinging to skin, dramatic lighting highlighting tension and release"
  },
  {
    "id": "nsfw-cowgirl",
    "model": "any",
    "label": "Cowgirl",
    "image": "https://image.pollinations.ai/prompt/person%20straddling%20camera%2C%20looking%20down?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", straddling in cowgirl position, hands on chest for balance, bouncing motion with breast physics and hair sway, close-up on connected hips, glossy skin from exertion"
  },
  {
    "id": "nsfw-oral",
    "model": "any",
    "label": "Oral",
    "image": "https://image.pollinations.ai/prompt/person%20looking%20up%20kneeling%2C%20parted%20lips?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", kneeling oral position, lips wrapped around with saliva trails, upward gaze with flushed cheeks, detailed tongue and throat anatomy, soft focus on facial details"
  },
  {
    "id": "nsfw-standing",
    "model": "any",
    "label": "Standing",
    "image": "https://image.pollinations.ai/prompt/couple%20pressed%20against%20wall%2C%20passionate?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", against wall standing pose, one leg lifted, urgent embrace with wall support, realistic balance shifts and grip marks on skin"
  },
  {
    "id": "nsfw-group",
    "model": "any",
    "label": "Group",
    "image": "https://image.pollinations.ai/prompt/tangled%20limbs%20of%20three%20people%20in%20bed?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", entwined with two partners, alternating positions like spooning and facing, fluid body interactions with overlapping limbs, natural asymmetry in expressions"
  },
  {
    "id": "nsfw-pov-shower",
    "model": "any",
    "label": "POV Shower",
    "image": "https://image.pollinations.ai/prompt/pov%20looking%20down%20in%20shower%2C%20wet%20skin%2C%20steam?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", first-person POV looking down at nude body in steamy shower, water cascading over curves with soap suds trailing down breasts and hips, hands lathering skin with realistic foam bubbles, foggy glass door in background, subtle steam haze and wet tile reflections"
  },
  {
    "id": "nsfw-pov-fucked",
    "model": "any",
    "label": "POV F**ked",
    "image": "https://image.pollinations.ai/prompt/pov%20missionary%20looking%20down%20at%20partner?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", first-person POV from above in missionary, partner's face close with aroused expression and parted lips, bodies connected with realistic thrusting motion and skin friction, hands gripping sheets or hips, sweat-slicked torso and bouncing breasts in frame"
  },
  {
    "id": "nsfw-pov-masturbate",
    "model": "any",
    "label": "POV Solo",
    "image": "https://image.pollinations.ai/prompt/pov%20looking%20down%20at%20hand%20between%20legs?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", first-person POV looking down at hand between thighs, fingers circling clit with visible arousal fluids, arched back and tensed muscles, flushed skin with vein details, soft moans implied through open mouth, bedside lamp casting warm glow on intimate area"
  },
  {
    "id": "nsfw-pov-oral",
    "model": "any",
    "label": "POV Oral",
    "image": "https://image.pollinations.ai/prompt/pov%20looking%20down%20at%20person%20kneeling?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", first-person POV from below looking up at face during oral, lips wrapped around with saliva trails and tongue visible, upward gaze with flushed cheeks, hands on thighs for stability, detailed throat and mouth anatomy, dim room light highlighting wet sheen"
  },
  {
    "id": "nsfw-pov-edgy",
    "model": "any",
    "label": "POV Edgy",
    "image": "https://image.pollinations.ai/prompt/pov%20holding%20wrists%2C%20dominant?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", first-person POV holding wrists above head, feigned struggle with intense eye contact, torn clothing remnants and grip marks on skin, dramatic tension in body language, low-angle view emphasizing power dynamic in fictional scenario"
  },
  {
    "id": "nsfw-teasing",
    "model": "any",
    "label": "Teasing",
    "image": "https://image.pollinations.ai/prompt/seductive%20pose%2C%20finger%20on%20lip%2C%20teasing?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", seductive teasing stance with fingers tracing curves, partially parted lips and heavy-lidded eyes, light fabric draped loosely over hips revealing subtle outlines, soft breath causing chest rise, anticipatory flush on cheeks and neck"
  },
  {
    "id": "nsfw-selftouch",
    "model": "any",
    "label": "Self Touch",
    "image": "https://image.pollinations.ai/prompt/hands%20caressing%20own%20body%2C%20soft%20lighting?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", gentle self-caress over breasts and thighs, fingertips grazing sensitive areas with visible goosebumps, relaxed posture on silk sheets, natural body arch from subtle pleasure, dewy skin sheen under warm lamp light"
  },
  {
    "id": "nsfw-undressing",
    "model": "any",
    "label": "Undressing",
    "image": "https://image.pollinations.ai/prompt/person%20taking%20off%20shirt%2C%20revealing?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", slowly peeling off sheer top to expose shoulders and cleavage, fabric slipping down with realistic wrinkles and clings, playful glance over shoulder, humid air causing light perspiration on collarbone, scattered clothes on floor"
  },
  {
    "id": "nsfw-embrace",
    "model": "any",
    "label": "Embrace",
    "image": "https://image.pollinations.ai/prompt/couple%20hugging%20tightly%2C%20messy%20hair%2C%20close%20up?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", bodies pressed close in heated embrace, hands exploring back and waist with firm grip, faces inches apart with shared breath, clothing rumpled and partially undone, tension in hips and subtle grinding motion implied"
  },
  {
    "id": "nsfw-arousal",
    "model": "any",
    "label": "Arousal",
    "image": "https://image.pollinations.ai/prompt/face%20flushed%2C%20biting%20lip%2C%20dilated%20pupils?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", heightened arousal with dilated pupils and bitten lip, light nibbling on neck or earlobe, fingers intertwined or hovering near intimate zones, flushed skin gradients from chest to abdomen, atmospheric steam from hot breath"
  },
  {
    "id": "nsfw-lingerie",
    "model": "any",
    "label": "Lingerie",
    "image": "https://image.pollinations.ai/prompt/person%20in%20lace%20lingerie%2C%20dramatic%20pose?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", posing in lace lingerie with straps slipping off shoulder, arched back to accentuate silhouette, inviting gaze with coy smile, fabric textures showing translucency and lace patterns, soft shadows playing across exposed skin"
  },
  {
    "id": "nsfw-massage",
    "model": "any",
    "label": "Massage",
    "image": "https://image.pollinations.ai/prompt/oily%20skin%20massage%2C%20candles%2C%20relaxing?model=flux&width=128&height=192&nologo=true&private=true",
    "suffix": ", receiving light oil massage on back and legs, glistening skin with oil trails, relaxed muscles yielding to pressure, subtle moans through parted mouth, candlelight flickering on contours and dimples"
  }
];
