import { Handler } from '@netlify/functions';

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || 'pk_2yctpceb1LwUL1Vr';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const headers = { Authorization: `Bearer ${POLLINATIONS_API_KEY}` };
    const baseUrl = 'https://gen.pollinations.ai';

    const [profileRes, balanceRes, usageRes] = await Promise.all([
      fetch(`${baseUrl}/account/profile`, { headers }).catch(() => null),
      fetch(`${baseUrl}/account/balance`, { headers }).catch(() => null),
      fetch(`${baseUrl}/account/usage?limit=10`, { headers }).catch(() => null)
    ]);

    let profile = null;
    let balance = null;
    let usage = [];

    if (profileRes && profileRes.ok) profile = await profileRes.json();
    if (balanceRes && balanceRes.ok) {
      const balanceData = await balanceRes.json();
      balance = balanceData.balance;
    }
    if (usageRes && usageRes.ok) {
      const usageData = await usageRes.json();
      usage = usageData.usage || [];
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ profile, balance, usage }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
