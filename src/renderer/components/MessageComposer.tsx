import React, { useState, useEffect, useMemo, useRef } from 'react'
import type { Template } from './templates'
import './MessageComposer.css'

interface MessageComposerProps {
  message: string
  onChange: (message: string) => void
  onSend: () => Promise<void>
  onCancel: () => Promise<void>
  isSending: boolean
  contactCount: number
  templates?: Template[]
}

interface TemplateTrigger {
  start: number
  end: number
  query: string
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  message,
  onChange,
  onSend,
  onCancel,
  isSending,
  contactCount,
  templates = [],
}) => {
  const [charCount, setCharCount] = useState(0)
  const [isCanceling, setIsCanceling] = useState(false)

  const [templateTrigger, setTemplateTrigger] = useState<TemplateTrigger | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const MAX_CHARS = 1000

  useEffect(() => {
    setCharCount(message.length)
  }, [message])

  const templateSuggestions = useMemo(() => {
    if (!templateTrigger) return []

    const query = templateTrigger.query.toLowerCase()
    return templates
      .filter((template) => {
        if (!query) return true
        return (
          template.name.toLowerCase().includes(query) ||
          template.content.toLowerCase().includes(query)
        )
      })
      .slice(0, 5)
  }, [templateTrigger, templates])

  const resolveTemplateTrigger = (value: string, caretPosition: number): TemplateTrigger | null => {
    const beforeCaret = value.slice(0, caretPosition)
    const start = beforeCaret.lastIndexOf('@')

    if (start === -1) return null
    if (start > 0 && !/\s/.test(value[start - 1])) return null

    const query = beforeCaret.slice(start + 1)
    if (/\s/.test(query)) return null

    return {
      start,
      end: caretPosition,
      query,
    }
  }

  const updateTemplateTrigger = (textarea: HTMLTextAreaElement): void => {
    setTemplateTrigger(resolveTemplateTrigger(textarea.value, textarea.selectionStart))
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_CHARS) {
      onChange(value)
      updateTemplateTrigger(e.target)
    }
  }

  const handleTemplateSelect = (template: Template): void => {
    if (!templateTrigger) return

    const nextMessage =
      message.slice(0, templateTrigger.start) + template.content + message.slice(templateTrigger.end)

    if (nextMessage.length > MAX_CHARS) {
      alert('O template excede o limite de caracteres da mensagem')
      return
    }

    const nextCaretPosition = templateTrigger.start + template.content.length
    onChange(nextMessage)
    setTemplateTrigger(null)

    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(nextCaretPosition, nextCaretPosition)
    }, 0)
  }

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Por favor, digite uma mensagem')
      return
    }

    if (contactCount === 0) {
      alert('Por favor, selecione contatos antes de enviar')
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
        ref={textareaRef}
        className="message-input"
        value={message}
        onChange={handleChange}
        onClick={(event) => updateTemplateTrigger(event.currentTarget)}
        onKeyUp={(event) => updateTemplateTrigger(event.currentTarget)}
        onBlur={() => setTemplateTrigger(null)}
        placeholder="Digite a mensagem que sera enviada para os contatos selecionados..."
        disabled={isSending}
      />
      {templateSuggestions.length > 0 && (
        <div className="template-suggestions" role="listbox">
          {templateSuggestions.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-suggestion"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleTemplateSelect(template)}
            >
              <span className="template-suggestion__name">{template.name}</span>
              <span className="template-suggestion__content">{template.content}</span>
            </button>
          ))}
        </div>
      )}

      <div className="message-footer">
        <div className="message-info">
          <span className="info-badge">
            {contactCount > 0 ? (
              <>
                <strong>{contactCount}</strong> contato{contactCount !== 1 ? 's' : ''}
              </>
            ) : (
              <span style={{ color: '#ff6b6b' }}>Selecione contatos para enviar</span>
            )}
          </span>
        </div>

        <div className="message-actions">
          {isSending && (
            <button
              className="btn-cancel-send"
              onClick={async () => {
                if (isCanceling) return
                setIsCanceling(true)
                try {
                  await onCancel()
                } finally {
                  setIsCanceling(false)
                }
              }}
              type="button"
              disabled={isCanceling}
            >
              {isCanceling ? 'Cancelando...' : 'Cancelar Envio'}
            </button>
          )}

          <button
            className="btn-send"
            onClick={handleSend}
            disabled={isSending || !message.trim() || contactCount === 0}
          >
            {isSending ? 'Enviando...' : 'Enviar Mensagens'}
          </button>
        </div>
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
