# CampusOS — Comprehensive Project Documentation

**Document Classification:** Internal Technical & Functional Reference  
**Version:** 1.0  
**Scope:** Original foundational system (pre-enhancement baseline)

---

## Table of Contents

1. Executive Summary
2. Project Vision & Objectives
3. Technology Stack — In-Depth Analysis
4. System Architecture & Data Flow
5. Database Schema & Data Model
6. Authentication & Role-Based Access Control
7. Module 1 — Social Feed & Community Engagement
8. Module 2 — Events Management System
9. Module 3 — Club Ecosystem
10. Module 4 — Academic Infrastructure
11. Module 5 — Gamification Engine
12. Module 6 — Campus Wallet & Reward Store
13. Module 7 — Alumni Network
14. Module 8 — Placement Hub & Career Services
15. Module 9 — Campus Communities
16. Module 10 — Notifications & Real-Time Systems
17. Module 11 — Search & Discovery
18. Module 12 — User Profiles & Portfolios
19. Module 13 — Administrative Control Panel
20. Storage & Media Management
21. Security Architecture
22. Deployment & DevOps
23. Conclusion

---

## 1. Executive Summary

CampusOS is a verbose, all-encompassing, next-generation collegiate management platform that has been engineered from the ground up to serve as a unified digital ecosystem for higher-education institutions. The platform synthesizes academic administration, social networking, gamification, event management, career services, and institutional operations into a single, cohesive, real-time web application. Rather than requiring colleges to subscribe to dozens of fragmented tools for attendance tracking, event ticketing, club management, and alumni engagement, CampusOS consolidates every operational need into one premium, beautifully designed experience.

The platform is purpose-built to serve the full spectrum of college stakeholders: students who need a rich social and academic hub, faculty who require streamlined teaching and evaluation workflows, administrators who demand institutional control and analytics, club leaders who organize campus life, alumni who wish to stay connected and give back, and event organizers who need professional-grade logistics tools. Each role is given a tailored, permission-controlled experience that ensures users see only what is relevant to their function, while the underlying data flows seamlessly between modules to create emergent intelligence — for instance, event attendance feeds the gamification engine, which feeds the leaderboard, which drives engagement on the social feed.

This document provides a verbose and exhaustive technical and functional reference for the entirety of the CampusOS system, covering every module, every database table, every server action, every UI component, and the reasoning behind every architectural decision. It is intended to serve as the definitive source of truth for anyone seeking to understand what CampusOS is, how it works, and why it was built the way it was.

---

## 2. Project Vision & Objectives

### 2.1 Problem Statement

Traditional college management relies on a fragmented patchwork of disconnected systems. Attendance is tracked on paper or in Excel spreadsheets. Events are promoted through WhatsApp groups and physical posters. Clubs communicate through informal channels. Career services operate through email blasts. Alumni engagement is virtually non-existent beyond annual reunions. This fragmentation leads to data silos, poor student engagement, administrative inefficiency, and a complete lack of actionable analytics.

### 2.2 The CampusOS Solution

CampusOS addresses every one of these pain points through a single, integrated platform that provides:

- **Unified Identity:** Every user — student, faculty, admin, alumni — has a single profile that serves as their digital campus passport. This profile accumulates reputation, achievements, certificates, and engagement history over time.
- **Gamified Engagement:** Rather than treating student participation as a chore, CampusOS transforms it into a rewarding experience through XP (Experience Points), Campus Coins, levels, streaks, badges, and leaderboards.
- **Real-Time Collaboration:** From live event check-ins via QR codes to real-time notifications and social feed updates, the platform operates on a foundation of instant data propagation powered by Supabase's real-time subscription engine.
- **Administrative Intelligence:** Administrators gain access to batch-level analytics, attendance reports, placement statistics, and gamification economy controls — all generated automatically from the same data that students interact with daily.
- **Career Readiness:** Through an integrated placement hub with resume builders, ATS (Applicant Tracking System) checkers powered by AI, internship portals, and mock interview simulators, CampusOS ensures that the platform's value extends beyond graduation.

### 2.3 Design Philosophy

The following principles guided every technical and design decision:

1. **Zero Friction:** Minimize clicks, pages, and loading times. Every action should feel instantaneous.
2. **Mobile-First Responsive:** While built as a web application, every interface is designed to function flawlessly on mobile viewports.
3. **Data Integrity First:** PostgreSQL's strict typing, foreign key constraints, unique indexes, and Row Level Security ensure that data is always consistent, never orphaned, and always private by default.
4. **Progressive Enhancement:** The core platform works without JavaScript for content viewing. Interactive features layer on top using React's hydration model.
5. **Premium Aesthetics:** CampusOS is not a utilitarian tool. It is designed to feel like a consumer-grade social product that students genuinely want to use, with dark mode defaults, glassmorphism, gradient accents, micro-animations, and carefully curated color palettes.

---

## 3. Technology Stack — In-Depth Analysis

### 3.1 Frontend Architecture

#### 3.1.1 Next.js 14 (App Router)

CampusOS is built on Next.js 14 using the modern App Router paradigm. This architectural choice was deliberate and provides several critical advantages over the older Pages Router.

The App Router introduces React Server Components (RSCs) as the default rendering strategy. This means that the vast majority of CampusOS pages render entirely on the server, sending pre-built HTML to the client with zero JavaScript overhead for static content. Only interactive elements — such as the QR scanner, the social feed's infinite scroll, or the gamification animations — are explicitly marked as Client Components using the 'use client' directive.

The file-system-based routing of the App Router maps directly to CampusOS's page structure. The `(dashboard)` route group wraps all authenticated pages in a shared layout that includes the sidebar navigation, the notification bell, and the user's profile avatar. The `(auth)` route group handles login, signup, and OAuth callback flows. This grouping mechanism keeps the codebase organized without polluting the URL structure.

Server Actions — a Next.js 14 feature — are used extensively throughout CampusOS. Every database mutation (creating a post, registering for an event, submitting an assignment, issuing a certificate) is implemented as a Server Action. These are asynchronous functions that run exclusively on the server, eliminating the need for a separate API layer in most cases. The entire `src/actions/` directory contains 25 Server Action modules totaling over 130KB of business logic.

#### 3.1.2 React 18

React 18's concurrent features underpin the user experience. Suspense boundaries are used to show loading skeletons while data fetches complete. The `useTransition` hook ensures that heavy state updates (such as filtering a large list of students or rendering a complex leaderboard) do not block user input. The `useState` and `useEffect` hooks manage local component state and side effects respectively, with custom hooks abstracting common patterns like debounced search and infinite scrolling.

#### 3.1.3 TypeScript

The entire codebase is written in TypeScript with strict mode enabled. Every database table has a corresponding type definition in `src/types/database.ts`, and every Server Action returns typed responses. This provides compile-time guarantees that prevent entire categories of runtime errors — such as accessing a non-existent property on a database row, or passing the wrong argument type to an action.

#### 3.1.4 Tailwind CSS

Tailwind CSS provides the styling foundation. Rather than maintaining a separate CSS file for each component, styles are applied directly via utility classes. CampusOS extends Tailwind's default configuration with custom design tokens — HSL-based CSS variables that support dynamic theme switching between light and dark modes. Custom utilities like `gradient-accent`, `scrollbar-thin`, and `animate-fade-in` are defined in the global stylesheet.

#### 3.1.5 Lucide React

Lucide React provides the icon system. With over 1,000 icons available, Lucide offers a consistent, MIT-licensed icon library that tree-shakes to include only the icons actually imported. CampusOS uses approximately 60 unique icons across its interface, from the sidebar navigation to inline button labels and status indicators.

#### 3.1.6 Next Themes

