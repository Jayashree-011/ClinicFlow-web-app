import { Plus, Minus } from "lucide-react";
import { FAQS } from "../../constants/data";

interface FAQProps {
  openFaq:  number | null;
  onToggle: (i: number) => void;
}

export function FAQ({ openFaq, onToggle }: FAQProps): JSX.Element {
  return (
    <section id="faq" className="relative z-10 bg-slate-900 py-24">
      <div className="max-w-[740px] mx-auto px-8">

        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-blue-400 mb-3">
          FAQ
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-12 leading-tight">
          Common questions,<br />clear answers.
        </h2>

        <div className="flex flex-col">
          {FAQS.map((faq, i) => (
            <div key={i} className="border-b border-blue-400/10">
              <button
                onClick={() => onToggle(i)}
                className="w-full bg-transparent border-none cursor-pointer flex items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  {faq.q}
                </span>
                {openFaq === i
                  ? <Minus size={16} className="text-blue-400 flex-shrink-0" />
                  : <Plus  size={16} className="text-slate-500 flex-shrink-0" />
                }
              </button>
              {openFaq === i && (
                <p className="text-[14px] text-slate-400 leading-relaxed pb-5 pr-8">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}