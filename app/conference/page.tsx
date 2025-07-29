import { Metadata } from 'next';
import ConferenceClient from './ConferenceClient';

export default function ConferencePage() {
  return <ConferenceClient />;
}

// SEO Metadata (for App Router)
export const metadata: Metadata = {
  title: 'Video Conference - WeDebate',
  description: 'Join or create video conference rooms with HD video, audio, screen sharing, and real-time chat. Powered by LiveKit.',
  keywords: ['video conference', 'online meeting', 'screen sharing', 'real-time chat', 'LiveKit'],
  authors: [{ name: 'WeDebate Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Video Conference - WeDebate',
    description: 'Professional video conferencing with HD video, audio, and real-time collaboration features.',
    type: 'website',
    siteName: 'WeDebate',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Conference - WeDebate',
    description: 'Professional video conferencing with HD video, audio, and real-time collaboration features.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};