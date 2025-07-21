# WeDebate - AI-Powered Debate Platform

WeDebate is a web application that helps users improve their debate skills through structured debates with real-time feedback powered by AI. The platform allows users to engage in debates with others, practice solo, and receive detailed analysis of their performance.

## Features

- **User Authentication**: Sign up and log in with email or Google OAuth via Supabase Auth
- **Create/Join Debates**: Start debate rooms with customizable topics and formats
- **Real-Time Debate Interface**: Text editor with optional speech-to-text for arguments
- **AI Feedback**: Get detailed analysis on clarity, logic, and persuasiveness after debates
- **Topic Generator**: Access curated debate topics or practice with AI-generated ones
- **User Dashboard**: Track debate history and performance metrics
- **Solo Practice Mode**: Practice debate skills with AI-generated responses

## Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript and Tailwind CSS
- **Authentication & Database**: Supabase (Auth, Database, Real-time subscriptions)
- **AI Integration**: OpenRouter API (using open-source models like Mistral or LLaMA3)
- **Speech Recognition**: Web Speech API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier available)
- OpenRouter API key (free tier available)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/wedebate.git
cd wedebate
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables

```bash
cp env.local.example .env.local
```

Edit `.env.local` and add your Supabase and OpenRouter API keys.

4. Set up Supabase

- Create a new Supabase project
- Run the database schema setup (SQL scripts provided in `/supabase/migrations`)
- Configure authentication providers (Email, Google)

5. Run the development server

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main tables in Supabase:

- **profiles**: User profile information
- **debates**: Debate room details (topic, format, participants, status)
- **debate_arguments**: Arguments submitted during debates
- **debate_feedback**: AI-generated feedback for debates
- **practice_sessions**: Solo practice session records
- **debate_topics**: Curated and AI-generated debate topics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

This project was bootstrapped with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
