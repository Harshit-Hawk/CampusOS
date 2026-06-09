import { fetchSubjectAttendanceReport } from './src/actions/academic'

async function test() {
  const result = await fetchSubjectAttendanceReport('some-id')
  console.log(result)
}
test()
