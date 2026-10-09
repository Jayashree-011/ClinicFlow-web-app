import { STEPS } from "../../constants/data";

export function HowItWorks(): JSX.Element {
  return (
    <section id="how-it-works" className="relative z-10 bg-slate-950 py-24">
      <div className="max-w-[1160px] mx-auto px-8">

        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-blue-400 mb-3">
          How It Works
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-14 leading-tight">
          Up and running in four steps.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((st) => (
            <div
              key={st.n}
              className="bg-slate-800/60 border border-blue-400/10 rounded-2xl p-7 flex flex-col gap-3"
            >
              <span className="text-[36px] font-black text-blue-400/20 leading-none tracking-tighter">
                {st.n}
              </span>
              <h3 className="text-[15px] font-bold text-white">{st.title}</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}