The `next-themes` library powers seamless theme switching between Light, Dark, and System modes. Theme preference is persisted in `localStorage` and applied server-side via a cookie to prevent the flash of unstyled content (FOUC) that plagues most theme implementations. The dashboard defaults to dark mode for a premium aesthetic.

#### 3.1.7 Sonner

Sonner provides the toast notification system — lightweight, animated pop-up messages that confirm actions, report errors, and provide feedback. Every Server Action call in CampusOS is wrapped in a toast feedback pattern: `toast.info()` on initiation, `toast.success()` on completion, `toast.error()` on failure.

### 3.2 Backend Architecture

#### 3.2.1 Supabase (Backend-as-a-Service)

Supabase is the complete backend infrastructure for CampusOS. It provides:

- **PostgreSQL Database:** A fully managed, production-grade PostgreSQL 15 instance with extensions like `uuid-ossp` for UUID generation and `pgcrypto` for cryptographic functions.
- **Authentication:** Supabase Auth handles user registration, login, OAuth (Google), magic links, and session management. Every session is JWT-based, and the `auth.uid()` function is available within SQL policies to enforce per-user data access.
- **Storage:** Supabase Storage provides S3-compatible object storage for file uploads. CampusOS maintains six storage buckets: `avatars`, `posts`, `clubs`, `events`, `certificates`, and `feed-media`. Each bucket has granular RLS policies controlling who can upload, view, and delete files.
- **Real-Time:** Supabase's real-time engine (built on Elixir's Phoenix framework) pushes database changes to connected clients via WebSockets. CampusOS enables real-time subscriptions on the `notifications`, `posts`, and `event_attendees` tables, ensuring that actions like new check-ins, new comments, and new announcements appear instantly across all connected clients.
- **Edge Functions:** While the primary business logic runs through Next.js Server Actions, Supabase Edge Functions (Deno-based) are available for webhook processing and scheduled tasks.
- **RPC Functions:** Stored procedures written in PL/pgSQL run directly in the database engine for performance-critical operations like XP incrementing, wallet balance updates, and level calculations.

#### 3.2.2 PostgreSQL

PostgreSQL is the relational database engine. The CampusOS schema spans 45 migration files and over 60 tables. Every table uses UUID primary keys (generated via `uuid_generate_v4()`), has `created_at` timestamps with timezone awareness, and enforces referential integrity through foreign key constraints with appropriate `ON DELETE` behaviors (`CASCADE`, `SET NULL`, or `RESTRICT` depending on the business rule).

The schema makes extensive use of PostgreSQL's advanced features:

- **CHECK Constraints:** Enum-like validation on columns like `role`, `status`, `category`, and `exam_type` to prevent invalid data at the database level.
- **UNIQUE Constraints:** Composite unique constraints prevent duplicate relationships (e.g., a user cannot like the same post twice, register for the same event twice, or submit the same assignment twice).
- **JSONB Columns:** Flexible JSON storage for semi-structured data like resume content, mock interview questions, and AI feedback.
- **Array Columns:** PostgreSQL's native `text[]` arrays store lists like media URLs, skill tags, and department tags without requiring junction tables.
- **Computed Columns & Functions:** The `calculate_level()` function converts raw XP points into a discrete level using a predefined threshold array, ensuring consistent leveling logic across all access paths.

---

## 4. System Architecture & Data Flow

CampusOS follows a layered architecture:

1. **Presentation Layer (React Components):** Located in `src/components/` and `src/app/`, these are the visual building blocks. Components are organized by domain: `feed/`, `events/`, `clubs/`, `gamification/`, `profile/`, `admin/`, `layout/`, `settings/`, `notifications/`, `landing/`, and `ui/`.

2. **Action Layer (Server Actions):** Located in `src/actions/`, these 25 modules contain all business logic. Each action function authenticates the user, validates permissions, interacts with the database, and returns typed results. Actions never expose raw Supabase clients to the frontend.

3. **Database Layer (Supabase/PostgreSQL):** The source of truth. All data lives in PostgreSQL tables with Row Level Security ensuring that even if a Server Action has a bug, the database itself prevents unauthorized access.

4. **Storage Layer (Supabase Storage):** Binary assets (images, PDFs, documents) are stored in Supabase Storage buckets and served via CDN-backed public URLs.

5. **Real-Time Layer (Supabase Realtime):** WebSocket connections push database changes to connected clients for live updates.

The data flow for a typical user action follows this path: User clicks a button → React calls a Server Action → Server Action authenticates via Supabase Auth → Server Action performs the database operation → PostgreSQL triggers fire (XP awards, count updates) → Server Action returns result → React updates the UI → Supabase Realtime pushes the change to other connected clients.

---

## 5. Database Schema & Data Model

The CampusOS database consists of 45 migration files that build up the schema incrementally. Each migration is idempotent (using `CREATE TABLE IF NOT EXISTS` and `DO $$ ... $$` blocks for constraint modifications) to prevent errors on re-runs. The migrations are numbered sequentially from `001_initial_schema.sql` through `043_event_feedback_control.sql`.

### 5.1 Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Central user identity | `id`, `full_name`, `roll_no`, `avatar_url`, `department`, `course`, `semester`, `year`, `bio`, `skills[]`, `xp_points`, `level`, `role`, `phone`, `email` |
| `posts` | Social feed entries | `author_id`, `content`, `media_urls[]`, `category`, `like_count`, `comment_count` |
| `post_likes` | Like tracking | `post_id`, `user_id` (unique pair) |
| `post_comments` | Comment threads | `post_id`, `user_id`, `content` |
| `events` | Event definitions | `title`, `description`, `banner_url`, `location`, `start_date`, `end_date`, `organizer_id`, `max_attendees`, `registered_count`, `status`, `is_team_event`, `max_team_size`, `feedback_published` |
| `event_registrations` | Event sign-ups | `event_id`, `user_id` (unique pair) |
| `event_attendees` | Verified check-ins | `event_id`, `user_id`, `check_in_time` |
| `event_teams` | Team formations | `event_id`, `name`, `code`, `creator_id`, `member_count` |
| `event_team_members` | Team membership | `team_id`, `user_id` |
| `event_winners` | Podium results | `event_id`, `placement`, `user_id`, `team_id` |
| `event_feedback` | Post-event surveys | `event_id`, `user_id`, `rating_overall`, `rating_content`, `comments` |
| `clubs` | Student organizations | `name`, `description`, `logo_url`, `banner_url`, `category`, `leader_id`, `member_count`, `activity_score`, `engagement_score`, `growth_score` |
| `club_members` | Club membership | `club_id`, `user_id`, `role` (member/moderator/leader/president/vice_president/secretary/treasurer/core_team) |
| `club_applications` | Join requests | `club_id`, `user_id`, `status`, `position_id` |
| `club_announcements` | Club news | `club_id`, `author_id`, `title`, `content` |
| `club_positions` | Open roles | `club_id`, `title`, `description`, `is_open` |

### 5.2 Academic Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `departments` | Academic departments | `name`, `code` |
| `subjects` | Course subjects | `department_id`, `name`, `code`, `credits`, `semester` |
| `faculty_subjects` | Faculty-subject mapping | `faculty_id`, `subject_id` |
| `student_subjects` | Student enrollments | `student_id`, `subject_id` |
| `timetables` | Weekly schedules | `subject_id`, `day_of_week` (1-6), `start_time`, `end_time`, `room` |
| `attendance_records` | Daily attendance | `subject_id`, `student_id`, `date`, `status` (present/absent/late/excused), `recorded_by` |
| `assignments` | Homework/projects | `subject_id`, `title`, `description`, `due_date`, `max_marks`, `created_by` |
| `assignment_submissions` | Student submissions | `assignment_id`, `student_id`, `file_url`, `content`, `marks_obtained`, `feedback` |
| `exam_marks` | Examination results | `subject_id`, `student_id`, `exam_type` (internal_1/internal_2/midterm/final), `marks_obtained`, `max_marks` |
| `subject_resources` | Study materials | `subject_id`, `title`, `type`, `file_url`, `uploaded_by` |

