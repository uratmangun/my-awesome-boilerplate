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
import {
  Github,
  Trash2,
  Copy,
  Search,
  Plus,
  Star,
  GitFork,
  ExternalLink,
} from 'lucide-react'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/constants/api'

// Interface for repository data
interface Repository {
  id: string
  github_repository_name: string
  github_description?: string
  homepage_url?: string
  is_template?: boolean
  createdAt: string | number | Date
}

export function HomePage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const isAuthorizedUser = user?.username === 'uratmangun'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [githubRepo, setGithubRepo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [submissionError, setSubmissionError] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoadingRepos, setIsLoadingRepos] = useState(true)
  const [repoError, setRepoError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    repoId: string
    repoName: string
  }>({ isOpen: false, repoId: '', repoName: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchResults, setSearchResults] = useState<Repository[]>([])
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
          limit: 50,
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
      setIsDeleting(true)

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
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ id: repoId }),
      })

      if (response.ok) {
        toast.success('Repository deleted successfully!', {
          duration: 3000,
        })

        // Refresh the repository list
        await fetchRepositories()

        // Close the modal
        setDeleteConfirmation({ isOpen: false, repoId: '', repoName: '' })
      } else {
        const errorData = (await response.json()) as Record<string, unknown>
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
    } finally {
      setIsDeleting(false)
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
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
          searchType: 'combined',
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AB</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">
            Awesome Boilerplate
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm text-blue-800 dark:text-blue-200 mb-8">
            <Star className="w-4 h-4 mr-2" />
            Modern Development Platform
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
            Build Amazing
            <br />
            Web Applications
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            A modern, flexible boilerplate template with cutting-edge tools and
            best practices. Start building your next project in minutes, not
            hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() =>
                window.open(
                  'https://github.com/uratmangun/my-awesome-boilerplate',
                  '_blank'
                )
              }
            >
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </Button>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search repositories and templates..."
                  className="pl-12 pr-4 py-4 text-lg rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      searchRepositories()
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-full px-6"
                  onClick={searchRepositories}
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
                {isSearchMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={clearSearch}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {isAuthorizedUser && (
              <Button
                variant="outline"
                size="lg"
                className="mt-6 px-8 py-3 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Repository
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Repository Grid */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {isSearchMode
                ? `Search Results (${searchResults.filter(repo => repo.score > 0).length})`
                : 'Repository Collection'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover and manage your development projects
            </p>
          </div>

          {isSearching ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 dark:text-blue-200">
                  Searching repositories...
                </span>
              </div>
            </div>
          ) : isLoadingRepos && !isSearchMode ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  Loading repositories...
                </span>
              </div>
            </div>
          ) : repoError && !isSearchMode ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{repoError}</p>
              </div>
            </div>
          ) : isSearchMode &&
            searchResults.filter(repo => repo.score > 0).length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  No repositories found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try different keywords or clear your search
                </p>
              </div>
            </div>
          ) : !isSearchMode && repositories.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                <Github className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  No repositories yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add your first repository to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(isSearchMode
                ? searchResults.filter(repo => repo.score > 0)
                : repositories
              ).map((repo: Repository, index) => (
                <Card
                  key={repo.id}
                  className="group hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:scale-105 rounded-2xl overflow-hidden"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg flex items-center justify-center">
                          <Github className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {repo.github_repository_name.split('/')[1] ||
                              repo.github_repository_name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {repo.github_repository_name.split('/')[0]}
                          </p>
                        </div>
                      </div>
                      {repo.is_template && (
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          Template
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4">
                    <CardDescription className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {repo.github_description || 'No description available'}
                    </CardDescription>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Added {new Date(repo.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 flex flex-col space-y-3">
                    {repo.is_template && (
                      <div className="w-full p-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              📋 Ready to Clone
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              Create new project from template
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              createFromTemplate(repo.github_repository_name)
                            }
                            className="border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1 rounded-lg"
                      >
                        <a
                          href={`https://github.com/${repo.github_repository_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="w-4 h-4 mr-2" />
                          Repository
                        </a>
                      </Button>
                      {repo.homepage_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 rounded-lg"
                        >
                          <a
                            href={repo.homepage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Live Site
                          </a>
                        </Button>
                      )}
                    </div>

                    {isAuthorizedUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDeleteConfirmation({
                            isOpen: true,
                            repoId: repo.id,
                            repoName: repo.name,
                          })
                        }
                        className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Repository
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Github className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {repositories.length}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Active Repositories
              </p>
            </div>

            <div className="text-center p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Copy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {repositories.filter(repo => repo.is_template).length}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Template Projects
              </p>
            </div>

            <div className="text-center p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <GitFork className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user ? 'Active' : 'Guest'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">User Status</p>
            </div>
          </div>
        </div>
      </section>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Add GitHub Repository
            </h2>

            {submissionMessage && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-xl border border-green-200 dark:border-green-800">
                {submissionMessage}
              </div>
            )}
            {submissionError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-800">
                {submissionError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository URL
              </label>
              <Input
                type="text"
                placeholder="https://github.com/username/repository"
                value={githubRepo}
                onChange={e => setGithubRepo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl"
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
                      setSubmissionError(
                        'Authentication required. Please sign in.'
                      )
                      setIsSubmitting(false)
                      return
                    }

                    const response = await fetch(API_ENDPOINTS.ADD_ITEM, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionToken}`,
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
                      // Close modal immediately after successful submission and list refresh
                      setIsModalOpen(false)
                      setGithubRepo('')
                    } else {
                      const errorData = (await response.json()) as Record<
                        string,
                        unknown
                      >
                      setSubmissionError(
                        (errorData.message as string) ||
                          'Failed to add repository'
                      )
                      console.error('Failed to add repository:', errorData)
                    }
                  } catch (error) {
                    setSubmissionError(
                      'Error submitting repository. Please try again.'
                    )
                    console.error('Error submitting repository:', error)
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  'Add Repository'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to remove{' '}
              <strong>{deleteConfirmation.repoName}</strong>? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteConfirmation({
                    isOpen: false,
                    repoId: '',
                    repoName: '',
                  })
                }
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => deleteRepository(deleteConfirmation.repoId)}
                disabled={isDeleting}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
