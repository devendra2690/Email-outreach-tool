import React, { useState, useEffect } from 'react'
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { listKeys } from '../api/client'

const LS_BASE_URL = 'dmot_base_url'
const LS_API_KEY = 'dmot_api_key'
const DEFAULT_BASE_URL = 'http://localhost:8080'

function SavedToast({ visible }) {
  if (!visible) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-medium ml-3 animate-pulse">
      <CheckCircle className="w-3.5 h-3.5" />
      Saved
    </span>
  )
}

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem(LS_BASE_URL) || DEFAULT_BASE_URL)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_API_KEY) || '')
  const [showKey, setShowKey] = useState(false)

  const [urlSaved, setUrlSaved] = useState(false)
  const [keySaved, setKeySaved] = useState(false)

  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('')

  // Sync from localStorage on mount in case another tab changed it
  useEffect(() => {
    const storedUrl = localStorage.getItem(LS_BASE_URL)
    const storedKey = localStorage.getItem(LS_API_KEY)
    if (storedUrl) setBaseUrl(storedUrl)
    if (storedKey) setApiKey(storedKey)
  }, [])

  const showToast = (setter) => {
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const handleSaveUrl = () => {
    localStorage.setItem(LS_BASE_URL, baseUrl.trim() || DEFAULT_BASE_URL)
    setBaseUrl(baseUrl.trim() || DEFAULT_BASE_URL)
    showToast(setUrlSaved)
    setTestResult(null)
  }

  const handleSaveKey = () => {
    localStorage.setItem(LS_API_KEY, apiKey.trim())
    showToast(setKeySaved)
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setTestLoading(true)
    setTestResult(null)
    setTestMessage('')

    try {
      await listKeys()
      setTestResult('success')
      setTestMessage('Connection successful — backend is reachable and API key is valid.')
    } catch (err) {
      setTestResult('error')
      const msg = err?.message || err?.error || 'Unable to reach the backend.'
      setTestMessage(`Connection failed: ${msg}`)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Configure your backend connection and authentication.
        </p>
      </div>

      <div className="space-y-6">
        {/* Backend Base URL */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Backend Base URL</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The URL where your DMOT Spring Boot backend is running.
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="url"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_BASE_URL}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSaveUrl}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Save
            </button>
          </div>
          <div className="mt-2 flex items-center">
            <p className="text-xs text-gray-400">
              Current: <span className="font-mono">{localStorage.getItem(LS_BASE_URL) || DEFAULT_BASE_URL}</span>
            </p>
            <SavedToast visible={urlSaved} />
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">API Key</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Sent as the <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">X-Api-Key</code> header with every request.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="dmot_••••••••••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Save
            </button>
          </div>
          <div className="mt-2 flex items-center">
            <p className="text-xs text-gray-400">
              {localStorage.getItem(LS_API_KEY)
                ? `Stored key starts with: ${localStorage.getItem(LS_API_KEY).slice(0, 8)}...`
                : 'No API key saved yet.'}
            </p>
            <SavedToast visible={keySaved} />
          </div>
        </div>

        {/* Connection Test */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Test Connection</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify that the backend is reachable and your API key is accepted.
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testLoading}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {testLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing connection...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>

          {testResult === 'success' && (
            <div className="flex items-start gap-3 mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{testMessage}</p>
            </div>
          )}

          {testResult === 'error' && (
            <div className="flex items-start gap-3 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{testMessage}</p>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-semibold">How to get started</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
              <li>Set the Backend Base URL to your running DMOT Spring Boot instance.</li>
              <li>Go to <strong>API Keys</strong> and create your first key — you'll need an existing key to authenticate that request, so bootstrap by setting any key if your backend allows unauthenticated key creation, or configure a master key.</li>
              <li>Paste the key here and click Save.</li>
              <li>Click <strong>Test Connection</strong> to confirm everything works.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
