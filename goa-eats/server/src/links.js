// Helpers for links shared into the Goa Eats inbox.

// Tracking parameters that do not change which post a link points to.
const YOUTUBE_TRACKING_PARAMS = ['si', 'feature', 'pp', 'app']

// Accepts a bare URL or a block of shared text ("Check this out https://...")
// and returns the first http(s) URL in it, or null.
export function extractUrl(input) {
  if (typeof input !== 'string') return null

  const text = input.trim()
  const match = text.match(/https?:\/\/[^\s<>"']+/i)
  return match ? match[0] : null
}

export function detectPlatform(hostname) {
  const host = hostname.toLowerCase().replace(/^(www\.|m\.)/, '')

  if (host === 'instagram.com' || host === 'instagr.am') return 'instagram'
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com') {
    return 'youtube'
  }
  return 'other'
}

// Returns { url, platform } with tracking removed, or null if the URL is
// not a valid http(s) link. The cleaned URL is used to detect duplicates.
export function normalizeLink(rawUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const platform = detectPlatform(url.hostname)
  url.protocol = 'https:'
  url.hash = ''

  if (platform === 'instagram') {
    // Instagram post identity is entirely in the path (/reel/<id>/, /p/<id>/).
    url.hostname = 'www.instagram.com'
    url.search = ''
    if (!url.pathname.endsWith('/')) url.pathname += '/'
  } else if (platform === 'youtube') {
    const host = url.hostname.toLowerCase()

    // youtu.be/<id> -> youtube.com/watch?v=<id>
    if (host === 'youtu.be') {
      const videoId = url.pathname.slice(1)
      url = new URL(`https://www.youtube.com/watch?v=${videoId}`)
    } else {
      url.hostname = 'www.youtube.com'
      for (const param of YOUTUBE_TRACKING_PARAMS) {
        url.searchParams.delete(param)
      }
    }
  }

  return { url: url.toString(), platform }
}
