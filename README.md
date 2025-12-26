# ChildTale - Personalized Coloring Book Creator 🎨

ChildTale is a magical application where imagination meets reality. We empower parents to weave personalized, tangible coloring books where their child is the hero of every page. By combining **advanced story engines**, **cloud technology**, and vivid creativity, we turn bedtime stories into cherished keepsakes.

## ✨ Features

- **Personalized Stories**: Create unique adventures featuring your child's name, age, gender, and description.
- **Two Magic Modes**:
    - **Standard Mode (Free)**: Quick, 5-page story creation.
    - **Deep Dive Mode (Premium)**: In-depth, 25-page adventure with "Meaningful Screentime" features.
- **Magical Illustrations**: High-quality, colorable line art created instantly to match your story.
- **Magic Studio**: A dedicated space to read, color, and manage your collection.
- **Library**: Persistent storage for all your creations.
- **Hardcover Printing**: Integration with Lulu for printing real physical books (in progress).
- **Secure Authentication**: Magic link and password login.

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Creative Engine**: Google Gemini Pro & Flash
- **Payments**: PayPal Integration
- **Printing**: Lulu Direct API

## 🛠️ Local Development Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Lilbrother254/childtale2.0-deployment.git
    cd childtale2.0-deployment
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory and add your credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 🌍 Deployment

This project is configured for deployment on **Vercel**.

1.  Connect your GitHub repository to Vercel.
2.  Add the same environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard.
3.  Deploy!

## 🔐 Security

- **Row Level Security (RLS)**: Enabled on all tables to ensure users only access their own data.
- **Edge Functions**: Sensitive operations (payment processing, book management) are handled securely on the server side.

---

<div align="center">
  <p>Made with ❤️ for children everywhere.</p>
</div>
