import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = req.body;

    console.log("🔥 PayHero Webhook FULL DATA:", JSON.stringify(data, null, 2));

    const reference =
      data?.external_reference ||
      data?.reference ||
      data?.checkout_request_id;

    if (!reference) {
      console.log("❌ Missing reference in webhook");
      return res.status(400).json({ message: "Missing reference" });
    }

    // 🔥 IMPROVED STATUS DETECTION (IMPORTANT FIX)
    let status = "PENDING";

    const rawStatus = (data?.status || "").toLowerCase();

    const successFlags = [
      data?.success === true,
      rawStatus === "success",
      rawStatus === "completed",
      rawStatus === "paid",
      rawStatus === "successful",
    ];

    const failedFlags = [
      rawStatus === "failed",
      rawStatus === "cancelled",
      rawStatus === "canceled",
    ];

    if (successFlags.some(Boolean)) {
      status = "SUCCESS";
    } else if (failedFlags.some(Boolean)) {
      status = "FAILED";
    }

    // ✅ SAVE STATUS IN KV
    await kv.set(reference, status);

    console.log(`✅ Updated KV: ${reference} → ${status}`);

    return res.status(200).json({
      received: true,
      reference,
      status,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);

    return res.status(500).json({
      received: false,
      error: error.message,
    });
  }
}