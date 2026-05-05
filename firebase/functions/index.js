const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// --- Rate limiting (in-memory, resets when instance recycles) ---
const ipHits = new Map();
const RATE_LIMIT = 10;          // max requests
const RATE_WINDOW = 3600000;    // per hour (ms)

function isRateLimited(ip) {
  const now = Date.now();
  const hits = ipHits.get(ip) || [];
  const recent = hits.filter(t => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  ipHits.set(ip, recent);
  return false;
}

// --- App token (stops casual curl abuse) ---
const APP_TOKEN = functions.config().meowify?.token || '';

exports.reportMeows = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // App token check
  if (APP_TOKEN && req.body.appToken !== APP_TOKEN) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }

  // Per-IP rate limiting
  const ip = req.headers['x-forwarded-for'] || req.ip;
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Rate limited', retryAfter: 600 });
    return;
  }

  const { wordCount, inputWordCount, isNewUser } = req.body;

  if (!Number.isInteger(wordCount) || wordCount <= 0 || wordCount > 5000) {
    res.status(400).json({ error: 'Invalid wordCount' });
    return;
  }
  const validInputWords = Number.isInteger(inputWordCount) && inputWordCount > 0 && inputWordCount <= 5000
    ? inputWordCount : 0;

  const db = admin.database();

  try {
    await db.ref('counters/totalWords').transaction(current => (current || 0) + wordCount);

    if (validInputWords > 0) {
      await db.ref('counters/totalInputWords').transaction(current => (current || 0) + validInputWords);
    }

    if (isNewUser === true) {
      await db.ref('counters/totalMeowifiers').transaction(current => (current || 0) + 1);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('reportMeows error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});
