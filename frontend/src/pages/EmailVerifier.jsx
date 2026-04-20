import React, { useState } from 'react'
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { verifyEmail, verifyEmails } from '../api/client'

const STATUS_CONFIG = {
  WEBSITE: {
    label: 'On Website',
    className: 'bg-emerald-100 text-emerald-800'
  },
  VALID: {
    label: 'Valid',
    className: 'bg-green-100 text-green-800'
  },
  INVALID: {
    label: 'Invalid',
    className: 'bg-red-100 text-red-800'
  },
  CATCH_ALL: {
    label: 'Catch-All',
    className: 'bg-amber-100 text-amber-800'
  },
  UNVERIFIABLE: {
    label: 'Unverifiable',
    className: 'bg-gray-100 text-gray-700'
  },
  TIMEOUT: {
    label: 'Timeout',
    className: 'bg-orange-100 text-orange-800'
  }
}

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'WEBSITE': return <CheckCircle className="w-4 h-4 text-emerald-600" />
    case 'VALID': return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'INVALID': return <XCircle className="w-4 h-4 text-red-600" />
    case 'CATCH_ALL': return <AlertCircle className="w-4 h-4 text-amber-600" />
    case 'TIMEOUT': return <Clock className="w-4 h-4 text-orange-600" />
    default: return <AlertCircle className="w-4 h-4 text-gray-500" />
  }
}

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNVERIFIABLE
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <StatusIcon status={status} />
      {config.label}
    </span>
  )
}

const ResultsTable = ({ results }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">MX Record</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SMTP Response</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 bg-white">
        {results.map((item, idx) => (
          <tr key={idx} className="hover:bg-gray-50 transition-colors">
            <td className="px-5 py-3 font-mono text-gray-800 text-xs">{item.email}</td>
            <td className="px-5 py-3">
              <StatusBadge status={item.status} />
            </td>
            <td className="px-5 py-3 text-gray-600 text-xs">{item.mxRecord || '—'}</td>
            <td className="px-5 py-3 text-gray-500 text-xs max-w-xs truncate">{item.smtpResponse || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

function SingleVerifier() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await verifyEmail(email.trim())
      setResult(data)
    } catch (err) {
      setError(err?.message || err?.error || 'Verification failed. Check your settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleVerify} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Verify
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-gray-900 font-medium">{result.email}</p>
            <StatusBadge status={result.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">MX Record</p>
              <p className="text-sm text-gray-800">{result.mxRecord || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Catch-All</p>
              <p className="text-sm text-gray-800">{result.catchAll != null ? (result.catchAll ? 'Yes' : 'No') : '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">SMTP Response</p>
              <p className="text-sm text-gray-800 font-mono">{result.smtpResponse || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Enter an email address above to check its deliverability.</p>
        </div>
      )}
    </div>
  )
}

function BatchVerifier() {
  const [emailsText, setEmailsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

  const handleVerifyAll = async (e) => {
    e.preventDefault()
    const emailList = emailsText
      .split('\n')
      .map(e => e.trim())
      .filter(Boolean)

    if (emailList.length === 0) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const data = await verifyEmails(emailList)
      // data may be an array directly or wrapped
      setResults(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setError(err?.message || err?.error || 'Batch verification failed. Check your settings.')
    } finally {
      setLoading(false)
    }
  }

  const emailCount = emailsText
    .split('\n')
    .map(e => e.trim())
    .filter(Boolean).length

  return (
    <div className="space-y-5">
      <form onSubmit={handleVerifyAll} className="space-y-3">
        <textarea
          value={emailsText}
          onChange={e => setEmailsText(e.target.value)}
          placeholder={`Enter one email per line, e.g.:\njohn.doe@acmecorp.com\njane.smith@acmecorp.com\ncto@startup.io`}
          rows={6}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {emailCount > 0 ? `${emailCount} email${emailCount !== 1 ? 's' : ''} ready to verify` : 'No emails entered'}
          </p>
          <button
            type="submit"
            disabled={loading || emailCount === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying {emailCount} emails...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Verify All
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {results && !loading && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''} returned
          </p>
          <ResultsTable results={results} />
        </div>
      )}

      {!results && !loading && !error && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Enter a list of emails above and click Verify All.</p>
        </div>
      )}
    </div>
  )
}

export default function EmailVerifier() {
  const [tab, setTab] = useState('single')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Verifier</h1>
        <p className="text-gray-500 mt-1">
          Check email deliverability via live SMTP verification.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('single')}
            className={`flex-1 py-3 text-sm font-medium transition-colors rounded-tl-xl ${
              tab === 'single'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Single Email
          </button>
          <button
            onClick={() => setTab('batch')}
            className={`flex-1 py-3 text-sm font-medium transition-colors rounded-tr-xl ${
              tab === 'batch'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Batch Verify
          </button>
        </div>

        <div className="p-6">
          {tab === 'single' ? <SingleVerifier /> : <BatchVerifier />}
        </div>
      </div>
    </div>
  )
}
