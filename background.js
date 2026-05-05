// Meowify service worker — Firebase counter sync
let firebaseConfig = null;
try {
  importScripts('firebase-config.js');
  firebaseConfig = FIREBASE_CONFIG;
} catch (e) {
  // firebase-config.js not found — counters disabled
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('meowifyUserId', (r) => {
    if (!r.meowifyUserId) {
      chrome.storage.local.set({
        meowifyUserId: crypto.randomUUID(),
        hasReportedAsNewUser: false,
        pendingWordCount: 0,
        pendingNewUser: false
      });
    }
  });
  chrome.alarms.create('reportMeows', { periodInMinutes: 10 });
});

function timedFetch(url, options, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

async function reportPending() {
  if (!firebaseConfig) return;
  const data = await chrome.storage.local.get(['pendingWordCount', 'pendingInputWordCount', 'pendingNewUser', 'hasReportedAsNewUser']);
  const wordCount = data.pendingWordCount || 0;
  if (wordCount <= 0) return;
  const inputWordCount = data.pendingInputWordCount || 0;
  const isNewUser = !data.hasReportedAsNewUser && data.pendingNewUser;
  try {
    const resp = await timedFetch(firebaseConfig.cloudFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordCount, inputWordCount, isNewUser, appToken: firebaseConfig.appToken || '' })
    });
    if (resp.ok) {
      await chrome.storage.local.set({
        pendingWordCount: 0,
        pendingInputWordCount: 0,
        pendingNewUser: false,
        hasReportedAsNewUser: data.hasReportedAsNewUser || isNewUser,
        cachedDataAt: 0,
        rateLimited: false
      });
    } else if (resp.status === 429) {
      await chrome.storage.local.set({ rateLimited: true });
    }
  } catch (e) {
    // Retry on next alarm
  }
}

async function getData() {
  if (!firebaseConfig) return null;
  const cached = await chrome.storage.local.get(['cachedData', 'cachedDataAt']);
  if (cached.cachedData && cached.cachedDataAt && Date.now() - cached.cachedDataAt < 1200000) {
    return cached.cachedData;
  }
  try {
    const [countersResp, messagesResp] = await Promise.all([
      timedFetch(firebaseConfig.databaseUrl + '/counters.json'),
      timedFetch(firebaseConfig.databaseUrl + '/messages.json')
    ]);
    const counters = countersResp.ok ? ((await countersResp.json()) || { totalMeowifiers: 0, totalWords: 0 }) : { totalMeowifiers: 0, totalWords: 0 };
    const messages = messagesResp.ok ? (await messagesResp.json()) : null;
    const data = { counters, messages: Array.isArray(messages) ? messages.slice(0, 3) : [] };
    await chrome.storage.local.set({ cachedData: data, cachedDataAt: Date.now() });
    return data;
  } catch (e) {
    return cached.cachedData || null;
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reportMeows') reportPending();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'meowified') {
    chrome.storage.local.get(['pendingWordCount', 'pendingInputWordCount', 'hasReportedAsNewUser'], (r) => {
      const updates = {
        pendingWordCount: (r.pendingWordCount || 0) + msg.wordCount,
        pendingInputWordCount: (r.pendingInputWordCount || 0) + (msg.inputWordCount || 0)
      };
      if (!r.hasReportedAsNewUser) updates.pendingNewUser = true;
      chrome.storage.local.set(updates);
    });
    return false;
  }
  if (msg.type === 'getData') {
    getData().then(sendResponse);
    return true;
  }
});
