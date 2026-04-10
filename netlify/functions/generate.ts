import { Handler } from '@netlify/functions';

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || 'pk_N2YEvo5VHzELOFio';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = JSON.parse(event.body || '{}');
    const { prompt, model, width, height, seed, enhance, nologo, negative_prompt, safe } = params;

    const baseUrl = 'https://gen.pollinations.ai/image/';
    const url = new URL(`${baseUrl}${encodeURIComponent(prompt)}`);
    
    if (model) url.searchParams.append('model', model);
    if (width) url.searchParams.append('width', width.toString());
    if (height) url.searchParams.append('height', height.toString());
    if (seed !== undefined) url.searchParams.append('seed', seed.toString());
    if (enhance) url.searchParams.append('enhance', 'true');
    if (nologo) url.searchParams.append('nologo', 'true');
    if (negative_prompt) url.searchParams.append('negative_prompt', negative_prompt);
    if (safe) url.searchParams.append('safe', 'true');
    
    if (POLLINATIONS_API_KEY) {
      url.searchParams.append('key', POLLINATIONS_API_KEY);
    }

    // Since this is a serverless function, we can return the URL or proxy the image.
    // Returning the URL is fine as long as the key is appended on the server.
    return {
      statusCode: 200,
      body: JSON.stringify({ url: url.toString() }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
