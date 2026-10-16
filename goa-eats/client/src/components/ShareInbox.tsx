import React, { useCallback, useEffect, useState } from 'react'
import { createLink, deleteLink, getLinks } from '../services/api'
import type { LinkPlatform, SharedLink } from '../types/link'

const platformLabels: Record<LinkPlatform, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  other: 'Link',
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "https://www.instagram.com/reel/ABC/" -> "instagram.com/reel/ABC/"
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '')
}

function ShareInbox() {
  const [links, setLinks] = useState<SharedLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const loadLinks = useCallback(async () => {
    setError('')

    try {
      setLinks(await getLinks())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load links.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Reload when the app comes back into view, so links shared from the
  // other device show up without a manual refresh.
  useEffect(() => {
    void loadLinks()

    function handleVisible() {
      if (document.visibilityState === 'visible') void loadLinks()
    }

    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', handleVisible)
    return () => {
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', handleVisible)
    }
  }, [loadLinks])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setSaving(true)

    try {
      const result = await createLink(url)

      setMessage(
        result.duplicate
          ? `Already in your inbox (shared ${formatDate(result.createdAt)}).`
          : `Saved ${platformLabels[result.platform]} link to your inbox.`,
      )
      setUrl('')
      await loadLinks()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save the link.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this link from your inbox?')) return

    try {
      await deleteLink(id)
      await loadLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete link.')
    }
  }

  return (
    <div className="share-inbox">
      <div className="placeholder-card share-card">
        <h2>Share a find</h2>
        <p>Paste an Instagram or YouTube link to add it to your inbox.</p>

        <form onSubmit={handleSubmit} className="share-form">
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            aria-label="Link to share"
            required
          />
          <button
            className="primary-button"
            type="submit"
            disabled={saving || !url.trim()}
          >
            {saving ? 'Saving...' : 'Save link'}
          </button>
        </form>

        {message && <p role="status" className="share-message">{message}</p>}
      </div>

      <div className="inbox-heading">
        <h2>Inbox</h2>
        <span>
          {links.length} {links.length === 1 ? 'link' : 'links'}
        </span>
        <button
          type="button"
          className="text-button"
          onClick={() => void loadLinks()}
        >
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="share-error">{error}</p>}

      {loading ? (
        <p className="inbox-empty">Loading links…</p>
      ) : links.length === 0 ? (
        <p className="inbox-empty">No links yet. Shared links will appear here.</p>
      ) : (
        <ul className="link-list">
          {links.map((link) => (
            <li className="link-item" key={link.id}>
              <span className={`platform-badge platform-${link.platform}`}>
                {platformLabels[link.platform]}
              </span>

              <div className="link-details">
                <a href={link.url} target="_blank" rel="noreferrer">
                  {displayUrl(link.url)}
                </a>
                <small>
                  Shared {formatDate(link.createdAt)}
                  {link.note && ` · ${link.note}`}
                </small>
              </div>

              <button
                type="button"
                className="text-button danger"
                onClick={() => void handleDelete(link.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ShareInbox
