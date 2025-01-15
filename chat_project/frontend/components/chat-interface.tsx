'use client'

import { useState, useEffect } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import AuthForm from './auth-form'

interface User {
  id: number
  username: string
}

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
}

export default function ChatInterface() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      setToken(storedToken)
      checkCurrentUser(storedToken)
    }
  }, [])

  useEffect(() => {
    if (currentUser && token) {
      fetchUsers()
    }
  }, [currentUser, token])

  useEffect(() => {
    if (selectedUser && token) {
      fetchMessages(selectedUser.id)
    }
  }, [selectedUser, token])

  const checkCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:8000/chat/current_user/', {
        headers: {
          'Authorization': `Token ${authToken}`
        }
      })
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
      } else {
        // If the token is invalid, clear it
        localStorage.removeItem('authToken')
        setToken(null)
      }
    } catch (error) {
      console.error('Error checking current user:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/chat/users/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchMessages = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/chat/messages/${userId}/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim() || !token) return

    try {
      const response = await fetch('http://localhost:8000/chat/send_message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: newMessage,
        }),
      })
      const data = await response.json()
      setMessages([...messages, data])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
    setCurrentUser(null)
    setSelectedUser(null)
    setUsers([])
    setMessages([])
  }

  const handleLogin = (user: User, authToken: string) => {
    setCurrentUser(user)
    setToken(authToken)
  }

  if (!currentUser || !token) {
    return <AuthForm onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Users</h2>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
        {users.map(user => (
          <Button
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className="w-full mb-2"
            variant={selectedUser?.id === user.id ? "default" : "outline"}
          >
            {user.username}
          </Button>
        ))}
      </div>
      <div className="w-3/4 flex flex-col">
        {selectedUser ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map(message => (
                <div key={message.id} className={`mb-2 ${message.sender === currentUser.username ? 'text-right' : ''}`}>
                  <span className="font-bold">{message.sender}: </span>
                  {message.content}
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 mr-2"
                />
                <Button type="submit">Send</Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

