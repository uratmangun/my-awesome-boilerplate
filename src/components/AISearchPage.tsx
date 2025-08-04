import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Plus,
  ArrowLeft,
  Bot,
  CheckCircle,
  XCircle,
  X,
  Trash2,
} from 'lucide-react'
import { API_ENDPOINTS, buildApiUrl } from '@/constants/api'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SearchItem {
  id: string
  title: string
  content: string
  category: string
  relevanceScore: number
  is_template?: boolean
}

interface AISearchPageProps {
  onBack: () => void
}

export function AISearchPage({ onBack }: AISearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemContent, setNewItemContent] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null
    message: string
    itemId?: string
  }>({ type: null, message: '', itemId: '' })
  const [getItemId, setGetItemId] = useState('')
  const [fetchedItem, setFetchedItem] = useState<SearchItem | null>(null)
  const [isGettingItem, setIsGettingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [isInitializingIndex, setIsInitializingIndex] = useState(false)
  const [indexStatus, setIndexStatus] = useState<
    'unknown' | 'exists' | 'missing'
  >('unknown')

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    try {
      // Call the real Redis backend API
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.SEARCH_ITEMS, {
          query: searchQuery,
          limit: '50',
        }),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (result.success && result.results) {
        // Map the API response to the expected SearchItem format
        const mappedResults: SearchItem[] = result.results.items.map(
          (item: {
            id: string
            github_description: string
            github_repository_name: string
            category: string
            score?: number
            is_template?: boolean
          }) => ({
            id: item.id,
            title: item.github_repository_name,
            content: item.github_description,
            category: item.category,
            relevanceScore: item.score || 0,
            is_template: item.is_template,
          })
        )
        setSearchResults(mappedResults)
      } else {
        console.error('Search failed:', result.message)
        // Fallback to mock results if Redis search fails
        const mockResults: SearchItem[] = [
          {
            id: Date.now().toString(),
            title: `Search Result for "${searchQuery}"`,
            content: `No results found in Redis for "${searchQuery}". This is a fallback result.`,
            category: 'Fallback',
            relevanceScore: 0.5,
          },
        ]
        setSearchResults(mockResults)
      }
    } catch (error) {
      console.error('Error searching Redis:', error)
      // Fallback to mock results on error
      const mockResults: SearchItem[] = [
        {
          id: Date.now().toString(),
          title: `Search Result for "${searchQuery}"`,
          content: `Redis search unavailable. Showing fallback result for "${searchQuery}".`,
          category: 'Fallback',
          relevanceScore: 0.5,
        },
      ]
      setSearchResults(mockResults)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !newItemContent.trim()) {
      setNotification({
        type: 'error',
        message: 'Please fill in both title and content',
      })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      return
    }

    try {
      // First, try to initialize the index if it doesn't exist
      if (indexStatus !== 'exists') {
        try {
          const initResponse = await fetch(API_ENDPOINTS.INIT_INDEX, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          const initResult = await initResponse.json()
          if (initResult.success) {
            setIndexStatus('exists')
            console.log('✅ Index initialized automatically before adding item')
          }
        } catch (initError) {
          console.warn(
            '⚠️ Could not initialize index, proceeding with add-item anyway:',
            initError
          )
        }
      }

      // Call the real Redis backend API
      const response = await fetch(API_ENDPOINTS.ADD_ITEM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newItemTitle,
          content: newItemContent,
          category: 'User Added',
        }),
      })

      const result = await response.json()

      if (result.success) {
        setNewItemTitle('')
        setNewItemContent('')
        setNotification({
          type: 'success',
          message: 'Item added successfully to Redis!',
          itemId: result.item?.id,
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 7000)
      } else {
        setNotification({
          type: 'error',
          message: `Failed to add item: ${result.message}`,
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      }
    } catch (error) {
      console.error('Error adding item to Redis:', error)
      setNotification({
        type: 'error',
        message:
          'Failed to add item. Please check your connection and Redis configuration.',
      })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
    }
  }

  const handleGetItem = async () => {
    if (!getItemId.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter an item ID',
      })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      return
    }

    setIsGettingItem(true)
    setFetchedItem(null)

    try {
      // Call the get-item API endpoint
      const response = await fetch(
        `${API_ENDPOINTS.GET_ITEM}?id=${encodeURIComponent(getItemId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (result.success && result.item) {
        const item: SearchItem = {
          id: result.item.id,
          title: result.item.title,
          content: result.item.content,
          category: result.item.category,
          relevanceScore: 1.0,
        }

        setFetchedItem(item)
        setNotification({
          type: 'success',
          message: 'Item retrieved successfully!',
          itemId: result.item.id,
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Item not found',
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      }
    } catch (error) {
      console.error('Error retrieving item from Redis:', error)
      setNotification({
        type: 'error',
        message:
          'Failed to retrieve item. Please check your connection and try again.',
      })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
    } finally {
      setIsGettingItem(false)
    }
  }

  const handleInitializeIndex = async () => {
    setIsInitializingIndex(true)

    try {
      const response = await fetch(API_ENDPOINTS.INIT_INDEX, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setIndexStatus('exists')
        setNotification({
          type: 'success',
          message: result.indexExists
            ? 'Redis search index already exists and is ready!'
            : 'Redis search index created successfully! You can now use vector search.',
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      } else {
        setIndexStatus('missing')
        setNotification({
          type: 'error',
          message: result.message || 'Failed to initialize Redis search index',
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      }
    } catch (error) {
      console.error('Error initializing index:', error)
      setIndexStatus('missing')
      setNotification({
        type: 'error',
        message: 'Network error occurred while initializing index',
      })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
    } finally {
      setIsInitializingIndex(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!itemId.trim()) {
      console.error('❌ Invalid item ID')
      setNotification({
        type: 'error',
        message: 'Invalid item ID',
      })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      return
    }

    console.log(
      '✅ Proceeding with deletion (confirmation temporarily removed for testing)...'
    )
    setIsDeletingItem(true)

    const deleteUrl = `${API_ENDPOINTS.DELETE_ITEM}?id=${encodeURIComponent(itemId)}`
    console.log('📡 Making DELETE request to:', deleteUrl)

    try {
      // Call the delete-item API endpoint
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📥 Delete response status:', response.status)
      console.log(
        '📥 Delete response headers:',
        Object.fromEntries(response.headers.entries())
      )

      const result = await response.json()

      if (result.success) {
        // Clear the fetched item if it was deleted
        if (fetchedItem && fetchedItem.id === itemId) {
          setFetchedItem(null)
        }

        // Remove from search results if present
        setSearchResults(searchResults.filter(item => item.id !== itemId))

        setNotification({
          type: 'success',
          message: `Item "${result.deletedItem?.title || 'Unknown'}" deleted successfully!`,
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Failed to delete item',
        })
        setTimeout(() => setNotification({ type: null, message: '' }), 5000)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      setNotification({
        type: 'error',
        message:
          'Failed to delete item. Please check your connection and try again.',
      })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
    } finally {
      setIsDeletingItem(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Documentation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Tutorial':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Best Practices':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'AI Generated':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'User Added':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              AI Semantic Search
            </h1>
          </div>
        </div>

        {/* Notification */}
        {notification.type && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <div className="flex-1">
              <p className="font-medium">{notification.message}</p>
              {notification.itemId && (
                <p className="text-sm opacity-80 mt-1">
                  Item ID: {notification.itemId}
                </p>
              )}
            </div>
            <button
              onClick={() => setNotification({ type: null, message: '' })}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Initialize Index Section */}
        <Card className="mb-8 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Bot className="h-5 w-5" />
              Redis Search Index Setup
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-400">
              Initialize the Redis search index before using vector similarity
              search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleInitializeIndex}
                disabled={isInitializingIndex}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isInitializingIndex
                  ? 'Initializing...'
                  : 'Initialize Search Index'}
              </Button>
              {indexStatus === 'exists' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Index Ready</span>
                </div>
              )}
              {indexStatus === 'missing' && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Index Not Found</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Important:</strong> You must initialize the search index
              before adding items or searching. This creates the necessary Redis
              indexes for vector similarity search.
            </p>
          </CardContent>
        </Card>

        {/* Add Item Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Item
            </CardTitle>
            <CardDescription>
              Add content to the searchable knowledge base (requires initialized
              index)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Item title..."
              value={newItemTitle}
              onChange={e => setNewItemTitle(e.target.value)}
            />
            <Input
              placeholder="Item content..."
              value={newItemContent}
              onChange={e => setNewItemContent(e.target.value)}
            />
            <Button onClick={handleAddItem} className="w-full">
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Get Item by ID Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Get Item by ID
            </CardTitle>
            <CardDescription>
              Retrieve a specific item using its unique identifier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter item ID (e.g., item:1234567890:abc123def)"
              value={getItemId}
              onChange={e => setGetItemId(e.target.value)}
            />
            <Button
              onClick={handleGetItem}
              className="w-full"
              disabled={isGettingItem}
            >
              {isGettingItem ? 'Retrieving...' : 'Get Item'}
            </Button>

            {/* Display fetched item */}
            {fetchedItem && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{fetchedItem.title}</h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(fetchedItem.id)}
                    disabled={isDeletingItem}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                    {isDeletingItem ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {fetchedItem.content}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(fetchedItem.category)}`}
                  >
                    {fetchedItem.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {fetchedItem.id}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Semantic Search
            </CardTitle>
            <CardDescription>
              Search using natural language queries powered by AI embeddings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything... e.g., 'How to implement real-time chat?'"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {searchResults.length} items found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Relevance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {item.content}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}
                      >
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.relevanceScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(item.relevanceScore * 100)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
