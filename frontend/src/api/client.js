const getConfig = () => ({
  apiKey: localStorage.getItem('dmot_api_key') || '',
  baseUrl: localStorage.getItem('dmot_base_url') || ''
})

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Api-Key': getConfig().apiKey
})

const base = () => getConfig().baseUrl

export const findLeads = (domain, companyName, skipCache = false, emailDomain = null) =>
  fetch(`${base()}/api/v1/outreach/find-leads`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ domain, companyName, skipCache, ...(emailDomain ? { emailDomain } : {}) })
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))

export const generatePatterns = (firstName, lastName, domain) =>
  fetch(`${base()}/api/v1/outreach/generate-patterns`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ firstName, lastName, domain })
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))

export const verifyEmail = (email) =>
  fetch(`${base()}/api/v1/outreach/verify-email`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email })
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))

export const verifyEmails = (emails) =>
  fetch(`${base()}/api/v1/outreach/verify-emails`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ emails })
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))

export const listKeys = () =>
  fetch(`${base()}/api/v1/keys`, { headers: headers() })
    .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))

export const createKey = (name) =>
  fetch(`${base()}/api/v1/keys`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name })
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))

export const deleteKey = (id) =>
  fetch(`${base()}/api/v1/keys/${id}`, {
    method: 'DELETE',
    headers: headers()
  }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)) })

export const detectEmailDomain = (domain) =>
  fetch(`${base()}/api/v1/outreach/detect-email-domain?domain=${encodeURIComponent(domain)}`, {
    headers: headers()
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
