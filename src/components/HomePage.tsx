import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Github, Trash2, Copy } from 'lucide-react'
import { SignInButton, SignedIn, SignedOut, UserButton, useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/constants/api'

export function HomePage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const isAuthorizedUser = user?.username === 'uratmangun'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [githubRepo, setGithubRepo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [submissionError, setSubmissionError] = useState('')
  const [repositories, setRepositories] = useState([])
  const [isLoadingRepos, setIsLoadingRepos] = useState(true)
  const [repoError, setRepoError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)

  // Fetch repositories function
  const fetchRepositories = async () => {
    try {
      setIsLoadingRepos(true)
      setRepoError('')
      
      const response = await fetch(API_ENDPOINTS.LIST_ITEMS_BY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: window.location.hostname,
          limit: 50
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setRepositories(data.results?.items || [])
      } else {
        setRepoError('Failed to fetch repositories')
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
      setRepoError('Error loading repositories')
    } finally {
      setIsLoadingRepos(false)
    }
  }

  // Fetch repositories on component mount
  useEffect(() => {
    fetchRepositories()
  }, [])

  // Delete repository function
  const deleteRepository = async (repoId: string) => {
    try {
      // Get the session token for authentication
      const sessionToken = await getToken()
      if (!sessionToken) {
        console.error('No session token available')
        toast.error('Authentication required', {
          description: 'Please sign in to delete repositories.',
          duration: 3000,
        })
        return
      }

      const response = await fetch(API_ENDPOINTS.DELETE_ITEM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ id: repoId }),
      })
      
      if (response.ok) {
        // Remove the deleted repo from the local state
        setRepositories(repositories.filter((repo: Record<string, unknown>) => repo.id !== repoId))
        toast.success('Repository deleted successfully!', {
          duration: 3000,
        })
      } else {
        const errorData = await response.json() as Record<string, unknown>
        console.error('Failed to delete repository:', errorData)
        toast.error('Failed to delete repository', {
          description: (errorData.message as string) || 'Please try again.',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error deleting repository:', error)
      toast.error('Error deleting repository', {
        description: 'Please try again later.',
        duration: 3000,
      })
    }
  }

  // Search repositories function
  const searchRepositories = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, show all repositories
      setIsSearchMode(false)
      return
    }

    try {
      setIsSearching(true)
      
      // Get the session token for authentication
      const sessionToken = await getToken()
      if (!sessionToken) {
        toast.error('Authentication required', {
          description: 'Please sign in to search repositories.',
          duration: 3000,
        })
        setIsSearching(false)
        return
      }
      
      const response = await fetch(API_ENDPOINTS.SEARCH_ITEMS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
          searchType: 'combined'
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results?.items || [])
        setIsSearchMode(true)
      } else {
        console.error('Search failed:', response.statusText)
        toast.error('Search failed', {
          description: 'Please try again later.',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error searching repositories:', error)
      toast.error('Search error', {
        description: 'Please check your connection and try again.',
        duration: 3000,
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search and show all repositories
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearchMode(false)
  }

  // Create repository from template using GitHub CLI
  const createFromTemplate = async (repoName: string) => {
    const newRepoName = prompt('Enter name for your new repository:')
    if (!newRepoName) {
      return // User cancelled
    }

    try {
      // Use GitHub CLI to create repo from template
      const ghCommand = `gh repo create ${newRepoName} --template ${repoName} --public --clone`
      
      // Copy the command to clipboard for user to run
      await navigator.clipboard.writeText(ghCommand)
      
      toast.success('GitHub CLI command copied!', {
        description: `Run the copied command in your terminal to create "${newRepoName}" from this template.`,
        duration: 5000,
      })
      
      // Also show the command in console for reference
      console.log('GitHub CLI command:', ghCommand)
      
    } catch (error) {
      console.error('Failed to prepare GitHub CLI command:', error)
      toast.error('Failed to prepare command', {
        description: 'Please try again or use GitHub web interface.',
        duration: 4000,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-gray-100">
      {/* Top right sign-in button */}
      <div className="absolute top-4 right-4 z-10">
        <SignedOut>
          <SignInButton mode="modal">
            <Button size="lg">Sign In</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 text-gray-900 dark:text-gray-100">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Awesome Boilerplate
          </h1>
          <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-2xl mx-auto mb-10">
            A modern, flexible template for building amazing web applications
          </p>
          
          <div className="flex justify-center">
            <Button variant="outline" size="lg" asChild>
              <a 
                href="https://github.com/uratmangun/my-awesome-boilerplate" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </Button>
          </div>

          <div className="max-w-md mx-auto mt-8 flex gap-2 items-center">
            <Input 
              type="search" 
              placeholder="Search repositories..." 
              className="flex-1 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchRepositories()
                }
              }}
            />
            <Button 
              size="lg" 
              className="h-11"
              onClick={searchRepositories}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            {isSearchMode && (
              <Button 
                variant="outline" 
                size="lg" 
                className="h-11"
                onClick={clearSearch}
              >
                Clear
              </Button>
            )}
          </div>
          {isAuthorizedUser && (
            <div className="max-w-md mx-auto mt-4">
              <Button 
                variant="default" 
                size="lg" 
                className="w-full"
                onClick={() => setIsModalOpen(true)}
              >
                Add Project
              </Button>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto mb-16">
          {/* Clerk authentication components moved to header section */}
        </div>

        {/* Repository List Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
            {isSearchMode ? `Search Results (${searchResults.length})` : 'Added Repositories'}
          </h2>
          
          {isSearching ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Searching repositories...</p>
            </div>
          ) : isLoadingRepos && !isSearchMode ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading repositories...</p>
            </div>
          ) : repoError && !isSearchMode ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{repoError}</p>
            </div>
          ) : isSearchMode && searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No repositories found matching your search. Try different keywords!</p>
            </div>
          ) : !isSearchMode && repositories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No repositories added yet. Add your first repository above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(isSearchMode ? searchResults : repositories).map((repo: Record<string, unknown>) => (
                <Card key={repo.id} className="p-6 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-300">
                      <Github className="h-5 w-5" />
                      {repo.github_repository_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <CardDescription className="text-sm text-muted-foreground mb-3">
                      {repo.github_description || 'No description available'}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground">
                      <p>Added: {new Date(repo.createdAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 flex flex-col gap-2">
                    {/* Template Creation Section - Only show for template repositories */}
                    {repo.is_template && (
                      <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                              📋 Template Repository
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              Create a new repo based on this template
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createFromTemplate(repo.github_repository_name)}
                            className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
                            title="Create repository from template using GitHub CLI"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="flex-1"
                      >
                        <a 
                          href={`https://github.com/${repo.github_repository_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="h-4 w-4 mr-1" />
                          View Repo
                        </a>
                      </Button>
                      {repo.homepage_url && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="flex-1"
                        >
                          <a 
                            href={repo.homepage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🌐 Homepage
                          </a>
                        </Button>
                      )}
                    </div>
                    {isAuthorizedUser && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteRepository(repo.id)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Repository
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>


      </div>
      
      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add GitHub Project</h2>
            {submissionMessage && (
              <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md">
                {submissionMessage}
              </div>
            )}
            {submissionError && (
              <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md">
                {submissionError}
              </div>
            )}
            <Input 
              type="text" 
              placeholder="https://github.com/username/repo" 
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  // Submit the GitHub repo URL to the backend
                  setIsSubmitting(true)
                  setSubmissionMessage('')
                  setSubmissionError('')
                  
                  try {
                    // Temporarily remove auth for CORS testing
                    const sessionToken = await getToken()
                    if (!sessionToken) {
                      setSubmissionError('Authentication required. Please sign in.')
                      setIsSubmitting(false)
                      return
                    }



                    const response = await fetch(API_ENDPOINTS.ADD_ITEM, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}`,
                      },
                      body: JSON.stringify({
                        github_repository_url: githubRepo,
                        url: window.location.hostname,
                      }),
                    })
                    
                    if (response.ok) {
                      setSubmissionMessage('Repository added successfully!')
                      console.log('Repository added successfully')
                      // Refresh the repository list to show the newly added repository
                      await fetchRepositories()
                      // Close modal after successful submission
                      setTimeout(() => {
                        setIsModalOpen(false)
                        setGithubRepo('')
                      }, 1500)
                    } else {
                      const errorData = await response.json() as Record<string, unknown>
                      setSubmissionError((errorData.message as string) || 'Failed to add repository')
                      console.error('Failed to add repository:', errorData)
                    }
                  } catch (error) {
                    setSubmissionError('Error submitting repository. Please try again.')
                    console.error('Error submitting repository:', error)
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Repository'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
