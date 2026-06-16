import { useMemo, useState } from "react";
import {
  DEFAULT_PHONE_COUNTRY,
  detectPhoneCountry,
  formatPhoneWithCountryCode,
  getPhoneCountryOptions,
} from "../utils/phone.js";

interface PhoneInputProps {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
  className?: string;
}

export default function PhoneInput({
  id,
  label,
  value,
  required,
  maxLength = 30,
  onChange,
  className = "",
}: PhoneInputProps) {
  const countryOptions = useMemo(() => getPhoneCountryOptions(), []);
  const [countryCode, setCountryCode] = useState(
    value ? detectPhoneCountry(value) : DEFAULT_PHONE_COUNTRY,
  );

  const handleChange = (nextValue: string) => {
    onChange(formatPhoneWithCountryCode(nextValue, countryCode));
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        aria-label={`${label} country code`}
        value={countryCode}
        onChange={(event) => {
          const nextCountry = event.target
            .value as (typeof countryOptions)[number]["code"];
          setCountryCode(nextCountry);
          onChange(formatPhoneWithCountryCode(value, nextCountry));
        }}
        className="w-32 vms-input"
      >
        {countryOptions.map((option) => (
          <option key={option.code} value={option.code} title={option.name}>
            {option.dialCode} {option.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="vms-input flex-1"
        placeholder="Phone number"
      />
    </div>
  );
}
