const REDIRECT_BASE_URL = "https://visitygo.io/7jZssN";
const DEFAULT_LINK =
  "https://visitygo.io/7jZssN?c=0321zGomw1BAYL4ebf090e267d571a&utm_source=testiosland&utm_campaign=test";
const COOKIE_MAX_AGE_DAYS = 30;
const PUSH_PUBLIC_VAPID_KEY = "BKUSu5aVL907JoeUz0-nibRpvtIc1KYoGaj5ibyHbazeNeF6ICFVlOEG38XxYlM5hzLFDc15FtjE-xHUTagxR1Q";
const PUSH_REGISTER_ENDPOINT = "https://thiscrm.co/api/push/notauth";
const PUSH_STORAGE_PREFIX = "webpush";
const ENABLE_REDIRECTS = true;
const SERVICE_WORKER_URL = "./sw.js?v=4";
const PUSH_BRAND_FALLBACK = "patrickspins";
const PUSH_TOKEN_FALLBACK = "fh378f65734dtwe767hbdjj24372j";
const PUSH_DOMAIN_FALLBACK = "dpdbia.com";
const PUSH_LANG_FALLBACK = "en";
const FINGERPRINTJS_AGENT_URLS = [
  "https://openfpcdn.io/fingerprintjs/v3",
  "https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js"
];
const FALLBACK_FTOKEN_STORAGE_KEY = "fallbackFToken";
const PARAM_KEYS = [
  "c",
  "saff_id",
  "http_referer",
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
  "clickid",
  "pid"
];
const REDIRECT_PARAM_ORDER = [
  "c",
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
  "clickid",
  "pid",
  "saff_id",
  "http_referer"
];

const targetLink = document.getElementById("targetLink");
const targetUrlText = document.getElementById("targetUrlText");
const openInstructions = document.getElementById("openInstructions");
const iosInstructionsDialog = document.getElementById("iosInstructionsDialog");
const mainContainer = document.querySelector(".container");

const isStandaloneMode =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;
const defaultParams = new URL(DEFAULT_LINK).searchParams;
let standaloneFlowStarted = false;
let pushGestureListenerBound = false;
let fingerprintAgentLoadPromise = null;
const pushStorage = newStorage(PUSH_STORAGE_PREFIX);

function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name) {
  const encodedName = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    if (cookie.startsWith(encodedName)) {
      return decodeURIComponent(cookie.slice(encodedName.length));
    }
  }
  return "";
}

function captureQueryParamsToCookies() {
  const query = new URLSearchParams(window.location.search);

  for (const key of PARAM_KEYS) {
    const value = query.get(key);
    if (value) {
      setCookie(key, value, COOKIE_MAX_AGE_DAYS);
    }
  }

  if (!getCookie("http_referer") && document.referrer) {
    setCookie("http_referer", document.referrer, COOKIE_MAX_AGE_DAYS);
  }
}

function ensureDefaultCookies() {
  for (const key of PARAM_KEYS) {
    const hasCookieValue = Boolean(getCookie(key));
    const defaultValue = defaultParams.get(key) || "";
    if (!hasCookieValue && defaultValue) {
      setCookie(key, defaultValue, COOKIE_MAX_AGE_DAYS);
    }
  }
}

function buildRedirectUrl() {
  const hasAtLeastOneCookieParam = PARAM_KEYS.some((key) => Boolean(getCookie(key)));
  if (!hasAtLeastOneCookieParam) {
    return DEFAULT_LINK;
  }

  const url = new URL(REDIRECT_BASE_URL);

  for (const key of REDIRECT_PARAM_ORDER) {
    const cookieValue = getCookie(key);
    const defaultValue = defaultParams.get(key) || "";
    const finalValue = cookieValue || defaultValue;
    url.searchParams.set(key, finalValue);
  }

  return url.toString();
}

function updateUiLink(url) {
  if (targetLink) {
    targetLink.href = url;
  }
  if (targetUrlText) {
    targetUrlText.textContent = url;
  }
}

