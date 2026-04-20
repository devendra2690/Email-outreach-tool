import React, { useState } from 'react'
import {
  Search,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  User,
  Wand2,
  Star
} from 'lucide-react'
import { findLeads, generatePatterns, verifyEmails, detectEmailDomain } from '../api/client'

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
    className: 'bg-purple-100 text-purple-700'
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

const AUTO_STEPS = [
  { label: 'Searching for decision makers', description: 'Scraping LinkedIn and web sources' },
  { label: 'Generating email patterns', description: 'Building likely email combinations' },
  { label: 'Verifying emails via SMTP', description: 'Running live deliverability checks' }
]

const MANUAL_STEPS = [
  { label: 'Generating email patterns', description: 'Building name-based combinations for ' },
  { label: 'Verifying emails via SMTP', description: 'Running live deliverability checks' }
]

export default function LeadFinder() {
  const [domain, setDomain] = useState('')
  const [emailDomain, setEmailDomain] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [skipCache, setSkipCache] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [copied, setCopied] = useState(false)

  const isManualMode = firstName.trim() && lastName.trim()
  // Email domain falls back to website domain if not explicitly overridden
  const effectiveEmailDomain = emailDomain.trim() || domain.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!domain.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)
    setActiveStep(0)

    try {
      if (isManualMode) {
        // Manual path: skip SerpAPI, generate patterns by name then verify
        const stepTimer = setTimeout(() => setActiveStep(1), 800)
        const patterns = await generatePatterns(firstName.trim(), lastName.trim(), effectiveEmailDomain)
        clearTimeout(stepTimer)
        setActiveStep(1)

        const verified = await verifyEmails(patterns)
        const best = verified.find(v => v.status === 'WEBSITE') ||
                     verified.find(v => v.status === 'VALID') ||
                     verified.find(v => v.status === 'CATCH_ALL') ||
                     null
        const catchAll = verified.length > 0 && verified.every(v => v.status === 'CATCH_ALL')

        setResults({
          domain: domain.trim(),
          emailDomain: effectiveEmailDomain,
          decisionMakers: [{
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            fullName: `${firstName.trim()} ${lastName.trim()}`,
            title: 'Manually provided'
          }],
          verifiedEmails: verified,
          bestEmail: best?.email || null,
          catchAllDomain: catchAll
        })
      } else {
        // Auto-discovery path: full 3-phase pipeline
        const stepTimer1 = setTimeout(() => setActiveStep(1), 1500)
        const stepTimer2 = setTimeout(() => setActiveStep(2), 3500)
        const data = await findLeads(domain.trim(), companyName.trim() || undefined, skipCache, emailDomain.trim() || null)
        clearTimeout(stepTimer1)
        clearTimeout(stepTimer2)
        setResults(data)
      }
    } catch (err) {
      setError(err?.message || err?.error || 'An unexpected error occurred. Please check your API key and backend URL in Settings.')
    } finally {
      setLoading(false)
      setActiveStep(0)
    }
  }

  const handleDetectEmailDomain = async () => {
    if (!domain.trim()) return
    setDetecting(true)
    try {
      const result = await detectEmailDomain(domain.trim())
      setEmailDomain(result.emailDomain)
    } catch (err) {
      // silently ignore — user can still type manually
    } finally {
      setDetecting(false)
    }
  }

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lead Finder</h1>
        <p className="text-gray-500 mt-1">
          Discover decision makers at any company and find their verified email addresses.
        </p>
      </div>

      {/* Input card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Domain + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website Domain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="e.g. chhedaspecialities.com"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Domain <span className="text-gray-400 font-normal">(if different)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emailDomain}
                  onChange={e => setEmailDomain(e.target.value)}
                  placeholder={domain.trim() || 'e.g. chhedas.com'}
                  disabled={loading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={handleDetectEmailDomain}
                  disabled={loading || detecting || !domain.trim()}
                  title="Auto-detect email domain from MX records"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-gray-50 disabled:text-gray-300 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                >
                  {detecting
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Wand2 className="w-3.5 h-3.5" />}
                  {detecting ? 'Detecting...' : 'Detect'}
                </button>
              </div>
            </div>
          </div>

          {emailDomain.trim() && emailDomain.trim() !== domain.trim() && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Email patterns will use <strong>{emailDomain.trim()}</strong> — website domain <strong>{domain.trim()}</strong> is only used for lead discovery.
            </p>
          )}

          {/* Row 1b: Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-gray-400 font-normal">(optional — improves SerpAPI search)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Chheda Specialities"
              disabled={loading || !!isManualMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Divider with label */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3 h-3" />
                Known person? Skip auto-discovery
              </span>
            </div>
          </div>

          {/* Row 2: First Name + Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Devendra"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g. Patil"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {isManualMode && (
            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Name provided — will generate email patterns for <strong>{firstName.trim()} {lastName.trim()}</strong> and verify via SMTP. SerpAPI discovery skipped.
            </p>
          )}

          {!isManualMode && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skipCache"
                checked={skipCache}
                onChange={e => setSkipCache(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="skipCache" className="text-sm text-gray-600">
                Skip cache — force a fresh search
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isManualMode ? 'Generating & verifying...' : 'Searching...'}
              </>
            ) : (
              <>
                {isManualMode ? <User className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                {isManualMode ? `Find Emails for ${firstName.trim()} ${lastName.trim()}` : 'Find Decision Makers'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading: step progress */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Processing your request...</h3>
          <div className="space-y-4">
            {(isManualMode ? MANUAL_STEPS : AUTO_STEPS).map((step, idx) => {
              const isDone = idx < activeStep
              const isActive = idx === activeStep
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : isDone ? 'text-green-700' : 'text-gray-400'}`}>
                      Step {idx + 1}: {step.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-500' : isDone ? 'text-green-500' : 'text-gray-300'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Request failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !results && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mb-4">
            <Search className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No search run yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Enter a domain above to discover decision makers and their email addresses.
          </p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="space-y-6">
          {/* Best email banner */}
          {results.bestEmail && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Best Email Found</p>
                  <p className="text-green-900 font-semibold text-base mt-0.5">{results.bestEmail}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(results.bestEmail)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium rounded-lg transition-colors"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Catch-all warning */}
          {results.catchAllDomain && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Catch-All Domain Detected</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  This domain ({results.emailDomain || results.domain}) accepts all incoming email. Verification results may not be reliable.
                </p>
              </div>
            </div>
          )}

          {/* Best Guesses — shown when provider blocks SMTP verification */}
          {results.verifiedEmails && results.verifiedEmails.length > 0 &&
           results.verifiedEmails.every(e => e.status === 'UNVERIFIABLE') && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-blue-900">Most Likely Emails</h2>
                <span className="ml-1 text-xs text-blue-600 font-normal">
                  — SMTP verification is blocked by the mail provider. These are ranked by real-world frequency.
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {results.verifiedEmails.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {idx + 1}
                      </span>
                      <span className="font-mono text-sm text-gray-800">{item.email}</span>
                      {idx === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Try first
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(item.email)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Makers */}
          {results.decisionMakers && results.decisionMakers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  Decision Makers
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({results.decisionMakers.length} found)
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {results.decisionMakers.map((person, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 border border-gray-100 rounded-lg p-4 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-semibold text-gray-900 text-sm">{person.fullName || `${person.firstName} ${person.lastName}`}</p>
                    {person.title && (
                      <p className="text-xs text-blue-700 font-medium">{person.title}</p>
                    )}
                    {person.company && (
                      <p className="text-xs text-gray-500">{person.company}</p>
                    )}
                    {person.sourceUrl && (
                      <a
                        href={person.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate mt-1"
                      >
                        Source
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Emails table */}
          {results.verifiedEmails && results.verifiedEmails.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  Email Verification Results
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({results.verifiedEmails.length} addresses checked)
                  </span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">MX Record</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SMTP Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.verifiedEmails.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-mono text-gray-800 text-xs">{item.email}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-xs">{item.mxRecord || '—'}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">{item.smtpResponse || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No emails found state */}
          {(!results.verifiedEmails || results.verifiedEmails.length === 0) &&
           (!results.decisionMakers || results.decisionMakers.length === 0) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No results found</p>
              <p className="text-gray-400 text-sm mt-1">
                No decision makers or email addresses were discovered for <strong>{results.domain}</strong>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
