# CampusOS 🚀

CampusOS is a next-generation, all-in-one college management and social platform designed to bridge the gap between students, faculty, and administration. It combines academic infrastructure with a gamified social experience.

## 🛠 Tech Stack

**Frontend:**
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript** (Strong typing)
- **Tailwind CSS** (Styling & utility classes)
- **Lucide React** (Icons)
- **Next Themes** (Light, Dark, and System modes)
- **Sonner** (Toast notifications)

**Backend & Database:**
- **Supabase** (BaaS)
- **PostgreSQL** (Relational database)
- **Supabase Auth** (Authentication & Role-based Access Control)
- **Supabase Storage** (File, image, and avatar storage)
- **RPC Functions** (Secure, server-side database logic)

---

## 🎭 Role-Based Features

CampusOS provides distinct experiences tailored to specific roles within the college ecosystem.

### 🎓 1. Student
*The core user of CampusOS, utilizing the platform for social engagement, event participation, and academic tracking.*

* **Social Feed:** Create posts, upload images, engage in discussions, and vote on interactive campus polls.
* **Event Hub:** Discover campus events. Register as an individual or form a team (with a secret joining code). Automatically join waitlists if an event is full.
* **Smart Check-ins:** Check into events using a dynamic, personal QR code to log attendance.
* **Clubs:** Discover official college clubs and submit applications to join them.
* **Academics Dashboard:** Track subject-wise attendance, view class timetables, and download study resources.
* **Assignments & Exams:** View upcoming assignments, submit work directly through the platform, and check exam marks and feedback.
* **Gamification Engine:** Earn **XP (Reputation)** and **Campus Coins (CC)** for positive engagements like daily streaks, event check-ins, or winning hackathons.
* **Campus Wallet & Reward Store:** Track your earned CC and XP history. Spend your Campus Coins in the college's physical Reward Store to buy merch or exclusive items.
* **Dynamic Profile:** Showcase a beautifully generated "Rank Card" featuring your Avatar, XP Level, Roll Number, and gamification rank.

### 👨‍🏫 2. Faculty
*Teachers and professors who manage the academic lifecycle of the students.*

* **Attendance Management:** View enrolled students and mark daily attendance (Present, Absent, Late, Excused).
* **Attendance Reports:** Generate and download comprehensive, subject-specific CSV attendance reports in a single click.
* **Assignment Workflow:** Create assignments with due dates and max marks, view student submissions, grade them, and leave constructive feedback.
* **Exam Marks:** Upload internal and final exam marks for enrolled students.
* **Study Resources:** Upload and manage subject-specific study materials and PDFs for students to access.

### 🛡️ 3. Admin / Staff
*The college administration that oversees the entire ecosystem, structures academics, and manages the gamification economy.*

* **Academic Infrastructure:** Create and manage Departments, Subjects, and Student Batches.
* **Timetable & Enrollment:** Assign faculty to subjects, auto-enroll entire student batches into subjects, and build the weekly timetable.
* **Batch Analytics:** Generate massive, college-wide CSV reports detailing overall batch semester attendance.
* **Reward Store Management:** Complete control over the Campus Wallet. Add new physical rewards to the store, track student redemption requests, and mark rewards as "fulfilled" once handed out.
* **Global Moderation:** Ensure the social feed and clubs remain safe and adhere to college guidelines.

### 🎪 4. Club Leader / Event Organizer
*Students or staff trusted with organizing events and managing student organizations.*

* **Event Creation:** Create intricate events with participant limits, specify whether it's a Solo or Team event, and set maximum team sizes.
* **Scanner Dashboard:** Use the built-in QR Scanner to rapidly scan student QR codes and check them into the event.
* **Volunteer Management:** Accept or reject student volunteer requests for events.
* **Leaderboard Engine:** At the conclusion of an event, officially assign 1st, 2nd, and 3rd place winners. This automatically generates a beautiful public podium on the event page.
* **Certificates:** Automatically generate and issue digital certificates to students who successfully checked into the event.
* **Club Management:** Review and process incoming applications to join their respective club.
