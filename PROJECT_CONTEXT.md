
# Resonance - Project Context & Documentation

## Overview
Resonance is a premium, glass-morphic AI image generation PWA (Progressive Web App) built with React, TypeScript, Tailwind CSS, and Framer Motion. It utilizes the Pollinations.ai API for generating images.

## Tech Stack
- **Framework**: React 18+
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom config for glassmorphism, animations)
- **Animation**: Framer Motion
- **State Management**: React `useState`, `useEffect`, `useMemo`
- **Persistence**: `localStorage`
- **Icons**: Material Symbols Outlined
- **Build Tool**: (Assumed Vite or similar ESM based setup)

## API Integration: Pollinations.ai

**Base URL**: `https://gen.pollinations.ai`

### 1. Image Generation
**Endpoint**: `GET /image/{encoded_prompt}`

**Query Parameters**:
- `model`: (string) e.g., 'flux', 'zimage', 'any'.
- `width`: (number) Image width in pixels.
- `height`: (number) Image height in pixels.
- `seed`: (number) Random seed for reproducibility.
- `nologo`: (boolean) 'true' to hide the Pollinations watermark.
- `private`: (boolean) 'true' to prevent the image from appearing in the public feed.
- `enhance`: (boolean) 'true' to use LLM-based prompt enhancement.
- `safe`: (boolean) 'true' to filter NSFW content.
- `transparent`: (boolean) 'true' for transparent background output.
- `quality`: (string) 'medium' or 'hd'.
- `guidance_scale`: (number) CFG scale (default is usually around 7.5).
- `negative_prompt`: (string) Elements to exclude from generation.
- `key`: (string) API Key (optional/premium).

**Example URL Construction (TypeScript)**:
```typescript
const url = `${BASE_URL}/image/${encodeURIComponent(prompt)}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true`;
```

### 2. Account Information
**Headers**: `Authorization: Bearer {apiKey}`

- **Profile**: `GET /account/profile`
    - Returns JSON with `tier` ('anonymous', 'seed', 'flower', 'nectar').
- **Balance**: `GET /account/balance`
    - Returns JSON with `balance` (number).

## Application Structure

### Core Components
- **`App.tsx`**: Main entry point. Handles routing (`currentRoute` state) and global state initialization for `history` and `settings` from `localStorage`.
- **`Layout.tsx`**: Provides the base UI wrapper with fixed background animated blobs (`bg-primary` and `bg-purple-600` blurs).
- **`NavigationDock.tsx`**: A floating, glass-morphic bottom navigation bar with three icons: Generator (Home), History, and Preferences (Settings).

### Features & Routes

#### 1. Image Generator (`components/ImageGenerator.tsx`)
- **Route**: `AppRoute.GENERATOR`
- **Functionality**:
    - **Classic Mode**: Horizontal scrollable carousel of generated images.
    - **Infinite Mode**: Vertical masonry grid layout where images are grouped by session (Batch ID) with collapsible headers.
    - **Prompt Input**: A floating glass "pill" at the bottom containing the text area and generate button. Expands to show settings.
- **Key Interactions**:
    - Click an image to open **Fullscreen View**.
    - Fullscreen view supports swiping (Framer Motion drag), downloading, copying links, and viewing metadata (seed, prompt, model).

#### 2. History (`components/History.tsx`)
- **Route**: `AppRoute.HISTORY`
- **Layout**: Grid view of generated images.
- **Grouping**: Images are grouped first by **Date**, then by **Session** (Batch).
- **Features**:
    - **Selection Mode**: Long press or toggle via header to select multiple images for deletion.
    - **Session Viewer**: Clicking a "stack" (multiple images in one batch) opens a specific sub-view for that session.

#### 3. Preferences (`components/Preferences.tsx`)
- **Route**: `AppRoute.PREFERENCES`
- **Settings**:
    - **Global Defaults**: Model selection (Flux/Z-Image), Aspect Ratio, Styles.
    - **API Account**: Input for API Key, displays Tier and Pollen balance.
    - **Unlock**: Enter code "6969" to disable the "Safe Mode" lock, allowing NSFW styles.
    - **Infinite Feed**: Toggle for the vertical layout mode.

#### 4. Style Library (`components/StyleLibrary.tsx`)
- **Route**: `AppRoute.STYLE_LIBRARY`
- **Functionality**: A gallery of all available `MODEL_STYLES`. Allows users to generate previews of specific styles using a random seed.

## Data Types (`types.ts`)

### `AppSettings`
Global configuration object persisted in `localStorage` key `resonance_settings`.
```typescript
interface AppSettings {
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
  infiniteMode: boolean; // Toggles vertical layout
}
```

### `HistoryItem`
Record of a generated image. Persisted in `resonance_history`.
```typescript
interface HistoryItem {
  id: string;
  batchId?: string; // Links images generated in the same request
  timestamp: number;
  url: string;
  prompt: string;
  styleSuffix?: string; // The specific keywords added by the style
  // ... extends ImageGenerationParams
}
```

## Design System Rules

### Aesthetics
- **Theme**: Dark Mode Only.
- **Background**: `#101622` (Deep Space) with ambient glowing orbs.
- **Surface**: "Glass-morphic" - High transparency, backdrop blur (`backdrop-blur-xl`), thin white borders (`border-white/10`).
- **Typography**: `Space Grotesk` (headings/display), Sans-serif (body).

### UI Patterns
- **Liquid Navigation**: Elements should float and have fluid animations (spring physics).
- **Icons**: `Material Symbols Outlined`.
- **Feedback**: Use Toast notifications for actions like "Link Copied" or "Saved".
- **Image Loading**: Images use a "Blur Reveal" effect—starting opacity 0 with high blur, transitioning to opacity 100 with 0 blur upon load.

## Future Development Instructions
If the chat history is cleared, use this file to understand the existing architecture.
1. **Do not introduce new libraries** unless necessary. Use existing Framer Motion and Tailwind.
2. **Respect LocalStorage Keys**: Do not change `resonance_settings` or `resonance_history` keys to avoid data loss for the user.
3. **API Integrity**: Ensure all new API calls follow the `services/pollinations.ts` pattern.