function base64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalizedBase64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(normalizedBase64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function newStorage(id) {
  return {
    keyPrefix: id,
    _key(key) {
      return `${this.keyPrefix}_${key}`;
    },
    get(key) {
      const storageKey = this._key(key);
      try {
        return JSON.parse(window.localStorage.getItem(storageKey));
      } catch (_error) {
        return null;
      }
    },
    set(key, value) {
      const storageKey = this._key(key);
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    }
  };
}

function getEnvValue(key, fallback = null) {
  if (window._env && key in window._env) {
    return window._env[key];
  }
  return fallback;
}

function getPushBrandValue() {
  return getEnvValue("brandId", PUSH_BRAND_FALLBACK);
}

function getPushTokenValue() {
  // Keep configurable from env if present; fallback is empty string for notauth flow.
  return getEnvValue("pushToken", PUSH_TOKEN_FALLBACK);
}

function normalizeMaybeToken(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return null;
  }
  return trimmed;
}

function loadFingerprintJsAgent() {
  if (window.FingerprintJS) {
    return Promise.resolve(window.FingerprintJS);
  }

  if (fingerprintAgentLoadPromise) {
    return fingerprintAgentLoadPromise;
  }

  const tryLoadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        if (window.FingerprintJS) {
          resolve(window.FingerprintJS);
        } else {
          reject(new Error(`FingerprintJS loaded from ${src} but global object is missing`));
        }
      };
      script.onerror = () => reject(new Error(`FingerprintJS script failed to load: ${src}`));
      document.head.appendChild(script);
    });

  fingerprintAgentLoadPromise = (async () => {
    let lastError = null;
    for (const src of FINGERPRINTJS_AGENT_URLS) {
      try {
        return await tryLoadScript(src);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Unable to load FingerprintJS from all configured URLs");
  })();

  return fingerprintAgentLoadPromise;
}

function generateRandomToken() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateFallbackFToken() {
  const existing = normalizeMaybeToken(window.localStorage.getItem(FALLBACK_FTOKEN_STORAGE_KEY));
  if (existing) {
    return existing;
  }
  const created = generateRandomToken();
  window.localStorage.setItem(FALLBACK_FTOKEN_STORAGE_KEY, created);
  return created;
}

async function ensureFingerprintTokenGenerated() {
  const alreadyAvailable = readFingerprintTokenCandidate();
  if (alreadyAvailable) {
    return alreadyAvailable;
  }

  try {
    const FingerprintJS = await loadFingerprintJsAgent();
    const fpAgent = await FingerprintJS.load();
    const result = await fpAgent.get();
    const visitorId = normalizeMaybeToken(result?.visitorId);
    if (!visitorId) {
      return null;
    }

    if (window._env && typeof window._env === "object") {
      window._env.deviceHash = visitorId;
    }
    window.fToken = visitorId;
    window.deviceHash = visitorId;

    try {
      window.localStorage.setItem("fToken", visitorId);
      window.localStorage.setItem("deviceHash", visitorId);
    } catch (_error) {
      // localStorage might be unavailable
    }
    setCookie("fToken", visitorId, COOKIE_MAX_AGE_DAYS);
    setCookie("deviceHash", visitorId, COOKIE_MAX_AGE_DAYS);

    return visitorId;
  } catch (error) {
    console.error("FingerprintJS generation failed:", error);
    return null;
  }
}

function readFingerprintTokenCandidate() {
  const envKeys = ["deviceHash", "fToken", "fingerprintToken", "fingerprint"];
  for (const key of envKeys) {
    const envValue = normalizeMaybeToken(getEnvValue(key));
    if (envValue) {
      return envValue;
    }
  }

  const windowKeys = ["fToken", "deviceHash", "fingerprintToken"];
  for (const key of windowKeys) {
    const winValue = normalizeMaybeToken(window[key]);
    if (winValue) {
      return winValue;
    }
  }

  try {
    const localStorageKeys = ["fToken", "deviceHash", "fingerprintToken"];
    for (const key of localStorageKeys) {
      const localValue = normalizeMaybeToken(window.localStorage.getItem(key));
      if (localValue) {
        return localValue;
      }
    }
  } catch (_error) {
    // localStorage might be unavailable
  }

  const cookieKeys = ["fToken", "deviceHash", "fingerprintToken"];
  for (const key of cookieKeys) {
    const cookieValue = normalizeMaybeToken(getCookie(key));
    if (cookieValue) {
      return cookieValue;
    }
  }

  const query = new URLSearchParams(window.location.search);
  const queryKeys = ["fToken", "deviceHash", "fingerprintToken"];
  for (const key of queryKeys) {
    const queryValue = normalizeMaybeToken(query.get(key));
    if (queryValue) {
      return queryValue;
    }
  }

  return null;
}

async function resolveFingerprintToken(maxWaitMs = 10000, intervalMs = 100) {
  const immediate = readFingerprintTokenCandidate();
  if (immediate) {
    return immediate;
  }

  const generated = await ensureFingerprintTokenGenerated();
  if (generated) {
    return generated;
  }

  const attempts = Math.max(1, Math.floor(maxWaitMs / intervalMs));
  for (let i = 0; i < attempts; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const value = readFingerprintTokenCandidate();
    if (value) {
      return value;
    }
  }

  try {
    const fallback = getOrCreateFallbackFToken();
    if (fallback) {
      return fallback;
    }
  } catch (_error) {
    // ignore localStorage errors
  }

  return null;
}

function normalizeUserId(rawUserId) {
  if (!rawUserId || typeof rawUserId !== "string") {
    return null;
  }
  return rawUserId.replace("PLAYER-", "");
}

async function subscribeUserToPush(registration) {
  if (!registration || !("PushManager" in window) || !("Notification" in window)) {
    return false;
  }

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    await sendSubscriptionToServer(existingSubscription);
    return true;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  if (!PUSH_PUBLIC_VAPID_KEY) {
    return true;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToUint8Array(PUSH_PUBLIC_VAPID_KEY)
  });
  await sendSubscriptionToServer(subscription);

  return true;
}

