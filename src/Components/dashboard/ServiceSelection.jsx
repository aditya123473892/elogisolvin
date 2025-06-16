import React from "react";
import NewServiceModal from "./NewServiceModal";

const ServicesSelection = ({
  services,
  loadingServices,
  selectedServices,
  servicePrices,
  onServiceToggle,
  isNewServiceModalOpen,
  setIsNewServiceModalOpen,
  onServiceAdded,
}) => {
  const handleServiceClick = (service) => {
    const isSelected = selectedServices.includes(service.SERVICE_NAME);
    onServiceToggle(service.SERVICE_NAME, isSelected);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <label className="block text-sm font-medium">Services Required</label>
        <button
          type="button"
          onClick={() => setIsNewServiceModalOpen(true)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Service
        </button>
      </div>

      {loadingServices ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {services.map((service) => (
            <div
              key={service.SERVICE_ID}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedServices.includes(service.SERVICE_NAME)
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={() => handleServiceClick(service)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedServices.includes(service.SERVICE_NAME)}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="ml-2 font-medium">
                    {service.SERVICE_NAME}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {service.SERVICE_CODE}
                </span>
              </div>

              {selectedServices.includes(service.SERVICE_NAME) && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500">
                    Unit: {service.UNIT}
                    {service.TAX_ON_PERCENTAGE > 0 && (
                      <span className="ml-2">
                        Tax: {service.TAX_ON_PERCENTAGE}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <NewServiceModal
        isOpen={isNewServiceModalOpen}
        onClose={() => setIsNewServiceModalOpen(false)}
        onServiceAdded={onServiceAdded}
      />
    </div>
  );
};

export default ServicesSelection;
