# Elegant Notes 📝

A premium, sleek, and high-performance note-taking application designed for speed, security, and effortless organization. **Elegant Notes** allows you to capture your thoughts locally with lightning-fast performance and sync them to the cloud for accessibility across all your devices.

![Elegant Notes Preview](/public/favicon.png)

## ✨ Features

- **🚀 Infinite Scaling**: Optimized to handle 10,000+ notes using server-side pagination and infinite scrolling.
- **✍️ Premium Rich Text**: Powered by Tiptap for a high-end editing experience supporting Headings (H1/H2), Bulleted/Numbered Lists, Bold, Italic, and Code Blocks.
- **☁️ Cloud Sync & Real-time**: Built with Supabase for instant synchronization and live updates across multiple devices.
- **📶 Offline First (PWA)**: Full Progressive Web App support using Service Workers. Take notes even without an internet connection; changes sync automatically when you're back online.
- **🌐 Professional Sharing**: Generate beautiful, read-only public links for your notes with optimized reading layouts and SEO metadata.
- **🔐 Secure Authentication**: Integrated with Supabase Auth for secure user profiles and protected note storage.
- **🎨 Modern Aesthetic**: Minimalist design featuring glassmorphism, smooth Framer Motion transitions, and a curated 24-color professional note palette.
- **📌 Organization Tools**: Fast tagging system, pinning, archiving, and advanced server-side search.
- **📱 Responsive by Design**: Seamless experience across mobile sidebar navigation and large-screen multi-column layouts.

## 🛠️ Tech Stack

- **Core**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Real-time)
- **Rich Text**: [Tiptap Editor](https://tiptap.dev/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) with Persistence
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **PWA**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) project

### Installation

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd elegant-notes
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Initialize Database**:
   Run your SQL schema in the Supabase SQL Editor to create the `notes` table with `public_slug` and `is_public` columns.

5. **Start Development**:
   ```sh
   npm run dev
   ```

## 📦 Deployment

### Vercel Deployment

1. Push your code to a GitHub repository.
2. Connect the repo to **Vercel**.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Environment Variables.
4. Deployment settings are pre-configured in `vercel.json` for SPA routing.

## 📄 License

Distributed under the MIT License.

---

*Made with ❤️ for thinkers and creators.*
