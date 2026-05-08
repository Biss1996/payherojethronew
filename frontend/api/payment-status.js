import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ status: "ERROR" });
  }

  try {
    const status = await kv.get(reference);

    return res.status(200).json({
      status: status || "PENDING",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "ERROR",
    });
  }
}