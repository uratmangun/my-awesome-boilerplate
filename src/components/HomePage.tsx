import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Heart, Github, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 text-gray-900 dark:text-gray-100">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Redis Boilerplate
          </h1>
          <p className="text-lg text-muted-foreground dark:text-gray-300 max-w-2xl mx-auto">
            This is a Redis boilerplate for you to create Redis app easily using
            React, Cloudflare, and Deno function. Get started quickly with a
            modern stack and Redis integration.
          </p>
        </div>

        {/* Create New Repository from Template */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                <Github className="h-5 w-5" />
                Create New Repository from Template
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Use GitHub CLI to quickly create a new Redis project from this
                template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 relative group">
                <code className="text-green-400 font-mono text-sm block">
                  gh repo create my-redis-app --template
                  uratmangun/redis-boilerplate --public --clone
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      'gh repo create my-redis-app --template uratmangun/redis-boilerplate --public --clone'
                    )
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Replace{' '}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    my-redis-app
                  </code>{' '}
                  with your desired repository name.
                </p>
                <p>This command will:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    Create a new repository from this Redis boilerplate template
                  </li>
                  <li>
                    Set it as public (use{' '}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      --private
                    </code>{' '}
                    for private repos)
                  </li>
                  <li>Clone the repository to your local machine</li>
                  <li>Set up all Redis boilerplate files and configurations</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://github.com/uratmangun/redis-boilerplate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  View Template Repository
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-center mb-12">
          <Card className="hover:shadow-lg transition-shadow max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-500" />
                Semantic Search with AI
              </CardTitle>
              <CardDescription>
                Intelligent vector-based search capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Powered by Redis Vector Search and AI embeddings. Find relevant
                content using natural language queries with semantic
                understanding.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/aisearchpage">Try AI Search</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
