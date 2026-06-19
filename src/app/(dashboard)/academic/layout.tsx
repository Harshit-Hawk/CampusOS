import { redirect } from 'next/navigation'

export default function AcademicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Temporarily disabled
  redirect('/feed')
}