### 5.3 Gamification Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `wallets` | Coin balances | `user_id`, `balance` |
| `coin_transactions` | CC transaction log | `user_id`, `amount`, `reason` |
| `xp_transactions` | XP transaction log | `user_id`, `amount`, `reason`, `source_type`, `source_id` |
| `badges` | Badge definitions | `name`, `description`, `icon_url`, `xp_reward`, `criteria`, `category`, `is_seasonal` |
| `user_badges` | Earned badges | `user_id`, `badge_id`, `earned_at` |
| `achievements` | Achievement definitions | `title`, `description`, `category`, `max_stages`, `xp_reward`, `coin_reward` |
| `user_achievements` | Progress tracking | `user_id`, `achievement_id`, `current_stage`, `progress`, `completed_at` |
| `user_streaks` | Streak tracking | `user_id`, `streak_type` (daily_login/event_participation/club_activity), `current_count`, `longest_count` |
| `rewards` | Purchasable items | `title`, `description`, `cost`, `image_url`, `stock`, `is_active` |
| `reward_redemptions` | Purchase history | `reward_id`, `user_id`, `status` (pending/fulfilled/rejected), `cost_at_redemption` |

### 5.4 Career & Alumni Tables

| Table | Purpose |
|-------|---------|
| `alumni_profiles` | Extended alumni data (company, position, industry, graduation year, mentor availability) |
| `mentorship_requests` | Student-alumni mentorship connections |
| `job_referrals` | Alumni-posted job openings |
| `alumni_stories` | Success stories and testimonials |
| `resumes` | JSON-based resume data with ATS scoring |
| `internship_listings` | Internship postings |
| `internship_applications` | Application tracking |
| `placement_records` | Historical placement statistics |
| `mock_interviews` | AI-powered interview practice sessions |


---

## 6. Authentication & Role-Based Access Control

### 6.1 Authentication Flow

CampusOS uses Supabase Auth with Google OAuth as the primary authentication method. The flow proceeds as follows:

1. User clicks "Sign in with Google" on the landing page.
2. Supabase redirects to Google's OAuth consent screen.
3. Upon consent, Google redirects back to `/auth/callback` with an authorization code.
4. The callback route exchanges the code for a session token and creates the Supabase session.
5. A PostgreSQL trigger (`on_auth_user_created`) fires automatically, creating a new row in the `profiles` table with the user's name, a generated username, and their Google avatar URL.
6. A second trigger creates a corresponding `wallets` row with a zero balance.
7. The user is redirected to the dashboard.

### 6.2 Role System

CampusOS defines six distinct roles, enforced via a CHECK constraint on the `profiles.role` column:

| Role | Description | Access Level |
|------|-------------|-------------|
| `student` | Default role for all new users | Social feed, events, clubs, academics (student view), wallet |
| `faculty` | Teaching staff | Academic management (attendance, assignments, exams, resources) |
| `admin` | College administration | Full system access, reward store management, academic infrastructure, moderation |
| `club_leader` | Student organization leaders | Event creation, club management, volunteer oversight |
| `alumni` | Graduated students | Alumni network, mentorship, job referrals |
| `user` | Base role (deprecated in favor of student) | Minimal access |

### 6.3 Row Level Security (RLS)

Every table in CampusOS has RLS enabled. Policies are written using PostgreSQL's policy language and reference `auth.uid()` to identify the current user and `public.has_role()` to check role-based permissions. This provides defense-in-depth: even if application code has a vulnerability, the database itself prevents unauthorized data access.

Key RLS patterns used throughout the schema:

- **Public Read, Restricted Write:** Tables like `posts`, `events`, and `clubs` are readable by anyone but writable only by authenticated users with appropriate roles.
- **Owner-Only Access:** Tables like `wallets`, `coin_transactions`, and `resumes` are visible only to their owner (or admins).
- **Role-Gated Management:** Administrative tables like `departments`, `subjects`, and `rewards` are manageable only by users with the `admin` role.
- **Relationship-Based Access:** Tables like `attendance_records` use subqueries to check if the requesting user is a faculty member assigned to the relevant subject.

---

## 7. Module 1 — Social Feed & Community Engagement

### 7.1 Overview

The Social Feed is the primary landing experience for students after login. It serves as a campus-wide news feed where users can share updates, upload images, discuss topics, and engage through likes and comments. The feed is categorized into six channels: General, Academic, Social, Events, Announcements, and Achievements.

### 7.2 Post Creation

Users create posts through a modal dialog that supports rich text input and multi-image uploads. Images are uploaded to the `posts` Supabase Storage bucket and their public URLs are stored in the `media_urls` text array column. Posts are tagged with a category that determines their visibility and sorting priority.

The Server Action `createPost()` in `src/actions/posts.ts` handles the creation flow:
1. Authenticate the user via `supabase.auth.getUser()`.
2. Insert the post row into the `posts` table.
3. A PostgreSQL trigger (`on_post_award_xp`) automatically fires, inserting an XP transaction of +10 XP and updating the user's profile.
4. Return the created post data to the client.

### 7.3 Engagement System

- **Likes:** Toggling a like inserts or deletes a row from `post_likes`. A trigger automatically increments or decrements the `like_count` on the parent post. The post author receives +5 XP when their post is liked (self-likes are excluded by the trigger logic).
- **Comments:** Comments are stored in `post_comments` with a similar trigger updating `comment_count`. Comments display the commenter's avatar, name, and timestamp.
- **Media Gallery:** Posts with multiple images render as a responsive grid. Clicking an image opens a full-screen lightbox viewer.

### 7.4 Feed Filtering

The feed supports filtering by category, pagination via cursor-based infinite scrolling, and sorting by recency. The `fetchPosts()` Server Action accepts page size and cursor parameters, returning batches of posts with their associated author profiles, like counts, comment counts, and the current user's like status.

---

## 8. Module 2 — Events Management System

### 8.1 Overview

The Events module is one of the most feature-rich areas of CampusOS. It provides a complete event lifecycle management system covering event creation, registration, team formation, QR-based check-in, attendance tracking, winner assignment, volunteer management, certificate issuance, feedback collection, and post-event reporting.

### 8.2 Event Creation

Events are created by users with `admin` or `club_leader` roles. The creation form captures:
- Title, description, and location
- Start and end dates with time
- Banner image (uploaded to the `events` storage bucket)
- Maximum attendee capacity
- Whether it's a team event and the maximum team size
- Optional club association

The `createEvent()` Server Action validates that the user has the appropriate role before inserting into the `events` table.

### 8.3 Registration System

Students register for events through the event detail page. The system handles several scenarios:
- **Solo Registration:** A direct insert into `event_registrations`.
- **Team Registration:** If the event is a team event, the user can either create a new team (generating a unique join code) or join an existing team using a code. Team data is stored in `event_teams` and `event_team_members`.
- **Capacity Management:** If `max_attendees` is set and `registered_count` has reached the limit, the system prevents further registrations.
- **Registration Count:** A PostgreSQL trigger automatically increments/decrements `registered_count` on the event whenever a registration is inserted or deleted.

### 8.4 QR Code Check-In System

Each registered student receives a dynamic QR code on their event ticket page. The QR code encodes a JSON payload containing `{ eventId, userId }`. On the event management page, organizers access a built-in QR scanner (powered by `@yudiel/react-qr-scanner`) that reads the code, validates the payload, and calls the `checkInAttendee()` Server Action.

The check-in process:
1. Parse the QR JSON payload.
2. Verify the `eventId` matches the current event.
3. Check that the user is registered for the event.
4. Check that the user hasn't already been checked in.
5. Insert a row into `event_attendees` with the current timestamp.
6. A PostgreSQL trigger automatically awards the user +20 XP and +5 Campus Coins.

