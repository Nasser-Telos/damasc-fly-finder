import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { COUNTRIES, REGIONS, getCountryByCode, getCountriesByRegion } from "@/lib/booking-constants";

interface CountrySelectProps {
  value: string; // ISO 3166-1 alpha-2
  onChange: (code: string) => void;
  placeholder?: string;
  error?: boolean;
}

const REGION_KEYS = Object.keys(REGIONS) as (keyof typeof REGIONS)[];

export function CountrySelect({
  value,
  onChange,
  placeholder = "اختر البلد",
  error,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = getCountryByCode(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`book-country-trigger ${error ? "book-country-error" : ""}`}
        >
          <span className="book-country-display">
            {selected ? (
              <>
                <span className="book-country-flag">{selected.flag}</span>
                <span>{selected.name_ar}</span>
                <span className="book-country-code">({selected.code})</span>
              </>
            ) : (
              <span className="book-country-placeholder">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="book-country-chevron" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" sideOffset={4}>
        <Command dir="rtl">
          <CommandInput placeholder="ابحث عن البلد..." className="book-country-search" />
          <CommandList>
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            {REGION_KEYS.map((regionKey) => {
              const countries = getCountriesByRegion(regionKey);
              if (countries.length === 0) return null;
              return (
                <CommandGroup key={regionKey} heading={REGIONS[regionKey]}>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.code}
                      keywords={[country.name_ar, country.code]}
                      onSelect={() => {
                        onChange(country.code);
                        setOpen(false);
                      }}
                      className="book-country-item"
                    >
                      <span className="book-country-flag">{country.flag}</span>
                      <span className="flex-1">{country.name_ar}</span>
                      <span className="book-country-item-code">({country.code})</span>
                      {value === country.code && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
