import { SettingsView } from '@/components/settings/settings-view'
import { getUserRole } from '@/actions/auth'

export default async function SettingsPage() {
  const role = await getUserRole()
  return <SettingsView userRole={role} />
}
