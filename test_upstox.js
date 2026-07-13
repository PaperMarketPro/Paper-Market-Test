const token = "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0VUFQVzYiLCJqdGkiOiI2YTUzNDhmZjA4OWEyZjI0OGM2Y2NjMzkiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc4Mzg0MzA3MSwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzgzODkzNjAwfQ.hyMkiLlwaZEpYWGR3k1DenCvfx_KfZZErje_wQfFWdU";

async function run() {
  try {
    const res = await fetch("https://api.upstox.com/v2/user/profile", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
