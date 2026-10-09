import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { STATS } from "../../constants/data";

interface HeroProps {
  onScrollTo: (id: string) => void;
}

export function Hero({ onScrollTo }: HeroProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative z-10 bg-slate-950">
      <div className="max-w-[1160px] mx-auto px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT — copy */}
        <div className="flex flex-col gap-7">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            Healthcare Management Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-[54px] font-extrabold leading-[1.07] tracking-[-0.04em] text-white">
            Medicine, managed<br />
            <span className="text-blue-400">with precision.</span>
          </h1>

          {/* Sub */}
          <p className="text-base leading-relaxed text-slate-400 max-w-[480px]">
            A unified system for patient records, appointment scheduling,
            and clinical billing — built for modern healthcare teams.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-150 border-none cursor-pointer"
            >
              Get started free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onScrollTo("how-it-works")}
              className="bg-white/5 hover:bg-white/10 text-white text-sm font-semibold px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-150 cursor-pointer"
            >
              See how it works
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center flex-wrap gap-0 pt-2">
            {STATS.map((st, i) => (
              <div key={st.n} className="flex items-center">
                <div className="flex flex-col gap-0.5 pr-6">
                  <span className="text-2xl font-extrabold tracking-tight text-white">{st.n}</span>
                  <span className="text-[11px] text-slate-500">{st.l}</span>
                </div>
                {i < STATS.length - 1 && (
                  <div className="w-px h-9 bg-white/10 mr-6" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — doctor image */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden h-[520px] bg-slate-800 shadow-[0_24px_80px_rgba(0,0,0,0.5),0_4px_24px_rgba(59,130,246,0.2)] border border-white/10">
            
          </div>
        </div>

      </div>
    </section>
  );
}