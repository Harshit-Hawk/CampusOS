import { redirect } from 'next/navigation'

export default function AdminAcademicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Temporarily disabled
  redirect('/admin')
}
