<!-- CREATED USING AI -->

# Legal Document Search Portal - Frontend

React-based web interface for searching and viewing legal documents. Provides an intuitive UI for interacting with the Legal Document Search API.

## Tech Stack

-   **React**: 18+ with TypeScript
-   **TypeScript**: Type-safe development
-   **Tailwind CSS**: Utility-first styling
-   **Vite** or **Create React App**: Build tool

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── SearchBar.tsx        # Search input with Load All button
│   │   ├── DocumentDisplay.tsx  # Document listing component
│   │   ├── DocumentModal.tsx    # Full document view modal
│   │   ├── ErrorMessage.tsx     # Error toast notifications
│   │   └── LoadingSpinner.tsx   # Loading indicator
│   ├── services/
│   │   └── api.ts               # API service layer
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── App.tsx                  # Main application component
│   ├── index.tsx                # Application entry point
│   └── index.css                # Global styles with Tailwind
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── Dockerfile
```

## Features

-   🔍 **Search Documents**: Keyword-based search with real-time results
-   📄 **View All Documents**: Load and display all available documents
-   👁️ **Full Document View**: Modal popup with complete document details
-   ⚡ **Loading States**: Visual feedback during API calls
-   ❌ **Error Handling**: User-friendly error messages with toast notifications
-   🎨 **Responsive Design**: Works on desktop, tablet, and mobile
-   🧹 **Clear Search**: Quick clear button in search input
-   📊 **Relevance Scores**: Visual indicators for search match quality
-   🖨️ **Print Support**: Print documents directly from modal

## Setup Instructions

### Option 1: Using Docker (Recommended)

```bash
# From project root
docker-compose up frontend
```

The application will be available at: http://localhost:5173

### Option 2: Manual Setup

#### Prerequisites

-   Node.js 18+ and npm
-   Backend API running on http://localhost:8001

#### Installation Steps

1. **Navigate to frontend directory**

```bash
   cd frontend
```

2. **Install dependencies**

```bash
   npm install
```

3. **Start development server**

```bash
   npm start
```

The application will open at http://localhost:3000

### Option 3: Quick Start Script

```bash
chmod +x run.sh
./run.sh
```

## Available Scripts

### `npm start`

Runs the app in development mode at http://localhost:3000

### `npm run build`

Builds the app for production to the `build` folder

### `npm test`

Launches the test runner in interactive watch mode

### `npm run lint`

Runs ESLint to check code quality

## Configuration

### API Base URL

The API base URL is configured in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8001/api';
```

For production, update this to your production API URL.

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8001/api
```

Then update `api.ts`:

```typescript
const API_BASE_URL =
    process.env.REACT_APP_API_URL || 'http://localhost:8001/api';
```

## Component Documentation

### SearchBar

-   Search input field with clear button
-   "Search" button (disabled when empty)
-   "Load All" button to fetch all documents
-   Loading state handling

### DocumentDisplay

-   Displays list of documents in card format
-   Shows document metadata (title, type, date, parties)
-   Preview of document content
-   "View Full Document" button on each card
-   Handles loading, empty, and error states

### DocumentModal

-   Full-screen modal overlay
-   Complete document information
-   Scrollable content area
-   Close and Print buttons
-   Click outside to close

### ErrorMessage

-   Toast notification for errors
-   Auto-dismissible
-   Manual close button

### LoadingSpinner

-   Animated loading indicator
-   Used during API calls

## API Integration

### Services Layer (`api.ts`)

```typescript
// Get all documents
getAllDocuments(): Promise<DocumentResult[]>

// Search documents
searchDocuments(query: string): Promise<SearchResponse>

// Get document by ID
getDocumentById(id: number): Promise<DocumentResult>
```

### Type Definitions

```typescript
interface DocumentResult {
    id: number;
    title: string;
    type: string;
    date: string;
    parties: string[];
    summary: string;
    content: string;
    relevance_score: number;
}

interface SearchResponse {
    success: boolean;
    query: string;
    total_found: number;
    results: DocumentResult[];
    processing_time: number;
}
```

## Styling

The application uses Tailwind CSS for styling:

-   Utility-first approach
-   Responsive design breakpoints
-   Custom gradient backgrounds
-   Hover and focus states
-   Smooth transitions

### Color Scheme

-   Primary: Blue (600-700)
-   Success: Green (600-700)
-   Warning: Yellow (600-800)
-   Background: Blue/Indigo gradient

## User Flow

1. **Initial Load**: Automatically fetches all documents
2. **Search**: User enters query → Shows filtered results
3. **View Document**: Click "View Full Document" → Modal opens
4. **Load All**: Click "Load All" → Resets to all documents
5. **Clear Search**: Click X in search box → Clears input

## Error Handling

The application handles various error scenarios:

-   Network errors
-   API errors (404, 500, etc.)
-   Empty results
-   Loading failures

Errors are displayed as toast notifications with descriptive messages.

## Browser Support

-   Chrome (latest)
-   Firefox (latest)
-   Safari (latest)
-   Edge (latest)

## Performance Optimizations

-   Component-level state management
-   Conditional rendering
-   Lazy loading for modal
-   Debounced search (if implemented)
-   Optimized re-renders with React.memo (if needed)

## Accessibility

-   Semantic HTML elements
-   ARIA labels on interactive elements
-   Keyboard navigation support
-   Focus management in modal
-   Color contrast compliance

## Development Guidelines

### Code Style

-   Use TypeScript for type safety
-   Follow React best practices
-   Use functional components with hooks
-   Keep components small and focused
-   Use meaningful variable names

### File Naming

-   Components: PascalCase (e.g., `SearchBar.tsx`)
-   Services: camelCase (e.g., `api.ts`)
-   Types: camelCase (e.g., `index.ts`)

## Troubleshooting

**API Connection Issues:**

-   Ensure backend is running on port 8001
-   Check CORS configuration in backend
-   Verify API_BASE_URL in `api.ts`

**Port Already in Use:**

```bash
# Change port
PORT=3001 npm start
```

**Build Errors:**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors:**

```bash
# Check TypeScript configuration
npx tsc --noEmit
```

## Production Build

```bash
# Build for production
npm run build

# Serve production build
npx serve -s build
```
