# WeDebate Video Conference System

A production-ready video conferencing feature built with LiveKit and Next.js, designed for scalable real-time communication.

## 🚀 Features

### Core Video Conferencing
- **HD Video & Audio**: High-quality video streaming with adaptive bitrate
- **Screen Sharing**: Share your screen with other participants
- **Real-time Chat**: Text messaging with typing indicators and moderation
- **Auto Reconnect**: Automatic reconnection with exponential backoff
- **Connection Quality**: Real-time connection status indicators

### Role-Based Access Control
- **Moderator**: Full control over the meeting, can mute participants, manage chat
- **Participant**: Can share video/audio, participate in chat
- **Audience**: View-only mode with chat access

### Production Features
- **Error Boundaries**: Graceful error handling with recovery options
- **Responsive Design**: Mobile-first design that scales to desktop
- **SEO Optimized**: Proper meta tags and SSR compatibility
- **Build Compatible**: Fully compatible with `npm run build` and deployment

## 📁 Project Structure

```
/app/conference/
├── page.tsx                    # Main conference page with join form
/components/conference/
├── JoinRoom.tsx               # Room joining component with validation
├── LiveKitRoomComponent.tsx   # Main room component
├── VideoTile.tsx              # Individual participant video display
├── Controls.tsx               # Media controls (mute/unmute, camera, etc.)
├── ChatComponent.tsx          # Real-time chat with moderation
└── ErrorBoundary.tsx          # Error handling component
/components/ui/
├── Input.tsx                  # Form input component
└── Button.tsx                 # Button component
/utils/
├── livekitClient.ts           # Enhanced LiveKit utilities
└── connectionManager.ts       # Auto-reconnect logic
/lib/
└── utils.ts                   # Utility functions
```

## 🛠️ Technical Implementation

### LiveKit Integration
- **Connection Management**: Singleton connection manager with auto-reconnect
- **Event Handling**: Comprehensive event listeners for all LiveKit events
- **Media Controls**: Camera, microphone, and screen sharing controls
- **Data Channels**: Real-time messaging using LiveKit's data channel

### State Management
- **React Hooks**: Custom hooks for media devices and participant management
- **Connection States**: Proper handling of connecting, connected, reconnecting states
- **Error Recovery**: Automatic retry with exponential backoff

### UI/UX Design
- **Tailwind CSS**: Modern, responsive design system
- **Loading States**: Skeleton screens and loading indicators
- **Accessibility**: ARIA labels and keyboard navigation support
- **Mobile Responsive**: Optimized for all screen sizes

## 🔧 Configuration

### Environment Variables
```env
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
NEXT_PUBLIC_LIVEKIT_HOST_URL=wss://your-livekit-server.livekit.cloud
```

### LiveKit Server Setup
The system uses the existing LiveKit configuration and token generation API at `/api/token`.

## 🚀 Usage

### Basic Usage
1. Navigate to `/conference`
2. Enter room name and your name
3. Select your role (Moderator/Participant/Audience)
4. Click "Join Room"

### Advanced Features
- **Room Creation**: Rooms are created automatically when you join
- **Invite Others**: Share the room name to invite participants
- **Chat Moderation**: Moderators can mute chat or clear messages
- **Device Selection**: Choose camera and microphone from available devices

## 🎯 Key Components

### JoinRoom Component
- Form validation with real-time error checking
- Random room name generation
- Role selection with descriptions
- Loading states during connection

### LiveKitRoomComponent
- Main room interface with video grid
- Connection state management
- Participant management
- Chat sidebar toggle

### VideoTile Component
- Individual participant video display
- Connection quality indicators
- Speaking indicators
- Mute/unmute status display

### Controls Component
- Media device controls
- Screen sharing toggle
- Device selection menu
- Leave room functionality

### ChatComponent
- Real-time messaging
- Typing indicators
- Message persistence
- Moderator controls

## 🔒 Security & Performance

### Security Features
- Token-based authentication with proper expiration
- Input validation and sanitization
- Role-based permissions
- Secure data transmission

### Performance Optimizations
- Adaptive video quality based on network conditions
- Lazy loading for better performance
- Efficient re-rendering with React optimization
- Memory leak prevention with proper cleanup

## 🌐 Deployment

### Build Process
```bash
npm run build
```

### Deployment Platforms
- **Vercel**: Optimized for Next.js deployment
- **Netlify**: Static site generation support
- **Docker**: Container-ready configuration
- **Custom Servers**: Node.js compatible

### Production Considerations
- Environment variable configuration
- LiveKit server scaling
- CDN integration for static assets
- Monitoring and logging setup

## 🐛 Error Handling

### Error Boundaries
- Component-level error catching
- Graceful fallback UI
- Error logging to external services
- Recovery mechanisms

### Connection Issues
- Automatic reconnection attempts
- Connection quality monitoring
- Fallback strategies
- User feedback and retry options

## 📱 Mobile Support

### Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Optimized video layouts
- Adaptive chat interface

### Mobile-Specific Features
- Device orientation handling
- Battery optimization
- Network-aware quality adjustment
- Background mode handling

## 🔮 Future Enhancements

### Planned Features
- Recording functionality
- Virtual backgrounds
- Breakout rooms
- Whiteboard integration
- Calendar integration
- Advanced analytics

### Scalability Improvements
- Load balancing
- Geographic distribution
- Advanced bandwidth management
- Enterprise features

## 📞 Support

For technical support or questions about the video conferencing system:
1. Check the error logs in the browser console
2. Verify LiveKit server connectivity
3. Ensure proper environment variable configuration
4. Review the component documentation above

## 🏗️ Architecture Decisions

### Why LiveKit?
- Production-ready WebRTC infrastructure
- Scalable server architecture
- Comprehensive client SDKs
- Active development and support

### Why Next.js?
- Server-side rendering capabilities
- API routes for token generation
- Optimized build process
- Excellent developer experience

### Component Architecture
- Modular, reusable components
- Clear separation of concerns
- Testable code structure
- Maintainable codebase