import { Link, useLocation } from "react-router-dom";
import { Plane, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          </div>
        </nav>
      )}
    </header>
  );
}
