import React from "react";

const VehicleChargesTable = ({
  vehicleDataList,
  services,
  updateVehicleData,
}) => {
  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        Vehicle Charges
      </h4>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Vehicle Number
              </th>
            
              {services.map((serviceName) => (
                <th
                  key={serviceName}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]"
                >
                  {serviceName} (INR)
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                Additional Charges (INR)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                Total Charge (INR)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicleDataList.map((vehicle, index) => (
              <tr key={`charges-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {vehicle.vehicleNumber}
                  </span>
                </td>
               
                {services.map((serviceName) => (
                  <td key={serviceName} className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      className="min-w-[140px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={vehicle.serviceCharges?.[serviceName] || ""}
                      onChange={(e) => {
                        const updatedCharges = {
                          ...vehicle.serviceCharges,
                          [serviceName]: e.target.value,
                        };
                        updateVehicleData(
                          index,
                          "serviceCharges",
                          updatedCharges
                        );

                        const serviceTotal = Object.values(updatedCharges).reduce(
                          (sum, val) => sum + (parseFloat(val) || 0),
                          0
                        );
                        const newTotal =
                          (parseFloat(vehicle.baseCharge) || 0) +
                          (parseFloat(vehicle.additionalCharges) || 0) +
                          serviceTotal;

                        updateVehicleData(index, "totalCharge", newTotal);
                      }}
                      placeholder={`${serviceName} charge`}
                      min="0"
                      step="0.01"
                    />
                  </td>
                ))}
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    className="min-w-[140px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.additionalCharges}
                    onChange={(e) => {
                      updateVehicleData(
                        index,
                        "additionalCharges",
                        e.target.value
                      );

                      const serviceTotal = Object.values(
                        vehicle.serviceCharges || {}
                      ).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                      const newTotal =
                        (parseFloat(vehicle.baseCharge) || 0) +
                        (parseFloat(e.target.value) || 0) +
                        serviceTotal;

                      updateVehicleData(index, "totalCharge", newTotal);
                    }}
                    placeholder="Additional charges"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="min-w-[160px] border border-gray-300 rounded-md p-2 text-sm bg-gray-50 cursor-not-allowed font-medium text-gray-900"
                    value={`₹${vehicle.totalCharge.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
                    readOnly
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleChargesTable;
