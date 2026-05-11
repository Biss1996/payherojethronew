import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

import Loader from "../components/Loader";

import { initiateSTKPush } from "../services/payhero";

export default function Payment() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(null);

  const [loanData, setLoanData] = useState(null);

  const navigate = useNavigate();

  const pollingRef = useRef(null);

  useEffect(() => {
    const data = JSON.parse(
      sessionStorage.getItem("myLoan") || "null"
    );

    if (!data) {
      navigate("/apply", { replace: true });
      return;
    }

    setFormData(data);
    setLoanData(data);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [navigate]);

  // CHECK PAYMENT STATUS
  const checkPaymentStatus = async (reference) => {
    try {
      const res = await fetch(
        `/api/payment-status?reference=${reference}`
      );

      const data = await res.json();

      return data.status || "PENDING";
    } catch (err) {
      return "PENDING";
    }
  };

  const handlePay = async () => {
    if (loading) return;

    if (!formData?.phone_number) {
      toast.error("Phone number missing");
      return;
    }

    if (!loanData?.processing_fee) {
      toast.error("Invalid processing fee");
      return;
    }

    setLoading(true);

    Swal.fire({
      title: "Sending STK Push 📱",
      html: `
        <div class="space-y-2">
          <p>Please check your phone</p>
          <p class="text-sm text-gray-500">
            Enter your M-Pesa PIN to continue
          </p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await initiateSTKPush({
        amount: Number(loanData.processing_fee),

        phone_number: formData.phone_number,

        channel_id: Number(
          import.meta.env.VITE_CHANNEL_ID
        ),

        provider: "m-pesa",

        external_reference: `LOAN-${Date.now()}`,

        customer_name:
          formData.full_name || "Customer",

        callback_url:
          window.location.origin + "/api/callback",
      });

      console.log("PAYHERO RESPONSE:", response);

      if (!response.success) {
        setLoading(false);

        Swal.fire({
          title: "Payment Failed",
          text:
            response.message ||
            "Unable to initiate STK Push",
          icon: "error",
        });

        return;
      }

      // SAVE PAYHERO REFERENCE
      sessionStorage.setItem(
        "payment_reference",
        response.reference
      );

      sessionStorage.setItem(
        "checkout_request_id",
        response.CheckoutRequestID
      );

      Swal.fire({
        title: "Waiting for Payment ⏳",
        html: `
          <div class="space-y-2">
            <p>
              Complete payment on your phone
            </p>

            <p class="text-sm text-gray-500">
              Do not refresh or close this page
            </p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      let attempts = 0;

      pollingRef.current = setInterval(async () => {
        attempts++;

        const status = await checkPaymentStatus(
          response.reference
        );

        console.log(
          "PAYMENT STATUS:",
          status
        );

        // SUCCESS
        if (status === "SUCCESS") {
          clearInterval(pollingRef.current);

          sessionStorage.setItem(
            "payment_status",
            "SUCCESS"
          );

          Swal.fire({
            title: "Payment Successful 🎉",
            text: "Loan activated successfully",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

          setTimeout(() => {
            navigate("/success", {
              replace: true,
            });
          }, 2000);

          return;
        }

        // FAILED
        if (
          status === "FAILED" ||
          status === "CANCELLED"
        ) {
          clearInterval(pollingRef.current);

          setLoading(false);

          Swal.fire({
            title: "Payment Failed",
            text:
              "Transaction was cancelled or failed",
            icon: "error",
          });

          return;
        }

        // TIMEOUT
        if (attempts >= 20) {
          clearInterval(pollingRef.current);

          setLoading(false);

          Swal.fire({
            title: "Timeout",
            text:
              "Payment confirmation took too long",
            icon: "warning",
          });
        }
      }, 3000);
    } catch (error) {
      console.error(error);

      setLoading(false);

      Swal.fire({
        title: "Error",
        text: "Failed to process payment",
        icon: "error",
      });
    }
  };

  if (!formData || !loanData) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-sky-500 to-emerald-500 p-6 text-center text-white">
          <h1 className="text-2xl font-bold">
            Loan Activation
          </h1>

          <p className="text-sm opacity-90 mt-1">
            Secure M-Pesa STK Checkout
          </p>
        </div>

        <div className="p-6 space-y-5">

          {/* LOAN CARD */}
          <div className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl p-6 text-white shadow-lg text-center">
            <p className="text-sm opacity-90">
              Approved Loan Amount
            </p>

            <h2 className="text-5xl font-black mt-2">
              KES{" "}
              {loanData.loan_amount?.toLocaleString()}
            </h2>
          </div>

          {/* ACTIVATION */}
          <div className="bg-gray-50 rounded-2xl border p-5 text-center">
            <p className="text-sm text-gray-500">
              Activation Fee
            </p>

            <h3 className="text-3xl font-bold text-gray-900 mt-1">
              KES{" "}
              {loanData.processing_fee?.toLocaleString()}
            </h3>
          </div>

          {/* PHONE */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-gray-500">
              M-Pesa Number
            </p>

            <p className="text-lg font-semibold text-gray-900">
              {formData.phone_number}
            </p>
          </div>

          {/* INFO */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed">
            You will receive an M-Pesa STK Push
            prompt on your phone. Enter your
            M-Pesa PIN to complete payment
            securely.
          </div>

          {/* BUTTON */}
          {loading ? (
            <Loader />
          ) : (
            <button
              onClick={handlePay}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              Activate via M-Pesa
            </button>
          )}

          <p className="text-center text-xs text-gray-400">
            Powered securely by M-Pesa STK Push
          </p>
        </div>
      </div>
    </div>
  );
}