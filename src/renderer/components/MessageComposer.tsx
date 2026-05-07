import React, { useState, useEffect } from 'react'
import './MessageComposer.css'

interface MessageComposerProps {
  message: string
  onChange: (message: string) => void
  onSend: () => Promise<void>
  isSending: boolean
  contactCount: number
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  message,
  onChange,
  onSend,
  isSending,
  contactCount,
}) => {
  const [charCount, setCharCount] = useState(0)
  const MAX_CHARS = 1000

  useEffect(() => {
    setCharCount(message.length)
  }, [message])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_CHARS) {
      onChange(value)
    }
  }

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Por favor, digite uma mensagem')
      return
    }

    if (contactCount === 0) {
      alert('Por favor, adicione contatos antes de enviar')
      return
    }

    if (confirm(`Enviar mensagem para ${contactCount} contato(s)?`)) {
      await onSend()
    }
  }

  const remainingChars = MAX_CHARS - charCount
  const charCountColor = remainingChars < 50 ? '#ff6b6b' : '#999'

  return (
    <div className="message-composer">
      <div className="message-header">
        <h3>Mensagem</h3>
        <span className="char-count" style={{ color: charCountColor }}>
          {charCount}/{MAX_CHARS}
        </span>
      </div>

      <textarea
        className="message-input"
        value={message}
        onChange={handleChange}
        placeholder="Digite a mensagem que será enviada para todos os contatos..."
        disabled={isSending}
      />

      <div className="message-footer">
        <div className="message-info">
          <span className="info-badge">
            {contactCount > 0 ? (
              <>
                <strong>{contactCount}</strong> contato{contactCount !== 1 ? 's' : ''}
              </>
            ) : (
              <span style={{ color: '#ff6b6b' }}>Adicione contatos para enviar</span>
            )}
          </span>
        </div>

        <button
          className="btn-send"
          onClick={handleSend}
          disabled={isSending || !message.trim() || contactCount === 0}
        >
          {isSending ? 'Enviando...' : 'Enviar Mensagens'}
        </button>
      </div>

      {isSending && (
        <div className="sending-progress">
          <div className="spinner"></div>
          <span>Enviando mensagens...</span>
        </div>
      )}
    </div>
  )
}

export default MessageComposer
