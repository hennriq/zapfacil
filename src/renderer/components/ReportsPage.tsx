import React from 'react'
import { PerformanceSummary, TelemetrySummary } from '@shared/appTypes'

interface ReportsPageProps {
  telemetrySummary: TelemetrySummary
  performanceSummary: PerformanceSummary | null
  onRefresh: () => Promise<void>
}

const formatBytes = (value: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let current = value
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(1)} ${units[index]}`
}

const ReportsPage: React.FC<ReportsPageProps> = ({ telemetrySummary, performanceSummary, onRefresh }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Relatórios & Monitoramento</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Métricas de uso e desempenho da aplicação.
          </p>
        </div>
        <button className="btn-secondary" onClick={onRefresh}>
          Atualizar dados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-panel">
          <h3 className="text-xl font-semibold mb-2">Eventos de Telemetria</h3>
          <p className="text-4xl font-bold">{telemetrySummary.totalEvents}</p>
          <p className="text-sm text-gray-500">Eventos registrados até o momento</p>
        </div>
        <div className="card-panel">
          <h3 className="text-xl font-semibold mb-2">Último Evento</h3>
          <p className="text-base text-gray-900 dark:text-gray-100">
            {telemetrySummary.lastEventAt || 'Nenhum evento registrado'}
          </p>
        </div>
        <div className="card-panel">
          <h3 className="text-xl font-semibold mb-2">Uso de CPU</h3>
          <p className="text-4xl font-bold">
            {performanceSummary ? `${performanceSummary.cpuUsageMs} ms` : 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Tempo de CPU do processo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-panel">
          <h3 className="text-xl font-semibold mb-4">Detalhes de Telemetria</h3>
          {Object.entries(telemetrySummary.eventsByName).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(telemetrySummary.eventsByName).map(([name, count]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nenhum evento registrado ainda.</p>
          )}
        </div>

        <div className="card-panel">
          <h3 className="text-xl font-semibold mb-4">Uso de Memória</h3>
          {performanceSummary ? (
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
              <li>RSS: {formatBytes(performanceSummary.rss)}</li>
              <li>Heap Total: {formatBytes(performanceSummary.heapTotal)}</li>
              <li>Heap Usado: {formatBytes(performanceSummary.heapUsed)}</li>
              <li>External: {formatBytes(performanceSummary.external)}</li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Perfis de desempenho indisponíveis.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
