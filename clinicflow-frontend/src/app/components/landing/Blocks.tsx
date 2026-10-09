import { Activity, Calendar, Shield, Users } from "lucide-react";

export function Blocks(): JSX.Element {
  return (
    <section id="blocks" className="relative z-10 bg-slate-900 py-24">
      <div className="max-w-[1160px] mx-auto px-8">

        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-blue-400 mb-3">
          Why ClinicFlow
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-14 leading-tight">
          Built different. Built better.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Card 1 — vivid blue */}
          <div className="bg-blue-600 border border-blue-500 rounded-2xl p-9 flex flex-col gap-4 shadow-[0_8px_32px_rgba(29,78,216,0.35)]">
            <Activity size={30} strokeWidth={1.5} className="text-white" />
            <h3 className="text-[18px] font-bold text-white tracking-tight">Real-time vitals dashboard</h3>
            <p className="text-[14px] text-blue-200 leading-relaxed">
              Monitor live patient data — heart rate, SpO₂, blood pressure — without leaving the app.
            </p>
          </div>

          {/* Card 2 — slate-800 */}
          <div className="bg-slate-800 border border-blue-400/10 rounded-2xl p-9 flex flex-col gap-4 hover:border-blue-400/25 transition-all duration-200">
            <Calendar size={30} strokeWidth={1.5} className="text-blue-400" />
            <h3 className="text-[18px] font-bold text-white tracking-tight">Smart scheduling engine</h3>
            <p className="text-[14px] text-slate-400 leading-relaxed">
              AI-assisted slot suggestions reduce no-shows by 40% and keep your calendar full.
            </p>
          </div>

          {/* Card 3 — slate-800 */}
          <div className="bg-slate-800 border border-blue-400/10 rounded-2xl p-9 flex flex-col gap-4 hover:border-blue-400/25 transition-all duration-200">
            <Shield size={30} strokeWidth={1.5} className="text-blue-400" />
            <h3 className="text-[18px] font-bold text-white tracking-tight">HIPAA-grade security</h3>
            <p className="text-[14px] text-slate-400 leading-relaxed">
              End-to-end encryption, role-based access, and automated audit trails — always on.
            </p>
          </div>

          {/* Card 4 — deep navy */}
          <div className="bg-blue-950 border border-blue-400/15 rounded-2xl p-9 flex flex-col gap-4">
            <Users size={30} strokeWidth={1.5} className="text-blue-300" />
            <h3 className="text-[18px] font-bold text-white tracking-tight">Multi-clinic support</h3>
            <p className="text-[14px] text-blue-300 leading-relaxed">
              Manage multiple branches, departments, and specialties from a single admin panel.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}