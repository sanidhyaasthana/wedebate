import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Or try one of these pages:</p>
            <div className="mt-2 space-x-4">
              <Link href="/conference" className="text-blue-600 hover:text-blue-800">
                Conference
              </Link>
              <Link href="/practice" className="text-blue-600 hover:text-blue-800">
                Practice
              </Link>
              <Link href="/profile" className="text-blue-600 hover:text-blue-800">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}