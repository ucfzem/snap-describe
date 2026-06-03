import { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export default function ImageCaptionApp() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  const previewRef = useRef(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const validateFile = (file) => {
    if (!file) return 'No file selected'
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Format not supported (use JPEG, PNG, or WebP)'
    if (file.size > MAX_SIZE) return 'Image too large (max 10 MB)'
    return null
  }

  const handleFile = (file) => {
    const err = validateFile(file)
    if (err) { setError(err); return }
    setError(null)
    setResult(null)
    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async () => {
    if (!image) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', image)

    try {
      const res = await fetch(`${API_URL}/generate-caption`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}`)
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to generate caption')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', padding: 24,
      fontFamily: 'system-ui, sans-serif', color: '#1a1a1a'
    }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Snap & Describe</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 24 }}>
        Upload an image to generate a title and description
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? '#007bff' : '#ccc'}`,
          borderRadius: 12, padding: 40, textAlign: 'center',
          cursor: 'pointer', background: dragOver ? '#f0f7ff' : '#fafafa',
          transition: 'all 0.2s'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        {preview ? (
          <img
            ref={previewRef}
            src={preview}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
          />
        ) : (
          <p style={{ margin: 0, color: '#999' }}>
            Click or drop an image here
          </p>
        )}
      </div>

      {error && (
        <p style={{ color: '#d32f2f', fontSize: 14, marginTop: 12 }}>{error}</p>
      )}

      {image && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', marginTop: 16, padding: '12px 0',
            backgroundColor: loading ? '#999' : '#007bff',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Analyzing\u2026' : 'Generate Title & Description'}
        </button>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{
            width: 32, height: 32, border: '3px solid #e0e0e0',
            borderTopColor: '#007bff', borderRadius: '50%',
            margin: '0 auto', animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 20, padding: 16,
          background: '#f4f4f9', borderRadius: 10
        }}>
          <h3 style={{ margin: '0 0 8px', color: '#333' }}>{result.title}</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: 1.5 }}>
            {result.description}
          </p>
        </div>
      )}
    </div>
  )
}