async function sendSubscriptionToServer(subscription) {
  if (!subscription) {
    return;
  }

  const plainSubscription = JSON.parse(JSON.stringify(subscription));
  const userId = normalizeUserId(getEnvValue("playerUUID"));
  const fingerprintToken = await resolveFingerprintToken();
  const payload = {
    brand_id: getPushBrandValue(),
    info: {
      key: plainSubscription.keys?.auth || null,
      domain: PUSH_DOMAIN_FALLBACK,
      fToken: fingerprintToken,
      data: plainSubscription,
      lang: PUSH_LANG_FALLBACK
    },
    user_id: userId,
    brand: getPushBrandValue(),
    token: getPushTokenValue(),
    domain: PUSH_DOMAIN_FALLBACK,
    key: plainSubscription.keys?.auth || null,
    data: plainSubscription,
    tz: -new Date().getTimezoneOffset() / 60,
    fToken: fingerprintToken,
    lang: PUSH_LANG_FALLBACK
  };
  const dataToStore = {
    user_id: userId,
    fToken: fingerprintToken,
    data: JSON.stringify(plainSubscription)
  };
  const dataInStorage = pushStorage.get("subscription");

  if (
    dataInStorage &&
    typeof dataInStorage === "object" &&
    (dataInStorage.user_id === dataToStore.user_id || dataToStore.user_id === null) &&
    dataInStorage.fToken === dataToStore.fToken &&
    dataInStorage.data === dataToStore.data
  ) {
    return;
  }

  try {
    const response = await fetch(PUSH_REGISTER_ENDPOINT, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Failed to register web push subscription:", response.status, errorBody);
      return;
    }

    pushStorage.set("subscription", dataToStore);
  } catch (error) {
    console.error("Error sending subscription to server:", error);
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_URL);
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
}

function redirectToTarget() {
  if (!ENABLE_REDIRECTS) {
    return;
  }
  window.location.replace(buildRedirectUrl());
}

async function runStandaloneFlow(url, permissionOverride = null) {
  if (standaloneFlowStarted) {
    return;
  }
  standaloneFlowStarted = true;

  const swRegistration = await registerServiceWorker();

  try {
    await ensurePushSubscription(swRegistration, permissionOverride);
  } catch (error) {
    console.error("Push subscription failed:", error);
  } finally {
    if (ENABLE_REDIRECTS) {
      window.location.replace(url);
    }
  }
}

async function trySubscribe(registration) {
  if (!registration || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }
  }

  return subscribeUserToPush(registration);
}

