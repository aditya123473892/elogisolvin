import React, { useState, useEffect } from "react";
import api from "../../utils/Api";
import { toast } from "react-toastify";

const PaymentModal = ({ shipment, onClose, onPaymentComplete }) => {
  const [formData, setFormData] = useState({
    payment_amount: "",
    payment_mode: "Cash",
    payment_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingTransaction, setExistingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (shipment && shipment.id) {
      fetchExistingTransaction(shipment.id);
    }
  }, [shipment]);

  const fetchExistingTransaction = async (requestId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/transactions/request/${requestId}`);
      if (
        response.data.success &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setExistingTransaction(response.data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setIsSubmitting(true);

    try {
      // First check if a transaction exists for this shipment
      const transactionsResponse = await api.get(
        `/transactions/request/${shipment.id}`
      );

      let response;

      if (
        transactionsResponse.data.data &&
        transactionsResponse.data.data.length > 0
      ) {
        // If transaction exists, update it with new payment
        const transactionId = transactionsResponse.data.data[0].id;
        response = await api.put(
          `/transactions/${transactionId}/payment`,
          formData
        );
      } else {
        // If no transaction exists, create a new one
        const transactionData = {
          request_id: shipment.id,
          transporter_id:
            shipment.transporter_id ||
            (shipment.transporter_details
              ? shipment.transporter_details.id
              : 1),
          gr_no: `GR-${shipment.id}-${Date.now().toString().slice(-6)}`, // Generate a unique GR number
          payment_amount: formData.payment_amount,
          payment_mode: formData.payment_mode,
          payment_date: formData.payment_date,
          remarks: formData.remarks,
        };

        response = await api.post("/transactions/create", transactionData);
      }

      if (response.data.success) {
        toast.success("Payment processed successfully");
        onPaymentComplete(response.data.data);
        onClose();
      } else {
        toast.error(response.data.message || "Failed to process payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      // Check if it's an authentication error
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        toast.error("Your session has expired. Please log in again.");
        // Don't close the modal yet - let the interceptor handle the redirect
      } else {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while processing payment"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total amount - use the passed total_amount from shipment first
  const getTotalAmount = () => {
    // First priority: Use the total_amount passed from parent component
    if (shipment.total_amount) {
      return parseFloat(shipment.total_amount);
    }

    // Second priority: Use transporter_charge from existing transaction
    if (existingTransaction && existingTransaction.transporter_charge) {
      return parseFloat(existingTransaction.transporter_charge);
    }

    // Third priority: Use transporter_details total_charge
    if (
      shipment.transporter_details &&
      shipment.transporter_details.total_charge
    ) {
      return parseFloat(shipment.transporter_details.total_charge);
    }

    // Fourth priority: Use request_total_amount from transporter_details
    if (
      shipment.transporter_details &&
      shipment.transporter_details.request_total_amount
    ) {
      return parseFloat(shipment.transporter_details.request_total_amount);
    }

    // Fallback: Use requested_price from shipment
    if (shipment.requested_price) {
      return parseFloat(shipment.requested_price);
    }

    return 0;
  };

  const totalAmount = getTotalAmount();
  const totalPaid = existingTransaction
    ? parseFloat(existingTransaction.total_paid || 0)
    : 0;
  const remainingAmount = Math.max(0, totalAmount - totalPaid);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Add Payment</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-100 mt-1">Shipment ID: {shipment.id}</p>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading payment details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500">Total Amount</div>
                <div className="font-semibold text-blue-600">
                  ₹{totalAmount.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500">Remaining</div>
                <div className="font-semibold text-green-600">
                  ₹{remainingAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  name="payment_amount"
                  value={formData.payment_amount}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                  required
                  min="1"
                  max={remainingAmount}
                />
                {parseFloat(formData.payment_amount) > remainingAmount && (
                  <p className="text-red-500 text-xs mt-1">
                    Amount exceeds the remaining balance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes"
                  rows="3"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                disabled={
                  isSubmitting ||
                  !formData.payment_amount ||
                  parseFloat(formData.payment_amount) <= 0 ||
                  parseFloat(formData.payment_amount) > remainingAmount
                }
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  "Process Payment"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
