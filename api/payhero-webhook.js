import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = req.body;

    console.log("PayHero Webhook:", data);

    const reference = data?.external_reference;

    if (!reference) {
      return res.status(400).json({ message: "Missing reference" });
    }

    // 🔥 Normalize status
    let status = "PENDING";

    if (data?.success === true && data?.status === "success") {
      status = "SUCCESS";
    } else if (data?.status === "failed") {
      status = "FAILED";
    }

    // ✅ SAVE TO KV (this is the key fix)
    await kv.set(reference, status);

    console.log("Saved:", reference, status);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ received: false });
  }
}