### 8.5 Winner Assignment

After an event concludes, organizers can assign 1st, 2nd, and 3rd place winners. For solo events, winners are individual users. For team events, winners are teams. The `markEventWinner()` Server Action uses an upsert pattern on a composite constraint (`event_id`, `placement`) to ensure each placement slot is unique.

Winners are displayed on the public event page as a podium component, automatically sorted with 1st place in the center, flanked by 2nd and 3rd. Each winner card shows the user's avatar, name, and roll number.

### 8.6 Volunteer Management

Events can accept volunteer applications. Students browse events and submit volunteer requests, which are stored in the `event_volunteer_assignments` table with a `pending` status. Organizers review applications in the Volunteers tab and approve or reject them. Approved volunteers gain a distinct badge on the event page.

### 8.7 Event Feedback

Organizers control when the feedback form is available to participants through a "Publish Feedback" toggle. Once published, registered participants who attended the event can submit ratings (on content, organization, and overall experience) along with open-ended comments. Feedback is stored in the `event_feedback` table.

### 8.8 Participant Data Export

Organizers can export a comprehensive CSV file containing all registered participants with their full profile details (name, roll number, email, phone, department, course, semester), registration timestamp, attendance status, and team information. The export is generated client-side using the `fetchAllEventRegistrations()` Server Action.

---

## 9. Module 3 — Club Ecosystem

### 9.1 Overview

The Club module provides infrastructure for managing student organizations. Each club has a leader, a member roster with hierarchical roles, a public profile page, an announcement system, and a position-based application workflow.

### 9.2 Club Structure

Clubs are created by administrators and assigned a leader. The data model supports:
- **Club Profile:** Name, description, logo, banner, category (Technical, Cultural, Sports, etc.).
- **Membership Hierarchy:** Eight distinct roles — member, moderator, leader, president, vice_president, secretary, treasurer, core_team — each enforced via a CHECK constraint.
- **Performance Metrics:** `activity_score`, `engagement_score`, and `growth_score` columns track club health.

### 9.3 Application Workflow

Clubs can create open positions (stored in `club_positions`) with titles and descriptions. Students apply through the club page, optionally targeting a specific position. Applications follow a four-stage pipeline: pending → interviewing → approved → rejected. Club leaders manage applications through their club dashboard.

### 9.4 Announcements

Club leaders and officers can post announcements visible to all members. Announcements support titles and rich text content. RLS policies ensure only users with leadership roles in the specific club can create announcements.

### 9.5 Faculty Coordination

Clubs can be assigned a faculty coordinator (stored as `faculty_coordinator_id` on the clubs table). This provides institutional oversight while keeping day-to-day management in student hands.

---

## 10. Module 4 — Academic Infrastructure

### 10.1 Overview

The Academic module provides a complete Learning Management System (LMS) integrated into the CampusOS ecosystem. It covers departmental structure, subject management, faculty-student mapping, timetables, attendance tracking, assignment workflows, exam marks, and study resources.

### 10.2 Departmental Structure

Administrators create departments (e.g., Computer Science, Mechanical Engineering, Business Administration) with unique codes. Subjects are then created within departments, each with a code, credit count, and semester assignment.

### 10.3 Faculty-Subject Mapping

The `faculty_subjects` junction table maps faculty profiles to the subjects they teach. This mapping determines which subjects appear in a faculty member's teaching dashboard and which students they can mark attendance for.

### 10.4 Student Enrollment

Students are enrolled into subjects through the `student_subjects` table. Administrators can bulk-enroll entire student batches into all subjects for a given semester using the batch enrollment system. Student batches (stored in a separate `student_batches` table) group students by department, year, and section.

### 10.5 Timetable System

The timetable system uses a structured format: each entry specifies a subject, a day of the week (1=Monday through 6=Saturday), a start time, an end time, and a room number. The student dashboard aggregates timetable entries for all enrolled subjects and renders them as a visual weekly calendar grid.

### 10.6 Attendance Management

Faculty members mark attendance through a subject-specific dashboard. The interface displays all enrolled students in a clean list with status buttons (Present, Absent, Late, Excused). Attendance records are stored with the subject ID, student ID, date, status, and the recording faculty member's ID. Composite unique constraints prevent duplicate records for the same student-subject-date combination.

Students view their own attendance through a subject-wise dashboard that shows:
- Total classes held
- Classes attended
- Attendance percentage
- Per-date status history

Faculty can also generate and download CSV attendance reports for any subject, covering a specified date range.

### 10.7 Assignment Workflow

Faculty create assignments with a title, description, due date, and maximum marks. Students view assignments on their subject page and submit work by uploading files or entering text content. Faculty review submissions, assign marks, and provide written feedback. The entire workflow operates through the `assignments` and `assignment_submissions` tables with appropriate RLS policies ensuring students can only view and submit their own work, while faculty can view and grade all submissions.

### 10.8 Exam Marks

The exam marks system supports four exam types: Internal 1, Internal 2, Midterm, and Final. Faculty record marks through a dedicated interface, and students view their marks alongside maximum possible marks. The schema enforces uniqueness per student-subject-exam type combination, preventing accidental duplicate entries.

### 10.9 Study Resources

Faculty can upload study materials (PDFs, documents, links) organized by subject. Resources are stored in the `subject_resources` table with metadata including title, type, file URL, and uploader ID. Students access these resources through their subject pages.

---

## 11. Module 5 — Gamification Engine

### 11.1 Overview

The Gamification Engine is the behavioral backbone of CampusOS. It transforms routine academic and social activities into a rewarding, game-like experience through four interconnected systems: XP (Experience Points), Campus Coins (CC), Levels, and Streaks.

### 11.2 XP (Experience Points)

XP serves as the primary reputation metric. It is earned through positive engagement and cannot be spent. Every XP-earning action is logged in the `xp_transactions` table with the amount, reason, source type, and an optional source ID for traceability.

XP-earning triggers are implemented as PostgreSQL functions that fire automatically:

| Action | XP Awarded | Trigger |
|--------|-----------|---------|
| Create a post | +10 XP | `on_post_award_xp` (after INSERT on posts) |
| Receive a like (non-self) | +5 XP | `on_like_award_xp` (after INSERT on post_likes) |
| Check into an event | +20 XP | `on_event_checkin_award` (after INSERT on event_attendees) |

The `increment_xp()` RPC function handles XP addition with role filtering — admin and faculty accounts are excluded from XP accumulation to prevent gamification of administrative actions.

### 11.3 Levels

Levels are derived from cumulative XP using the `calculate_level()` function. The leveling curve follows an exponential pattern:

| Level | XP Required |
|-------|-------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 500 |
| 5 | 1,000 |
| 6 | 1,750 |
| 7 | 2,750 |
| 8 | 4,000 |
| 9 | 5,500 |
| 10 | 7,500 |
| 11 | 10,000 |
| 12 | 13,000 |
| 13 | 16,500 |
| 14 | 20,500 |
| 15 | 25,000 |

The level is recalculated every time XP changes and stored denormalized on the `profiles` table for efficient leaderboard queries.

### 11.4 Campus Coins (CC)

Campus Coins are the spendable currency. They are earned alongside XP through specific actions (e.g., +5 CC for event check-in) and can be spent in the Reward Store. The `increment_cc()` RPC function handles coin additions with wallet auto-creation and role filtering.

### 11.5 Badges

Ten default badges are seeded into the database, each with a criteria string, an emoji icon, and an XP reward:

- 🚀 First Steps (first post)
- 🦋 Social Butterfly (join 3 clubs)
- 🎪 Event Explorer (attend 5 events)
- ⭐ Rising Star (reach Level 5)
- 💫 Influencer (50 likes received)
- 💬 Commentator (20 comments)
- 🏆 Club Champion (lead a club)
- 👑 Campus Legend (reach Level 10)
- 🎯 Event Master (organize 3 events)
- ✨ Profile Pro (complete profile)

