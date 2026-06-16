import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

export interface PhoneCountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

export const DEFAULT_PHONE_COUNTRY: CountryCode = "NP";

export function getPhoneCountryOptions(): PhoneCountryOption[] {
  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
  return getCountries()
    .map((code) => ({
      code,
      name: countryNames.of(code) || code,
      dialCode: `+${getCountryCallingCode(code)}`,
    }))
    .sort(
      (a, b) =>
        a.dialCode.localeCompare(b.dialCode) || a.name.localeCompare(b.name),
    );
}

export function detectPhoneCountry(value: string): CountryCode {
  try {
    const phoneNumber = parsePhoneNumber(value.trim(), DEFAULT_PHONE_COUNTRY);
    return phoneNumber?.country || DEFAULT_PHONE_COUNTRY;
  } catch {
    return DEFAULT_PHONE_COUNTRY;
  }
}

export function formatPhoneWithCountryCode(
  value: string,
  countryCode: CountryCode,
): string {
  const dialCode = `+${getCountryCallingCode(countryCode)}`;
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (value.trim().startsWith("+")) return value.trim();
  const withoutLeadingZero = digits.replace(/^0+/, "");
  return `${dialCode} ${withoutLeadingZero}`;
}
