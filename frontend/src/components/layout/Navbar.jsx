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
  FiCheck,
  FiBriefcase,
  FiPlus,
} from "react-icons/fi";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";

import Avatar from "../ui/Avatar";
import Dropdown from "../ui/Dropdown";
import SearchBar from "../ui/SearchBar";

const Navbar = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const {
    companies,
    activeCompany,
    activeCompanyId,
    setActiveCompany,
  } = useProfile();

  // =========================================================
  // SEARCH STATE
  // =========================================================

  const [searchQuery, setSearchQuery] = useState("");

  const [switchingCompany, setSwitchingCompany] =
    useState(false);

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

  // =========================================================
  // COMPANY SWITCH
  // =========================================================

  const handleCompanySwitch = async (companyId) => {
    if (
      String(companyId) ===
      String(activeCompanyId)
    ) {
      return;
    }

    try {
      setSwitchingCompany(true);

      await setActiveCompany(companyId);

      // Reload current page so company-scoped
      // data is fetched again using the new company ID.
      window.location.reload();

    } catch (error) {
      console.error(
        "Failed to switch company:",
        error
      );
    } finally {
      setSwitchingCompany(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
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
              COMPANY SWITCHER
          ================================================= */}

          <Dropdown
            trigger={
              <button className="hidden md:flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">

                <FiBriefcase size={17} />

                <span className="text-sm font-medium max-w-[180px] truncate">
                  {activeCompany?.business_name ||
                    activeCompany?.businessName ||
                    activeCompany?.company ||
                    "Select Company"}
                </span>

                <FiChevronDown size={15} />
              </button>
            }
            align="right"
            width="md">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Your Companies
              </p>
            </div>

            {companies.length > 0 ? (
              companies.map((company) => {
                const companyName =
                  company.business_name ||
                  company.businessName ||
                  company.company ||
                  "Unnamed Company";

                const isActive =
                  String(company.id) === String(activeCompanyId);

                return (
                  <Dropdown.Item
                    key={company.id}
                    icon={
                      <FiBriefcase
                        size={16}
                        className={
                          isActive
                            ? "text-primary"
                            : "text-gray-400"
                        }
                      />
                    }
                    onClick={() => {
                      handleCompanySwitch(company.id);
                    }}
                    className={
                      isActive
                        ? "bg-primary/10 text-primary"
                        : ""
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">
                        {companyName}
                      </span>

                      {isActive && (
                        <span className="text-xs font-semibold text-primary ml-2">
                          Active
                        </span>
                      )}
                    </div>
                  </Dropdown.Item>
                );
              })
            ) : (
              <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                No companies found.
              </div>
            )}

            <Dropdown.Divider />

            <Dropdown.Item
              icon={<FiBriefcase size={16} />}
              onClick={() => navigate("/companies")}
            >
              Add / Manage Companies
            </Dropdown.Item>

          </Dropdown>


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
              USER / COMPANY MENU
          ================================================= */}

          <Dropdown
            trigger={
              <button className="flex items-center gap-3 p-1.5 pr-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">

                {/* User Avatar */}

                <Avatar
                  name={user?.name}
                  size="sm"
                />


                {/* User + Active Company */}

                <div className="hidden sm:flex flex-col items-start min-w-0">

                  <span className="text-sm font-medium truncate max-w-[160px]">
                    {user?.name || "User"}
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                    {activeCompany?.business_name ||
                      activeCompany?.company ||

                      "Company"}
                  </span>

                </div>


                <FiChevronDown size={16} />

              </button>
            }

            align="right"
            width="md"
          >

            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">

              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {user?.email || ""}
              </p>

            </div>


            {/* =================================================
                COMPANY SWITCHER
            ================================================= */}

            <div className="px-4 pt-3 pb-2">

              <div className="flex items-center justify-between mb-2">

                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Companies
                </p>

              </div>


              <div className="space-y-1 max-h-60 overflow-y-auto">

                {companies.length === 0 ? (

                  <p className="text-sm text-gray-500 dark:text-gray-400 px-2 py-2">
                    No companies found
                  </p>

                ) : (

                  companies.map((company) => {

                    const isActive =
                      String(company.id) ===
                      String(activeCompanyId);

                    return (
                      <button
                        key={company.id}
                        type="button"
                        disabled={switchingCompany}
                        onClick={() =>
                          handleCompanySwitch(
                            company.id
                          )
                        }
                        className={`
                          w-full flex items-center justify-between
                          px-3 py-2.5 rounded-lg
                          text-left
                          transition-colors
                          ${isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }
                          ${switchingCompany
                            ? "opacity-60 cursor-wait"
                            : ""
                          }
                        `}
                      >

                        <div className="flex items-center gap-3 min-w-0">

                          {/* Company Avatar */}

                          <div
                            className={`
                              w-8 h-8 rounded-lg
                              flex items-center justify-center
                              flex-shrink-0
                              ${isActive
                                ? "bg-primary text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                              }
                            `}
                          >
                            <span className="text-xs font-semibold">
                              {(
                                company.company ||
                                company.business_name ||
                                "C"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>


                          {/* Company Name */}

                          <div className="min-w-0">

                            <p className="text-sm font-medium truncate">
                              {company.company ||
                                company.business_name ||
                                "Unnamed Company"}
                            </p>

                            {company.business_name &&
                              company.company &&
                              company.business_name !==
                              company.company && (
                                <p className="text-xs text-gray-400 truncate">
                                  {company.business_name}
                                </p>
                              )}

                          </div>

                        </div>


                        {/* Active Check */}

                        {isActive && (
                          <FiCheck
                            size={17}
                            className="flex-shrink-0 ml-2"
                          />
                        )}

                      </button>
                    );
                  })
                )}

              </div>

            </div>


            {/* Company Management */}
            <Dropdown.Item
              icon={<FiBriefcase size={16} />}
              onClick={() => navigate("/companies")}
            >
              Add / Manage Companies
            </Dropdown.Item>



            {/* =================================================
                PROFILE
            ================================================= */}

            <Dropdown.Item
              icon={<FiUser size={16} />}
              onClick={() => navigate("/profile")}
            >
              Profile
            </Dropdown.Item>


            {/* =================================================
                LOGOUT
            ================================================= */}

            <Dropdown.Item
              icon={<FiLogOut size={16} />}
              className="text-red-600 dark:text-red-400"
              onClick={handleLogout}
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