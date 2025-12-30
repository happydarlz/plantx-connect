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
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "USA" },
  { code: "+44", country: "UK", flag: "🇬🇧", name: "UK" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+65", country: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+7", country: "RU", flag: "🇷🇺", name: "Russia" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+31", country: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", country: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "+41", country: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+62", country: "ID", flag: "🇮🇩", name: "Indonesia" },
  { code: "+60", country: "MY", flag: "🇲🇾", name: "Malaysia" },
  { code: "+63", country: "PH", flag: "🇵🇭", name: "Philippines" },
  { code: "+66", country: "TH", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", country: "VN", flag: "🇻🇳", name: "Vietnam" },
  { code: "+92", country: "PK", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", country: "BD", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94", country: "LK", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", country: "NP", flag: "🇳🇵", name: "Nepal" },
  { code: "+27", country: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+234", country: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+254", country: "KE", flag: "🇰🇪", name: "Kenya" },
  { code: "+20", country: "EG", flag: "🇪🇬", name: "Egypt" },
  { code: "+64", country: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "+353", country: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "+48", country: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "+90", country: "TR", flag: "🇹🇷", name: "Turkey" },
  { code: "+972", country: "IL", flag: "🇮🇱", name: "Israel" },
  { code: "+43", country: "AT", flag: "🇦🇹", name: "Austria" },
  { code: "+32", country: "BE", flag: "🇧🇪", name: "Belgium" },
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
    <div className={`flex gap-1.5 ${className}`}>
      <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
        <SelectTrigger className="w-[72px] h-9 rounded-lg bg-secondary/50 border-border shrink-0 px-2 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border-border max-h-[280px]">
          {countryCodes.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-1.5">
                <span>{c.flag}</span>
                <span className="text-xs font-medium">{c.code}</span>
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
        className="h-9 rounded-lg border-border bg-secondary/50 flex-1"
      />
    </div>
  );
};

export default PhoneInput;
