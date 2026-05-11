import axios from "axios";

export const initiateSTKPush = async (payload) => {
  try {
    const response = await axios.post("/api/stkpush", payload);

    return response.data;
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Payment failed",
    };
  }
};

export const checkPaymentStatus = async () => {
  try {
    const response = await axios.get("/api/callback");

    return response.data;
  } catch (error) {
    return {
      paid: false,
    };
  }
};