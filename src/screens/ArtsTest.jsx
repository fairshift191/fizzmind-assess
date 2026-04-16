import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { getRandomArtsPrompt } from '../assessment/arts-prompts.js'
import { supabase } from '../lib/supabase.js'

const prompt = getRandomArtsPrompt()

export default function ArtsTest({ studentName, onComplete }) {
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 50 * 1024 * 1024) { setError('File must be under 50MB'); return }
    setFile(f)
    setError('')
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit() {
    if (!file && !description.trim()) {
      setError('Please upload a creative piece or write a description')
      return
    }

    setUploading(true)
    setError('')

    let fileUrl = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `arts-test/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('challenges').upload(path, file)
      if (uploadErr) {
        setError('Upload failed: ' + uploadErr.message)
        setUploading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('challenges').getPublicUrl(path)
      fileUrl = publicUrl
    }

    onComplete({
      fileUrl,
      description: description.trim(),
      prompt: prompt.title,
      fileName: file?.name,
      fileType: file?.type,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        background: '#0A0B0F',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: '680px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: '99px',
            background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)',
            fontSize: '12px', fontWeight: 600, color: '#EC4899',
            marginBottom: '16px',
          }}>
            Creative Arts Challenge
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.75rem', fontWeight: 700, color: '#E8E8ED',
            marginBottom: '8px',
          }}>
            Hey {studentName}, time to create!
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
            There are no wrong answers. We want to see how you think, not how "good" your art is.
          </p>
        </div>

        {/* Prompt Card */}
        <div style={{
          background: '#1A1D26', border: '1px solid #2A2D36', borderRadius: '16px',
          padding: '28px', marginBottom: '28px',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: '#EC4899', marginBottom: '12px',
          }}>
            Your Prompt
          </div>
          <h2 style={{
            fontSize: '1.25rem', fontWeight: 700, color: '#E8E8ED', marginBottom: '12px',
          }}>
            {prompt.title}
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
            {prompt.prompt}
          </p>
          <p style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic',
            padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
          }}>
            {prompt.hint}
          </p>
        </div>

        {/* Upload */}
        <div style={{
          background: '#1A1D26', border: '1px solid #2A2D36', borderRadius: '16px',
          padding: '28px', marginBottom: '28px',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '16px',
          }}>
            Upload Your Creation
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,audio/*,.pdf"
            onChange={handleFile}
            style={{ display: 'none' }}
          />

          {!file ? (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '32px', borderRadius: '12px',
                border: '2px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)',
                color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; e.currentTarget.style.color = '#EC4899' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
              Drop your file here or click to browse
              <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>
                Images, video, audio, or PDF — up to 50MB
              </div>
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            }}>
              {preview && (
                <img src={preview} alt="Preview" style={{
                  width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px',
                }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8E8ED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setPreview(null) }}
                style={{
                  padding: '6px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444',
                  fontSize: '12px', cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{
          background: '#1A1D26', border: '1px solid #2A2D36', borderRadius: '16px',
          padding: '28px', marginBottom: '28px',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '12px',
          }}>
            Tell us about your piece
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What did you create? What does it mean to you? What inspired your choices?"
            maxLength={2500}
            style={{
              width: '100%', minHeight: '140px', padding: '14px',
              background: '#0D0F12', border: '1px solid #2A2D36', borderRadius: '10px',
              color: '#E8E8ED', fontSize: '14px', lineHeight: 1.6,
              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '6px', textAlign: 'right' }}>
            {description.length} / 2500
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444', fontSize: '13px', marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={uploading}
          style={{
            width: '100%', padding: '16px', borderRadius: '12px',
            background: uploading ? '#555' : '#EC4899', color: 'white',
            fontSize: '15px', fontWeight: 600, border: 'none',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {uploading ? 'Uploading...' : 'Submit My Creation'}
        </button>
      </div>
    </motion.div>
  )
}
