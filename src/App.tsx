export default function App() {
  return (
    <div className="min-h-screen flex flex-col gap-12 p-10">

      {/* HEADER */}
      <header className="text-4xl font-bold tracking-tight text-center">
        STRATFIT GODMODE
      </header>

      {/* KPI GRID */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 text-center">
          <div className="text-sm opacity-75">Revenue</div>
          <div className="text-2xl font-bold">$125K</div>
        </div>

        <div className="p-6 bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 text-center">
          <div className="text-sm opacity-75">Burn Rate</div>
          <div className="text-2xl font-bold">-$22K</div>
        </div>

        <div className="p-6 bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 text-center">
          <div className="text-sm opacity-75">Runway</div>
          <div className="text-2xl font-bold">9.4 months</div>
        </div>

        <div className="p-6 bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 text-center">
          <div className="text-sm opacity-75">Valuation</div>
          <div className="text-2xl font-bold">$1.02M</div>
        </div>
      </section>

      {/* Placeholder for future Mountain */}
      <section className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
        <p className="opacity-60">Mountain Visual Goes Here</p>
      </section>

    </div>
  );
}
