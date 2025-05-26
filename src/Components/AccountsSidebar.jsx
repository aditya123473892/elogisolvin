import React from "react";
import {
  Home,
  DollarSign,
  FileText,
  CreditCard,
  BarChart2,
  Users,
  Settings,
  ChevronRight,
  X,
  Briefcase,
  TrendingUp,
} from "lucide-react";

export function AccountsSidebar({
  collapsed,
  toggleSidebar,
  activePage,
  setActivePage,
  mobileMenuOpen,
  toggleMobileMenu,
  navigate
}) {
  // Navigation items for accounts
  const navItems = [
    { name: "Dashboard", icon: Home, path: "dashboard" },
    { name: "Invoices", icon: FileText, path: "invoices" },
    { name: "Payments", icon: DollarSign, path: "payments" },
    { name: "Expenses", icon: CreditCard, path: "expenses" },
    { name: "Revenue", icon: TrendingUp, path: "revenue" },
    { name: "Clients", icon: Users, path: "clients" },
    { name: "Reports", icon: BarChart2, path: "reports" },
    { name: "Taxes", icon: Briefcase, path: "taxes" },
    { name: "Settings", icon: Settings, path: "settings" },
  ];

  const handleNavigation = (path) => {
    setActivePage(path);
    if (path !== "dashboard") {
      navigate(`/accounts/${path}`);
    } else {
      navigate("/accounts-dashboard");
    }
  };

  return (
    <>
      {/* Sidebar - Desktop */}
      <div
        className={`bg-blue-700 text-white ${
          collapsed ? "w-20" : "w-64"
        } flex-shrink-0 transition-all duration-300 hidden md:block`}
      >
        <div className="flex items-center justify-between p-5">
          {!collapsed && (
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <DollarSign className="h-6 w-6 text-blue-700" />
              </div>
              <span className="font-bold text-xl">Fleet Accounts</span>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="h-6 w-6 text-blue-700" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`text-white ${collapsed ? "mx-auto" : ""}`}
          >
            <ChevronRight
              className={`h-5 w-5 transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="mt-5">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center py-3 px-5 w-full transition-colors duration-200 ${
                activePage === item.path
                  ? "bg-blue-800 border-l-4 border-white"
                  : "border-l-4 border-transparent hover:bg-blue-600"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="bg-blue-700 text-white w-64 h-full overflow-y-auto">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                  <DollarSign className="h-6 w-6 text-blue-700" />
                </div>
                <span className="font-bold text-xl">Fleet Accounts</span>
              </div>
              <button onClick={toggleMobileMenu}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    handleNavigation(item.path);
                    toggleMobileMenu();
                  }}
                  className={`flex items-center py-3 px-5 w-full transition-colors duration-200 ${
                    activePage === item.path
                      ? "bg-blue-800 border-l-4 border-white"
                      : "border-l-4 border-transparent hover:bg-blue-600"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="ml-3">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}