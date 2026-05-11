let latestPayment = {
  paid: false,
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    console.log("PAYMENT CALLBACK:", req.body);

    latestPayment = {
      paid: true,
      data: req.body,
    };

    return res.status(200).json({
      success: true,
    });
  }

  if (req.method === "GET") {
    return res.status(200).json(latestPayment);
  }

  return res.status(405).json({
    success: false,
  });
}