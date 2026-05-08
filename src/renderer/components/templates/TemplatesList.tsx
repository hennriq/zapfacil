import { ReactNode } from 'react'
import { Trash2, Edit2 } from 'lucide-react'
import { Button } from '../ui'

export interface Template {

  id: string
  name: string
  content: string
  characterCount: number
  createdAt: Date
  updatedAt: Date
}

interface TemplatesListProps {
  templates: Template[]
  onEdit?: (template: Template) => void
  onDelete?: (id: string) => void
  onNew?: () => void
}

export function TemplatesList({ templates, onEdit, onDelete, onNew }: TemplatesListProps): ReactNode {
  return (
    <div className="card-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Templates de Mensagem</h3>
        <Button variant="primary" size="sm" onClick={onNew}>
          + Novo Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum template criado ainda</p>
          <Button variant="primary" onClick={onNew}>
            Criar Primeiro Template
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                  {template.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {template.characterCount} caracteres
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Edit2}
                  onClick={() => onEdit?.(template)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => onDelete?.(template.id)}
                >
                  Deletar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