### 11.6 Streaks

The `user_streaks` table tracks three streak types: daily login, event participation, and club activity. Each record maintains the current consecutive count, the longest historical count, and the last activity timestamp. Streak widgets appear on the dashboard and profile pages, encouraging daily engagement.

### 11.7 Leaderboard

The leaderboard page ranks users by XP with support for three time periods: All Time, Monthly, and Weekly. The `fetchLeaderboard()` Server Action queries the `xp_transactions` table with date filters and aggregates XP by user. The leaderboard displays rank, avatar, name, department, level, and total XP.

---

## 12. Module 6 — Campus Wallet & Reward Store

### 12.1 Wallet System

Every user has a wallet (created automatically via trigger on profile creation) that tracks their Campus Coin balance. The wallet page displays the current balance, a history of all coin transactions (earnings and expenditures), and the Reward Store.

### 12.2 Reward Store

Administrators create rewards (physical items like merchandise, coupons, or exclusive access passes) with a title, description, cost in CC, image, and optional stock limit (infinite stock is supported via a -1 sentinel value). Students browse the store and redeem rewards using their CC balance.

The redemption flow:
1. Student clicks "Redeem" on a reward.
2. The `redeemReward()` Server Action checks the user's wallet balance.
3. If sufficient funds exist, a negative coin transaction is inserted, the wallet balance is decremented, and a `reward_redemptions` entry is created with `pending` status.
4. Administrators review redemptions in the admin panel, marking them as `fulfilled` once the physical item is handed over, or `rejected` if the request is invalid.

---

## 13. Module 7 — Alumni Network

### 13.1 Student-to-Alumni Transition

When a student graduates, administrators use the `convert_to_alumni()` RPC function, which updates the user's role from `student` to `alumni` and creates a corresponding `alumni_profiles` record with graduation year and batch information.

### 13.2 Alumni Directory

The alumni page displays a searchable, filterable directory of all alumni with their professional information: company, position, industry, location, and graduation year. Alumni can edit their profiles to update their career information.

### 13.3 Mentorship System

Alumni who opt into mentorship (by setting `is_mentor_available = true` and specifying `mentor_topics[]`) appear in the mentorship directory. Students can send mentorship requests with a topic and message. Alumni respond by accepting, declining, or completing the mentorship. The `mentorship_requests` table tracks the full lifecycle.

### 13.4 Job Referrals

Alumni can post job referral opportunities with company name, role title, description, location, job type (full-time/part-time/internship/contract/freelance), and application URLs. Listings have optional expiration dates and are visible to all authenticated users.

### 13.5 Success Stories

Alumni can submit success stories — narrative posts with titles, content, and images — that are displayed on the alumni page after admin approval. Featured stories are highlighted at the top of the page.

---

## 14. Module 8 — Placement Hub & Career Services

### 14.1 Resume Builder

The placement hub includes a JSON-based resume builder that stores resume data as a JSONB column. The schema supports multiple templates (professional, modern, minimal) and structured sections: personal information, summary, education, experience, projects, skills, certifications, and achievements. Users can create multiple resumes with one marked as primary.

### 14.2 ATS Score Checker

Resumes can be analyzed by an AI-powered ATS (Applicant Tracking System) checker that evaluates the resume against industry standards and returns a score out of 100 along with detailed feedback stored as JSONB. The analysis timestamp is recorded for tracking improvements over time.

### 14.3 Internship Portal

Alumni and administrators can post internship listings with comprehensive details: company, role, description, requirements, stipend, location, work type (onsite/remote/hybrid), duration, department tags, application URL, and deadline. Students browse active listings and apply by attaching their resume and an optional cover letter.

Applications follow a seven-stage pipeline: applied → under_review → shortlisted → interview → offered → rejected → withdrawn. Listing owners can update application statuses and add notes.

### 14.4 Placement Records

The platform maintains historical placement data indexed by academic year and department. Each record captures the company name, role title, package (in lakhs per annum), number of students placed, and placement type (campus/off-campus/internship). This data powers the placement analytics dashboard visible to administrators and students.

### 14.5 Mock Interviews

Students can practice with AI-powered mock interview sessions in three categories: Technical, HR, and Behavioral. Each session stores the domain, a JSON array of questions with AI evaluations, a total score, AI feedback, and duration. This provides a safe, repeatable environment for interview preparation.

---


---

## 15. Module 9 — Campus Communities

### 15.1 Overview

Campus Communities is a modern, real-time messaging subsystem integrated seamlessly into the CampusOS dashboard. Designed to replace fragmented group chats and isolated external tools, the Communities feature allows students, faculty, and alumni to create public or private discussion groups (Communities) containing multiple, topic-specific text channels.

### 15.2 Architecture & Layout

Unlike traditional forum layouts, the Communities module employs a sophisticated "Split-Pane" messenger architecture:
- **Left Pane:** Displays the community's banner, avatar, title, and a list of available text channels.
- **Right Pane:** Houses the real-time chat interface.

This layout rests comfortably within the standard CampusOS dashboard shell (preserving the global topbar and sidebar), ensuring users can transition rapidly between checking their social feed, viewing an event, and chatting with their study group without losing contextual navigation.

### 15.3 Database Schema

The subsystem relies on four interconnected tables:
1. `communities`: Stores the high-level group details (name, description, branding assets, privacy flag).
2. `community_members`: Tracks user enrollment within communities and their associated roles (owner, admin, moderator, member).
3. `community_channels`: Defines individual discussion spaces (e.g., `#general`, `#announcements`) within a community.
4. `community_messages`: Stores the actual chat payload, including text content, attachments, and timestamps.

### 15.4 Real-Time Infrastructure

The core magic of Campus Communities is its real-time capability. Leveraging Supabase's `realtime` publication, the chat interface opens a WebSocket connection to listen for `INSERT` events on the `community_messages` table. When a payload is received, the client automatically fetches the sender's profile data and appends the message to the conversation array in memory. This eliminates the need for manual polling and provides an instantaneous, fluid chat experience on par with industry-leading messenger applications.

---

## 16. Module 10 — Notifications & Real-Time Systems

### 16.1 Notification System

CampusOS maintains a `notifications` table that stores in-app notifications for each user. Notifications are generated by Server Actions throughout the platform: event registrations, certificate awards, mentorship responses, volunteer decisions, and more. Each notification includes a type, title, message, optional link, and read status.

The notification bell in the dashboard header shows an unread count badge and opens a dropdown panel listing recent notifications with timestamps and action links.

### 16.2 Push Notifications

The platform supports browser push notifications via the Web Push API. Push subscriptions are stored in the `push_subscriptions` table and managed through the `src/actions/push.ts` Server Action module. Users can opt in or out of push notifications through their settings page.

### 16.3 Real-Time Subscriptions

Supabase Realtime is enabled on key tables (`notifications`, `posts`, `event_attendees`) via `020_enable_realtime.sql`. This allows the frontend to subscribe to INSERT events and update the UI instantly — for example, new check-ins appear in the organizer's scanner dashboard without requiring a page refresh.

---

## 17. Module 11 — Search & Discovery

The search module (implemented in `src/actions/search.ts` and rendered at `src/app/(dashboard)/search/page.tsx`) provides a unified search interface across multiple entity types. Users can search for:

- **People:** By name, roll number, or department
- **Events:** By title or description
- **Clubs:** By name or category

Search results are categorized and displayed in a tabbed interface with rich preview cards showing relevant metadata for each result type.

---

## 18. Module 12 — User Profiles & Portfolios

### 18.1 Profile System

Every user has a comprehensive profile page displaying their identity, academic information, gamification statistics, and social activity. Profile fields include: full name, roll number, avatar, banner image, department, course, semester, year, bio, skills array, phone number, and email.

