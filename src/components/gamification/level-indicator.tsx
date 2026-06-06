export function LevelIndicator({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg level-badge text-white text-xs font-bold">
      {level}
    </span>
  )
}
