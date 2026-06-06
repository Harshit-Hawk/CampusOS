import { DashboardContainer } from '@/components/ui/dashboard-container'
import { CardGridSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <DashboardContainer title="Faculty Hub" subtitle="Manage attendance, assignments, and exam marks for your subjects.">
      <div className="mt-8">
        <CardGridSkeleton />
      </div>
    </DashboardContainer>
  )
}
