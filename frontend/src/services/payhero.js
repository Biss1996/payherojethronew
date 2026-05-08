import API from "../api";

export const initiateSTKPush = async ({
  phone_number,
  amount,
  reference,
  customer_name,
}) => {
  try {
    const res = await API.post("/api/payhero-payment", {
      phone_number,
      amount,
      reference: reference || `LOAN-${Date.now()}`,
      customer_name: customer_name || "Customer",
    });

    return res.data;
  } catch (error) {
    console.error("PayHero Error:", error.response?.data || error.message);

    return {
      success: false,
      message: error.response?.data?.message || "Payment failed",
    };
  }
};