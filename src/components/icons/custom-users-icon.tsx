export function CustomUsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Center person */}
      <circle cx="12" cy="8" r="3" />
      <path d="M18 21v-2a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v2" />

      {/* Left person */}
      <circle cx="5" cy="10" r="2.5" />
      <path d="M1 21v-2a4 4 0 0 1 4.5-3.8" />

      {/* Right person */}
      <circle cx="19" cy="10" r="2.5" />
      <path d="M23 21v-2a4 4 0 0 0-4.5-3.8" />
    </svg>
  )
}
