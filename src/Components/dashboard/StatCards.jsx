import React from "react";
import { Truck, CheckCircle, DollarSign } from "lucide-react";

const StatsCards = () => {
  const stats = [
    {
      title: "Active Shipments",
      value: "3",
      icon: Truck,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Completed",
      value: "12",
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Total Spent",
      value: "₹7,500",
      icon: DollarSign,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${stat.bgColor} ${stat.iconColor}`}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
