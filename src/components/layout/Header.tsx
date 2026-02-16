import { Link, useLocation } from "react-router-dom";
import { Plane, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const { currency, setCurrency, symbol } = useCurrency();

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/search?type=to_damascus", label: "رحلات إلى دمشق" },
    { href: "/search?type=from_damascus", label: "رحلات من دمشق" },
    { href: "/airlines", label: "شركات الطيران" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">رحلات دمشق</h1>
            <p className="text-xs text-muted-foreground">Damascus Flights</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant={location.pathname === link.href.split("?")[0] ? "secondary" : "ghost"}
              size="sm"
            >
              <Link to={link.href}>{link.label}</Link>
            </Button>
          ))}
          <div className="relative mr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="text-xs gap-1"
            >
              {symbol} {currency}
            </Button>
            {currencyOpen && (
              <div className="absolute left-0 top-full mt-1 bg-background border rounded-md shadow-lg z-50 min-w-[160px]">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <button
                    key={code}
                    className={`w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors ${currency === code ? 'bg-muted font-medium' : ''}`}
                    onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                  >
                    {CURRENCIES[code].symbol} {code} — {CURRENCIES[code].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-background p-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={location.pathname === link.href.split("?")[0] ? "secondary" : "ghost"}
                className="justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={link.href}>{link.label}</Link>
              </Button>
            ))}
            <div className="flex gap-1 pt-2 border-t mt-1">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <Button
                  key={code}
                  variant={currency === code ? "secondary" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => { setCurrency(code); setMobileMenuOpen(false); }}
                >
                  {CURRENCIES[code].symbol} {code}
                </Button>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
