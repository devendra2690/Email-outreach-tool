import React, { useState, useEffect, useCallback } from 'react'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { listKeys, createKey, deleteKey } from '../api/client'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

export default function ApiKeys() {
  const [keys, setKeys] = useState([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  // Newly created key modal
  const [createdKey, setCreatedKey] = useState(null)
  const [copiedRaw, setCopiedRaw] = useState(false)

  // Delete
  const [deletingId, setDeletingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true)
    setLoadError(null)
    try {
      const data = await listKeys()
      setKeys(Array.isArray(data) ? data : [])
    } catch (err) {
      setLoadError(err?.message || err?.error || 'Failed to load API keys. Check your settings.')
    } finally {
      setLoadingKeys(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    setCreating(true)
    setCreateError(null)

    try {
      const data = await createKey(newKeyName.trim())
      setCreatedKey(data)
      setNewKeyName('')
      setShowCreateForm(false)
      // Refresh key list (created key won't have rawKey)
      fetchKeys()
    } catch (err) {
      setCreateError(err?.message || err?.error || 'Failed to create key.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteConfirm = async (id) => {
    setDeletingId(id)
    setDeleteError(null)
    try {
      await deleteKey(id)
      setKeys(prev => prev.filter(k => k.id !== id))
      setDeleteConfirmId(null)
    } catch (err) {
      setDeleteError(err?.message || err?.error || 'Failed to delete key.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopyRaw = async () => {
    if (!createdKey?.rawKey) return
    try {
      await navigator.clipboard.writeText(createdKey.rawKey)
      setCopiedRaw(true)
      setTimeout(() => setCopiedRaw(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">
            Manage authentication keys for the DMOT backend.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(v => !v)
            setCreateError(null)
            setNewKeyName('')
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Key
        </button>
      </div>

      {/* Inline create form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">New API Key</h3>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Production, Development)"
              required
              disabled={creating}
              autoFocus
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={creating || !newKeyName.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Create Key
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </form>
          {createError && (
            <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {createError}
            </div>
          )}
        </div>
      )}

      {/* Newly created key modal */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">API Key Created</h3>
                <p className="text-sm text-gray-500">{createdKey.name}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">
                This key will never be shown again. Copy it now and store it securely.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-3 mb-4 flex items-center gap-3">
              <code className="flex-1 text-green-400 text-xs font-mono break-all">
                {createdKey.rawKey}
              </code>
              <button
                onClick={handleCopyRaw}
                className="flex-shrink-0 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                {copiedRaw ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRaw ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="text-xs text-gray-500 space-y-1 mb-5">
              <p><span className="font-medium">Prefix:</span> {createdKey.keyPrefix}</p>
              <p><span className="font-medium">Created:</span> {formatDate(createdKey.createdAt)}</p>
            </div>

            <button
              onClick={() => setCreatedKey(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Done — I've saved my key
            </button>
          </div>
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{deleteError}</p>
        </div>
      )}

      {/* Keys table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loadingKeys ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-500 text-sm">Loading keys...</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <p className="text-gray-600 text-sm font-medium">Failed to load keys</p>
            <p className="text-gray-400 text-xs">{loadError}</p>
            <button
              onClick={fetchKeys}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Key className="w-10 h-10 text-gray-300" />
            <p className="text-gray-500 font-medium">No API keys</p>
            <p className="text-gray-400 text-sm">Create your first key to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prefix</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Used</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{k.name}</td>
                    <td className="px-6 py-3 font-mono text-gray-600 text-xs">{k.keyPrefix}...</td>
                    <td className="px-6 py-3">
                      {k.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(k.createdAt)}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(k.lastUsedAt)}</td>
                    <td className="px-6 py-3">
                      {deleteConfirmId === k.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Sure?</span>
                          <button
                            onClick={() => handleDeleteConfirm(k.id)}
                            disabled={deletingId === k.id}
                            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            {deletingId === k.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Revoke
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(k.id)}
                          className="flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
