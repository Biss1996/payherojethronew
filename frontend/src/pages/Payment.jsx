import { useState, useEffect } from "react";
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

  useEffect(() => {
    const data = JSON.parse(sessionStorage.getItem("myLoan") || "null");

    if (!data) {
      navigate("/apply", { replace: true });
      return;
    }

    setFormData(data);
    setLoanData(data);
  }, [navigate]);

  // 🔥 CHECK PAYMENT STATUS FROM API
  const checkPaymentStatus = async (reference) => {
    try {
      const res = await fetch(`/api/payment-status?reference=${reference}`);
      const data = await res.json();
      return data.status;
    } catch (err) {
      return "PENDING";
    }
  };

  const handlePay = async () => {
    if (loading) return;

    if (!formData?.phone_number || !loanData?.processing_fee) {
      toast.error("Missing payment details");
      return;
    }

    setLoading(true);

    const reference = `LOAN-${Date.now()}`;

    // 🔥 STK INITIATION ALERT
    Swal.fire({
      title: "Sending STK Push 📱",
      html: "Check your phone and enter your M-Pesa PIN",
      icon: "info",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await initiateSTKPush({
        phone_number: formData.phone_number,
        amount: loanData.processing_fee,
        reference,
        customer_name: formData.full_name || "Customer",
      });

      if (!response.success) {
        setLoading(false);

        Swal.fire({
          title: "Failed",
          text: response.message || "STK Push failed",
          icon: "error",
        });

        return;
      }

      sessionStorage.setItem("payment_reference", reference);

      // 🔥 WAITING SCREEN (NO FAKE SUCCESS)
      Swal.fire({
        title: "Waiting for Payment ⏳",
        html: `
          <div>
            <p>We are waiting for your M-Pesa confirmation.</p>
            <p><b>Do not close this page</b></p>
          </div>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 🔥 POLLING LOOP
      const interval = setInterval(async () => {
        const status = await checkPaymentStatus(reference);

        if (status === "SUCCESS") {
          clearInterval(interval);

          Swal.fire({
            title: "Payment Successful",
            text: "Your loan has been activated",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

          setTimeout(() => {
            navigate("/success", { replace: true });
          }, 2000);
        }

        if (status === "FAILED") {
          clearInterval(interval);
          setLoading(false);

          Swal.fire({
            title: "Payment Failed",
            text: "Please try again",
            icon: "error",
          });
        }
      }, 3000);
    } catch (error) {
      setLoading(false);

      Swal.fire({
        title: "Error",
        text: "STK Push failed",
        icon: "error",
      });

      toast.error("Payment error");
    }
  };

  if (!formData || !loanData) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-sky-500 to-emerald-500 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Loan Activation</h1>
          <p className="text-sm opacity-90 mt-1">Secure M-Pesa Checkout</p>
        </div>

        <div className="p-6 space-y-5">

          {/* LOAN INFO */}
          <div className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-xl p-6 text-center text-white shadow-lg">
            <p className="text-sm opacity-90">Approved Loan Amount</p>
            <p className="text-5xl font-extrabold mt-2">
              KES {loanData.loan_amount?.toLocaleString() || 0}
            </p>
          </div>

          {/* FEE */}
          <div className="bg-gray-50 rounded-xl p-4 border text-center">
            <p className="text-sm text-gray-500">Activation Fee</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              KES {loanData.processing_fee?.toLocaleString() || 0}
            </p>
          </div>

          {/* PHONE */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-gray-600">M-Pesa Number</p>
            <p className="text-lg font-semibold text-gray-900">
              {formData.phone_number}
            </p>
          </div>

          {/* INFO */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            You will receive an M-Pesa STK Push. Enter your PIN to complete payment.
          </div>

          {/* BUTTON */}
          {loading ? (
            <Loader />
          ) : (
            <button
              onClick={handlePay}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg shadow-md hover:scale-[1.02] transition"
            >
              Activate via M-Pesa
            </button>
          )}

          <p className="text-center text-xs text-gray-400">
            Secure M-Pesa STK Push Payment
          </p>
        </div>
      </div>
    </div>
  );
}