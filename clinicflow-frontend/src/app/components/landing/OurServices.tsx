import type { LucideIcon } from "lucide-react";
import { SERVICES } from "../../constants/data";

export function OurServices(): JSX.Element {
  return (
    <section id="services" className="relative z-10 bg-slate-900 py-24">
      <div className="max-w-[1160px] mx-auto px-8">

        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-blue-400 mb-3">
          Our Services
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-14 leading-tight">
          Everything your clinic needs,<br />all in one place.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((sv) => {
            const Icon = sv.icon as LucideIcon;
            return (
              <div
                key={sv.title}
                className="bg-slate-800 border border-blue-400/10 rounded-2xl p-7 flex flex-col gap-3 hover:border-blue-400/25 hover:bg-slate-800/80 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                    <Icon size={20} strokeWidth={1.75} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-400/20 px-2.5 py-1 rounded-full">
                    {sv.tag}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-white tracking-tight">{sv.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{sv.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}