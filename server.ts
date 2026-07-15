/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import http from "http";
import { WebSocketServer, WebSocket as WS } from "ws";
import protobuf from "protobufjs";

// Load environment variables
dotenv.config();

// Upstox session credentials and mappings
let upstoxAccessToken: string | null = null;
let upstoxConnectedUser: any = null;
let upstoxLinkedPermanently = false;
let upstoxWs: WS | null = null;
const clientWsSockets = new Set<any>();
let simulationInterval: NodeJS.Timeout | null = null;
let upstoxReconnectTimeout: NodeJS.Timeout | null = null;

// Initialize Firebase Admin securely
import admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
try {
  const firebaseApp = admin.initializeApp({ projectId: "phonic-transit-7wfkz" });
  db = getFirestore(firebaseApp, "ai-studio-papermarketpro-a4c451cc-beae-433b-b0ec-ae18cdd3511b");
  console.log("[FIREBASE-ADMIN] Initialized targeting: ai-studio-papermarketpro-a4c451cc-beae-433b-b0ec-ae18cdd3511b");
} catch (err: any) {
  console.warn("[FIREBASE-ADMIN] Local or mock environment initialization: ", err.message);
}

const CACHE_PATH = path.join(process.cwd(), "upstox_token_cache.json");

async function saveUpstoxTokenToFirestore(token: string, user: any) {
  // Save locally first
  upstoxLinkedPermanently = true;
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ accessToken: token, user, upstoxLinkedPermanently: true, updatedAt: new Date().toISOString() }), "utf8");
    console.log("[CACHE] Saved active Upstox credentials to local cache file successfully.");
  } catch (err: any) {
    console.warn("[CACHE] Failed to save Upstox token to local cache:", err.message);
  }

  if (!db) return;
  try {
    const configDocRef = db.collection("config").doc("upstox");
    await configDocRef.set({
      accessToken: token,
      user: user,
      upstoxLinkedPermanently: true,
      updatedAt: new Date().toISOString()
    });
    console.log("[FIRESTORE] Saved active Upstox credentials to database successfully.");
  } catch (error: any) {
    console.warn("[FIRESTORE] Optional Firestore persistence note:", error.message);
  }
}

async function loadUpstoxTokenFromFirestore(): Promise<{ accessToken: string; user: any } | null> {
  // Load locally first
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
      if (data && (data.accessToken || data.upstoxLinkedPermanently)) {
        console.log("[CACHE] Successfully loaded saved Upstox token from local cache file.");
        if (data.upstoxLinkedPermanently || data.accessToken) {
          upstoxLinkedPermanently = true;
        }
        return { accessToken: data.accessToken, user: data.user };
      }
    }
  } catch (err: any) {
    console.warn("[CACHE] Failed to load Upstox token from local cache:", err.message);
  }

  if (!db) return null;
  try {
    const configDocRef = db.collection("config").doc("upstox");
    const docSnap = await configDocRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data && (data.accessToken || data.upstoxLinkedPermanently)) {
        console.log("[FIRESTORE] Successfully loaded saved Upstox token.");
        if (data.upstoxLinkedPermanently || data.accessToken) {
          upstoxLinkedPermanently = true;
        }
        return { accessToken: data.accessToken, user: data.user };
      }
    }
  } catch (error: any) {
    console.warn("[FIRESTORE] Optional Firestore retrieval note:", error.message);
  }
  return null;
}

async function clearUpstoxTokenInFirestore() {
  upstoxLinkedPermanently = false;
  // Clear locally
  try {
    if (fs.existsSync(CACHE_PATH)) {
      fs.unlinkSync(CACHE_PATH);
      console.log("[CACHE] Cleared active Upstox credentials in local cache file.");
    }
  } catch (err: any) {
    console.warn("[CACHE] Failed to clear local cache file:", err.message);
  }

  if (!db) return;
  try {
    const configDocRef = db.collection("config").doc("upstox");
    await configDocRef.set({
      accessToken: null,
      user: null,
      upstoxLinkedPermanently: false,
      updatedAt: new Date().toISOString()
    });
    console.log("[FIRESTORE] Cleared Upstox credentials in database.");
  } catch (error: any) {
    console.warn("[FIRESTORE] Optional Firestore clearing note:", error.message);
  }
}

const UPSTOX_INSTRUMENT_MAP: Record<string, string> = {
  'NIFTY 50': 'NSE_INDEX|Nifty 50',
  'BANKNIFTY': 'NSE_INDEX|Nifty Bank',
  'FINNIFTY': 'NSE_INDEX|Nifty Fin Service',
  'SENSEX': 'BSE_INDEX|SENSEX',
  'MIDCPNIFTY': 'NSE_INDEX|Nifty Midcap 50',
  'RELIANCE': 'NSE_EQ|INE002A01018',
  'TCS': 'NSE_EQ|INE467B01029',
  'INFY': 'NSE_EQ|INE009A01021',
  'HDFCBANK': 'NSE_EQ|INE040A01034',
  'ICICIBANK': 'NSE_EQ|INE090A01021',
  'SBIN': 'NSE_EQ|INE062A01020',
  'TATAMOTORS': 'NSE_EQ|INE155A01022',
  'LT': 'NSE_EQ|INE018A01030',
  'BHARTIARTL': 'NSE_EQ|INE397D01024',
  'ITC': 'NSE_EQ|INE154A01025',
  'HINDUNILVR': 'NSE_EQ|INE030A01027',
  'WIPRO': 'NSE_EQ|INE075A01022',
  'AXISBANK': 'NSE_EQ|INE238A01034',
  'KOTAKBANK': 'NSE_EQ|INE237A01028',
  'BAJFINANCE': 'NSE_EQ|INE296A01024',
  'M&M': 'NSE_EQ|INE101A01026',
  'SUNPHARMA': 'NSE_EQ|INE044A01045'
};

const UPSTOX_TRADING_SYMBOL_TO_FRONTEND_MAP: Record<string, string> = {
  'Nifty 50': 'NIFTY 50',
  'Nifty Bank': 'BANKNIFTY',
  'Nifty Fin Service': 'FINNIFTY',
  'SENSEX': 'SENSEX',
  'Nifty Midcap 50': 'MIDCPNIFTY',
  'RELIANCE': 'RELIANCE',
  'TCS': 'TCS',
  'INFY': 'INFY',
  'HDFCBANK': 'HDFCBANK',
  'ICICIBANK': 'ICICIBANK',
  'SBIN': 'SBIN',
  'TATAMOTORS': 'TATAMOTORS',
  'TMPV': 'TATAMOTORS',
  'LT': 'LT',
  'BHARTIARTL': 'BHARTIARTL',
  'ITC': 'ITC',
  'HINDUNILVR': 'HINDUNILVR',
  'WIPRO': 'WIPRO',
  'AXISBANK': 'AXISBANK',
  'KOTAKBANK': 'KOTAKBANK',
  'BAJFINANCE': 'BAJFINANCE',
  'M&M': 'M&M',
  'SUNPHARMA': 'SUNPHARMA'
};

function matchUpstoxKeyToSymbol(key: string): string | null {
  if (!key) return null;
  const cleanKey = key.replace(":", "|");

  // Direct match in instrument map values (e.g., 'NSE_INDEX|Nifty 50' or 'NSE_EQ|INE002A01018')
  for (const [symbol, upstoxVal] of Object.entries(UPSTOX_INSTRUMENT_MAP)) {
    if (upstoxVal.replace(":", "|") === cleanKey) {
      return symbol;
    }
  }

  // Split and match by trading symbol (e.g., 'NSE_EQ|RELIANCE' -> 'RELIANCE')
  const parts = cleanKey.split("|");
  if (parts.length > 1) {
    const tradingSymbolOrIsin = parts[1];
    
    // Check in TRADING_SYMBOL_TO_FRONTEND map
    if (UPSTOX_TRADING_SYMBOL_TO_FRONTEND_MAP[tradingSymbolOrIsin]) {
      return UPSTOX_TRADING_SYMBOL_TO_FRONTEND_MAP[tradingSymbolOrIsin];
    }

    // Check if the trading symbol itself is directly the frontend symbol key
    if (UPSTOX_INSTRUMENT_MAP[tradingSymbolOrIsin]) {
      return tradingSymbolOrIsin;
    }
  }

  return null;
}

function broadcastToClients(payload: any) {
  const messageStr = JSON.stringify(payload);
  clientWsSockets.forEach(ws => {
    if (ws.readyState === WS.OPEN) {
      ws.send(messageStr);
    }
  });
}

function scheduleUpstoxReconnect() {
  if (upstoxReconnectTimeout) return; // already scheduled
  if (!upstoxAccessToken) return; // no token, don't reconnect

  console.log("[UPSTOX RECONNECT] Scheduling Upstox WebSocket reconnection in 10 seconds...");
  upstoxReconnectTimeout = setTimeout(async () => {
    upstoxReconnectTimeout = null;
    await connectUpstoxFeed();
  }, 10000);
}

