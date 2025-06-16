import React from "react";

const ContainerDetailsTable = ({ vehicleDataList, updateVehicleData }) => {
  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        Container Details
        <span className="text-sm font-normal text-gray-500 ml-2">
          (Optional)
        </span>
      </h4>
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
                    value={vehicle.sealNo}
                    onChange={(e) =>
                      updateVehicleData(
                        index,
                        "sealNo",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Seal number"
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
