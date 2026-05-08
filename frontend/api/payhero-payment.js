import { kv } from "@vercel/kv";

const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(req, res) {
  setCors(res);

  // ✅ MUST handle preflight FIRST
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    setCors(res);
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { phone_number, amount, reference, customer_name } = req.body;

    const response = await fetch(
      "https://backend.payhero.co.ke/api/v2/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.PAYHERO_TOKEN}`,
        },
        body: JSON.stringify({
          amount,
          phone_number,
          channel_id: 133,
          provider: "m-pesa",
          external_reference: reference,
          customer_name: customer_name || "Customer",
          callback_url: `${process.env.BASE_URL}/api/payhero-webhook`,
        }),
      }
    );

    const data = await response.json();

    await kv.set(reference, "PENDING");

    setCors(res);
    return res.status(200).json({
      success: true,
      reference,
      data,
    });

  } catch (error) {
    setCors(res);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}