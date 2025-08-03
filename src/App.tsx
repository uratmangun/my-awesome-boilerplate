import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'

import { AISearchPage } from '@/components/AISearchPage'
import { HomePage } from '@/components/HomePage'
import { Toaster } from 'sonner'

// Import the publishable key from environment variables
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable')
}

function AISearchPageWrapper() {
  const navigate = useNavigate()
  const handleBack = () => navigate('/')

  return <AISearchPage onBack={handleBack} />
}

function App() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/aisearchpage" element={<AISearchPageWrapper />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </div>
      </Router>
    </ClerkProvider>
  )
}

export default App
