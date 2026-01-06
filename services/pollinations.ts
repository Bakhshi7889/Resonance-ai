import { ImageGenerationParams } from '../types';

const BASE_URL = 'https://gen.pollinations.ai/image';
const API_KEY = 'pk_BnmABucSE1VNCWRT';

export const generateImageUrl = (params: ImageGenerationParams): string => {
  const { prompt, model, width, height, seed, enhance, nologo, negativePrompt, quality } = params;
  
  const encodedPrompt = encodeURIComponent(prompt);
  
  const queryObj: any = {
    model,
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    nologo: nologo.toString(),
    enhance: enhance.toString(),
    key: API_KEY,
  };

  if (negativePrompt) {
    queryObj.negative_prompt = negativePrompt;
  }

  if (quality) {
    queryObj.quality = quality;
  }

  const queryParams = new URLSearchParams(queryObj);

  return `${BASE_URL}/${encodedPrompt}?${queryParams.toString()}`;
};

export const getRandomSeed = () => Math.floor(Math.random() * 1000000);