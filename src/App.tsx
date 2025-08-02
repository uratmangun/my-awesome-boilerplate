import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom'
import { StagewiseToolbar } from '@stagewise/toolbar-react'
import ReactPlugin from '@stagewise-plugins/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AISearchPage } from '@/components/AISearchPage'
import { HomePage } from '@/components/HomePage'

function AISearchPageWrapper() {
  const navigate = useNavigate()
  const handleBack = () => navigate('/')

  return <AISearchPage onBack={handleBack} />
}

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <StagewiseToolbar
          config={{
            plugins: [ReactPlugin],
          }}
        />
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/aisearchpage" element={<AISearchPageWrapper />} />
        </Routes>
      </ThemeProvider>
    </Router>
  )
}

export default App
