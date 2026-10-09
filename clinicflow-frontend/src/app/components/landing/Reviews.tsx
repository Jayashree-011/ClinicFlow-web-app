import { Star } from "lucide-react";
import { REVIEWS } from "../../constants/data";

export function Reviews(): JSX.Element {
  return (
    <section id="reviews" className="relative z-10 bg-slate-950 py-24">
      <div className="max-w-[1160px] mx-auto px-8">

        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-blue-400 mb-3">
          Reviews
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-14 leading-tight">
          Loved by patients and clinicians alike.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="bg-slate-800/60 border border-blue-400/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-blue-400/20 transition-all duration-200"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: r.stars }).map((_, j) => (
                  <Star key={j} size={13} fill="#60a5fa" color="#60a5fa" />
                ))}
              </div>

              {/* Text */}
              <p className="text-[13px] text-slate-400 leading-relaxed italic flex-grow">
                "{r.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-[34px] h-[34px] rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[12px] font-extrabold text-white">{r.name[0]}</span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white leading-tight">{r.name}</p>
                  <p className="text-[11px] text-slate-500">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}