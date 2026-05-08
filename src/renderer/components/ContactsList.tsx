import React from 'react'
import { IContact } from '@shared/interfaces'
import './ContactsList.css'

interface ContactsListProps {
  contacts: IContact[]
  selectedContactIds: string[]
  onSelectedContactIdsChange: (selectedContactIds: string[]) => void
  selectionDisabled?: boolean
  onImport: () => Promise<void>
  onExport: () => Promise<void>
}

const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  selectedContactIds,
  onSelectedContactIdsChange,
  selectionDisabled = false,
  onImport,
  onExport,
}) => {
  const selectedIds = new Set(selectedContactIds)
  const allSelected = contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id))

  const handleToggleAll = (checked: boolean): void => {
    onSelectedContactIdsChange(checked ? contacts.map((contact) => contact.id) : [])
  }

  const handleToggleContact = (contactId: string, checked: boolean): void => {
    if (checked) {
      onSelectedContactIdsChange([...selectedContactIds, contactId])
      return
    }

    onSelectedContactIdsChange(selectedContactIds.filter((id) => id !== contactId))
  }

  return (
    <div className="contacts-list">
      <div className="contacts-header">
        <h2>
          Contatos ({selectedContactIds.length}/{contacts.length})
        </h2>
        <div className="contacts-actions">
          <button className="btn-import" onClick={onImport}>
            Importar CSV
          </button>
          <button className="btn-export" onClick={onExport} disabled={contacts.length === 0}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="contacts-table-container">
        {contacts.length === 0 ? (
          <div className="contacts-empty">
            <p>Nenhum contato adicionado</p>
            <small>Importe um arquivo CSV para comecar</small>
          </div>
        ) : (
          <table className="contacts-table">
            <thead>
              <tr>
                <th className="contacts-table__select-col">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos os contatos"
                    checked={allSelected}
                    disabled={selectionDisabled || contacts.length === 0}
                    onChange={(event) => handleToggleAll(event.target.checked)}
                  />
                </th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`row-${contact.status || 'pendente'} ${
                    selectedIds.has(contact.id) ? 'contacts-table__row--selected' : ''
                  }`}
                >
                  <td className="contacts-table__select-col">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${contact.name}`}
                      checked={selectedIds.has(contact.id)}
                      disabled={selectionDisabled}
                      onChange={(event) => handleToggleContact(contact.id, event.target.checked)}
                    />
                  </td>
                  <td>{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td>
                    <span className={`status-badge status-${contact.status || 'pendente'}`}>
                      {contact.status || 'pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ContactsList