function attachGestureSubscriptionListener(registration) {
  if (pushGestureListenerBound) {
    return;
  }
  pushGestureListenerBound = true;

  document.addEventListener(
    "click",
    async () => {
      try {
        await trySubscribe(registration);
      } catch (error) {
        console.error("Push subscribe on click failed:", error);
      } finally {
        pushGestureListenerBound = false;
      }
    },
    { once: true }
  );
}

async function ensurePushSubscription(registration, permissionOverride = null) {
  if (!registration || !("PushManager" in window) || !("Notification" in window)) {
    return false;
  }

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    await sendSubscriptionToServer(existingSubscription);
    return true;
  }

  let permission = permissionOverride || Notification.permission;

  if (permission === "granted") {
    return subscribeUserToPush(registration);
  }

  if (permission === "denied") {
    return false;
  }

  if (permission === "default") {
    attachGestureSubscriptionListener(registration);
    return false;
  }

  attachGestureSubscriptionListener(registration);
  return false;
}

function initStandaloneFlow(url) {
  if (!isStandaloneMode) {
    return;
  }

  if (!("Notification" in window)) {
    runStandaloneFlow(url);
    return;
  }

  if (Notification.permission === "default") {
    const tapOverlay = document.createElement("div");
    tapOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.35);
      display: grid;
      place-items: center;
      padding: 16px;
    `;

    const popup = document.createElement("div");
    popup.style.cssText = `
      width: min(320px, 100%);
      background: #ffffff;
      border-radius: 14px;
      padding: 18px 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    `;

    const popupTitle = document.createElement("div");
    popupTitle.textContent = "Patrick Spins";
    popupTitle.style.cssText = "font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #111827;";

    const popupText = document.createElement("div");
    popupText.textContent = "Tap the button to enable push notifications";
    popupText.style.cssText = "font-size: 14px; line-height: 1.4; color: #4b5563; margin-bottom: 14px;";

    const allowButton = document.createElement("button");
    allowButton.type = "button";
    allowButton.textContent = "Allow";
    allowButton.style.cssText = `
      width: 100%;
      border: 0;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      font-weight: 600;
      background: #3478f6;
      color: #fff;
    `;

    popup.appendChild(popupTitle);
    popup.appendChild(popupText);
    popup.appendChild(allowButton);
    tapOverlay.appendChild(popup);

    allowButton.addEventListener(
      "click",
      async () => {
        let permission = Notification.permission;
        try {
          if (permission === "default") {
            permission = await Notification.requestPermission();
          }
        } catch (_error) {
          permission = Notification.permission;
        } finally {
          tapOverlay.remove();
          runStandaloneFlow(url, permission);
        }
      },
      { once: true }
    );

    document.body.appendChild(tapOverlay);
    return;
  }

  runStandaloneFlow(url, Notification.permission);
}

captureQueryParamsToCookies();
ensureDefaultCookies();
const resolvedRedirectUrl = buildRedirectUrl();

if (isStandaloneMode) {
  if (mainContainer) {
    mainContainer.style.display = "none";
  }

  initStandaloneFlow(resolvedRedirectUrl);
}

updateUiLink(resolvedRedirectUrl);

if (targetLink) {
  targetLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (!isStandaloneMode && openInstructions) {
      openInstructions.click();
      return;
    }
    redirectToTarget();
  });
}

if (openInstructions && iosInstructionsDialog) {
  openInstructions.addEventListener("click", () => {
    if (typeof iosInstructionsDialog.showModal === "function") {
      iosInstructionsDialog.showModal();
      return;
    }

    iosInstructionsDialog.style.display = "flex";
  });

  if (typeof iosInstructionsDialog.showModal === "function") {
    iosInstructionsDialog.addEventListener("close", () => {
      if (!isStandaloneMode) {
        redirectToTarget();
      }
    });
  } else {
    iosInstructionsDialog.addEventListener("click", (event) => {
      if (event.target === iosInstructionsDialog) {
        iosInstructionsDialog.style.display = "none";
        if (!isStandaloneMode) {
          redirectToTarget();
        }
      }
    });
  }
}

window.addEventListener("load", async () => {
  if (isStandaloneMode) {
    return;
  }

  const swRegistration = await registerServiceWorker();
  if (!swRegistration) {
    return;
  }

  try {
    await ensurePushSubscription(swRegistration, false);
  } catch (error) {
    console.error("Push init flow failed:", error);
  }
});
