import React from "react";
import { useNavigate } from "react-router-dom";

const ContainerDetailsTable = ({ vehicleDataList, updateVehicleData, transportRequestId }) => {
  const navigate = useNavigate();

  const handleViewContainerDetails = () => {
    // Store the current container data in sessionStorage to access it on the container details page
    sessionStorage.setItem("containerData", JSON.stringify(vehicleDataList));
    sessionStorage.setItem("transportRequestId", transportRequestId);
    
    // Navigate to the container details page
    navigate("/customer/container-page");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900">
          Container Details
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Optional)
          </span>
        </h4>
        <button
          type="button"
          onClick={handleViewContainerDetails}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View Container Details
        </button>
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Vehicle #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Container Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number of Containers
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Container Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Container Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipping Line
              </th>
          
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seal 1
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seal 2
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trailer Weight (kg)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cargo Weight (kg)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicleDataList.map((vehicle, index) => (
              <tr key={`container-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {vehicle.vehicleIndex}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.containerNo}
                    onChange={(e) =>
                      updateVehicleData(
                        index,
                        "containerNo",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Container number"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.numberOfContainers}
                    onChange={(e) =>
                      updateVehicleData(
                        index,
                        "numberOfContainers",
                        e.target.value
                      )
                    }
                    placeholder="Number of containers"
                    min="1"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.containerType}
                    onChange={(e) =>
                      updateVehicleData(index, "containerType", e.target.value)
                    }
                    placeholder="Container type"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.containerSize}
                    onChange={(e) =>
                      updateVehicleData(index, "containerSize", e.target.value)
                    }
                    placeholder="Container size"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.line}
                    onChange={(e) =>
                      updateVehicleData(index, "line", e.target.value)
                    }
                    placeholder="Shipping line"
                  />
                </td>
               
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.seal1}
                    onChange={(e) =>
                      updateVehicleData(
                        index,
                        "seal1",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Seal 1"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.seal2}
                    onChange={(e) =>
                      updateVehicleData(
                        index,
                        "seal2",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Seal 2"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.containerTotalWeight}
                    onChange={(e) =>
                      updateVehicleData(
                        index,
                        "containerTotalWeight",
                        e.target.value
                      )
                    }
                    placeholder="Container weight"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vehicle.cargoTotalWeight}
                    onChange={(e) =>
                      updateVehicleData(
                        index,
                        "cargoTotalWeight",
                        e.target.value
                      )
                    }
                    placeholder="Cargo weight"
                    min="0"
                    step="0.01"
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

export default ContainerDetailsTable;
