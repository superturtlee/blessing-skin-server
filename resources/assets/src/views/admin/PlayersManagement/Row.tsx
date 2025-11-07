import React from 'react'
import { t } from '@/scripts/i18n'
import type { Player } from '@/scripts/types'
import ButtonEdit from '@/components/ButtonEdit'

interface Props {
  player: Player
  uuid: string | null
  onlineChatEnabled: boolean | null
  multiplayerServerEnabled: boolean | null
  blocked: boolean | null
  telemetryEnabled: boolean | null
  optionalTelemetry: boolean | null
  onUpdateName(): void
  onUpdateOwner(): void
  onUpdateTexture(): void
  onDelete(): void
  onToggleChat(): void
  onToggleMultiplayer(): void
  onToggleBlocklist(): void
  onToggleTelemetry(): void
  onToggleOptionalTelemetry(): void
  onDownloadTelemetry(): void
  onClearTelemetry(): void
  onCopyUuid(uuid: string): void
}

const Row: React.FC<Props> = (props) => {
  const {
    player,
    uuid,
    onlineChatEnabled,
    multiplayerServerEnabled,
    blocked,
    telemetryEnabled,
    optionalTelemetry,
  } = props

  return (
    <tr>
      <td>{player.pid}</td>
      <td>
        {uuid ? (
          <span
            title="Click to copy UUID"
            style={{ cursor: 'pointer', fontFamily: 'monospace' }}
            onClick={() => props.onCopyUuid(uuid)}
            className="text-primary"
          >
            <i className="fas fa-copy mr-1"></i>
            {uuid.slice(0, 8)}...
          </span>
        ) : (
          '-'
        )}
      </td>
      <td>
        {player.name}
        <span className="ml-1">
          <ButtonEdit
            title={t('admin.changePlayerName')}
            onClick={props.onUpdateName}
          />
        </span>
      </td>
      <td>
        {player.uid}
        <span className="ml-1">
          <ButtonEdit
            title={t('admin.changeOwner')}
            onClick={props.onUpdateOwner}
          />
        </span>
      </td>
      <td>
        {player.tid_skin > 0 && (
          <a
            href={`${blessing.base_url}/skinlib/show/${player.tid_skin}`}
            target="_blank"
            className="mr-1"
          >
            <img
              src={`${blessing.base_url}/preview/${player.tid_skin}`}
              alt={`${player.name} - ${t('general.skin')}`}
              width="64"
            />
          </a>
        )}
        {player.tid_cape > 0 && (
          <a
            href={`${blessing.base_url}/skinlib/show/${player.tid_cape}`}
            target="_blank"
          >
            <img
              src={`${blessing.base_url}/preview/${player.tid_cape}`}
              alt={`${player.name} - ${t('general.cape')}`}
              width="64"
            />
          </a>
        )}
      </td>
      <td>{player.last_modified}</td>

      {/* Clickable badge to toggle chat (Allowed/Muted) */}
      <td>
        {onlineChatEnabled == null ? (
          '-'
        ) : (
          <span
            className={`badge ${onlineChatEnabled ? 'bg-success' : 'bg-secondary'}`}
            style={{ cursor: 'pointer' }}
            role="button"
            title={onlineChatEnabled ? 'Click to mute' : 'Click to allow chat'}
            onClick={(e) => {
              e.preventDefault()
              props.onToggleChat()
            }}
          >
            {onlineChatEnabled ? 'Allowed' : 'Muted'}
          </span>
        )}
      </td>

      {/* Clickable badge to toggle server access (Allowed/Blocked) */}
      <td>
        {multiplayerServerEnabled == null ? (
          '-'
        ) : (
          <span
            className={`badge ${multiplayerServerEnabled ? 'bg-success' : 'bg-danger'}`}
            style={{ cursor: 'pointer' }}
            role="button"
            title={
              multiplayerServerEnabled
                ? 'Click to block server access'
                : 'Click to allow server access'
            }
            onClick={(e) => {
              e.preventDefault()
              props.onToggleMultiplayer()
            }}
          >
            {multiplayerServerEnabled ? 'Allowed' : 'Blocked'}
          </span>
        )}
      </td>

      {/* Clickable badge to toggle system blocklist */}
      <td>
        {uuid == null ? (
          <span className="badge bg-secondary">No UUID</span>
        ) : blocked == null ? (
          '-'
        ) : (
          <span
            className={`badge ${blocked ? 'bg-danger' : 'bg-success'}`}
            style={{ cursor: 'pointer' }}
            role="button"
            title={blocked ? 'Click to unblock' : 'Click to block'}
            onClick={(e) => {
              e.preventDefault()
              props.onToggleBlocklist()
            }}
          >
            {blocked ? 'Blocked' : 'Not Blocked'}
          </span>
        )}
      </td>

      {/* Clickable badge to toggle telemetry */}
      <td>
        {uuid == null ? (
          <span className="badge bg-secondary">No UUID</span>
        ) : telemetryEnabled == null ? (
          '-'
        ) : (
          <span
            className={`badge ${telemetryEnabled ? 'bg-info' : 'bg-secondary'}`}
            style={{ cursor: 'pointer' }}
            role="button"
            title={
              telemetryEnabled
                ? 'Click to disable telemetry'
                : 'Click to enable telemetry'
            }
            onClick={(e) => {
              e.preventDefault()
              props.onToggleTelemetry()
            }}
          >
            {telemetryEnabled ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </td>

      {/* Clickable badge to toggle optional telemetry */}
      <td>
        {uuid == null ? (
          <span className="badge bg-secondary">No UUID</span>
        ) : optionalTelemetry == null ? (
          '-'
        ) : (
          <span
            className={`badge ${optionalTelemetry ? 'bg-warning' : 'bg-secondary'}`}
            style={{ cursor: 'pointer' }}
            role="button"
            title={
              optionalTelemetry
                ? 'Click to disable optional telemetry'
                : 'Click to enable optional telemetry'
            }
            onClick={(e) => {
              e.preventDefault()
              props.onToggleOptionalTelemetry()
            }}
          >
            {optionalTelemetry ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </td>

      <td className="d-flex flex-wrap align-items-center">
        <button
          className="btn btn-default mr-2"
          onClick={props.onUpdateTexture}
        >
          {t('admin.changeTexture')}
        </button>

        {/* More actions dropdown */}
        {uuid && (
          <div className="dropdown mr-2">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              data-toggle="dropdown"
              aria-expanded="false"
              title="More actions"
            >
              More actions
            </button>
            <div className="dropdown-menu dropdown-menu-right">
              <h6 className="dropdown-header">
                <i className="fas fa-chart-line mr-1"></i>
                Telemetry Actions
              </h6>
              <a
                className="dropdown-item"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  props.onDownloadTelemetry()
                }}
              >
                <i className="fas fa-download mr-2"></i>
                Download telemetry data
              </a>
              <a
                className="dropdown-item text-danger"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  props.onClearTelemetry()
                }}
              >
                <i className="fas fa-trash mr-2"></i>
                Clear telemetry data
              </a>
            </div>
          </div>
        )}

        <button className="btn btn-danger" onClick={props.onDelete}>
          {t('admin.deletePlayer')}
        </button>
      </td>
    </tr>
  )
}

export default Row