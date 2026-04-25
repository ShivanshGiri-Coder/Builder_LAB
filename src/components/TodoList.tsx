"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Todo {
  id: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  created_at: string
  updated_at: string
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTodo, setNewTodo] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high" })
  const [isAdding, setIsAdding] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all")
  const supabase = createClient()

  useEffect(() => {
    fetchTodos()
  }, [filter])

  const fetchTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("You must be logged in to view todos.")
        setIsLoading(false)
        return
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token
      
      let url = '/api/todos'
      if (filter !== 'all') {
        url += `?status=${filter}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }

      const { todos } = await response.json()
      setTodos(todos || [])
    } catch (err) {
      setError("Failed to load todos.")
    } finally {
      setIsLoading(false)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.title.trim()) return

    setIsAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const token = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTodo)
      })

      if (!response.ok) {
        throw new Error('Failed to add todo')
      }

      const { todo } = await response.json()
      setTodos([todo, ...todos])
      setNewTodo({ title: "", description: "", priority: "medium" })
    } catch (err) {
      setError("Failed to add todo.")
    } finally {
      setIsAdding(false)
    }
  }

  const updateTodo = async (id: number, updates: Partial<Todo>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const token = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      const { todo } = await response.json()
      setTodos(todos.map(t => t.id === id ? { ...t, ...todo } : t))
    } catch (err) {
      setError("Failed to update todo.")
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const token = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete todo')
      }

      setTodos(todos.filter(t => t.id !== id))
    } catch (err) {
      setError("Failed to delete todo.")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'in_progress': return 'text-blue-400'
      case 'pending': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading todos...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">My Tasks</h3>
        <div className="flex gap-2">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filter === filterOption
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white bg-gray-800/50'
              }`}
            >
              {filterOption === 'all' ? 'All' : filterOption.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Add new todo form */}
      <form onSubmit={addTodo} className="mb-6 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
            className="flex-1 h-10 px-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
          <select
            value={newTodo.priority}
            onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as Todo['priority'] })}
            className="h-10 px-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            disabled={isAdding || !newTodo.title.trim()}
            className="h-10 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-all"
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
        </div>
        <textarea
          placeholder="Description (optional)"
          value={newTodo.description}
          onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-all resize-none"
        />
      </form>

      {/* Todo list */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-400">No tasks yet. Add your first task above!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/40 transition-all">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={todo.status === 'completed'}
                  onChange={() => updateTodo(todo.id, { 
                    status: todo.status === 'completed' ? 'pending' : 'completed' 
                  })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-medium ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                      {todo.title}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                      {todo.priority}
                    </span>
                    <span className={`text-xs font-medium ${getStatusColor(todo.status)}`}>
                      {todo.status.replace('_', ' ')}
                    </span>
                  </div>
                  {todo.description && (
                    <p className="text-gray-400 text-sm mb-2">{todo.description}</p>
                  )}
                  {todo.due_date && (
                    <p className="text-gray-500 text-xs">
                      Due: {new Date(todo.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {todo.status !== 'in_progress' && (
                    <button
                      onClick={() => updateTodo(todo.id, { status: 'in_progress' })}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
