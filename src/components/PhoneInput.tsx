import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const PhoneInput = ({ value, onChange, disabled, placeholder = "Phone number", className }: PhoneInputProps) => {
  // Parse existing value to extract country code and number
  const parseValue = (val: string) => {
    for (const c of countryCodes) {
      if (val.startsWith(c.code)) {
        return { countryCode: c.code, number: val.slice(c.code.length).trim() };
      }
    }
    return { countryCode: "+91", number: val.replace(/^\+\d+\s*/, "") };
  };

  const { countryCode: initialCode, number: initialNumber } = parseValue(value);
  const [countryCode, setCountryCode] = useState(initialCode);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    onChange(`${code} ${phoneNumber}`);
  };

  const handleNumberChange = (num: string) => {
    // Only allow digits
    const cleaned = num.replace(/\D/g, "");
    setPhoneNumber(cleaned);
    onChange(`${countryCode} ${cleaned}`);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
        <SelectTrigger className="w-24 h-10 rounded-lg bg-secondary/50 border-border shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          {countryCodes.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-1">
                <span>{c.flag}</span>
                <span className="text-xs">{c.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
        disabled={disabled}
        className="h-10 rounded-lg border-border bg-secondary/50 flex-1"
      />
    </div>
  );
};

export default PhoneInput;
