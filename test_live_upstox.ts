import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

async function run() {
  try {
    const firebaseApp = admin.initializeApp({ projectId: "phonic-transit-7wfkz" });
    const db = getFirestore(firebaseApp, "ai-studio-papermarketpro-a4c451cc-beae-433b-b0ec-ae18cdd3511b");
    
    const configDocRef = db.collection("config").doc("upstox");
    const docSnap = await configDocRef.get();
    if (!docSnap.exists) {
      console.log("No Upstox token doc found in Firestore!");
      return;
    }
    const { accessToken } = docSnap.data() as any;
    console.log("Found Access Token! Testing Upstox candle endpoints...\n");

    const toDate = "2026-07-17";
    const fromDate = "2025-07-17";

    const keysToTest = [
      "NSE_EQ|INE296A01024",
      "NSE_EQ|BAJFINANCE",
      "NSE_EQ:INE296A01024",
      "NSE_EQ:BAJFINANCE",
      "BAJFINANCE",
      "INE296A01024"
    ];

    for (const key of keysToTest) {
      const encoded = encodeURIComponent(key);
      const urls = [
        `https://api.upstox.com/v2/historical-candle/${encoded}/day/${toDate}/${fromDate}`,
        `https://api.upstox.com/v2/historical-candle/${key}/day/${toDate}/${fromDate}`
      ];

      for (const url of urls) {
        console.log(`Trying URL: ${url}`);
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json"
          }
        });
        console.log(`Status: ${res.status}`);
        const body: any = await res.json();
        if (res.status === 200) {
          console.log(`✅ SUCCESS for key: ${key}, URL: ${url}`);
          console.log(`Candles length: ${body.data ? body.data.candles.length : 0}`);
          return;
        } else {
          console.log(`❌ FAIL: ${JSON.stringify(body.errors || body)}`);
        }
        console.log("-----------------------------------------");
      }
    }
  } catch (err) {
    console.error("Error running test:", err);
  }
}

run();
