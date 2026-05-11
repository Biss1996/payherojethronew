import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    const paymentStatus =
      sessionStorage.getItem("payment_status");

    if (paymentStatus !== "SUCCESS") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const loanData = JSON.parse(
    sessionStorage.getItem("myLoan") || "{}"
  );

  const paymentReference =
    sessionStorage.getItem("payment_reference");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 flex items-center justify-center px-4">

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

        {/* TOP */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">

          <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center text-5xl">
            🎉
          </div>

          <h1 className="text-3xl font-black mt-4">
            Payment Successful
          </h1>

          <p className="text-sm opacity-90 mt-2">
            Your loan activation was completed
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">

          {/* LOAN */}
          <div className="bg-gray-50 rounded-2xl p-5 text-center border">

            <p className="text-sm text-gray-500">
              Activated Loan Amount
            </p>

            <h2 className="text-4xl font-black text-gray-900 mt-2">
              KES{" "}
              {loanData.loan_amount?.toLocaleString()}
            </h2>
          </div>

          {/* REFERENCE */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">

            <p className="text-sm text-gray-500">
              Payment Reference
            </p>

            <p className="font-semibold text-gray-900 break-all">
              {paymentReference}
            </p>
          </div>

          {/* STATUS */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">

            <p className="text-green-700 font-semibold">
              Your activation payment has been
              confirmed successfully.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:scale-[1.02] transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}