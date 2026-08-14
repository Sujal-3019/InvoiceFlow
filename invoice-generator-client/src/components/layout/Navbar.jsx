import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiSearch,
  FiMenu,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Dropdown from "../ui/Dropdown";
import SearchBar from "../ui/SearchBar";

const Navbar = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // =========================================================
  // SEARCH STATE
  // =========================================================

  const [searchQuery, setSearchQuery] = useState("");

  // =========================================================
  // SEARCH HANDLER
  // =========================================================

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const value = searchQuery.trim();

      if (value) {
        navigate(
          `/invoices?search=${encodeURIComponent(value)}`
        );
      } else {
        navigate("/invoices");
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">

      <div className="flex items-center justify-between px-4 lg:px-6 py-3">

        {/* =====================================================
            LEFT SECTION
        ===================================================== */}

        <div className="flex items-center gap-4">

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <FiMenu size={20} />
          </button>


          {/* =================================================
              DESKTOP SEARCH
          ================================================= */}

          <div className="hidden md:block w-96">

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search invoices, clients..."
            />

          </div>

        </div>


        {/* =====================================================
            RIGHT SECTION
        ===================================================== */}

        <div className="flex items-center gap-2">


          {/* =================================================
              MOBILE SEARCH
          ================================================= */}

          <button
            onClick={() => navigate("/invoices")}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            title="Search invoices"
          >
            <FiSearch size={20} />
          </button>


          {/* =================================================
              THEME TOGGLE
          ================================================= */}

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >

            {theme === "dark" ? (
              <FiSun size={20} />
            ) : (
              <FiMoon size={20} />
            )}

          </button>


          {/* =================================================
              USER MENU
          ================================================= */}

          <Dropdown
            trigger={
              <button className="flex items-center gap-3 p-1.5 pr-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">

                {/* User Avatar */}
                <Avatar
                  name={user?.name}
                  size="sm"
                />


                {/* User Name & Company */}
                <div className="hidden sm:flex flex-col items-start min-w-0">

                  <span className="text-sm font-medium truncate max-w-[160px]">
                    {user?.name || "User"}
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                    {user?.businessName ||
                      user?.company ||
                      "Company"}
                  </span>

                </div>


                <FiChevronDown size={16} />

              </button>
            }

            align="right"
            width="sm"
          >

            {/* User Information */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">

              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {user?.businessName ||
                  user?.company ||
                  "Company"}
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                {user?.email || ""}
              </p>

            </div>


            {/* Profile */}
            <Dropdown.Item
              icon={<FiUser size={16} />}
              onClick={() => navigate("/profile")}
            >
              Profile
            </Dropdown.Item>


            {/* Logout */}
            <Dropdown.Item
              icon={<FiLogOut size={16} />}
              className="text-red-600 dark:text-red-400"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </Dropdown.Item>

          </Dropdown>

        </div>

      </div>

    </header>
  );
};

export default Navbar;