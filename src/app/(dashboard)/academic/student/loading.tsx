import { DashboardContainer } from '@/components/ui/dashboard-container'
import { CardGridSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <DashboardContainer title="Academic Portal" subtitle="View your timetable, attendance, assignments, and marks.">
      <div className="mt-8">
        <CardGridSkeleton />
      </div>
    </DashboardContainer>
  )
}
