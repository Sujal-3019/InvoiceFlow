// ==========================
// PHONE NUMBER VALIDATION
// ==========================

import {
    parsePhoneNumberFromString,
} from "libphonenumber-js";

export const validatePhoneNumber = (
    phone,
    countryCode
) => {
    // Phone is optional
    if (!phone || phone.trim() === "") {
        return "";
    }

    // Country is required when phone is provided
    if (!countryCode) {
        return "Please select a country";
    }

    try {
        const phoneNumber =
            parsePhoneNumberFromString(
                phone,
                countryCode
            );

        if (!phoneNumber || !phoneNumber.isValid()) {
            return "Enter a valid phone number";
        }

        return "";
    } catch {
        return "Enter a valid phone number";
    }
};