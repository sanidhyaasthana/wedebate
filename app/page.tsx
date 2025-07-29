import Link from 'next/link';
import Image from 'next/image';
import { sampleDebateTopics } from '@/utils/aiPrompts';

export default function Home() {
  // Randomly select 3 sample topics
  const randomTopics = [...sampleDebateTopics]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
        <div className="md:w-1/2">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Sharpen Your Debate Skills with AI-Powered Feedback
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            WeDebate helps you improve your argumentation, critical thinking, and persuasion skills through real-time debates and AI analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/conference" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition duration-200"
            >
              Start Debating
            </Link>
            <Link 
              href="/practice" 
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 font-bold py-3 px-6 rounded-lg text-center hover:bg-blue-50 dark:hover:bg-gray-700 transition duration-200"
            >
              Practice Solo
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md h-80">
            <Image 
              src="/debate-illustration.svg" 
              alt="Debate Illustration" 
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Debates</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Engage in structured debates with timed segments for opening statements, rebuttals, and conclusions.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Feedback</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Receive detailed analysis of your debate performance with scores for clarity, logic, and persuasiveness.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Topic Generator</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Access a variety of debate topics or practice with AI-generated topics on current events and timeless issues.
            </p>
          </div>
        </div>
      </section>

      {/* Sample Topics Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Sample Debate Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {randomTopics.map((topic, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <p className="text-lg font-medium mb-4">{topic}</p>
              <Link 
                href={`/debate?topic=${encodeURIComponent(topic)}`}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center"
              >
                Debate this topic
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link 
            href="/debate"
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center"
          >
            View all topics
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Account</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sign up with email or Google to get started.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Start or Join Debate</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create a new debate room or join an existing one.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Present Arguments</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Take turns presenting your arguments with timed segments.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">4</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get AI Feedback</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Receive detailed analysis and suggestions to improve.
            </p>
          </div>
        </div>
        <div className="text-center mt-12">
          <Link 
            href="/auth/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-center transition duration-200"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
