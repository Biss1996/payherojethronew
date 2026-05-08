import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { phone, amount, reference } = req.body;

    // 1. Call PayHero API
    const response = await fetch("https://PAYHERO_API_ENDPOINT", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYHERO_TOKEN}`,
      },
      body: JSON.stringify({
        phone,
        amount,
        reference,
      }),
    });

    const data = await response.json();

    // 2. Store pending status in KV
    await kv.set(reference, "PENDING");

    return res.status(200).json({
      success: true,
      reference,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}