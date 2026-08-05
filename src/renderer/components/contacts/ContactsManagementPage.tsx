import React, { useMemo, useState } from 'react'

import { IContact } from '@shared/interfaces'

import { Modal } from '../ui'

import { ContactEditorModal } from './ContactEditorModal'
import './ContactsManagementPage.css'

interface ContactsManagementPageProps {
  contacts: IContact[]
  onImport: () => Promise<void>
  onExport: () => Promise<void>
  onContactsChange: (nextContacts: IContact[]) => void
}

type ContactDraft = Pick<IContact, 'name' | 'phone' | 'status'>

export function ContactsManagementPage({
  contacts,
  onImport,
  onExport,
  onContactsChange,
}: ContactsManagementPageProps): React.ReactElement {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingContact = useMemo(() => {
    if (!editingId) return undefined
    return contacts.find((c) => c.id === editingId)
  }, [contacts, editingId])

  const [draft, setDraft] = useState<ContactDraft>({
    name: '',
    phone: '',
    status: 'pendente',
  })

  const openEditorFor = (contact: IContact): void => {
    setEditingId(contact.id)
    setDraft({
      name: contact.name,
      phone: contact.phone,
      status: contact.status || 'pendente',
    })
    setEditorOpen(true)
  }

  const closeEditor = (): void => {
    setEditorOpen(false)
    setEditingId(null)
  }

  const handleSave = (): void => {
    if (!editingId) return

    const nextContacts = contacts.map((c) =>
      c.id === editingId
        ? {
            ...c,
            name: draft.name.trim(),
            phone: draft.phone.trim(),
            status: draft.status || 'pendente',
          }
        : c
    )

    onContactsChange(nextContacts)
    closeEditor()
  }

  const handleDelete = (id: string): void => {
    const target = contacts.find((c) => c.id === id)
    const ok = confirm(`Remover contato "${target?.name ?? 'desconhecido'}"?`)
    if (!ok) return

    onContactsChange(contacts.filter((c) => c.id !== id))
  }




  return (
    <div className="contacts-management">
      <div className="card-lg">
        <div className="contacts-management__header">
          <div>
            <h2 className="text-2xl font-bold">Gerenciamento de Contatos</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {contacts.length === 0
                ? 'Importe um arquivo CSV para começar.'
                : `Total de contatos: ${contacts.length}`}
            </p>
          </div>

          <div className="contacts-management__actions">
            <button className="btn-import" onClick={onImport}>
              Importar CSV
            </button>
            <button className="btn-export" onClick={onExport} disabled={contacts.length === 0}>
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="contacts-management__table-container">
          {contacts.length === 0 ? (
            <div className="contacts-empty contacts-empty--manager">
              <p>Nenhum contato adicionado</p>
              <small>Use "Importar CSV" para carregar contatos.</small>
            </div>
          ) : (
            <table className="contacts-table contacts-table--manager">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th className="contacts-table__actions-col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className={`row-${contact.status || 'pendente'}`}>
                    <td>{contact.name}</td>
                    <td>{contact.phone}</td>
                    <td>
                      <span className={`status-badge status-${contact.status || 'pendente'}`}>
                        {contact.status || 'pendente'}
                      </span>

                    </td>
                    <td className="contacts-table__actions-col">
                      <div className="contacts-actions-row">
                        <button className="btn-ghost" onClick={() => openEditorFor(contact)}>
                          Editar
                        </button>
                        <button className="btn-danger-ghost" onClick={() => handleDelete(contact.id)}>
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={editorOpen} onClose={closeEditor} size="lg">
        <ContactEditorModal
          title="Editar contato"
          initialDraft={draft}
          onChangeDraft={setDraft}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      </Modal>
    </div>
  )
}

