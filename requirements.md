# REQUIREMENTS.md

## 📱 App Name: (To be decided)
> A cross-platform mobile app to help university students stay updated on school emails, apply for jobs easily, build resumes, track mental health, and trade event tickets.

---

## 1. 🔐 Authentication

### 1.1 Google Login
- Allow students to sign in using Google OAuth.
- Request permissions for Gmail API access.
- Verify `.edu` or school domain (optional).
- Store user profile info: name, email, profile picture, UID.

---

## 2. 📬 Email Reader + Gamification

### 2.1 Gmail Integration
- Pull user’s email using Gmail API.
- Only show **school-relevant** emails (filter based on keywords/domains).
- Cache emails for offline access.

### 2.2 Email Highlights
- AI-generated TL;DR summaries of each email.
- Tags: “Events,” “Jobs,” “Finance,” “Class,” etc.

### 2.3 Streak System
- Track daily email reading streaks.
- Reward XP for checking at least 1 school email per day.
- Visual calendar view for streaks.

### 2.4 Leaderboards
- Global & Friends leaderboard by:
  - Longest reading streak
  - Total emails read
  - XP earned

### 2.5 Notifications
- Smart push notifications for unread **important** emails.
- “New internship opportunity,” “Event tomorrow,” etc.

---

## 3. 💼 Job Swiping

### 3.1 Tinder-style Swiping UI
- Swipe right to apply, swipe left to skip.
- Job cards include title, company, pay, deadline, and logo.

### 3.2 Job Sources
- Curated internal job board
- Future integration with APIs (LinkedIn, Remotive, etc.)

### 3.3 AI Job Application Autofill
- Fill application forms using student profile.
- Match CV content to job description using GPT.
- Edit before final submission.

### 3.4 “My Applications” Tracker
- See jobs applied to, application status, and feedback.

---

## 4. 📄 Resume + Cover Letter Builder

### 4.1 AI Resume Generator
- Use profile info and career goal to generate resume sections.
- Choose from multiple templates.

### 4.2 Cover Letter Generator
- Upload job description → get a tailored cover letter draft.
- Option to manually tweak.

### 4.3 Export Options
- Download PDF and DOCX versions.
- Share to email or job platforms.

---

## 5. 🧠 Mental Health Hub

### 5.1 Mood Tracker
- Daily prompt: “How are you feeling?”
- Emoji-based scale or slider input.
- Streaks and analytics for mood trends.

### 5.2 Journaling Assistant (AI)
- Free-write journal with AI support.
- Prompts like “What stressed you today?” or “What are you grateful for?”
- GPT-4 summarizes or reflects positively.

### 5.3 Confessions Board (Anonymous)
- Students post thoughts anonymously.
- Posts are read-only or comment-only with reactions.
- Moderated using AI to filter hate, bullying, etc.

### 5.4 Mindful Moments / Daily Challenges
- “Drink water,” “Take 3 deep breaths,” “Send a compliment.”
- Completing gives XP or mood streak.

### 5.5 Resource Center
- University mental health contacts.
- Helplines, therapy services.
- Curated content: meditation videos, music, TED talks.

---

## 6. 🎟️ Ticket Resale Marketplace

### 6.1 Sell a Ticket
- Form: Event name, date, ticket price, upload QR or PDF.
- Option to mark “Urgent Sale.”

### 6.2 Browse Tickets
- Sorted by date, popularity, location.
- Filter: free events, concerts, uni events.

### 6.3 In-App Chat
- Secure messaging between buyer & seller.
- Track conversations and offers.

### 6.4 Payments (Future)
- Integrate payment (e.g., Flutterwave, Stripe).
- Simple escrow: money held until buyer confirms ticket works.

### 6.5 Buyer Confirmation
- Buyer marks ticket as received/working.
- Then seller is paid (if payments are integrated).

---

## 7. 👥 Social & User Features

### 7.1 Friends List
- Add friends using school email.
- Compete on reading streaks and wellness activities.

### 7.2 Profile Page
- Shows name, profile picture, streak count, mood stats, jobs applied.

### 7.3 Notifications
- Important emails
- Job match alerts
- Ticket activity
- Friend activity (optional)

---

## 8. 🧱 Admin & Backend Features

### 8.1 Admin Panel (Web App)
- Manage job postings, ticket listings, and flagged content.
- View analytics on email reads, app usage, and mood entries.

### 8.2 Database Models
- Users
- Emails (cached)
- Jobs
- Resumes
- Mood logs
- Tickets
- Messages
- Confessions

---

## 9. 📦 Tech Stack

| Layer          | Technology               |
|----------------|--------------------------|
| Frontend       | React Native + Expo      |
| Backend        |  API Routes              |
| DB             | supabase                 |
| Auth           | Google OAuth             |
| AI             | OpenAI API               |
| Notifications  | Expo Push Notifications  |
| Chat           | supabase                 |
| File Storage   | supabse                  |
| Payments       | Stripe / Flutterwave     |

---

## 10. 🛣️ Future Ideas

- Add calendar sync for events and deadlines.
- Verified badge for trusted ticket resellers.
- Partner with school career office to post jobs directly.
- Add polls and voting to the confessions board.

---

## ✅ MVP Priority Checklist

| Feature                           | Status      |
|----------------------------------|-------------|
| Gmail Login + Email Fetching     | [ ]         |
| Email Reading Gamification       | [ ]         |
| Job Swiping UI                   | [ ]         |
| Resume Builder (Basic)           | [ ]         |
| Mood Tracker                     | [ ]         |
| Ticket Resale Listing + Chat     | [ ]         |
| Anonymous Confessions            | [ ]         |

---