The profile page renders:
- A hero section with the user's banner, avatar, and basic info
- XP level progress bar with the current level and XP needed for the next level
- Badge collection grid
- Streak widgets
- Activity feed showing the user's recent posts

### 18.2 Rank Card

The profile features a dynamically generated "Rank Card" — a visually rich card displaying the user's avatar, name, roll number, XP, level, rank position on the leaderboard, and gamification tier. This card serves as a digital campus passport that users can share.

### 18.3 Portfolio Module

The portfolio module (`src/app/(dashboard)/portfolio/page.tsx` and `src/actions/portfolio.ts`) allows students to curate a professional portfolio showcasing their projects, achievements, certifications, and skills — ideal for sharing with potential employers or graduate programs.

### 18.4 Certificate Repository

Users can manage their certificates through a dedicated tab on their profile. This includes manually uploaded external certificates from platforms like Google, AWS, Coursera, Udemy, and others. Each certificate record includes the title, issuer, platform, credential URL, credential ID, issue date, and verification status. Certificates are stored in the `certificates_external` table.

The verification workflow supports three states: pending (awaiting admin review), verified (approved), and rejected (with a reason). Administrators review pending certificates through the admin panel.

### 18.5 AI-Powered Skill Extraction

Certificates can be analyzed by an AI engine that extracts relevant skills and proficiency levels. Extracted skills are stored in the `certificate_skills` table and displayed as tags on the certificate cards. This automated skill extraction populates the user's skill profile without manual data entry.

---

## 19. Module 13 — Administrative Control Panel

### 19.1 Overview

The admin panel provides comprehensive institutional control through several sub-modules:

### 19.2 Academic Management

Administrators can:
- Create and manage departments with unique codes
- Create subjects within departments
- Assign faculty to subjects
- Create student batches and bulk-enroll students into subjects
- Build weekly timetables
- Generate batch-level attendance reports as CSV downloads

### 19.3 Reward Store Management

Full CRUD operations on the reward catalog. Administrators set prices, manage stock, upload images, and process student redemption requests (approve/reject/fulfill).

### 19.4 User Management

Administrators can view all user profiles, update roles, and moderate content. The `has_role('admin')` function gates all administrative operations at the database level.

### 19.5 Event Banners

The admin panel includes a banner management system for promoting events on the dashboard. Banners can be created with images, links, and display priorities.

---

## 20. Storage & Media Management

CampusOS uses seven Supabase Storage buckets, each with specific RLS policies:

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile pictures | Public read, owner write |
| `posts` | Social feed images | Public read, authenticated write |
| `clubs` | Club logos and banners | Public read, authenticated write |
| `events` | Event banners and report photos | Public read, authenticated write |
| `certificates` | Certificate images | Public read, owner write |
| `feed-media` | Additional feed media | Public read, authenticated write |

All images are served via Supabase's CDN-backed public URLs, ensuring fast global delivery. Upload policies use folder-based ownership: users can only upload to folders matching their UUID, preventing unauthorized file modifications.

---

## 21. Security Architecture

### 21.1 Defense-in-Depth

CampusOS implements security at three layers:

1. **Application Layer:** Server Actions authenticate every request using `supabase.auth.getUser()` and validate roles before performing operations.
2. **Database Layer:** RLS policies on every table enforce access control at the PostgreSQL level, acting as a second line of defense.
3. **Storage Layer:** Storage bucket policies prevent unauthorized file uploads, modifications, and deletions.

### 21.2 Data Validation

- **CHECK Constraints:** Prevent invalid enum values at the database level.
- **UNIQUE Constraints:** Prevent duplicate relationships.
- **Foreign Key Constraints:** Prevent orphaned records.
- **TypeScript Types:** Prevent type mismatches at compile time.

### 21.3 Audit Trail

The `audit_logs` table records administrative actions with the user ID, action description, and JSONB details. Only admins can read audit logs, providing accountability for sensitive operations.

---

## 22. UI/UX Design System & Component Architecture

### 22.1 Design Philosophy

CampusOS was designed with the conviction that a college management platform must not feel like an enterprise tool. Students are accustomed to consumer-grade applications like Instagram, Discord, and Notion — and CampusOS meets them at that level of visual polish and interaction quality. The design system is built around a set of core principles that inform every pixel on the screen.

The color palette avoids generic primary colors in favor of carefully curated HSL-based tokens. The dark mode (which is the default) uses a deep charcoal background (`hsl(222, 47%, 11%)`) with subtle card surfaces, muted borders, and accent colors drawn from a blue-to-purple gradient spectrum. Text follows a strict hierarchy: foreground for primary content, muted-foreground for secondary content, and accent colors reserved exclusively for interactive elements and status indicators.

Typography uses the Inter font family loaded from Google Fonts, providing excellent readability at all sizes from 10px caption text to 36px hero headings. Font weights are carefully controlled — regular (400) for body text, medium (500) for labels, semibold (600) for sub-headings, bold (700) for section titles, and black (900) for hero-level metrics and leaderboard numbers.

### 22.2 Responsive Layout System

The dashboard layout is structured as a sidebar-content architecture. On desktop viewports (>= 1024px), the sidebar is a fixed 280px-wide panel on the left containing the CampusOS logo, navigation links with icons, and the user's profile avatar at the bottom. The main content area fills the remaining width with appropriate padding.

On tablet viewports (768px-1023px), the sidebar collapses to an icon-only mode (64px wide) to maximize content space. On mobile viewports (< 768px), the sidebar is hidden entirely and replaced with a hamburger menu that slides in from the left as an overlay. All page layouts use CSS Grid and Flexbox to reflow content gracefully across breakpoints.

### 22.3 Sidebar Navigation

The sidebar (`src/components/layout/sidebar.tsx`) renders navigation links dynamically based on the user's role. The navigation structure varies significantly between roles:

**Student Navigation:**
- Dashboard (home)
- Social Feed
- Events
- Clubs
- Academics
- Leaderboard
- Campus AI
- Placement Hub
- Wallet
- Portfolio
- Profile
- Settings

**Faculty Navigation:**
- Dashboard
- Academic Management
- Profile
- Settings

**Admin Navigation:**
- Dashboard
- Admin Panel
- Academic Management
- Events
- Clubs
- Wallet Management
- Profile
- Settings

Each navigation item displays an icon from Lucide React, a label, and optionally a notification badge (e.g., unread count on the notifications item). The active route is highlighted with a gradient accent background and white text.

### 22.4 Component Library

CampusOS maintains a set of reusable UI primitives in `src/components/ui/`:

- **Modal:** A centered overlay dialog with backdrop blur, close button, and title. Used for post creation, certificate upload, event registration, and dozens of other interactions.
- **Skeleton Loaders:** Animated placeholder blocks that match the exact dimensions of the content they replace, providing smooth perceived loading performance.
- **Button Variants:** Primary (gradient blue-to-purple), secondary (muted background), danger (red), ghost (transparent), and icon-only buttons with consistent hover, active, and disabled states.
- **Input Fields:** Styled text inputs, textareas, selects, and file uploaders with consistent border radius (12px), focus ring (blue-500/50), and placeholder text styling.
- **Cards:** Content containers with rounded corners (16px-24px), subtle borders, and optional hover shadows for interactive cards.
- **Badges:** Small inline indicators for statuses (Verified, Pending, Rejected), roles (Admin, Faculty, Student), and categories.

### 22.5 Micro-Animations

The platform uses Framer Motion for component-level animations that enhance the feeling of responsiveness and polish:

