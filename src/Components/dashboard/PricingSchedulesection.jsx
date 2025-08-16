import React from "react";
import ServicesSelection from "../dashboard/ServiceSelection";

const PricingScheduleSection = ({
  safeRequestData,
  setRequestData,
  services,
  loadingServices,
  handleServiceToggle,
  handleServicePriceChange,
  isNewServiceModalOpen,
  setIsNewServiceModalOpen,
  handleServiceAdded,
  today,
  currentTime,
}) => {
  const currentNoOfVehicles = parseInt(safeRequestData.no_of_vehicles) || 1;

  // Calculate total charge from service prices
  const calculateTotalCharge = () => {
    const servicePrices = safeRequestData.service_prices || {};
    const totalServiceCharge = Object.values(servicePrices).reduce(
      (sum, price) => sum + (parseFloat(price) || 0),
      0
    );
    return totalServiceCharge * currentNoOfVehicles;
  };

  const totalCharge = calculateTotalCharge();

  return (
    <>
      {/* Services Required with Price Inputs */}
      <div className="space-y-4">
        <ServicesSelection
          services={services}
          loadingServices={loadingServices}
          selectedServices={safeRequestData.service_type}
          servicePrices={safeRequestData.service_prices}
          onServiceToggle={handleServiceToggle}
          onServicePriceChange={handleServicePriceChange}
          isNewServiceModalOpen={isNewServiceModalOpen}
          setIsNewServiceModalOpen={setIsNewServiceModalOpen}
          onServiceAdded={handleServiceAdded}
        />
      </div>

      {/* Total Charge Display */}
      {safeRequestData.service_type.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Pricing Summary</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(safeRequestData.service_prices).map(
                ([service, price]) => (
                  <div key={service} className="flex justify-between">
                    <span>{service}:</span>
                    <span>₹{parseFloat(price) || 0}</span>
                  </div>
                )
              )}
              <div className="border-t pt-1 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal per vehicle:</span>
                  <span>
                    ₹
                    {Object.values(safeRequestData.service_prices).reduce(
                      (sum, price) => sum + (parseFloat(price) || 0),
                      0
                    )}
                  </span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span>Number of vehicles:</span>
                  <span>{currentNoOfVehicles}</span>
                </div> */}
                <div className="flex justify-between font-bold text-lg border-t pt-1 mt-1">
                  <span>Total Charge:</span>
                  <span>₹{totalCharge.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dates and Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Expected Pickup Date
          </label>
          <input
            type="date"
            name="expected_pickup_date"
            className="w-full border rounded-md p-2"
            value={safeRequestData.expected_pickup_date || today}
            onChange={(e) =>
              setRequestData((prev) => ({
                ...prev,
                expected_pickup_date: e.target.value,
              }))
            }
            min={today}
            required
          />
          <label className="block text-sm font-medium mt-2 mb-2">
            Expected Pickup Time
          </label>
          <input
            type="time"
            name="expected_pickup_time"
            className="w-full border rounded-md p-2"
            value={safeRequestData.expected_pickup_time || currentTime}
            onChange={(e) =>
              setRequestData((prev) => ({
                ...prev,
                expected_pickup_time: e.target.value,
              }))
            }
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Expected Delivery Date
          </label>
          <input
            type="date"
            className="w-full border rounded-md p-2"
            value={safeRequestData.expected_delivery_date || today}
            onChange={(e) =>
              setRequestData({
                ...safeRequestData,
                expected_delivery_date: e.target.value,
              })
            }
            min={safeRequestData.expected_pickup_date || today}
            required
          />
          <label className="block text-sm font-medium mt-2 mb-2">
            Expected Delivery Time
          </label>
          <input
            type="time"
            name="expected_delivery_time"
            className="w-full border rounded-md p-2"
            value={safeRequestData.expected_delivery_time || currentTime}
            onChange={(e) =>
              setRequestData({
                ...safeRequestData,
                expected_delivery_time: e.target.value,
              })
            }
            required
          />
        </div>
      </div>
    </>
  );
};

export default PricingScheduleSection;
