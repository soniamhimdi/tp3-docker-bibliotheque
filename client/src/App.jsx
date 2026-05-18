import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const statusStyle = {
  'à lire':  { bg: '#fcebeb', color: '#a32d2d', border: '#e24b4a' },
  'en cours': { bg: '#faeeda', color: '#854f0b', border: '#ef9f27' },
  'lu':       { bg: '#eaf3de', color: '#3b6d11', border: '#639922' },
}

const cycle = { 'à lire': 'en cours', 'en cours': 'lu', 'lu': 'à lire' }

function BookCover({ coverId, title }) {
  const [imgError, setImgError] = useState(false)

  if (coverId && !imgError) {
    return (
      <img
        src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
        alt={`Couverture de ${title}`}
        onError={() => setImgError(true)}
        style={{
          width: '52px', height: '72px',
          objectFit: 'cover', borderRadius: '4px', flexShrink: 0
        }}
      />
    )
  }

  return (
    <div style={{
      width: '52px', height: '72px', borderRadius: '4px',
      flexShrink: 0, background: '#e0d9f7',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '24px'
    }}>
      📖
    </div>
  )
}

function App() {
  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addedKeys, setAddedKeys] = useState(new Set())

  // Charger les livres au démarrage
  useEffect(() => {
  fetch(`${API_URL}/books`)
    .then(res => res.json())
    .then(data => {
      // Vérifier que c'est bien un tableau avant de l'utiliser
      if (Array.isArray(data)) {
        setBooks(data)
        const keys = new Set(data.map(b => b.openLibraryKey).filter(Boolean))
        setAddedKeys(keys)
      } else {
        setError('Erreur de chargement des livres')
      }
      setLoading(false)
    })
    .catch(() => {
      setError("Impossible de contacter l'API")
      setLoading(false)
    })
}, [])
  // Rechercher via Open Library
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data)
    } catch {
      setError('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }

  // Ajouter un livre
  const handleAdd = async (book) => {
    try {
      const res = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      })
      const saved = await res.json()
      setBooks([saved, ...books])
      setAddedKeys(prev => new Set([...prev, book.openLibraryKey]))
    } catch {
      setError('Erreur lors de l\'ajout')
    }
  }

  // Changer le statut
  const handleStatus = async (id) => {
    try {
      const res = await fetch(`${API_URL}/books/${id}/status`, { method: 'PATCH' })
      const updated = await res.json()
      setBooks(books.map(b => b._id === id ? updated : b))
    } catch {
      setError('Erreur lors du changement de statut')
    }
  }

  // Supprimer un livre
  const handleDelete = async (id, key) => {
    try {
      await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' })
      setBooks(books.filter(b => b._id !== id))
      setAddedKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  const counts = {
    'à lire': books.filter(b => b.status === 'à lire').length,
    'en cours': books.filter(b => b.status === 'en cours').length,
    'lu': books.filter(b => b.status === 'lu').length,
  }

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>

      <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>📚 Ma Bibliothèque</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>
        Propulsé par{' '}
        <a href="https://openlibrary.org" target="_blank" rel="noreferrer">
          Open Library
        </a>
      </p>

      {/* Recherche */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0, fontSize: '16px' }}>Rechercher un livre</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Titre, auteur..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '15px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <button
            type="submit"
            style={{ padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            {searching ? '...' : 'Rechercher'}
          </button>
        </form>

        {/* Résultats */}
        {searchResults.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {searchResults.map(result => {
              const alreadyAdded = addedKeys.has(result.openLibraryKey)
              return (
                <div
                  key={result.openLibraryKey}
                  style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px', display: 'flex', gap: '10px' }}
                >
                  <BookCover coverId={result.coverId} title={result.title} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 2px', lineHeight: '1.3' }}>
                      {result.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 2px' }}>{result.author}</p>
                    {result.year && (
                      <p style={{ fontSize: '11px', color: '#999', margin: '0 0 8px' }}>{result.year}</p>
                    )}
                    <button
                      onClick={() => !alreadyAdded && handleAdd(result)}
                      disabled={alreadyAdded}
                      style={{
                        padding: '4px 10px', fontSize: '12px', borderRadius: '4px',
                        border: '1px solid #ccc',
                        background: alreadyAdded ? '#e8f5e9' : '#2c3e50',
                        color: alreadyAdded ? '#2e7d32' : 'white',
                        cursor: alreadyAdded ? 'default' : 'pointer'
                      }}
                    >
                      {alreadyAdded ? '✓ Ajouté' : '+ Ajouter'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Compteurs */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
          {Object.entries(counts).map(([status, count]) => (
            <div
              key={status}
              style={{ background: statusStyle[status].bg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}
            >
              <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', color: statusStyle[status].color }}>{count}</p>
              <p style={{ fontSize: '13px', margin: '2px 0 0', color: statusStyle[status].color }}>{status}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: 'red' }}>⚠️ {error}</p>}
      {loading && <p style={{ textAlign: 'center' }}>Chargement...</p>}

      {/* Liste des livres */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {books.map(book => {
          const s = statusStyle[book.status] || statusStyle['à lire']
          return (
            <div
              key={book._id}
              style={{
                background: 'white', borderRadius: '10px', padding: '14px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                borderLeft: `5px solid ${s.border}`,
                display: 'flex', gap: '14px', alignItems: 'center'
              }}
            >
              <BookCover coverId={book.coverId} title={book.title} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 2px' }}>{book.title}</p>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px' }}>
                  ✍️ {book.author}{book.year ? ` · ${book.year}` : ''}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '12px', background: s.bg, color: s.color,
                    padding: '3px 10px', borderRadius: '12px', fontWeight: '500'
                  }}>
                    {book.status}
                  </span>
                  <button
                    onClick={() => handleStatus(book._id)}
                    style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: 'white' }}
                  >
                    → {cycle[book.status]}
                  </button>
                  <button
                    onClick={() => handleDelete(book._id, book.openLibraryKey)}
                    style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', border: '1px solid #fcc', color: '#c0392b', background: 'white', cursor: 'pointer' }}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!loading && books.length === 0 && (
        <p style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>
          Recherchez un livre et ajoutez-le à votre bibliothèque.
        </p>
      )}
    </div>
  )
}

export default App