- **Page Transitions:** Content fades in with a subtle upward slide (y: 20 → 0) as pages load.
- **Staggered Lists:** Items in grids and lists animate in sequentially with a 30ms delay between each item, creating a pleasing cascade effect.
- **Hover Interactions:** Cards lift slightly on hover with a shadow intensification. Buttons have subtle scale transforms (0.95 on press, 1.0 on release).
- **Modal Entry:** Modals fade in with a scale transform (0.95 → 1.0) and the backdrop blurs in simultaneously.
- **Toast Notifications:** Sonner toasts slide in from the top-right corner with a spring-physics animation.

### 22.6 Dark Mode Implementation

The dark mode system uses CSS custom properties (HSL-based) defined in `globals.css`. Two sets of tokens are defined — one for light mode and one for dark mode — and the active set is determined by a `class` attribute on the `<html>` element, controlled by `next-themes`.

Key design tokens include:
- `--background`: The page background color
- `--foreground`: Primary text color
- `--card`: Card surface color
- `--muted`: Subtle background for inactive elements
- `--muted-foreground`: Secondary text color
- `--border`: Border color
- `--accent`: Primary accent color for interactive elements

This token-based approach ensures that every component automatically adapts to the active theme without any component-level conditional logic.

---

## 23. Landing Page & Onboarding

### 23.1 Landing Page Design

The public-facing landing page (`src/app/page.tsx`) is the first touchpoint for prospective users. It is designed to communicate the platform's value proposition within seconds and convert visitors into authenticated users.

The hero section features a full-width gradient background with a large headline, a supporting subheadline, and a prominent "Get Started" call-to-action button that redirects to the authentication flow. Below the hero, feature showcase sections use a combination of large icons, concise descriptions, and mock-up screenshots to highlight the platform's key modules.

The landing page includes dedicated sections for:
- **For Students:** Highlighting the social feed, gamification, events, and career tools.
- **For Faculty:** Highlighting attendance management, assignment workflows, and resource sharing.
- **For Administration:** Highlighting institutional control, analytics, and economy management.

A hero mockup component (`src/components/landing/hero-mockup.tsx`) renders an animated preview of the dashboard interface, giving visitors a tangible sense of what the platform looks like before they sign up.

### 23.2 Authentication Flow

The authentication page provides a clean, centered login card with the CampusOS logo and a "Sign in with Google" button. The Google OAuth flow is handled entirely by Supabase Auth, which manages the redirect, token exchange, and session creation. Upon successful authentication, the callback route at `/auth/callback` processes the OAuth response and redirects the user to the dashboard.

### 23.3 Profile Completion

New users are encouraged to complete their profile by filling in their department, course, semester, year, phone number, and bio. A "Profile Pro" badge (worth 40 XP) is awarded upon completion, providing immediate gamification incentive. The profile page also allows users to upload a custom avatar (cropped and uploaded to the `avatars` storage bucket) and a banner image.

---

## 24. Settings & Personalization

### 24.1 Settings Page

The settings page (`src/app/(dashboard)/settings/page.tsx`) provides comprehensive account customization options organized into tabbed sections:

- **Profile Settings:** Edit personal information including full name, roll number, department, course, semester, year, bio, phone number, and skills. Changes are persisted via the `updateProfile()` Server Action.
- **Appearance Settings:** Toggle between Light, Dark, and System theme modes. The selected preference is persisted in localStorage and applied instantly without a page reload.
- **Notification Preferences:** Configure which types of notifications trigger in-app alerts and push notifications. Users can enable or disable notifications for events, clubs, academics, and social interactions independently.
- **Privacy Settings:** Control profile visibility options and data sharing preferences.

### 24.2 Avatar & Banner Upload

The settings page includes a drag-and-drop image upload interface for avatar and banner images. Uploaded files are processed client-side to generate a preview, then uploaded to the appropriate Supabase Storage bucket. The public URL is saved to the user's profile record. Storage policies ensure that users can only modify files within their own UUID-namespaced folder, preventing unauthorized modifications to other users' assets.

---

## 25. Database Trigger Architecture — Detailed Analysis

### 25.1 Automated Counter Maintenance

CampusOS relies heavily on PostgreSQL triggers to maintain denormalized counters that would otherwise require expensive COUNT() queries. The following triggers fire automatically on every relevant INSERT or DELETE operation:

**Post Like Counter (`on_post_like_change`):** When a row is inserted into `post_likes`, the trigger increments `like_count` on the parent post. When a row is deleted, it decrements the count. This is implemented as a `SECURITY DEFINER` function that bypasses RLS to ensure the count update always succeeds regardless of the calling user's permissions.

**Post Comment Counter (`on_post_comment_change`):** Identical logic applied to `comment_count` on the `posts` table, triggered by inserts and deletes on `post_comments`.

**Club Member Counter (`on_club_member_change`):** Maintains `member_count` on the `clubs` table as members join and leave. This counter is displayed prominently on club profile pages and the club discovery grid.

**Event Registration Counter (`on_event_registration_change`):** Maintains `registered_count` on the `events` table. This counter is critical for capacity management — the application layer checks this value before allowing new registrations to ensure the event hasn't reached its `max_attendees` limit.

### 25.2 XP Automation Triggers

Three triggers automate XP distribution without requiring application-layer intervention:

**Post Creation XP (`on_post_award_xp`):** Awards +10 XP to the post author immediately upon post creation. The trigger inserts a row into `xp_transactions` for audit trail purposes and updates the user's `xp_points` directly on the `profiles` table.

**Like Reception XP (`on_like_award_xp`):** Awards +5 XP to the post author when their post receives a like. Crucially, this trigger includes a self-like guard — if the liker is the same user as the post author, no XP is awarded. This prevents a trivial XP farming exploit.

**Event Check-In XP and CC (`on_event_checkin_award`):** Awards +20 XP and +5 Campus Coins simultaneously when a student checks into an event. This dual-reward trigger demonstrates the integration between the gamification and economy systems — a single real-world action (scanning a QR code) ripples through multiple subsystems automatically.

### 25.3 Profile Auto-Creation

The `on_auth_user_created` trigger fires when a new row appears in Supabase's `auth.users` table (i.e., when a user signs up or logs in for the first time via OAuth). It extracts the user's name and avatar URL from the OAuth metadata and creates a corresponding `profiles` row. A second trigger (`on_profile_created_wallet`) then creates a `wallets` row for the new profile with a zero balance. This two-trigger chain ensures that every authenticated user has both a profile and a wallet from the moment they first log in.

### 25.4 Trigger Error Handling

