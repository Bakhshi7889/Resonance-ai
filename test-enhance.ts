import { enhancePrompt } from './services/ai';
async function run() {
  const final = await enhancePrompt('a cat', 'flux', undefined, (chunk) => {
    console.log('CHUNK:', chunk.substring(0, 50));
  });
  console.log('FINAL:', final);
}
run();