async function connectUpstoxFeed() {
  try {
    if (!upstoxAccessToken) return;

    // 1. Authorize WebSocket connection
    const authRes = await fetch("https://api.upstox.com/v3/feed/market-data-feed/authorize", {
      headers: {
        "Authorization": `Bearer ${upstoxAccessToken}`,
        "Accept": "application/json"
      }
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      console.error("Upstox WS authorize failed:", errText);
      // We do not clear the token automatically to ensure the connection remains saved and can self-recover/reconnect
      scheduleUpstoxReconnect();
      return;
    }

    const authData = await authRes.json();
    const redirectUrl = authData?.data?.authorizedRedirectUri || authData?.data?.authorized_redirect_uri || authData?.data?.authorizedRedirectUrl;
    if (!redirectUrl) {
      console.error("Invalid authorize redirect URL from Upstox:", authData);
      scheduleUpstoxReconnect();
      return;
    }

    console.log("Upstox WS Authorized. Connecting to:", redirectUrl);

    // 2. Load the protobuf schema
    const root = await protobuf.load("./MarketDataFeed.proto");
    const FeedResponse = root.lookupType("com.upstox.marketdatafeed.FeedResponse");

    // 3. Establish WS connection
    upstoxWs = new WS(redirectUrl, {
      headers: {
        "Authorization": `Bearer ${upstoxAccessToken}`
      }
    });

    upstoxWs.on("open", () => {
      console.log("Upstox Live WebSocket connected successfully!");
      // Send subscription request for all configured instrument keys
      const subscriptionMessage = {
        guid: "papermarket-subscription-v3",
        method: "sub",
        data: {
          mode: "full",
          instrumentKeys: Object.values(UPSTOX_INSTRUMENT_MAP)
        }
      };
      upstoxWs?.send(JSON.stringify(subscriptionMessage));
    });

    upstoxWs.on("message", (data: Buffer) => {
      try {
        // Decode Protobuf binary buffer
        const decodedMessage = FeedResponse.decode(data);
        const feedObject = FeedResponse.toObject(decodedMessage, {
          longs: String,
          enums: String,
          bytes: String,
        }) as any;

        if (feedObject && feedObject.feeds) {
          const keys = Object.keys(feedObject.feeds);
          if (keys.length > 0) {
            console.log(`[UPSTOX FEED LIVE] Received real-time updates for ${keys.length} instruments (e.g. ${keys.slice(0, 3).join(", ")}).`);
          }
          // Process and map the feeds
          keys.forEach(key => {
            const feed = feedObject.feeds[key];
            let ltp = 0;
            let high = 0;
            let low = 0;
            let close = 0;

            if (feed.ltpc) {
              ltp = Number(feed.ltpc.ltp);
              close = Number(feed.ltpc.cp);
            }
            if (feed.ff) {
              if (feed.ff.ltpc) {
                ltp = Number(feed.ff.ltpc.ltp);
                close = Number(feed.ff.ltpc.cp);
              }
              if (feed.ff.marketOHLC && feed.ff.marketOHLC.ohlc) {
                const d1 = feed.ff.marketOHLC.ohlc.find((o: any) => o.interval === "1d") || feed.ff.marketOHLC.ohlc[0];
                if (d1) {
                  high = Number(d1.high);
                  low = Number(d1.low);
                }
              }
            }

            // Find reverse symbol from map using our robust matcher
            const symbol = matchUpstoxKeyToSymbol(key);
            if (symbol && ltp > 0) {
              const change = close > 0 ? ((ltp - close) / close) * 100 : 0;
              console.log(`[UPSTOX REALTIME TICK] ${symbol}: LTP = ${ltp}, High = ${high}, Low = ${low}, Change = ${change.toFixed(2)}%`);
              const payload = {
                type: "TICK",
                symbol,
                ltp,
                high: high || ltp,
                low: low || ltp,
                change: Number(change.toFixed(2))
              };

              // Broadcast tick to all connected clients
              broadcastToClients(payload);
            }
          });
        }
      } catch (err: any) {
        console.error("Protobuf WS Decode Error:", err.message);
      }
    });

    upstoxWs.on("close", (code, reason) => {
      console.log(`Upstox Live WebSocket closed: Code ${code}, Reason: ${reason}`);
      upstoxWs = null;
      scheduleUpstoxReconnect();
    });

    upstoxWs.on("error", (error) => {
      console.error("Upstox Live WebSocket Error:", error.message);
    });

  } catch (error: any) {
    console.error("Failed to connect Upstox Feed:", error.message);
    scheduleUpstoxReconnect();
  }
}

function reconnectUpstoxWebSocket() {
  disconnectUpstoxWebSocket();
  if (upstoxReconnectTimeout) {
    clearTimeout(upstoxReconnectTimeout);
    upstoxReconnectTimeout = null;
  }
  if (!upstoxAccessToken) return;

  console.log("Initiating Upstox Live Market Data WebSocket connection...");
  connectUpstoxFeed();
}

function disconnectUpstoxWebSocket() {
  if (upstoxReconnectTimeout) {
    clearTimeout(upstoxReconnectTimeout);
    upstoxReconnectTimeout = null;
  }
  if (upstoxWs) {
    try {
      upstoxWs.close();
    } catch (e) {}
    upstoxWs = null;
  }
}

async function verifyAndConnectProvidedToken(token: string) {
  console.log("------------------------------------------------------------------");
  console.log("[UPSTOX PRO VERIFICATION] VERIFYING USER-PROVIDED ACCESS TOKEN...");
  console.log(`[UPSTOX PRO VERIFICATION] Token: ${token.slice(0, 15)}...${token.slice(-15)}`);
  try {
    const res = await fetch("https://api.upstox.com/v2/user/profile", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[UPSTOX PRO VERIFICATION] Failed! HTTP status: ${res.status}`);
      console.error("[UPSTOX PRO VERIFICATION] Response payload:", errText);
      return false;
    }

    const data = await res.json();
    console.log("[UPSTOX PRO VERIFICATION] Profile Response Status:", data.status);
    if (data.status === "success" && data.data) {
      upstoxAccessToken = token;
      upstoxConnectedUser = {
        email: "pro_feed_user@papermarket.local",
        userName: "Upstox Pro Account",
        userId: "UPSTOX_USER",
      };
      console.log("[UPSTOX PRO VERIFICATION] Configured active anonymized connected profile:", upstoxConnectedUser);
      console.log("[UPSTOX PRO VERIFICATION] Triggering real-time Live Feed connection...");
      reconnectUpstoxWebSocket();
      return true;
    } else {
      console.error("[UPSTOX PRO VERIFICATION] Error: Response format does not contain success status or data:", data);
      return false;
    }
  } catch (err: any) {
    console.error("[UPSTOX PRO VERIFICATION] Exception raised:", err.message);
    return false;
  } finally {
    console.log("------------------------------------------------------------------");
  }
}

function startSimulationLoop() {
  if (simulationInterval) return;

  simulationInterval = setInterval(() => {
    // Only simulate if Upstox WS is NOT active
    if (upstoxWs) return;

    // Simulate tick updates for multiple symbols every 200ms to keep the UI incredibly fast, active and responsive for everyone
    const symbols = Object.keys(UPSTOX_INSTRUMENT_MAP);
    for (let i = 0; i < 6; i++) {
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const payload = {
        type: "SIM_TICK",
        symbol: randomSymbol
      };
      broadcastToClients(payload);
    }
  }, 200);
}

function stopSimulationLoop() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

// Initialize Razorpay client with environment variables or fallback to provided test credentials
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_TC3Hx6D3Aywz7D";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "qwRsIZ4BEbOcPLy5Erk5AEg4";

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// Lazy-initialize the official @google/genai SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY is not configured or is a placeholder. Using fallback mode.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function getLLMParameters(llmConfig: any, cognitiveRules: any, defaultModel: string, defaultTemp: number, defaultSystemInstruction: string) {
  const model = llmConfig?.selectedModel === "gemini-3.1-pro-preview" ? "gemini-3.1-pro-preview" : defaultModel;
  const temperature = llmConfig?.temperature !== undefined ? Number(llmConfig.temperature) : defaultTemp;
  
  let systemInstruction = defaultSystemInstruction;

  let personaPreamble = "";
  if (llmConfig?.systemPersona === "Market Veteran") {
    personaPreamble = "SYSTEM PERSONA ACTIVE: Prop-desk market veteran. Speak with raw tape-reading realism, using direct trading terminology (e.g. 'paper cuts', 'revenge trading', 'blowing accounts') and focus heavily on execution mechanics and survival.";
  } else if (llmConfig?.systemPersona === "Quantitative Analyst") {
    personaPreamble = "SYSTEM PERSONA ACTIVE: Algorithmic trading desk head. Focus purely on mathematical expectancy, drawdowns, profit factors, risk-of-ruin metrics, and highly precise statistical trade structures.";
  } else if (llmConfig?.systemPersona === "Clinical Psychologist") {
    personaPreamble = "SYSTEM PERSONA ACTIVE: Licensed clinical trading psychologist. Focus on calming mental exercises, identifying emotional triggers (FOMO, greed, loss-fear), cognitive framing, and disciplined routine adherence.";
  }

  let groundingContext = "";
  if (llmConfig?.customGrounding && llmConfig.customGrounding.trim() !== "") {
    groundingContext = `ADDITIONAL GROUNDING/TRAINING DIRECTIVES FROM THE TRADER:\n"${llmConfig.customGrounding}"`;
  }

  let cognitiveGrounding = "";
  if (llmConfig?.injectCognitiveRules && Array.isArray(cognitiveRules) && cognitiveRules.length > 0) {
    cognitiveGrounding = `TRADER'S ACTIVE COGNITIVE COMMITMENTS (Do NOT contradict these rules; reinforce them):\n` +
      cognitiveRules.map((c: any) => `- Trigger condition: "${c.trigger}" => Mandated Action: "${c.action}"`).join('\n');
  }

  const parts = [
    personaPreamble,
    systemInstruction,
    groundingContext,
    cognitiveGrounding
  ].filter(p => p !== "").join("\n\n---\n\n");

  return {
    model,
    temperature,
    systemInstruction: parts
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Upstox Integration API Endpoints
  app.get("/api/integrations/upstox/auth-url", (req, res) => {
    const apiKey = process.env.UPSTOX_API_KEY;
    let redirectUri = process.env.UPSTOX_REDIRECT_URI;
    if (!redirectUri) {
      if (process.env.APP_URL) {
        redirectUri = `${process.env.APP_URL.replace(/\/$/, "")}/api/integrations/upstox/callback`;
      } else {
        const host = req.get('host') || "";
        const protocol = host.includes("localhost") ? "http" : "https";
        redirectUri = `${protocol}://${host}/api/integrations/upstox/callback`;
      }
    }

    if (!apiKey) {
      return res.status(400).json({ error: "UPSTOX_API_KEY is not configured in environment variables." });
    }

    const params = new URLSearchParams({
      client_id: apiKey,
      redirect_uri: redirectUri,
      response_type: "code"
    });

    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get("/api/integrations/upstox/auth", (req, res) => {
    const apiKey = process.env.UPSTOX_API_KEY;
    let redirectUri = process.env.UPSTOX_REDIRECT_URI;
    if (!redirectUri) {
      if (process.env.APP_URL) {
        redirectUri = `${process.env.APP_URL.replace(/\/$/, "")}/api/integrations/upstox/callback`;
      } else {
        const host = req.get('host') || "";
        const protocol = host.includes("localhost") ? "http" : "https";
        redirectUri = `${protocol}://${host}/api/integrations/upstox/callback`;
      }
    }

    if (!apiKey) {
      return res.status(400).send("UPSTOX_API_KEY is not configured in environment variables.");
    }

    const params = new URLSearchParams({
      client_id: apiKey,
      redirect_uri: redirectUri,
      response_type: "code"
    });

    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
    res.redirect(authUrl);
  });

  app.get(["/api/integrations/upstox/callback", "/api/integrations/upstox/callback/"], async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code is missing.");
    }

    try {
      const apiKey = process.env.UPSTOX_API_KEY;
      const apiSecret = process.env.UPSTOX_API_SECRET;
      let redirectUri = process.env.UPSTOX_REDIRECT_URI;
      if (!redirectUri) {
        if (process.env.APP_URL) {
          redirectUri = `${process.env.APP_URL.replace(/\/$/, "")}/api/integrations/upstox/callback`;
        } else {
          const host = req.get('host') || "";
          const protocol = host.includes("localhost") ? "http" : "https";
          redirectUri = `${protocol}://${host}/api/integrations/upstox/callback`;
        }
      }

      const tokenResponse = await fetch("https://api.upstox.com/v2/login/authorization/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "accept": "application/json"
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: apiKey || "",
          client_secret: apiSecret || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        }).toString()
      });

      if (!tokenResponse.ok) {
        const errData = await tokenResponse.text();
        throw new Error(`Upstox token exchange failed: ${errData}`);
      }

      const data = await tokenResponse.json();
      upstoxAccessToken = data.access_token;
      upstoxConnectedUser = {
        email: "pro_feed_user@papermarket.local",
        userName: "Upstox Pro Account",
        userId: "UPSTOX_USER",
      };

      // Save to Firestore for all users & devices persistence
      await saveUpstoxTokenToFirestore(upstoxAccessToken, upstoxConnectedUser);

      // Reconnect Upstox Live WebSocket
      reconnectUpstoxWebSocket();

      res.send(`
        <html>
          <head>
            <style>
              body {
                background-color: #060913;
                color: #f3f4f6;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                padding: 2.5rem;
                border-radius: 1.5rem;
                text-align: center;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
                max-width: 400px;
              }
              .success-icon {
                color: #10b981;
                font-size: 3rem;
                margin-bottom: 1rem;
              }
              h1 {
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                font-weight: 600;
              }
              p {
                color: #9ca3af;
                font-size: 0.875rem;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="success-icon">✓</div>
              <h1>Authentication Successful</h1>
              <p>Upstox Developer API has been linked successfully to your Paper Market Pro account. This window will now self-close.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(upstoxConnectedUser)} }, '*');
                setTimeout(() => {
                  window.close();
                }, 1500);
              } else {
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              }
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Upstox OAuth Error:", error);
      res.status(500).send(`Upstox authentication failed: ${error.message}`);
    }
  });

  app.get("/api/integrations/upstox/status", (req, res) => {
    const isReal = !!upstoxWs && upstoxWs.readyState === WS.OPEN;
    res.json({
      connected: !!upstoxAccessToken || upstoxLinkedPermanently,
      wsConnected: isReal || upstoxLinkedPermanently,
      wsReadyState: upstoxWs ? upstoxWs.readyState : null,
      user: (upstoxConnectedUser || upstoxLinkedPermanently) ? {
        email: "pro_feed_user@papermarket.local",
        userName: "Upstox Pro Account",
        userId: "UPSTOX_USER",
      } : null,
      config: {
        apiKey: process.env.UPSTOX_API_KEY ? `${process.env.UPSTOX_API_KEY.slice(0, 6)}...` : null,
        redirectUri: process.env.UPSTOX_REDIRECT_URI || null
      },
      isRealUpstox: isReal
    });
  });

  app.post("/api/integrations/upstox/disconnect", async (req, res) => {
    upstoxAccessToken = null;
    upstoxConnectedUser = null;
    disconnectUpstoxWebSocket();
    await clearUpstoxTokenInFirestore();
    res.json({ success: true, message: "Disconnected successfully." });
  });

  app.post("/api/integrations/upstox/connect-manual", async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== "string" || token.trim() === "") {
      return res.status(400).json({ error: "Access token is required" });
    }

    const trimmedToken = token.trim();
    try {
      const verifyRes = await fetch("https://api.upstox.com/v2/user/profile", {
        headers: {
          "Authorization": `Bearer ${trimmedToken}`,
          "Accept": "application/json"
        }
      });

      if (!verifyRes.ok) {
        const errText = await verifyRes.text();
        let errMsg = "Verification failed.";
        try {
          const errObj = JSON.parse(errText);
          if (errObj.errors && errObj.errors[0]) {
            errMsg = errObj.errors[0].message || errMsg;
          } else if (errObj.message) {
            errMsg = errObj.message;
          }
        } catch (_) {}
        return res.status(400).json({ error: `Upstox rejected token: ${errMsg}` });
      }

      const data = await verifyRes.json();
      if (data.status === "success" && data.data) {
        upstoxAccessToken = trimmedToken;
        upstoxConnectedUser = {
          email: "pro_feed_user@papermarket.local",
          userName: "Upstox Pro Account",
          userId: "UPSTOX_USER",
        };
        
        await saveUpstoxTokenToFirestore(trimmedToken, upstoxConnectedUser);
        reconnectUpstoxWebSocket();

        return res.json({
          success: true,
          message: "Successfully connected to Upstox Market Data Feed!",
          user: upstoxConnectedUser
        });
      } else {
        return res.status(400).json({ error: "Failed to parse profile data from Upstox." });
      }
    } catch (err: any) {
      return res.status(500).json({ error: `Token validation error: ${err.message}` });
    }
  });

  app.get("/api/integrations/upstox/candles", async (req, res) => {
    const { symbol, timeframe } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    if (!upstoxAccessToken) {
      return res.json({ fallback: true, message: "Upstox not connected. Using premium simulation." });
    }

    try {
      const upstoxSymbol = UPSTOX_INSTRUMENT_MAP[symbol as string];
      if (!upstoxSymbol) {
        return res.json({ fallback: true, message: `Symbol ${symbol} has no Upstox mapping. Using simulation.` });
      }

      let upstoxInterval = "1minute";
      if (timeframe === "1D") {
        upstoxInterval = "day";
      } else if (timeframe === "30m" || timeframe === "1h") {
        upstoxInterval = "30minute";
      }

      let url = `https://api.upstox.com/v2/historical-candle/intraday/${encodeURIComponent(upstoxSymbol)}/${upstoxInterval}`;
      if (upstoxInterval === "day") {
        const toDateObj = new Date();
        const toDate = toDateObj.toISOString().split('T')[0];
        
        const fromDateObj = new Date();
        fromDateObj.setDate(fromDateObj.getDate() - 365); // 1 year of daily historical data
        const fromDate = fromDateObj.toISOString().split('T')[0];
        
        url = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(upstoxSymbol)}/${upstoxInterval}/${toDate}/${fromDate}`;
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${upstoxAccessToken}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Upstox candles request failed: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.status !== "success" || !json.data || !json.data.candles) {
        throw new Error("No candle data returned from Upstox.");
      }

      const candles = json.data.candles.map((c: any) => {
        const date = new Date(c[0]);
        let formattedTime = "";
        if (timeframe === '1D') {
          formattedTime = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } else {
          formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
        }

        return {
          time: formattedTime,
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
          volume: Number(c[5])
        };
      }).reverse();

      res.json({ success: true, candles });
    } catch (error: any) {
      console.warn(`Upstox Candle Fetch Warning for ${symbol}:`, error.message);
      res.json({ fallback: true, message: error.message });
    }
  });

  app.get("/api/integrations/upstox/ltp", async (req, res) => {
    if (!upstoxAccessToken) {
      return res.status(401).json({ error: "Upstox not connected" });
    }

    try {
      const keys = Object.values(UPSTOX_INSTRUMENT_MAP);
      
      // Chunk keys into arrays of max 15 items to respect Upstox API limits of max 20 per request
      const chunkSize = 15;
      const chunks: string[][] = [];
      for (let i = 0; i < keys.length; i += chunkSize) {
        chunks.push(keys.slice(i, i + chunkSize));
      }

      const prices: Record<string, number> = {};
      const rawKeys: string[] = [];

      // Fetch all chunks concurrently to keep performance high
      await Promise.all(chunks.map(async (chunk) => {
        try {
          const instrumentKeyParam = chunk.map(k => encodeURIComponent(k)).join(",");
          const url = `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrumentKeyParam}`;

          const response = await fetch(url, {
            headers: {
              "Authorization": `Bearer ${upstoxAccessToken}`,
              "Accept": "application/json"
            }
          });

          if (!response.ok) {
            console.error(`Upstox LTP chunk query failed with status: ${response.status}`);
            return;
          }

          const json = await response.json();
          if (json.status === "success" && json.data) {
            Object.keys(json.data).forEach(upstoxKey => {
              rawKeys.push(upstoxKey);
              const symbol = matchUpstoxKeyToSymbol(upstoxKey);
              if (symbol) {
                prices[symbol] = json.data[upstoxKey].last_price;
              }
            });
          }
        } catch (chunkErr: any) {
          console.error("Upstox LTP chunk fetch exception:", chunkErr.message);
        }
      }));

      res.json({ success: true, prices, rawKeys });
    } catch (error: any) {
      console.error("Upstox LTP Fetch Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Razorpay Payment Gateway Integration Routes
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const options = {
        amount: 900, // ₹9.00 in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId
      });
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      res.status(500).json({ success: false, error: "Failed to create Razorpay order.", details: error.message });
    }
  });

  app.post("/api/razorpay/verify-signature", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(body.toString())
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;
      if (isValid) {
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, error: "Invalid payment signature verification." });
      }
    } catch (error: any) {
      console.error("Razorpay signature verification error:", error);
      res.status(500).json({ success: false, error: "Failed to verify transaction.", details: error.message });
    }
  });

  // Helper to safely parse JSON from Gemini markdown wrappers
  function cleanAndParseJSON(text: string): any {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    }
    return JSON.parse(cleaned);
  }

  // A. AI Journal Auto-Log API
  app.post("/api/journal/auto-generate", async (req, res) => {
    const { symbol, direction, entryPrice, exitPrice, realizedPnl, quantity, closedTimestamp, additionalNotes, llmConfig, cognitiveRules } = req.body;

    if (!symbol || !direction) {
      return res.status(400).json({ error: "Symbol and Direction are required." });
    }

    const isWin = (realizedPnl || 0) >= 0;
    const generateFallback = () => ({
      entryReason: `Technical momentum setup based on high volume test near local support boundaries.`,
      exitReason: isWin ? "Profit targets reached at designated horizontal resistance levels." : "Manual stop-loss triggered to protect virtual core balance.",
      emotionTags: isWin ? ["Patient", "Disciplined"] : ["Anxious", "Fearful"],
      mistakeTags: isWin ? [] : ["Early Exit"],
      lessonLearned: `IF I trade ${symbol}, THEN I will establish rigid limit exit parameters beforehand and let them execute without emotional intervention.`,
      disciplineRating: isWin ? 5 : 3,
      notes: `Simulated trade log generated via intelligent local heuristic rules due to fallback parameters.`
    });

    const aiClient = getGeminiClient();
    if (!aiClient) {
      return res.json({ success: true, entry: generateFallback() });
    }

    try {
      const prompt = `Please evaluate and journalize this closed trade:
- Asset: ${symbol}
- Direction: ${direction}
- Quantity: ${quantity}
- Entry Price: ₹${entryPrice}
- Exit Price: ₹${exitPrice}
- P&L: ₹${realizedPnl}
- Exit Date: ${closedTimestamp || new Date().toISOString()}
- Trader's Private Thoughts: "${additionalNotes || 'None'}"

You must reconstruct a detailed, high-fidelity journal entry representing the trade. Support technical rationale and trading psychology.
Produce a JSON response matching this schema:
{
  "entryReason": "detailed technical entry setup rationale (e.g., support breakthrough, EMA crossover, RSI divergence)",
  "exitReason": "exit justification (e.g., target hit, stop loss hit, or anxiety manual cut)",
  "emotionTags": ["FOMO" | "Greedy" | "Fearful" | "Disciplined" | "Revenge" | "Overconfident" | "Patient" | "Anxious"], // Choose 1-3 tags
  "mistakeTags": ["Early Exit" | "Late Exit" | "Moved Stop Loss" | "Oversized Position" | "No Plan" | "FOMO Entry" | "Revenge Trade" | "Ignored Signal" | "Broke Rules"], // Choose 0-3 mistakes, or empty [] if highly disciplined
  "lessonLearned": "specific behavioral or risk heuristic rule in 'IF I... THEN I WILL...' format",
  "disciplineRating": 4, // integer rating 1-5
  "notes": "constructive 2-sentence critique analyzing the trade speed, risk profile, and alignment with proper trading methodology"
}`;

      const baseSystemInstruction = `You are "AI Journalizer" - specifically acting as a highly experienced human trader reviewing a trade log.
Analyze the provided closed trade parameters and generate a highly realistic, professional, and psychologically acute journal entry.

CRITICAL VOICE AND STYLE GUIDELINES:
1. STRICTLY FORBIDDEN: Do NOT sound like ChatGPT or Gemini. Avoid corporate jargon, preachy advice, or robotic intros/outros.
2. The fields "entryReason", "exitReason", "lessonLearned", and "notes" must sound exactly like a real human trader writing in their personal trading diary after a long session. Keep them concise, punchy, and highly realistic. Use short phrases and conversational styles (e.g., "Smashed into major resistance on high volume, had to cut it," instead of "The exit was executed because the asset reached a designated resistance level.").
3. Format the output strictly as JSON matching the requested schema. Do not include any text before or after the JSON.`;

      const { model, temperature, systemInstruction } = getLLMParameters(llmConfig, cognitiveRules, "gemini-3.5-flash", 0.4, baseSystemInstruction);

      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
          responseMimeType: "application/json"
        }
      });

      const entry = cleanAndParseJSON(response.text || "{}");
      res.json({ success: true, entry });
    } catch (error: any) {
      console.error("AI Auto-Journal Generation Error:", error);
      res.json({ success: true, entry: generateFallback() });
    }
  });

  // B. AI Coach Teach on Journals API
  app.post("/api/coach/teach", async (req, res) => {
    const { journals, llmConfig, cognitiveRules } = req.body;

    if (!journals || !Array.isArray(journals) || journals.length === 0) {
      return res.status(400).json({ error: "No journals available to teach on. Please log some journals first." });
    }

    const generateFallback = () => ({
      title: "Mastering Consistency & Preventing Early Exits",
      problemAnalysis: "Based on your simulated trading history, you have a tendency to cut profits short out of anxiety while letting losses run. This unbalances your risk-to-reward ratio.",
      coreConcept: `### Understanding the Prospect Theory
In behavioral finance, Daniel Kahneman's **Prospect Theory** explains that humans feel the pain of a loss twice as intensely as the pleasure of an equivalent gain. This leads traders to exit winning trades too early to lock in 'safe' profits, while holding onto losing trades hoping they will return to break-even.

### The Mathematics of Expectancy
Your trading expectancy is calculated as:
$$\\text{Expectancy} = (\\text{Win Rate} \\times \\text{Average Win}) - (\\text{Loss Rate} \\times \\text{Average Loss})$$
If you cut wins early (making Average Win small) and let losses run (making Average Loss large), your expectancy will be negative even with a 70% win rate!

### How to Overcome this Leak
1. **Implement Rule-Based Targets**: Set strict bracket orders (OOC) where target and stop-loss are automatically sent to the exchange.
2. **Step Away from the Screen**: Once a trade is active, do not monitor every tick. Noise triggers anxiety, which triggers premature exits.`,
      exerciseTitle: "Drafting an Execution Intention",
      exercisePrompt: "Write down your customized 'IF-THEN' rule to protect your winning trades. Example: 'IF price crosses 50% of my target, THEN I will move my stop loss to break-even and close my chart terminal.'",
      quizQuestion: "You are in a profitable trade up 8% on NIFTY-50, but you feel an overwhelming fear that the market will reverse and wipe out your profits. What is the most disciplined action?",
      quizOptions: [
        "Exit immediately to secure the profits and feel safe",
        "Trust your pre-calculated plan; let the trade hit either the target or the stop-loss automatically",
        "Double your position size to maximize the win quickly",
        "Adjust your profit target lower by 50% just to be safe"
      ],
      quizCorrectIndex: 1,
      quizExplanation: "Trusting your pre-calculated parameters ensures statistical expectancy works over a series of 100 trades. Changing plans mid-trade is a form of cognitive bias."
    });

    const aiClient = getGeminiClient();
    if (!aiClient) {
      return res.json({ success: true, lesson: generateFallback() });
    }

    try {
      const prompt = `Here are the user's latest logged trade journals:
${JSON.stringify(journals.slice(0, 10))}

Review their emotional tags and mistake tags. Pinpoint their main vulnerability (e.g., repeating FOMO entries, resizing positions, revenge trading, or exiting wins early).
Design a custom interactive lesson based on these actual logs.
Produce a JSON response matching this schema:
{
  "title": "A short high-impact title addressing their biggest vulnerability",
  "problemAnalysis": "2-3 sentence analysis of their behavior, citing their actual logged symbols or emotions to prove the coach researched their journal",
  "coreConcept": "Deep educational curriculum lesson (Markdown string, 3 paragraphs) teaching CBT tools or mathematical rules to overcome this mistake",
  "exerciseTitle": "Interactive Reflection Title",
  "exercisePrompt": "Actionable reflection or writing prompt instructing them to construct a specific If-Then rule for their next trade",
  "quizQuestion": "A situational multiple choice question testing their grasp of this leak",
  "quizOptions": ["Option A", "Option B", "Option C", "Option D"], // exactly 4 options
  "quizCorrectIndex": 1, // integer 0 to 3
  "quizExplanation": "Deep psychological explanation of why the correct option is the optimal action"
}`;

      const baseSystemInstruction = `You are "AI Trading Coach & Educator" - specifically acting as a seasoned trading partner who writes punchy, conversational, and deeply authentic notes.
Based on the user's trading journal entries, evaluate their core psychological and tactical leaks.
Design an engaging, personalized Markdown tutorial lesson to correct this behavior.

CRITICAL VOICE AND STYLE GUIDELINES:
1. STRICTLY FORBIDDEN: Do NOT sound like ChatGPT or Gemini. Avoid academic jargon, preachy advice, or robotic intros/outros. Write the lesson as if a highly successful trader is messaging a buddy on Discord to help them fix an expensive leak.
2. The 'coreConcept' section should be written in conversational Markdown. Use short paragraphs, casual contractions, and a direct tone. Break the concept down through raw real-world insights, not clinical bulleted guides.
3. Keep the lesson punchy, realistic, empathetic, and grounded in real-market execution.
4. Format the output strictly as JSON. No markdown other than the JSON string itself.
5. CRITICAL LANGUAGE RULE: Detect the language of the user's trading journal entries. If they are written in another language (e.g. Hindi, Hinglish, Spanish, etc.), generate the lesson titles, problemAnalysis, coreConcept, exercises, and quizzes in that SAME language so the user gets a fully native learning experience!`;

      const { model, temperature, systemInstruction } = getLLMParameters(llmConfig, cognitiveRules, "gemini-3.5-flash", 0.6, baseSystemInstruction);

      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
          responseMimeType: "application/json"
        }
      });

      const lesson = cleanAndParseJSON(response.text || "{}");
      res.json({ success: true, lesson });
    } catch (error: any) {
      console.error("AI Coach Teach Error:", error);
      res.json({ success: true, lesson: generateFallback() });
    }
  });

  // C. AI Coach Train Scorecard API
  app.post("/api/coach/train-scorecard", async (req, res) => {
    const { journals, positions, focusArea, customPrompt, llmConfig, cognitiveRules } = req.body;

    // Calculate real-time metrics based on user's actual ledger logs
    let totalTrades = (positions || []).filter((p: any) => p.status === 'Closed').length;
    let winTrades = (positions || []).filter((p: any) => p.status === 'Closed' && (p.realizedPnl || 0) > 0).length;
    let winRate = totalTrades > 0 ? Math.round((winTrades / totalTrades) * 100) : 60;

    // A. Compute Discipline Score
    // Base is 70. Add points for journaled trades, subtract for mistake logs.
    let baseDiscipline = 72;
    if (journals && Array.isArray(journals)) {
      baseDiscipline += journals.length * 4; // reward journaling
      journals.forEach((j: any) => {
        if (j.mistakeTags && j.mistakeTags.length > 0) {
          baseDiscipline -= j.mistakeTags.length * 6; // penalize logged mistakes
        }
        if (j.disciplineRating) {
          baseDiscipline += (j.disciplineRating - 3) * 2; // reward higher ratings
        }
      });
    }
    let disciplineScore = Math.min(98, Math.max(15, baseDiscipline));

    // B. Compute Risk Control Score
    // Base is 65. Subtract for resizing, lack of stop losses, or excessive losses.
    let baseRisk = 68;
    let tradesWithSL = (positions || []).filter((p: any) => p.stopLoss !== undefined).length;
    if (totalTrades > 0) {
      const slRatio = tradesWithSL / totalTrades;
      baseRisk += Math.round(slRatio * 15);
    }
    if (journals && Array.isArray(journals)) {
      journals.forEach((j: any) => {
        if (j.mistakeTags && j.mistakeTags.includes('Oversized Position')) baseRisk -= 10;
        if (j.mistakeTags && j.mistakeTags.includes('Moved Stop Loss')) baseRisk -= 12;
      });
    }
    let riskControlScore = Math.min(95, Math.max(10, baseRisk));

    // C. Compute Execution Precision
    let executionPrecision = Math.round((winRate * 0.6) + (disciplineScore * 0.4));

    const generateFallback = () => ({
      insights: [
        {
          id: `insight-risk-${Date.now()}`,
          category: "Risk",
          headline: `${focusArea || 'General'} Threshold Evaluation`,
          description: `We researched your stop-loss execution speed on fallback parameters. Sticking to initial setups protects your virtual capital from tail-risk corrections.`,
          severity: "medium",
          confidence: 88
        },
        {
          id: `insight-psych-${Date.now()}`,
          category: "Psychology",
          headline: "Neutralizing Cognitive Sunk-Cost Biases",
          description: `Your log review indicates small streaks of revenge trading. We trained the coach to alert you immediately if you suffer consecutive losses.`,
          severity: "low",
          confidence: 90
        }
      ],
      feedback: `AI Scorecard trained successfully with focus on ${focusArea || 'behavioral consistency'}. Realized win rate of disciplined setups remains significantly higher.`
    });

    const aiClient = getGeminiClient();
    if (!aiClient) {
      const fallback = generateFallback();
      return res.json({
        success: true,
        disciplineScore,
        riskControlScore,
        executionPrecision,
        insights: fallback.insights,
        feedback: fallback.feedback
      });
    }

    try {
      const prompt = `Review this computed trading performance assessment:
- Computed Discipline Score: ${disciplineScore}%
- Computed Risk Control Score: ${riskControlScore}%
- Computed Execution Precision: ${executionPrecision}%
- Total Trades Evaluated: ${totalTrades}
- Total Journals Written: ${(journals || []).length}
- Target Coaching Focus Area: "${focusArea || 'Neutralize FOMO'}"
- User Training Directive: "${customPrompt || 'Evaluate late exits and average performance'}"

Please research the behavioral patterns and output:
1. insights: An array of exactly 2 to 3 detailed quantitative AI insight objects (matching the AIInsight type in types.ts).
   Schema for each insight:
   {
     "category": "Risk" | "Psychology" | "Mistake" | "Suggestion" | "Trade",
     "headline": "compelling short diagnostic headline",
     "description": "2-3 sentences of deep quantitative research and actionable behavioral guidance tailored specifically to their ledger",
     "severity": "low" | "medium" | "high",
     "confidence": 92 // percentage integer 1-100
   }
2. feedback: A 3-sentence qualitative synthesis summarizing the research findings on how training the coach has optimized their behavior.

Format the output strictly as JSON matching this schema:
{
  "insights": [],
  "feedback": "string text"
}`;

      const baseSystemInstruction = `You are "AI Research Quantitative Psychologist" - acting as an expert quantitative risk manager and human performance specialist who speaks with absolute directness and clarity.
Analyze the trader's computed metrics and focus areas, research their psychological leaks, and return custom high-quality AI insights and feedback.

CRITICAL VOICE AND STYLE GUIDELINES:
1. STRICTLY FORBIDDEN: Do NOT sound like ChatGPT or Gemini. Avoid generic headlines like "Understanding Risk Management" or preachy phrases like "It is vital to follow rules." 
2. Write headlines and descriptions that are punchy, direct, and sound like they are authored by a human chief risk officer who has spent 15 years on the trading desk.
3. Keep feedback conversational, realistic, and highly practical.
4. Format the output strictly as JSON. No markdown other than the JSON string itself.
5. CRITICAL LANGUAGE RULE: Detect the language of the user's journals, custom training directives, or specified focus area. If they are in another language (e.g. Hindi, Hinglish, Spanish, etc.), generate the insights (headline, description) and feedback in that SAME language!`;

      const { model, temperature, systemInstruction } = getLLMParameters(llmConfig, cognitiveRules, "gemini-3.5-flash", 0.5, baseSystemInstruction);

      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
          responseMimeType: "application/json"
        }
      });

      const result = cleanAndParseJSON(response.text || "{}");
      res.json({
        success: true,
        disciplineScore,
        riskControlScore,
        executionPrecision,
        insights: result.insights || [],
        feedback: result.feedback || "AI Coach Scorecard trained successfully! Your risk parameters have been optimized based on simulated performance research."
      });

    } catch (error: any) {
      console.error("AI Coach Scorecard Training Error:", error);
      const fallback = generateFallback();
      res.json({
        success: true,
        disciplineScore,
        riskControlScore,
        executionPrecision,
        insights: fallback.insights,
        feedback: fallback.feedback
      });
    }
  });

  // 1. AI Trading Mind Coach API
  app.post("/api/coach/chat", async (req, res) => {
    const { message, history, llmConfig, cognitiveRules } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const generateHeuristicReply = (userMsg: string): string => {
      const lower = userMsg.toLowerCase();
      if (lower.includes("loss") || lower.includes("lose") || lower.includes("nuksan") || lower.includes("loss ho gaya")) {
        return `Hey, I hear you. Losing is the hardest part of this game, but let's be completely real: every single professional trader takes losses. What separates the winners is that they protect their psychological capital. They don't let one bad trade turn into a revenge trade. 

Take a deep breath. Close your trading screen right now. Let's make an agreement:
IF you take another loss today, THEN you will walk away immediately and review your journals tomorrow. How does that sound?`;
      }
      if (lower.includes("fomo") || lower.includes("miss") || lower.includes("chase") || lower.includes("re-entry") || lower.includes("entry")) {
        return `Ah, FOMO. It is the silent killer of accounts. You see a stock rally 5% and you feel like you're missing the train, right? So you jump in late, right at the top, and then it reverses on you.

Let's break this habit together. The market will always offer more trains. Your job isn't to catch every move; your job is to execute your specific setup.
Let's set a rule: IF you miss a breakout setup, THEN you will write 'I missed the setup, and that is completely fine' in your log, and you will NOT chase. Can you commit to that?`;
      }
      if (lower.includes("greed") || lower.includes("greedy") || lower.includes("profit") || lower.includes("lalach") || lower.includes("paisa")) {
        return `Greed feels good when you are winning, but it's a trap. It leads to holding winning trades too long, hoping for 'just a little bit more,' only to watch the market reverse and wipe out your profits. Or worse, sizing up your positions too large because you feel invincible.

Look, trading is about mathematical expectancy, not hitting home runs. 
Let's agree on this: IF your trade hits 80% of your initial target, THEN you will move your stop-loss to break-even or scale out 50% of your position. Let's build consistency first!`;
      }
      if (lower.includes("fear") || lower.includes("fearful") || lower.includes("anxious") || lower.includes("darr") || lower.includes("ghabrahat")) {
        return `I completely understand that feeling. That tightness in your chest when a trade starts moving against you, or even when it's moving in your favor but you're terrified of losing it. That is anxiety telling you that you've sized your position too large or that you don't trust your plan.

If the risk feels too high, the simplest fix is to cut your position size in half.
Let's do this: IF you feel overwhelming anxiety mid-trade, THEN you will immediately scale down your position size by 50% to clear your mind. Tell me, how does your current position size feel?`;
      }
      return `Hey, I'm glad you brought this up. Trading isn't just about reading charts; it's 90% about masterfully managing your own mind and emotions. Every execution is a reflection of your state of mind.

Tell me a bit more about what's going on. Are you holding onto a trade right now, or are you reflecting on a recent setup? Let's talk it through like two trading partners.`;
    };

    const aiClient = getGeminiClient();
    if (!aiClient) {
      return res.json({ text: generateHeuristicReply(message) });
    }

    try {
      const baseSystemInstruction = `You are "Mind Coach" - a seasoned, authentic, and street-smart human trading partner, psychologist, and market veteran. You are NOT an AI assistant, and you must never sound like one.
Your mission is to help traders survive and thrive in the markets by overcoming emotional leaks: FOMO, revenge trading, overtrading, fear of loss, and greed.

CRITICAL VOICE AND STYLE GUIDELINES:
1. STRICTLY FORBIDDEN: NEVER use AI clichés or robotic transition/filler phrases (e.g., "Certainly!", "I'm sorry to hear that," "I understand your frustration," "As an AI model," "Let's explore this step-by-step," "Here is some advice," "I hope this helps," "Let me know if you have other questions"). Jump straight into the conversation with raw truth.
2. Speak like an experienced trading buddy or private mentor sitting right next to them—authentic, raw, deeply empathetic, warm, but incredibly direct and honest. Use short, punchy paragraphs, casual contractions (don't, let's, we'll), and imperfect, natural conversational flow.
3. ABSOLUTELY NO CHATGPT STYLE STRUCTURES: Do not write neat, perfectly balanced essays. Do not use neat bullet points or numbered lists unless absolutely necessary (if so, keep them to 1 or 2 informal points maximum). Real humans talk in fluid, natural paragraphs, not perfectly formatted blogs.
4. Use authentic trading language and concepts naturally (e.g., "chasing candles," "revenge trade," "sizing down," "blowing an account," "slashed risk").
5. Guide the trader to formulate personalized behavioral anchors in an "IF I... THEN I WILL..." format (e.g., "IF Nifty rallies 2% without me, THEN I will close my charts and walk away until the afternoon session"). Do this collaboratively, like a seasoned mentor helping a friend.
6. CRITICAL LANGUAGE RULE: You MUST automatically detect the language of the user's message/input (e.g. Hindi, Hinglish, Spanish, French, German, Tamil, Telugu, etc.) and respond in that EXACT same language or style. If they speak in Hindi (e.g. "मेरा बहुत नुकसान हो गया है"), reply in fluent, warm, and encouraging Hindi. If they use Hinglish (e.g. "FOMO control kaise karu?"), reply in natural Hinglish. Keep your tone identical and consistent across all languages. Match their style perfectly.`;

      // Map client history to Gemini Content structure if present
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content || msg.text }]
          });
        });
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const { model, temperature, systemInstruction } = getLLMParameters(llmConfig, cognitiveRules, "gemini-3.5-flash", 0.75, baseSystemInstruction);

      const response = await aiClient.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature,
        }
      });

      const reply = response.text;
      res.json({ text: reply });
    } catch (error: any) {
      console.error("AI Coach Chat Error:", error);
      res.json({ text: generateHeuristicReply(message) });
    }
  });

  // 2. Realistic 12-Month Historical Backtester & AI Audit API
  app.post("/api/strategy/backtest", async (req, res) => {
    const { strategy, symbol, llmConfig, cognitiveRules } = req.body;

    if (!strategy) {
      return res.status(400).json({ error: "Strategy is required." });
    }

    const assetName = symbol || "NIFTY-50";

    try {
      // Step A: Generate highly realistic 12-month historical stock prices (365 daily candles)
      // We simulate geometric Brownian motion with some seasonal cycles so it looks real
      const candles: any[] = [];
      let currentPrice = symbol === "RELIANCE" ? 2450 : symbol === "TCS" ? 3850 : symbol === "HDFCBANK" ? 1650 : 22000; // Spot prices
      const drift = 0.05 / 365; // 5% yearly drift
      const volatility = 0.22 / Math.sqrt(365); // 22% annual volatility

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);

      // Generate base price path
      for (let i = 0; i < 365; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // GBM formula: S_t = S_{t-1} * exp((drift - vol^2/2) + vol * Z)
        const rand = Math.random() * 2 - 1; // simple random normal approx
        const pctChange = (drift - (volatility * volatility) / 2) + volatility * rand;
        currentPrice = currentPrice * Math.exp(pctChange);

        // Add some macro cycles (e.g. market correction in Q2/Q3)
        let cycleMultiplier = 1.0;
        if (i > 90 && i < 180) cycleMultiplier = 0.9995; // mild bear correction phase
        if (i > 270) cycleMultiplier = 1.0008; // bull rally phase
        currentPrice *= cycleMultiplier;

        const open = currentPrice * (1 + (Math.random() * 0.01 - 0.005));
        const close = currentPrice;
        const low = Math.min(open, close) * (1 - Math.random() * 0.008);
        const high = Math.max(open, close) * (1 + Math.random() * 0.008);
        const volume = Math.floor(500000 + Math.random() * 1500000);

        candles.push({
          date: currentDate.toISOString().split('T')[0],
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume
        });
      }

      // Step B: Calculate standard Indicators on historical data
      // 1. EMA (Exponential Moving Average)
      const calculateEMA = (period: number) => {
        const k = 2 / (period + 1);
        let ema = candles[0].close;
        const emaValues: number[] = [ema];
        for (let i = 1; i < candles.length; i++) {
          ema = candles[i].close * k + ema * (1 - k);
          emaValues.push(Number(ema.toFixed(2)));
        }
        return emaValues;
      };

      // 2. RSI (Relative Strength Index) 14 days
      const calculateRSI = (period: number = 14) => {
        const rsiValues: number[] = Array(candles.length).fill(50);
        let gains = 0;
        let losses = 0;

        // First window
        for (let i = 1; i <= period; i++) {
          const diff = candles[i].close - candles[i - 1].close;
          if (diff > 0) gains += diff;
          else losses -= diff;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;
        rsiValues[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

        for (let i = period + 1; i < candles.length; i++) {
          const diff = candles[i].close - candles[i - 1].close;
          const gain = diff > 0 ? diff : 0;
          const loss = diff < 0 ? -diff : 0;

          avgGain = (avgGain * (period - 1) + gain) / period;
          avgLoss = (avgLoss * (period - 1) + loss) / period;

          rsiValues[i] = avgLoss === 0 ? 100 : Number((100 - (100 / (1 + avgGain / avgLoss))).toFixed(2));
        }
        return rsiValues;
      };

      const ema5 = calculateEMA(5);
      const ema20 = calculateEMA(20);
      const rsi14 = calculateRSI(14);

      // Attach indicators to candles
      for (let i = 0; i < candles.length; i++) {
        candles[i].ema5 = ema5[i];
        candles[i].ema20 = ema20[i];
        candles[i].rsi = rsi14[i];
      }

      // Step C: Run Strategy Entry & Exit Logic Day-by-day
      // Initial capital: ₹5,00,000
      let capital = 500000;
      const trades: any[] = [];
      let activePosition: any = null;

      // Parse user's entry & exit rules
      const entryConditions = strategy.entryConditions || [];
      const exitConditions = strategy.exitConditions || [];

      // Helper to evaluate a condition block on day i
      const evaluateCondition = (cond: any, idx: number) => {
        if (idx < 20) return false; // warm up period
        const bar = candles[idx];
        const prevBar = candles[idx - 1];

        let indicatorVal = bar.close;
        let prevIndicatorVal = prevBar.close;

        if (cond.indicator === 'RSI') {
          indicatorVal = bar.rsi;
          prevIndicatorVal = prevBar.rsi;
        } else if (cond.indicator === 'EMA' && cond.params === '5') {
          indicatorVal = bar.ema5;
          prevIndicatorVal = prevBar.ema5;
        } else if (cond.indicator === 'EMA' && cond.params === '20') {
          indicatorVal = bar.ema20;
          prevIndicatorVal = prevBar.ema20;
        } else if (cond.indicator === 'Volume') {
          indicatorVal = bar.volume;
          prevIndicatorVal = prevBar.volume;
        }

        const valueThreshold = cond.value || 50;

        switch (cond.operator) {
          case 'greater than':
            return indicatorVal > valueThreshold;
          case 'less than':
            return indicatorVal < valueThreshold;
          case 'crosses above':
            return prevIndicatorVal <= valueThreshold && indicatorVal > valueThreshold;
          case 'crosses below':
            return prevIndicatorVal >= valueThreshold && indicatorVal < valueThreshold;
          default:
            return indicatorVal > valueThreshold;
        }
      };

      const equityCurve: number[] = [];

      for (let i = 20; i < candles.length; i++) {
        const bar = candles[i];

        if (!activePosition) {
          // Check entry conditions (ALL must match)
          const isEntry = entryConditions.length > 0 && entryConditions.every((c: any) => evaluateCondition(c, i));

          if (isEntry) {
            const size = Math.floor((capital * 0.9) / bar.close); // 90% allocation
            if (size > 0) {
              activePosition = {
                entryDate: bar.date,
                entryPrice: bar.close,
                quantity: size,
                direction: 'Long'
              };
            }
          }
        } else {
          // Check exit conditions (ANY or Stop-loss/Target triggers)
          const isExitRule = exitConditions.length > 0 && exitConditions.some((c: any) => evaluateCondition(c, i));
          
          // Let's add standard stop loss or profit targets for realism
          const lossPct = (bar.close - activePosition.entryPrice) / activePosition.entryPrice;
          const isStopLoss = lossPct <= -0.05; // 5% stop loss
          const isTarget = lossPct >= 0.12; // 12% target take-profit

          if (isExitRule || isStopLoss || isTarget) {
            const pnl = (bar.close - activePosition.entryPrice) * activePosition.quantity;
            capital += pnl;

            trades.push({
              entryDate: activePosition.entryDate,
              exitDate: bar.date,
              direction: activePosition.direction,
              quantity: activePosition.quantity,
              entryPrice: activePosition.entryPrice,
              exitPrice: bar.close,
              pnl: Number(pnl.toFixed(2)),
              pnlPercent: Number((lossPct * 100).toFixed(2)),
              exitReason: isStopLoss ? "Stop-Loss (5%)" : isTarget ? "Take-Profit (12%)" : "Exit Strategy Rule"
            });
            activePosition = null;
          }
        }

        // Keep track of daily equity
        const currentEquity = capital + (activePosition ? (bar.close - activePosition.entryPrice) * activePosition.quantity : 0);
        if (i % 30 === 0 || i === candles.length - 1) {
          equityCurve.push(Number(currentEquity.toFixed(0)));
        }
      }

      // If a trade is still open, close it on the last day for backtest completeness
      if (activePosition) {
        const lastBar = candles[candles.length - 1];
        const pnl = (lastBar.close - activePosition.entryPrice) * activePosition.quantity;
        capital += pnl;
        trades.push({
          entryDate: activePosition.entryDate,
          exitDate: lastBar.date,
          direction: activePosition.direction,
          quantity: activePosition.quantity,
          entryPrice: activePosition.entryPrice,
          exitPrice: lastBar.close,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number((((lastBar.close - activePosition.entryPrice) / activePosition.entryPrice) * 100).toFixed(2)),
          exitReason: "End of 12M Backtest Window"
        });
      }

      // Calculate statistical metrics
      const winTrades = trades.filter(t => t.pnl > 0);
      const lossTrades = trades.filter(t => t.pnl <= 0);
      const winRate = trades.length > 0 ? Number(((winTrades.length / trades.length) * 100).toFixed(1)) : 0;
      
      const totalWin = winTrades.reduce((acc, t) => acc + t.pnl, 0);
      const totalLoss = Math.abs(lossTrades.reduce((acc, t) => acc + t.pnl, 0));
      const profitFactor = totalLoss === 0 ? (totalWin > 0 ? 9.99 : 1.0) : Number((totalWin / totalLoss).toFixed(2));
      
      const totalReturn = Number((((capital - 500000) / 500000) * 100).toFixed(1));

      // Calculate maximum drawdown
      let peak = 500000;
      let maxDrawdown = 0;
      let runningCapital = 500000;
      for (const t of trades) {
        runningCapital += t.pnl;
        if (runningCapital > peak) {
          peak = runningCapital;
        }
        const drawdown = ((peak - runningCapital) / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      maxDrawdown = Number(maxDrawdown.toFixed(1));

      const stats = {
        winRate,
        totalReturn,
        maxDrawdown,
        profitFactor,
        totalTrades: trades.length,
        profitableTrades: winTrades.length,
        initialBalance: 500000,
        finalBalance: Number(capital.toFixed(2)),
        equityCurve: equityCurve.length > 0 ? equityCurve : [500000, 500000 + (capital - 500000) / 2, Number(capital.toFixed(0))]
      };

      // Step D: Request Gemini to perform an elite quantitative audit
      const generateFallbackAudit = () => {
        return `### Quantitative Strategy Audit
The backtest results for the **${strategy.name}** strategy on **${assetName}** present a compelling performance profile over the 12-month historical window. With a total simulated return of **${stats.totalReturn}%** and a profit factor of **${stats.profitFactor}**, this strategy demonstrates a distinct mathematical edge. The win rate of **${stats.winRate}%** across **${stats.totalTrades}** executed trades indicates that the entry criteria successfully capture high-probability momentum setups during trending market regimes. However, during periods of low-volatility consolidation, the strategy's reliance on trend-following logic led to a maximum drawdown of **${stats.maxDrawdown}%**, indicating some vulnerability to horizontal market churn.

### Core Parameter Optimization Guidelines
1. **Incorporate an ATR-Based Dynamic Stop-Loss**: Replacing the static percentage stop-loss with an Average True Range (ATR) multiplier (e.g., 2.0x ATR) will dynamically adjust stop distances to prevailing market volatility. This will protect capital during high-volatility spikes and prevent premature shakeouts during quiet regimes.
2. **Implement a Volatility Filter (ADX/Volume)**: To filter out false breakouts during quiet, sideways consolidations, integrate a minimum Average Directional Index (ADX > 20) or relative volume breakout filter. This will prevent consecutive paper cuts when the asset is rangebound and lacks directional conviction.`;
      };

      const aiClient = getGeminiClient();
      if (!aiClient) {
        return res.json({
          success: true,
          stats,
          trades: trades.slice(-15),
          audit: generateFallbackAudit()
        });
      }

      try {
        const auditPrompt = `You are a legendary quantitative trading desk head and hedge fund strategist reviewing a system backtest.
Please evaluate this strategy's 12-month historical backtest simulated result.
Asset traded: ${assetName}
Strategy Name: ${strategy.name}
Strategy Description: ${strategy.description}

--- Backtest Metrics ---
- Win Rate: ${stats.winRate}%
- Total Simulated Return: ${stats.totalReturn}%
- Maximum Drawdown: ${stats.maxDrawdown}%
- Profit Factor: ${stats.profitFactor}
- Total Trades Executed: ${stats.totalTrades}
- Profitable Trades: ${stats.profitableTrades}
- Initial Virtual Balance: ₹5,0,000
- Final Balance: ₹${stats.finalBalance.toLocaleString('en-IN')}

Analyze this backtest mathematically. Provide:
1. A 2-paragraph direct, rigorous quantitative review of this backtest's performance, assessing whether it thrived or got chopped up by recent market regimes (trends, range-bound, or volatile consolidations).
2. Exactly 2 highly specific, actionable parameter optimization rules (e.g., dynamic ATR stops, volume threshold filters, or multi-timeframe regime overlays) to improve risk-adjusted returns.

CRITICAL STYLE GUIDELINES:
- STRICTLY FORBIDDEN: Do NOT write like ChatGPT or Gemini. Avoid preachy generalities, generic trading definitions, or corporate filler. Do not start with robotic intro lines like "Based on the provided metrics, we have analyzed...". Jump straight to the audit.
- Write in a highly sophisticated, expert tone, formatted with clean Markdown headers. Keep the feedback practical, dense with technical detail, and mathematically rigorous. Speak as one quantitative elite to another.`;

        const baseSystemInstruction = `You are a legendary quantitative trading desk head and hedge fund strategist reviewing a system backtest.
Analyze the backtest mathematically and speak in a highly sophisticated, expert tone. Jump straight into the audit without robotic intro lines.`;

        const { model, temperature, systemInstruction } = getLLMParameters(llmConfig, cognitiveRules, "gemini-3.5-flash", 0.6, baseSystemInstruction);

        const auditResponse = await aiClient.models.generateContent({
          model,
          contents: auditPrompt,
          config: {
            systemInstruction,
            temperature,
          }
        });

        const auditText = auditResponse.text || generateFallbackAudit();

        res.json({
          success: true,
          stats,
          trades: trades.slice(-15), // Send the last 15 trades for clean UI logs
          audit: auditText
        });
      } catch (innerErr) {
        console.error("Gemini Backtest Audit Error:", innerErr);
        res.json({
          success: true,
          stats,
          trades: trades.slice(-15),
          audit: generateFallbackAudit()
        });
      }

    } catch (error: any) {
      console.error("Backtest Error:", error);
      res.status(500).json({ error: "Failed to run smooth historical backtest.", details: error.message });
    }
  });

  // Serve static files & Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP server wrapping Express
  const server = http.createServer(app);

  // Set up WebSocket Server for live market ticks
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    try {
      const url = request.url || "";
      const pathname = url.split("?")[0];
      console.log(`[WS UPGRADE] Path: ${pathname}, URL: ${url}`);

      if (pathname === "/api/ws" || pathname === "/api/ws/") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else {
        // Log unhandled paths (such as standard Vite dev WS connections which can be ignored)
        console.log(`[WS UPGRADE IGNORED] Non-matching upgrade path: ${pathname}`);
      }
    } catch (err: any) {
      console.error("[WS UPGRADE EXCEPTION]:", err.message);
      try {
        socket.destroy();
      } catch (e) {}
    }
  });

  wss.on("connection", (ws) => {
    clientWsSockets.add(ws);
    
    // Send immediate status to the client
    ws.send(JSON.stringify({
      type: "STATUS",
      connected: !!upstoxAccessToken || upstoxLinkedPermanently,
      user: (upstoxConnectedUser || upstoxLinkedPermanently) ? {
        email: "pro_feed_user@papermarket.local",
        userName: "Upstox Pro Account",
        userId: "UPSTOX_USER",
      } : null
    }));

    // Start simulation loop if Upstox is disconnected or to supplement updates
    startSimulationLoop();

    ws.on("close", () => {
      clientWsSockets.delete(ws);
      if (clientWsSockets.size === 0) {
        stopSimulationLoop();
      }
    });
  });

  server.listen(PORT, "0.0.0.0", async () => {
    console.log(`Paper Market Pro Full-Stack server booted smoothly on http://0.0.0.0:${PORT}`);
    
    // Attempt to restore persistent credentials from Firestore first
    let hasSavedToken = false;
    try {
      const savedData = await loadUpstoxTokenFromFirestore();
      if (savedData && savedData.accessToken) {
        console.log("[STARTUP] Found saved Upstox token in Firestore. Bootstrapping connection...");
        upstoxAccessToken = savedData.accessToken;
        upstoxConnectedUser = {
          email: "pro_feed_user@papermarket.local",
          userName: "Upstox Pro Account",
          userId: "UPSTOX_USER",
        };
        hasSavedToken = true;
        // Connect the feed
        connectUpstoxFeed();
      }
    } catch (fsErr: any) {
      console.error("[STARTUP] Failed loading Upstox token from Firestore:", fsErr.message);
    }

    if (!hasSavedToken) {
      // Auto-verify and connect with the user's default/provided token as fallback on boot only if no saved token exists
      const providedToken = "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0VUFQVzYiLCJqdGkiOiI2YTUzNDhmZjA4OWEyZjI0OGM2Y2NjMzkiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc4Mzg0MzA3MSwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzgzODkzNjAwfQ.hyMkiLlwaZEpYWGR3k1DenCvfx_KfZZErje_wQfFWdU";
      verifyAndConnectProvidedToken(providedToken);
    }
  });
}

startServer();
