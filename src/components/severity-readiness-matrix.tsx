import type { RegionBaseline } from "@/types/domain";

const pathwayColor: Record<string, string> = {
  "Fast-start": "bg-[color:var(--teal)]",
  "Build-first": "bg-[color:var(--accent)]",
  "Statewide coordination hub": "bg-[color:#182f4a]",
};

export function SeverityReadinessMatrix({
  regions,
}: {
  regions: RegionBaseline[];
}) {
  return (
    <div className="surface-card relative overflow-hidden rounded-[2rem] p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="relative h-[22rem] rounded-[1.6rem] border border-[color:var(--line)] bg-[linear-gradient(90deg,rgba(196,97,42,0.08)_0,rgba(255,255,255,0.82)_48%,rgba(15,124,134,0.1)_100%),linear-gradient(0deg,rgba(16,34,53,0.06)_0,rgba(16,34,53,0)_100%)]">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
            {Array.from({ length: 16 }).map((_, index) => (
              <div key={index} className="border border-white/60" />
            ))}
          </div>
          <div className="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Higher severity
          </div>
          <div className="absolute bottom-5 right-5 rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Higher readiness
          </div>
          {regions.map((region) => (
            <div
              key={region.slug}
              className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center gap-1"
              style={{
                left: `${region.readinessScore}%`,
                bottom: `${region.severityScore}%`,
              }}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-lg ${pathwayColor[region.recommendedPathway]}`}
              />
              <div className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-[color:var(--foreground)] shadow-sm">
                {region.name}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-2xl text-[color:var(--foreground)]">
            Severity x readiness view
          </h2>
          <p className="text-sm leading-7 text-[color:var(--muted)]">
            Read this as a policy map, not a GIS control surface: how urgent the burden is, and how
            ready the regional system is to absorb a screening program now.
          </p>
          <div className="space-y-2 text-sm">
            {Object.entries(pathwayColor).map(([label, color]) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3">
                <span className={`h-3 w-3 rounded-full ${color}`} />
                <span className="font-medium text-[color:var(--foreground)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
