/**
 * Sidebar navigation component
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, ListTodo } from "lucide-react";
import logo from "../assets/colibri_logo.png";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Overview", icon: BarChart3 },
    { path: "/projects", label: "Projects", icon: ListTodo },
  ];

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-6">
        <img src={logo} alt="Colibri Digital" className="h-12 w-auto " />
        {/* <h1 className="text-2xl font-bold text-gray-800">Colibri Digital</h1>
        <p className="text-sm text-gray-500">Projects Engagements Tracker</p> */}
      </div>

      <nav className="mt-8">
        {navItems.map((item) => {
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
  );
}
