import React, { useState, useEffect } from 'react'
import './StatusMonitor.css'

interface StatusLog {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

const StatusMonitor: React.FC = () => {
  const [logs, setLogs] = useState<StatusLog[]>([])
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    // Simular logs do IPC ou eventos
    const listener = (message: string) => {
      const newLog: StatusLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level: 'info',
        message,
      }
      setLogs((prev) => [...prev.slice(-99), newLog]) // Manter últimos 100 logs
    }

    // TODO: Conectar ao IPC real
    // window.electronAPI.on('app:log', listener)

    return () => {
      // Cleanup
    }
  }, [])

  const clearLogs = () => {
    setLogs([])
  }

  const downloadLogs = () => {
    const logsText = logs
      .map((log) => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs_${new Date().getTime()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'success':
        return '#28a745'
      case 'warning':
        return '#ffc107'
      case 'error':
        return '#dc3545'
      case 'info':
      default:
        return '#667eea'
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="status-monitor">
      <div className="monitor-header">
        <h3>Monitor de Status</h3>
        <div className="monitor-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto scroll
          </label>
          <button className="btn-secondary" onClick={downloadLogs} disabled={logs.length === 0}>
            Download
          </button>
          <button className="btn-secondary" onClick={clearLogs} disabled={logs.length === 0}>
            Limpar
          </button>
        </div>
      </div>

      <div className="monitor-logs">
        {logs.length === 0 ? (
          <div className="logs-empty">
            <p>Nenhum log para exibir</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-entry log-${log.level}`}>
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="monitor-footer">
        <small>{logs.length} log(s)</small>
      </div>
    </div>
  )
}

export default StatusMonitor
