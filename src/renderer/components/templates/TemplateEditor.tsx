import { ReactNode, useState, useEffect } from 'react'
import { Button } from '../ui'
import { Template } from './TemplatesList'

const AVAILABLE_VARIABLES = [
  { name: 'nome', placeholder: '{{nome}}', description: 'Nome do contato' },
  { name: 'telefone', placeholder: '{{telefone}}', description: 'Telefone do contato' },
  { name: 'empresa', placeholder: '{{empresa}}', description: 'Empresa do contato' },
  { name: 'data', placeholder: '{{data}}', description: 'Data atual' },
  { name: 'hora', placeholder: '{{hora}}', description: 'Hora atual' },
]

interface TemplateEditorProps {
  template?: Template
  onSave?: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onCancel?: () => void
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps): ReactNode {
  const [name, setName] = useState(template?.name || '')
  const [content, setContent] = useState(template?.content || '')
  const [preview, setPreview] = useState('')

  useEffect(() => {
    // Gerar preview com valores de exemplo
    let previewText = content
    previewText = previewText.replace(/{{nome}}/g, 'Bruno')
    previewText = previewText.replace(/{{telefone}}/g, '21 98765-4321')
    previewText = previewText.replace(/{{empresa}}/g, 'Empresa XYZ')
    previewText = previewText.replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
    previewText = previewText.replace(/{{hora}}/g, new Date().toLocaleTimeString('pt-BR'))
    setPreview(previewText)
  }, [content])

  const handleInsertVariable = (placeholder: string): void => {
    setContent((prev) => prev + ' ' + placeholder)
  }

  const handleSave = (): void => {
    if (!name.trim() || !content.trim()) {
      alert('Nome e conteúdo são obrigatórios')
      return
    }

    onSave?.({
      id: template?.id,
      name: name.trim(),
      content: content.trim(),
      characterCount: content.trim().length,
    })
  }

  return (
    <div className="card-lg space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-6">{template ? 'Editar Template' : 'Novo Template'}</h3>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="label">Nome do Template</label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Boas-vindas, Promoção, Cobrança"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Variables Helper */}
        <div>
          <label className="label">Variáveis Disponíveis</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <button
                key={variable.name}
                onClick={() => handleInsertVariable(variable.placeholder)}
                className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
                title={variable.description}
              >
                {variable.placeholder}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Clique em uma variável para inserir no template
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="label">Conteúdo do Template</label>
          <textarea
            className="input min-h-[150px] font-mono"
            placeholder="Olá {{nome}}, seja bem-vindo!"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {content.length} caracteres (Max: 1000)
            </p>
            {content.length > 1000 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Limite excedido em {content.length - 1000} caracteres
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="label">Preview</label>
          <div className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-[100px] text-gray-900 dark:text-white whitespace-pre-wrap break-words text-sm">
            {preview || 'Preencha o template para ver o preview'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!name.trim() || !content.trim() || content.length > 1000}
        >
          {template ? 'Atualizar' : 'Criar'} Template
        </Button>
      </div>
    </div>
  )
}
