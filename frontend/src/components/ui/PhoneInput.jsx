import React from "react";
import {
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

const PhoneInput = ({
  country,
  phone,
  onCountryChange,
  onPhoneChange,
  error,
  label = "Phone",
  placeholder = "Enter phone number",
}) => {
  const countries = getCountries();

  return (
    <div className="space-y-1 w-full min-w-0">

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="flex gap-2 w-full min-w-0">

        {/* COUNTRY SELECTOR */}

        <select
          value={country}
          onChange={(e) =>
            onCountryChange(e.target.value)
          }
          className="w-30 min-w-0 shrink-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-sm"
        >
          {countries.map((countryCode) => (
            <option
              key={countryCode}
              value={countryCode}
            >
              {countryCode} +
              {getCountryCallingCode(countryCode)}
            </option>
          ))}
        </select>

        {/* PHONE NUMBER */}

        <input
          type="tel"
          value={phone}
          placeholder={placeholder}
          onChange={(e) =>
            onPhoneChange(e.target.value)
          }
          className={`flex-1 min-w-0 w-0 px-4 py-2 rounded-xl border bg-white dark:bg-dark-card ${
            error
              ? "border-red-500"
              : "border-gray-200 dark:border-gray-700"
          }`}
        />

      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

    </div>
  );
};

export default PhoneInput;