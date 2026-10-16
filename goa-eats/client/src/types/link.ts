
export type LinkPlatform = 'instagram' | 'youtube' | 'other'

// A link shared into the Goa Eats inbox, waiting to be processed.
export interface SharedLink {
  id: string
  url: string
  platform: LinkPlatform
  status: 'new'
  note?: string

  // ISO 8601 timestamp.
  createdAt: string
}

export interface SharedLinkResult extends SharedLink {
  // True when this post was already in the inbox.
  duplicate: boolean
}
