import { redirect } from 'next/navigation'

// Portfolio is now part of the Profile page (Portfolio tab)
export default function PortfolioPage() {
  redirect('/profile')
}
