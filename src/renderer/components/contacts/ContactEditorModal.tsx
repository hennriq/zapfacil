import React, { useEffect, useState } from 'react'
import { IContact } from '@shared/interfaces'



interface ContactEditorModalProps {
  title: string
  initialDraft: Pick<IContact, 'name' | 'phone' | 'status'>
  onChangeDraft: (draft: Pick<IContact, 'name' | 'phone' | 'status'>) => void
  onSave: () => void
  onCancel: () => void
}

export function ContactEditorModal({
  title,
  initialDraft,
  onChangeDraft,
  onSave,
  onCancel,
}: ContactEditorModalProps): React.ReactElement {
  const [local, setLocal] = useState(initialDraft)

  useEffect(() => {
    setLocal(initialDraft)
  }, [initialDraft])

  const setField = <K extends keyof typeof local>(
    key: K,
    value: (typeof local)[K]
  ): void => {
    const next = { ...local, [key]: value }
    setLocal(next)
    onChangeDraft(next)
  }

  const canSave = local.name.trim().length > 0 && local.phone.trim().length > 0

  return (
    <div className="contact-editor">
      <div className="contact-editor__header">
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="contact-name">
            Nome
          </label>
          <input
            id="contact-name"
            className="form-input"
            value={local.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Nome do contato"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="contact-phone">
            Telefone
          </label>
          <input
            id="contact-phone"
            className="form-input"
            value={local.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="Ex: +55 11 99999-9999"
          />
        </div>
      </div>

      <div className="contact-editor__footer">
        <button className="btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={onSave} disabled={!canSave}>
          Salvar
        </button>
      </div>

      {!canSave && (
        <p className="text-sm text-gray-500 mt-2">Informe nome e telefone para salvar.</p>
      )}
    </div>
  )
}

