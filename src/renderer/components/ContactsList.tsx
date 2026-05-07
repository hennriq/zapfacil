import React, { useState } from 'react'
import { IContact } from '@shared/interfaces'
import './ContactsList.css'

interface ContactsListProps {
  contacts: IContact[]
  onImport: (contacts: IContact[]) => void
}

const ContactsList: React.FC<ContactsListProps> = ({ contacts, onImport }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n').filter((line) => line.trim())

        const importedContacts: IContact[] = lines
          .slice(1) // Skip header
          .map((line, index) => {
            const [name, phone] = line.split(',')
            return {
              id: `contact-${index}`,
              name: name?.trim() || '',
              phone: phone?.trim() || '',
              status: 'pendente' as const,
            }
          })
          .filter((c) => c.name && c.phone)

        onImport(importedContacts)
      } catch (error) {
        console.error('Error importing contacts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    reader.readAsText(file)
  }

  const handleExport = () => {
    if (contacts.length === 0) {
      alert('Nenhum contato para exportar')
      return
    }

    const csv = [
      'name,phone,status',
      ...contacts.map((c) => `"${c.name}","${c.phone}","${c.status || 'pendente'}"`),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contacts_${new Date().getTime()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="contacts-list">
      <div className="contacts-header">
        <h2>Contatos ({contacts.length})</h2>
        <div className="contacts-actions">
          <label className="btn-import">
            {isLoading ? 'Importando...' : 'Importar CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isLoading}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn-export" onClick={handleExport} disabled={contacts.length === 0}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="contacts-table-container">
        {contacts.length === 0 ? (
          <div className="contacts-empty">
            <p>Nenhum contato adicionado</p>
            <small>Importe um arquivo CSV para começar</small>
          </div>
        ) : (
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className={`status-${contact.status}`}>
                  <td>{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td>
                    <span className={`status-badge status-${contact.status}`}>
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
