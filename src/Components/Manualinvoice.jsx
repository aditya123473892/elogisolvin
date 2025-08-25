import React, { useState } from "react";
import { X, Plus, Minus, Download, Calculator } from "lucide-react";

const ManualInvoiceModal = ({
  isOpen,
  onClose,
  selectedRequest,
  onGenerateInvoice,
}) => {
  const [invoiceData, setInvoiceData] = useState({
    customerName: selectedRequest?.customer_name || "",
    customerEmail: selectedRequest?.customer_email || "",
    customerAddress: selectedRequest?.pickup_location || "",
    gstin: selectedRequest?.gstin || "",
    invoiceNumber: `ECAB/${selectedRequest?.id || "MANUAL"}/00${
      selectedRequest?.id || Date.now()
    }`,
    invoiceDate: new Date().toISOString().split("T")[0],
    placeOfSupply: "07",
    subTrips: [
      {
        id: 1,
        description: "Transportation Charges - Trip 1",
        hsnCode: "9965",
        quantity: 1,
        rate: 0,
        amount: 0,
        vehicleNumber: "",
        containerNumber: "",
        fromLocation: selectedRequest?.pickup_location || "",
        toLocation: selectedRequest?.delivery_location || "",
        driverName: "",
        sealNumber: "",
      },
    ],
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    useIgst: false,
    additionalCharges: 0,
    additionalChargesDescription: "",
    notes: "",
  });

  const addSubTrip = () => {
    const newTrip = {
      id: invoiceData.subTrips.length + 1,
      description: `Transportation Charges - Trip ${
        invoiceData.subTrips.length + 1
      }`,
      hsnCode: "9965",
      quantity: 1,
      rate: 0,
      amount: 0,
      vehicleNumber: "",
      containerNumber: "",
      fromLocation: "",
      toLocation: "",
      driverName: "",
      sealNumber: "",
    };
    setInvoiceData((prev) => ({
      ...prev,
      subTrips: [...prev.subTrips, newTrip],
    }));
  };

  const removeSubTrip = (tripId) => {
    if (invoiceData.subTrips.length > 1) {
      setInvoiceData((prev) => ({
        ...prev,
        subTrips: prev.subTrips.filter((trip) => trip.id !== tripId),
      }));
    }
  };

  const updateSubTrip = (tripId, field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      subTrips: prev.subTrips.map((trip) => {
        if (trip.id === tripId) {
          const updatedTrip = { ...trip, [field]: value };
          // Auto-calculate amount if rate or quantity changes
          if (field === "rate" || field === "quantity") {
            updatedTrip.amount =
              parseFloat(updatedTrip.rate || 0) *
              parseFloat(updatedTrip.quantity || 0);
          }
          return updatedTrip;
        }
        return trip;
      }),
    }));
  };

  const calculateTotals = () => {
    const subtotal = invoiceData.subTrips.reduce(
      (sum, trip) => sum + (trip.amount || 0),
      0
    );
    const totalWithAdditional = subtotal + (invoiceData.additionalCharges || 0);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (invoiceData.useIgst) {
      igstAmount = (totalWithAdditional * invoiceData.igstRate) / 100;
    } else {
      cgstAmount = (totalWithAdditional * invoiceData.cgstRate) / 100;
      sgstAmount = (totalWithAdditional * invoiceData.sgstRate) / 100;
    }

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = totalWithAdditional + totalTax;

    return {
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      grandTotal,
      totalWithAdditional,
    };
  };

  const totals = calculateTotals();

  const handleGenerateInvoice = () => {
    const invoicePayload = {
      ...invoiceData,
      totals,
      originalRequest: selectedRequest,
    };
    onGenerateInvoice(invoicePayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              Manual Invoice Generator
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={invoiceData.customerName}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={invoiceData.customerEmail}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          customerEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Address *
                    </label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      value={invoiceData.customerAddress}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          customerAddress: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={invoiceData.gstin}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          gstin: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={invoiceData.invoiceDate}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          invoiceDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sub Trips */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Sub Trips ({invoiceData.subTrips.length})
                  </h4>
                  <button
                    onClick={addSubTrip}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Trip
                  </button>
                </div>

                <div className="space-y-6">
                  {invoiceData.subTrips.map((trip, index) => (
                    <div
                      key={trip.id}
                      className="bg-white p-4 rounded-lg border"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium text-gray-900">
                          Trip {index + 1}
                        </h5>
                        {invoiceData.subTrips.length > 1 && (
                          <button
                            onClick={() => removeSubTrip(trip.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.description}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            HSN Code
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.hsnCode}
                            onChange={(e) =>
                              updateSubTrip(trip.id, "hsnCode", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.quantity}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.rate}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
                            value={trip.amount.toFixed(2)}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle Number
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.vehicleNumber}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "vehicleNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Container Number
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.containerNumber}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "containerNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Location
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.fromLocation}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "fromLocation",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Location
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.toLocation}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "toLocation",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Driver Name
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.driverName}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "driverName",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seal Number
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={trip.sealNumber}
                            onChange={(e) =>
                              updateSubTrip(
                                trip.id,
                                "sealNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Charges (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={invoiceData.additionalCharges}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          additionalCharges: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Charges Description
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={invoiceData.additionalChargesDescription}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          additionalChargesDescription: e.target.value,
                        }))
                      }
                      placeholder="e.g., Detention charges, Extra stops"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    value={invoiceData.notes}
                    onChange={(e) =>
                      setInvoiceData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes for the invoice..."
                  />
                </div>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Invoice Summary
                </h4>

                {/* Tax Configuration */}
                <div className="mb-6 p-4 bg-white rounded-lg border">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Tax Configuration
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="useIgst"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={invoiceData.useIgst}
                        onChange={(e) =>
                          setInvoiceData((prev) => ({
                            ...prev,
                            useIgst: e.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="useIgst"
                        className="ml-2 text-sm text-gray-700"
                      >
                        Use IGST (Interstate)
                      </label>
                    </div>

                    {!invoiceData.useIgst ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600">
                            CGST (%)
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={invoiceData.cgstRate}
                            onChange={(e) =>
                              setInvoiceData((prev) => ({
                                ...prev,
                                cgstRate: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">
                            SGST (%)
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={invoiceData.sgstRate}
                            onChange={(e) =>
                              setInvoiceData((prev) => ({
                                ...prev,
                                sgstRate: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-gray-600">
                          IGST (%)
                        </label>
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={invoiceData.igstRate}
                          onChange={(e) =>
                            setInvoiceData((prev) => ({
                              ...prev,
                              igstRate: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ₹{totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {invoiceData.additionalCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Additional Charges:</span>
                      <span className="font-medium">
                        ₹{invoiceData.additionalCharges.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxable Amount:</span>
                    <span className="font-medium">
                      ₹{totals.totalWithAdditional.toFixed(2)}
                    </span>
                  </div>

                  {!invoiceData.useIgst ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          CGST ({invoiceData.cgstRate}%):
                        </span>
                        <span className="font-medium">
                          ₹{totals.cgstAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          SGST ({invoiceData.sgstRate}%):
                        </span>
                        <span className="font-medium">
                          ₹{totals.sgstAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        IGST ({invoiceData.igstRate}%):
                      </span>
                      <span className="font-medium">
                        ₹{totals.igstAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">
                      ₹{totals.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateInvoice}
                  className="w-full mt-6 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  disabled={
                    !invoiceData.customerName || !invoiceData.customerAddress
                  }
                >
                  <Download className="h-5 w-5 mr-2" />
                  Generate Manual Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualInvoiceModal;
