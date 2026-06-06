export function XPBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
      <div
        className="h-full rounded-full xp-bar transition-all duration-1000 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
