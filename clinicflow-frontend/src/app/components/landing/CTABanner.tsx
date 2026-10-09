import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CTA_CHECKS } from "../../constants/data";

export function CTABanner(): JSX.Element {
  const navigate = useNavigate();

  return (
    <section id="cta" className="relative z-10 bg-slate-950 border-t border-blue-400/10 py-24">
      <div className="max-w-[1160px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-blue-400">
            Get started today
          </p>
          <h2 className="text-[42px] font-extrabold tracking-tight text-white leading-[1.1]">
            Ready to modernise<br />your clinic?
          </h2>
          <p className="text-[15px] text-slate-400 leading-relaxed">
            Join 340+ clinics already on ClinicFlow. Set up in under 10 minutes — no credit card required.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-150 border-none cursor-pointer"
            >
              Start for free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-transparent hover:bg-white/5 text-white text-sm font-semibold px-6 py-3 rounded-xl border border-blue-400/25 hover:border-blue-400/40 transition-all duration-150 cursor-pointer"
            >
              Staff login
            </button>
          </div>
        </div>

        {/* Right — checklist */}
        <div className="flex flex-col gap-4">
          {CTA_CHECKS.map((line) => (
            <div key={line} className="flex items-center gap-3">
              {/* Checkmark dot */}
              <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[14px] text-slate-300">{line}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}