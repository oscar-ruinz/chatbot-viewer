import React, { useEffect, useState, useRef } from 'react'

// Minimal styles are in styles.css
export default function ChatbotConversationViewer({ apiBase = '/api' }) {
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const chatEndRef = useRef(null)

  function safeParseMessage(raw) {
    if (!raw && raw !== 0) return { type: 'unknown', content: String(raw) }
    if (typeof raw === 'object') return raw
    try {
      let parsed = JSON.parse(raw)
      if (typeof parsed === 'string') parsed = JSON.parse(parsed)
      return parsed
    } catch (e) {
      // simple fallback: try to extract content
      const m = typeof raw === 'string' && raw.match(/"content"\s*:\s*"([\s\S]*?)"/)
      if (m) return { type: 'unknown', content: m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') }
      return { type: 'unknown', content: String(raw) }
    }
  }

  async function loadConversations() {
    setLoadingConvs(true)
    try {
      const res = await fetch(`${apiBase}/conversations`)
      const data = await res.json()
      setConversations(data)
    } catch (err) {
      console.error(err)
      setConversations([])
    } finally {
      setLoadingConvs(false)
    }
  }

  async function loadMessages(conv) {
    setLoadingMsgs(true)
    try {
      const res = await fetch(`${apiBase}/conversations/${encodeURIComponent(conv)}/messages`)
      const data = await res.json()
      const transformed = data.map(d => ({ ...d, parsed: safeParseMessage(d.message) }))
      setMessages(transformed)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (err) {
      console.error(err)
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }

  useEffect(() => { loadConversations() }, [])
  useEffect(() => { if (selectedConv) loadMessages(selectedConv) }, [selectedConv])

  const filtered = conversations.filter(c => c.session_id.toLowerCase().includes(search.toLowerCase()) || (c.preview||'').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Conversaciones</h3>
          <button onClick={loadConversations}>Refrescar</button>
        </div>
        <input className="search" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="conv-list">
          {loadingConvs ? <div className="muted">Cargando...</div> :
            filtered.map(c => (
              <div key={c.session_id} className={`conv-item ${selectedConv===c.session_id ? 'selected' : ''}`} onClick={()=>setSelectedConv(c.session_id)}>
                <div className="conv-id">{c.nombre_completo}</div>
                <div className="conv-preview">{c.preview || '—'}</div>
              </div>
            ))
          }
        </div>
      </aside>
      <main className="main">
        <div className="main-header">
          <div>
            <div className="muted">Vista de conversación</div>
            <div className="selected-id">{selectedConv || 'Ninguna seleccionada'}</div>
          </div>
          <div>
            <button onClick={()=>selectedConv && loadMessages(selectedConv)}>Refrescar mensajes</button>
          </div>
        </div>
        <div className="chat-area">
          {selectedConv ? (
            loadingMsgs ? <div className="muted">Cargando mensajes...</div> :
            messages.length===0 ? <div className="muted">No hay mensajes.</div> :
            messages.map(m => {
              const p = m.parsed || safeParseMessage(m.message)
              const isHuman = (p.type||'').toLowerCase()==='human'
              const content = p.content || JSON.stringify(p)
              return (
                <div key={m.id} className={`bubble-row ${isHuman ? 'right' : 'left'}`}>
                  <div className={`bubble ${isHuman ? 'human' : 'ai'}`}>
                    <div className="bubble-text">{content}</div>
                    <div className="bubble-meta">#{m.id} • {p.type || 'unknown'}</div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="muted center">Selecciona una conversación a la izquierda</div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>
    </div>
  )
}
