import { EmbeddedLabManager } from "./Reception/EmbeddedLabManager";

export function Lab() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Laboratory</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage lab orders, track sample collection, and review test results
        </p>
      </div>

      <EmbeddedLabManager />
    </div>
  );
}
