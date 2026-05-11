# Nexus Chat

A Slack-like messaging and calling application built with React, TypeScript, Tailwind CSS, and Supabase. Features real-time text chat (1-on-1 and group conversations), media/file sharing, voice and video calling via WebRTC, with email and Google OAuth authentication.

## Features

| Feature | Description |
|---------|-------------|
| **Real-time Messaging** | Instant text messaging with Supabase Realtime subscriptions |
| **Channels** | Public and private channels for team communication |
| **Direct Messages** | 1-on-1 private conversations |
| **Group Chats** | Multi-person group conversations |
| **File Sharing** | Upload and share images, documents, and files (up to 10MB) |
| **Voice Calls** | Peer-to-peer voice calling via WebRTC |
| **Video Calls** | Peer-to-peer video calling via WebRTC |
| **Authentication** | Email/password and Google OAuth via Supabase Auth |
| **User Presence** | Online, away, DND, and offline status indicators |
| **Search** | Command palette (CMD+K) for searching channels and messages |
| **Message Actions** | Edit, delete, and reply to messages |
| **Demo Mode** | Full demo experience without Supabase configuration |

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Vite | Build tool |
| Supabase | Database, Auth, Realtime, Storage |
| WebRTC | Voice and video calling |
| Framer Motion | Animations |
| Zustand | State management |
| shadcn/ui | UI components |

## Quick Start

### Prerequisites

You will need Node.js 18+ and pnpm installed on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/nexus-chat.git
cd nexus-chat
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Supabase

Create a new project at [supabase.com](https://supabase.com) and then run the database schema.

Navigate to your Supabase project's SQL Editor and run the contents of `supabase/schema.sql`. This creates all necessary tables, Row Level Security policies, storage buckets, and seed data.

### 4. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project dashboard under Settings > API.

### 5. Configure Google OAuth (Optional)

To enable Google sign-in, go to your Supabase Dashboard, navigate to Auth > Providers > Google, and configure it with your Google OAuth credentials. The redirect URL should be set to your Supabase project's auth callback URL.

### 6. Run the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### 7. Demo Mode

If you skip the Supabase configuration, the app runs in demo mode with mock data. Click "Try Demo Mode" on the login page to explore all features without a backend.

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create nexus-chat --private --push --source=.
```

### 2. Import to Vercel

Go to [vercel.com](https://vercel.com), click "New Project", and import your GitHub repository. The `vercel.json` configuration is already included.

### 3. Set Environment Variables

In your Vercel project settings, add the following environment variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### 4. Deploy

Vercel will automatically build and deploy your app. Any push to the main branch triggers a new deployment.

## Project Structure

```
nexus-chat/
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ChannelHeader.tsx
│   │   │   ├── MembersPanel.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageComposer.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── SearchDialog.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   └── VideoCallModal.tsx
│   │   ├── contexts/       # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ChatContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/          # Custom hooks
│   │   │   └── useNotifications.ts
│   │   ├── lib/            # Utilities
│   │   │   ├── mockData.ts
│   │   │   ├── supabase.ts
│   │   │   ├── types.ts
│   │   │   ├── utils.ts
│   │   │   └── webrtc.ts
│   │   ├── pages/          # Page components
│   │   │   ├── Chat.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── index.html
├── supabase/
│   └── schema.sql          # Database schema
├── vercel.json             # Vercel deployment config
└── package.json
```

## Supabase Database Schema

The schema includes the following tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (auto-created on signup) |
| `channels` | Chat channels (public, private, DM, group) |
| `channel_members` | Channel membership and roles |
| `messages` | Chat messages with file attachments |
| `reactions` | Message reactions (emoji) |

Row Level Security (RLS) is enabled on all tables to ensure data privacy and access control.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open search / command palette |
| `Enter` | Send message |
| `Shift+Enter` | New line in message |
| `Escape` | Close dialogs |

## License

MIT
