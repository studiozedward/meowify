const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.reportMeows = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { wordCount, inputWordCount, isNewUser } = req.body;

  if (!Number.isInteger(wordCount) || wordCount <= 0 || wordCount > 100000) {
    res.status(400).json({ error: 'Invalid wordCount' });
    return;
  }
  const validInputWords = Number.isInteger(inputWordCount) && inputWordCount > 0 && inputWordCount <= 100000
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
