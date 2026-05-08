import React, { useEffect, useRef, useState } from 'react'
import './StatusMonitor.css'

export interface StatusLog {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

interface StatusMonitorProps {
  logs: StatusLog[]
  onClear: () => void
}

const StatusMonitor: React.FC<StatusMonitorProps> = ({ logs, onClear }) => {
  const [autoScroll, setAutoScroll] = useState(true)
  const logsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [autoScroll, logs])

  const downloadLogs = () => {
    const logsText = logs
      .map((log) => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs_${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
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
          <button className="btn-secondary" onClick={onClear} disabled={logs.length === 0}>
            Limpar
          </button>
        </div>
      </div>

      <div className="monitor-logs" ref={logsRef}>
        {logs.length === 0 ? (
          <div className="logs-empty">
            <p>Nenhum log para exibir</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-entry log-${log.level}`}>
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className="log-level">[{log.level.toUpperCase()}]</span>
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