All triggers are defined as `SECURITY DEFINER` functions, meaning they execute with the permissions of the function creator (typically the database owner) rather than the calling user. This ensures that triggers can update tables that the triggering user might not have direct write access to (e.g., a student's like should update the author's XP, even though the student doesn't have UPDATE permission on the `profiles` table).

Error handling within triggers uses PostgreSQL's `EXCEPTION` blocks where necessary, and `ON CONFLICT DO NOTHING` clauses for idempotent operations. This prevents trigger failures from cascading and rolling back the original user action.

---

## 26. Error Handling & User Feedback

### 26.1 Server Action Error Pattern

Every Server Action in CampusOS follows a consistent error handling pattern:

1. **Authentication Check:** The action calls `supabase.auth.getUser()` and returns `{ error: 'Not authenticated' }` if no user session exists.
2. **Authorization Check:** For role-gated operations, the action queries the user's profile to verify their role and returns `{ error: 'Unauthorized' }` if the role check fails.
3. **Database Operation:** The action performs the primary database operation within a try-catch block.
4. **Error Response:** If the database operation fails, the error message is extracted from the Supabase error object and returned to the client.
5. **Success Response:** On success, the action returns the created/updated data to the client.

This pattern ensures that the client always receives a predictable response shape and can display appropriate toast messages via Sonner.

### 26.2 Client-Side Error Handling

On the frontend, every Server Action call is wrapped in an async function with toast feedback:

```
toast.info('Processing...')
const result = await someAction(params)
if (result.error) {
  toast.error(result.error)
} else {
  toast.success('Operation successful!')
  // Update local state
}
```

This ensures that users always receive immediate, visible feedback for every action they take — whether it succeeds or fails.

### 26.3 Constraint Violation Handling

PostgreSQL constraint violations (e.g., unique constraint violations when a user tries to register for an event twice) are detected by checking the error code. For example, error code `23505` indicates a unique violation and is translated into a user-friendly message like "You are already registered for this event" rather than exposing raw database error text.

---

## 27. Performance Optimization

### 27.1 Database Indexing Strategy

CampusOS defines over 30 database indexes across its tables, strategically placed on columns that appear in WHERE clauses, JOIN conditions, and ORDER BY expressions. Key indexes include:

- `idx_posts_created` (DESC) — Powers the reverse-chronological feed
- `idx_profiles_xp` (DESC) — Powers the leaderboard
- `idx_events_start` — Powers event discovery sorted by upcoming date
- `idx_event_registrations_event` — Powers efficient attendee lookups
- `idx_attendance_records` — Composite for subject-student-date lookups

### 27.2 Denormalized Counters

As described in the trigger architecture section, CampusOS denormalizes frequently accessed count values (like_count, comment_count, member_count, registered_count) directly onto their parent tables. This eliminates the need for COUNT(*) subqueries in list views, reducing the computational cost of rendering feeds, event lists, and club directories from O(n) per item to O(1).

### 27.3 Server-Side Rendering

By leveraging Next.js 14's Server Components, the majority of CampusOS pages render entirely on the server. This means that the HTML sent to the browser contains pre-rendered content with zero JavaScript overhead for static elements. Only interactive widgets (search inputs, infinite scroll handlers, modal triggers) are hydrated as Client Components.

### 27.4 Image Optimization

All images served through Supabase Storage benefit from CDN caching. The platform uses responsive image sizing via CSS `object-fit: cover` and `aspect-ratio` properties to ensure images display correctly across all viewport sizes without layout shifts.

---

## 28. Scalability Considerations

### 28.1 Horizontal Database Scaling

Supabase's managed PostgreSQL instance supports connection pooling via PgBouncer, which allows hundreds of concurrent connections from the Next.js serverless functions without exhausting database connection limits. The schema is designed to avoid long-running transactions and uses indexes to keep query execution times under 10ms for common operations.

### 28.2 Storage Scaling

Supabase Storage is backed by S3-compatible object storage with virtually unlimited capacity. File uploads are streamed directly from the client to storage, bypassing the application server's memory. CDN-backed public URLs ensure that image delivery scales globally without any additional infrastructure.

### 28.3 Real-Time Scaling

Supabase's real-time engine (built on Elixir/Phoenix) is designed for high-concurrency WebSocket connections. CampusOS limits real-time subscriptions to specific, high-value tables (notifications, posts, event_attendees) to minimize the broadcast volume and ensure that the real-time layer remains responsive even under heavy load.

### 28.4 Codebase Modularity

The Server Action architecture — with 25 independent modules — ensures that the codebase scales organizationally as new features are added. Each module is self-contained, with its own authentication logic, database queries, and error handling. New modules can be added without modifying existing code.

---

## 29. Deployment & DevOps

### 29.1 Development Workflow

The development server runs via `npm run dev`, leveraging Next.js's fast refresh for instant code changes. The project uses ESLint for code quality and TypeScript's strict mode for type safety. Hot Module Replacement (HMR) ensures that developers see changes reflected in the browser within milliseconds of saving a file.

### 29.2 Database Migrations

All schema changes are managed through numbered SQL migration files in `supabase/migrations/`. The 45 migration files represent the complete evolutionary history of the database schema, from the initial tables (`001_initial_schema.sql`) through gamification (`003_gamification_engine.sql`), academics (`006_academic_infrastructure.sql`), wallet redesign (`032_wallet_redesign.sql`), alumni networks (`037_alumni_network.sql`), placement hub (`038_placement_hub.sql`), and beyond.

Migrations are applied sequentially using the Supabase CLI (`supabase db push`). Each migration is idempotent — using `CREATE TABLE IF NOT EXISTS`, `DO $$ ... $$` blocks for constraint modifications, and `ON CONFLICT DO NOTHING` for seed data — to prevent errors on re-runs. This approach ensures that the schema can be reliably reproduced from scratch on any new database instance.

### 29.3 Environment Configuration

Environment variables are managed through `.env.local` for local development and platform-specific environment variable stores for production. The key variables include:

- `NEXT_PUBLIC_SUPABASE_URL`: The Supabase project URL for client-side API calls.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The Supabase anonymous key for unauthenticated requests (subject to RLS).
- `SUPABASE_SERVICE_ROLE_KEY`: The Supabase service role key for server-side administrative operations.
- `GOOGLE_GENERATIVE_AI_API_KEY`: The Google AI API key for AI-powered features.

The Supabase client is instantiated through helper functions in `src/lib/supabase/` that handle both server-side contexts (using the service role key) and client-side contexts (using the anonymous key). This dual-client pattern ensures that Server Actions have full database access while client-side code is properly sandboxed by RLS.

### 29.4 Version Control

The project uses Git for version control with a conventional commit message format. The `.gitignore` file excludes `node_modules/`, `.env.local`, `.next/`, and other build artifacts. The migration files are version-controlled to ensure that database schema changes are tracked alongside application code changes.

---

## 30. Conclusion

CampusOS represents a comprehensive, verbose, and ambitious reimagining of the digital infrastructure that powers higher education. In an era where students expect the responsiveness of consumer applications, the visual polish of social media, and the depth of enterprise systems, CampusOS delivers on all three fronts through a carefully architected fusion of modern web technologies.

The platform's technical foundation — Next.js 14 with the App Router, React 18 with concurrent features, TypeScript with strict typing, Tailwind CSS with HSL-based design tokens, Supabase as a complete Backend-as-a-Service, and PostgreSQL as a robust relational database engine — was selected not for novelty but for the specific advantages each technology brings to a real-time, multi-role, data-intensive application.

The twelve primary modules — Social Feed, Events Management, Club Ecosystem, Academic Infrastructure, Gamification Engine, Campus Wallet and Reward Store, Alumni Network, Placement Hub, Notifications, Search, User Profiles, and Administration — collectively address every operational need of a modern educational institution. These modules are not isolated features bolted onto a shared login system; they are deeply integrated subsystems that share data, trigger automated workflows, and create emergent value through their interactions. A student who checks into an event automatically earns XP and Campus Coins, which appear on their wallet, influence their leaderboard ranking, contribute to badge progress, and reflect on their dynamic profile card. This interconnectedness is what transforms CampusOS from a collection of tools into a genuine ecosystem.

The security architecture — defense-in-depth through application-layer authentication, database-layer Row Level Security, and storage-layer access policies — ensures that data integrity and privacy are maintained even in the face of application bugs. The gamification triggers — automated XP awards, coin distributions, and counter updates — eliminate manual bookkeeping and ensure that the economy runs accurately at scale. The real-time infrastructure — Supabase's WebSocket-based change notifications — keeps the platform feeling alive and responsive, with new events, notifications, and social interactions appearing instantly across all connected clients.

With over 60 database tables secured by Row Level Security, 25 Server Action modules containing the entirety of the business logic, 45 migration files documenting the complete schema evolution, 7 storage buckets organized by domain, 30+ database indexes optimized for the most common query patterns, 10 seeded achievement badges, 6 user roles with distinct permission sets, and hundreds of React components organized across 11 feature directories, CampusOS is a production-grade system of considerable depth and sophistication. This document has provided a verbose, exhaustive, and definitive account of every module, every table, every trigger, every policy, every design token, and every architectural decision that constitutes the foundational CampusOS platform.

---

*End of Document*

