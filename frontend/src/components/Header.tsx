/**
 * Header component
 */

import React from "react";
import logo from "../assets/colibri_logo.png";
export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-0 py-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Project Engagements Tracker
        </h2>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Development Mode</span>
        </div>
      </div>
    </header>
  );
}
