/**
 * Sidebar navigation component
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, ListTodo, HelpCircle } from "lucide-react";
import logo from "../assets/colibri_logo.png";

export default function Sidebar() {
  const location = useLocation();

  const mainNavItems = [
    { path: "/", label: "Overview", icon: BarChart3 },
    { path: "/projects", label: "Projects", icon: ListTodo },
  ];

  const secondaryNavItems = [
    { path: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <div className="w-52 bg-white shadow-md flex flex-col">
      <div>
        <div className="p-6">
          <img src={logo} alt="Colibri Digital" className="h-10 w-auto " />
        </div>

        <nav className="mt-8">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors border-t border-gray-100 ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
