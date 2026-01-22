import { Link } from "react-router-dom";
import { Plane, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-dark text-white mt-auto">
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
                <Plane className="h-5 w-5 text-navy-dark" />
              </div>
              <div>
                <h2 className="font-bold text-lg">رحلات دمشق</h2>
                <p className="text-xs text-white/60">Damascus Flights</p>
              </div>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed">
              محرك بحث شامل للرحلات الجوية من وإلى دمشق. نساعدك في إيجاد أفضل
              العروض ومقارنة الأسعار من جميع شركات الطيران.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-gold">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/search?type=to_damascus"
                  className="text-white/70 hover:text-gold transition-colors text-sm"
                >
                  رحلات إلى دمشق
                </Link>
              </li>
              <li>
                <Link
                  to="/search?type=from_damascus"
                  className="text-white/70 hover:text-gold transition-colors text-sm"
                >
                  رحلات من دمشق
                </Link>
              </li>
              <li>
                <Link
                  to="/airlines"
                  className="text-white/70 hover:text-gold transition-colors text-sm"
                >
                  شركات الطيران
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4 text-gold">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Mail className="h-4 w-4 text-gold" />
                <span>info@damascusflights.com</span>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Phone className="h-4 w-4 text-gold" />
                <span dir="ltr">+963 11 XXX XXXX</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} رحلات دمشق. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
