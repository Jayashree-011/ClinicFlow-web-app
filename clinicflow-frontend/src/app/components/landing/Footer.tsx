import { Facebook, Instagram, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function Footer(): JSX.Element {
  const socials: LucideIcon[] = [Facebook, Instagram, MessageCircle];

  return (
    <footer className="bg-slate-950 border-t border-blue-400/10 pt-16 pb-0">

      <div className="max-w-[1160px] mx-auto px-8 pb-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-[30px] h-[30px] rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M9 1v16M1 9h16" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-white">
              Clinic<span className="text-blue-400">Flow</span>
            </span>
          </div>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Modern solutions for modern healthcare.
          </p>
          <div className="flex gap-2 mt-1">
            {socials.map((Icon, i) => (
              <a
                key={i}
                aria-label="social link"
                className="w-8 h-8 rounded-lg border border-blue-400/10 flex items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-400/30 transition-colors cursor-pointer"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-blue-400 mb-1">
            Platform
          </p>
          {["Home", "Services", "Doctors", "How it works", "Pricing"].map((l) => (
            <p key={l} className="text-[13px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
              {l}
            </p>
          ))}
        </div>

        {/* Company */}
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-blue-400 mb-1">
            Company
          </p>
          {["About us", "Careers", "Blog", "Press", "Privacy policy"].map((l) => (
            <p key={l} className="text-[13px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
              {l}
            </p>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-blue-400 mb-1">
            Contact
          </p>
          <p className="flex items-center gap-2 text-[13px] text-slate-500">
            <Mail size={13} className="text-blue-400 flex-shrink-0" />
            clinicflow@example.com
          </p>
          <p className="flex items-center gap-2 text-[13px] text-slate-500">
            <Phone size={13} className="text-blue-400 flex-shrink-0" />
            +91 98765 43210
          </p>
          <p className="flex items-center gap-2 text-[13px] text-slate-500">
            <MapPin size={13} className="text-blue-400 flex-shrink-0" />
            Kolkata, West Bengal
          </p>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-[1160px] mx-auto px-8 py-5 border-t border-blue-400/8 flex items-center justify-between flex-wrap gap-3">
        <span className="text-[12px] text-slate-600">
          © 2026 ClinicFlow. All rights reserved.
        </span>
        <div className="flex gap-5">
          {["Terms", "Privacy", "Cookies"].map((l) => (
            <span key={l} className="text-[12px] text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">
              {l}
            </span>
          ))}
        </div>
      </div>

    </footer>
  );
}