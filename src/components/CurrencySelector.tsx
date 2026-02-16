import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencySelectorProps {
  variant?: "desktop" | "mobile";
  className?: string;
  onCurrencyChange?: () => void;
}

const currencyKeys = Object.keys(CURRENCIES) as CurrencyCode[];

function DesktopSelector({ className, onCurrencyChange }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();
  const [pulsing, setPulsing] = useState(false);
  const active = CURRENCIES[currency];

  function handleSelect(code: string) {
    if (code === currency) return;
    setCurrency(code as CurrencyCode);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 200);
    onCurrencyChange?.();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="اختيار العملة"
          className={cn(
            "gap-1.5 text-xs transition-transform",
            pulsing && "scale-105",
            className,
          )}
        >
          <span className="text-base leading-none">{active.flag}</span>
          <span>{active.symbol}</span>
          <span>{active.code}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuRadioGroup value={currency} onValueChange={handleSelect}>
          {currencyKeys.map((code) => {
            const c = CURRENCIES[code];
            return (
              <DropdownMenuRadioItem
                key={code}
                value={code}
                className="gap-3 py-2.5 pe-3 ps-3 cursor-pointer"
              >
                <span className="text-xl leading-none">{c.flag}</span>
                <span className="font-semibold">{c.code}</span>
                <span className="text-muted-foreground">{c.symbol}</span>
                <span className="text-xs text-muted-foreground me-auto">{c.label}</span>
                {currency === code && (
                  <Check className="h-4 w-4 text-primary ms-auto" />
                )}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileSelector({ className, onCurrencyChange }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();
  const activeIndex = currencyKeys.indexOf(currency);

  function handleSelect(code: CurrencyCode) {
    if (code === currency) return;
    setCurrency(code);
    onCurrencyChange?.();
  }

  return (
    <div
      role="radiogroup"
      aria-label="اختيار العملة"
      className={cn(
        "relative flex bg-muted/50 rounded-xl p-1",
        className,
      )}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 bg-background border shadow-sm rounded-lg transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${currencyKeys.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {currencyKeys.map((code) => {
        const c = CURRENCIES[code];
        const isActive = currency === code;
        return (
          <button
            key={code}
            role="radio"
            aria-checked={isActive}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm transition-colors active:scale-95",
              isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground",
            )}
            onClick={() => handleSelect(code)}
          >
            <span className="text-base leading-none">{c.flag}</span>
            <span>{c.code}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CurrencySelector({ variant = "desktop", ...props }: CurrencySelectorProps) {
  if (variant === "mobile") return <MobileSelector {...props} />;
  return <DesktopSelector {...props} />;
}
