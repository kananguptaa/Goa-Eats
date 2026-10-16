import React, { useState } from 'react'
import './index.css'
import {
  createSharedRestaurant,
  getSharedRestaurants,
  deleteSharedRestaurant,
} from './services/api'
import ShareInbox from './components/ShareInbox'

type Screen = 'map' | 'share' | 'saved' | 'add' | 'settings'

const screens: { id: Screen; label: string; icon: string }[] = [
  { id: 'map', label: 'Map', icon: '⌖' },
  { id: 'share', label: 'Share', icon: '↗' },
  { id: 'saved', label: 'Saved Places', icon: '♡' },
  { id: 'add', label: 'Add Place', icon: '+' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('map')
  const [restaurantsVersion, setRestaurantsVersion] = useState(0)
  const activeLabel = screens.find(
    (screen) => screen.id === activeScreen,
  )?.label

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault()
            setActiveScreen('map')
          }}
        >
          <span className="brand-mark">G</span>
          <span>
            <strong>Goa Eats</strong>
            <small>Your personal food map</small>
          </span>
        </a>

        <p className="nav-heading">YOUR COLLECTION</p>

        <nav className="navigation" aria-label="Main navigation">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              className={`nav-item ${
                activeScreen === screen.id ? 'active' : ''
              }`}
              onClick={() => setActiveScreen(screen.id)}
              aria-current={
                activeScreen === screen.id ? 'page' : undefined
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {screen.icon}
              </span>
              <span>{screen.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          Phase 1 · Prototype
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">EXPLORE GOA</p>
            <h1>{activeLabel}</h1>
          </div>
          <span className="prototype-tag">EARLY ACCESS</span>
        </header>

        <section className="screen-content">
          {activeScreen === 'map' && (
            <div className="welcome-card">
              <span className="large-icon">⌖</span>
              <h2>Your next favourite place awaits.</h2>
              <p>
                Your personal food map will live here.
                Soon, you will be able to see all your saved
                restaurants across Goa.
              </p>
              <button
                className="primary-button"
                onClick={() => setActiveScreen('add')}
              >
                <span aria-hidden="true">+</span> Add your first place
              </button>
            </div>
          )}

          {activeScreen === 'share' && <ShareInbox />}

          {activeScreen === 'saved' && (
  <SavedPlaces
    version={restaurantsVersion}
    onChanged={() => setRestaurantsVersion((version) => version + 1)}
  />
)}

          
{activeScreen === 'add' && (
  <AddPlaceForm
    onSaved={() => {
      setRestaurantsVersion((version) => version + 1)
      setActiveScreen('saved')
    }}
  />
)}


          {activeScreen === 'settings' && (
            <div className="placeholder-card">
              <span className="large-icon">⚙</span>
              <h2>Settings</h2>
              <p>
                Map preferences, storage information, and
                data management will be added later.
              </p>
            </div>
          )}
        </section>

        <footer className="app-footer">
          Goa Eats <span>·</span> Discover. Save. Explore.
        </footer>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {screens.map((screen) => (
          <button
            key={screen.id}
            type="button"
            className={
              activeScreen === screen.id ? 'mobile-nav-item active' : 'mobile-nav-item'
            }
            onClick={() => setActiveScreen(screen.id)}
          >
            <span className="nav-icon" aria-hidden="true">
              {screen.icon}
            </span>
            <span>{screen.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

type AddPlaceFormProps = {
  onSaved: () => void
}

function AddPlaceForm({ onSaved }: AddPlaceFormProps) {
  const [name, setName] = useState('')
  const [locality, setLocality] = useState('')
  const [category, setCategory] = useState('')
  const [address, setAddress] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setSaving(true)

    try {
       await createSharedRestaurant({
  name,
  locality,
  category,
  address,
  sourceUrl,
  notes,
})

      setMessage('Restaurant saved successfully!')
      setName('')
      setLocality('')
      setCategory('')
      setAddress('')
      setSourceUrl('')
      setNotes('')

      window.setTimeout(onSaved, 700)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not save the restaurant.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="placeholder-card">
      <h2>Add a restaurant</h2>
      <p>Save a recommendation to your personal Goa Eats collection.</p>

      <form onSubmit={handleSubmit} className="restaurant-form">
        <label>
          Restaurant name *
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={150}
            placeholder="e.g. A favourite cafe"
          />
        </label>

        <label>
          Locality
          <input
            value={locality}
            onChange={(event) => setLocality(event.target.value)}
            placeholder="e.g. Anjuna"
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Choose a category</option>
            <option value="Cafe">Cafe</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Bakery">Bakery</option>
            <option value="Bar">Bar</option>
            <option value="Beach Shack">Beach Shack</option>
            <option value="Street Food">Street Food</option>
            <option value="Dessert">Dessert</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Address
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Street or landmark (optional)"
          />
        </label>

        <label>
          Original social media URL
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label>
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What caught your attention?"
            rows={3}
          />
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save restaurant'}
        </button>

        {message && <p role="status">{message}</p>}
      </form>
    </div>
  )
}

type SavedPlacesProps = {
  version: number
  onChanged: () => void
}

function SavedPlaces({ version, onChanged }: SavedPlacesProps) {
  const [restaurants, setRestaurants] = useState<import('./types/restaurant').Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadRestaurants() {
    setLoading(true)
    setError('')

    try {
      setRestaurants(await getSharedRestaurants())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load restaurants.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void loadRestaurants()
  }, [version])

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this restaurant from Goa Eats?')) return

    try {
      await deleteSharedRestaurant(id)
      await loadRestaurants()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete restaurant.')
    }
  }

  if (loading) {
    return <div className="placeholder-card"><p>Loading saved places…</p></div>
  }

  return (
    <div className="saved-places">
      <div className="saved-heading">
        <div>
          <h2>Your saved places</h2>
          <p>{restaurants.length} {restaurants.length === 1 ? 'place' : 'places'} saved</p>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      {restaurants.length === 0 ? (
        <div className="placeholder-card">
          <span className="large-icon">♡</span>
          <h2>No saved places yet</h2>
          <p>Add a restaurant to start building your Goa food collection.</p>
        </div>
      ) : (
        <div className="restaurant-list">
          {restaurants.map((restaurant) => (
            <article className="restaurant-card" key={restaurant.id}>
              <div className="restaurant-card-content">
                <h3>{restaurant.name}</h3>

                {(restaurant.locality || restaurant.category) && (
                  <p>
                    {[restaurant.locality, restaurant.category]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}

                {restaurant.address && <p>{restaurant.address}</p>}
                {restaurant.notes && <p>{restaurant.notes}</p>}

                {restaurant.sourceUrl && (
                  <p>
                    <a href={restaurant.sourceUrl} target="_blank" rel="noreferrer">
                      Original recommendation ↗
                    </a>
                  </p>
                )}

                <p className="restaurant-status">
                  {restaurant.verified ? 'Location verified' : 'Location not verified'}
                </p>
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() => void handleDelete(restaurant.id)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
