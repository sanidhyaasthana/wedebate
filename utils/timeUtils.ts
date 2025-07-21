// Utility functions for handling time in debates

// Format seconds into MM:SS format
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Calculate total debate duration from a debate format structure
export function calculateTotalDuration(structure: Array<{ name: string; duration: number }>): number {
  return structure.reduce((total, segment) => total + segment.duration, 0);
}

// Format total seconds as human-readable duration (e.g., "5 minutes 30 seconds")
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  let result = '';
  
  if (minutes > 0) {
    result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  if (remainingSeconds > 0) {
    if (result.length > 0) result += ' ';
    result += `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  return result || '0 seconds';
}

// Get a color based on remaining time percentage
export function getTimeColor(remainingSeconds: number, totalSeconds: number): string {
  const percentage = (remainingSeconds / totalSeconds) * 100;
  
  if (percentage > 50) return 'text-green-500'; // Plenty of time
  if (percentage > 25) return 'text-yellow-500'; // Getting low
  return 'text-red-500'; // Running out of time
}

// Calculate progress percentage for progress bars
export function calculateProgress(elapsedSeconds: number, totalSeconds: number): number {
  return Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));
}