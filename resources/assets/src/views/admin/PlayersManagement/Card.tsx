import React from 'react'
import { t } from '@/scripts/i18n'
import { showModal } from '@/scripts/notify'
import type { Player } from '@/scripts/types'
import { Box } from './styles'
import clsx from 'clsx'

interface Props {
  player: Player
  uuid: string | null
  blocked: boolean | null
  telemetryEnabled: boolean | null
  optionalTelemetry: boolean | null
  onlineChatEnabled: boolean | null
  multiplayerServerEnabled: boolean | null
  onUpdateName(): void
  onUpdateOwner(): void
  onUpdateTexture(): void
  onDelete(): void
  onToggleBlocklist(): void
  onToggleTelemetry(): void
  onToggleOptionalTelemetry(): void
  onToggleChat(): void
  onToggleMultiplayer(): void
  onDownloadTelemetry(): void
  onClearTelemetry(): void
  onCopyUuid(uuid: string): void
}

const Card: React.FC<Props> = (props) => {
  const {
    player,
    uuid,
    blocked,
    telemetryEnabled,
    optionalTelemetry,
    onlineChatEnabled,
    multiplayerServerEnabled,
  } = props

  const handlePreviewTextures = () => {
    const skinPreview = `${blessing.base_url}/preview/${player.tid_skin}`
    const skinPreviewPNG = `${skinPreview}?png`
    const capePreview = `${blessing.base_url}/preview/${player.tid_cape}`
    const capePreviewPNG = `${capePreview}?png`

    showModal({
      mode: 'alert',
      title: t('general.player.previews'),
      children: (
        <div className="row">
          <div className="col-6 d-flex justify-content-center">
            {player.tid_skin > 0 && (
              <a
                href={`${blessing.base_url}/skinlib/show/${player.tid_skin}`}
                target="_blank"
              >
                <picture>
                  <source srcSet={skinPreview} type="image/webp" />
                  <img
                    src={skinPreviewPNG}
                    alt={`${player.name} - ${t('general.skin')}`}
                    width="128"
                  />
                </picture>
              </a>
            )}
          </div>
          <div className="col-6 d-flex justify-content-center">
            {player.tid_cape > 0 && (
              <a
                href={`${blessing.base_url}/skinlib/show/${player.tid_cape}`}
                target="_blank"
              >
                <picture>
                  <source srcSet={capePreview} type="image/webp" />
                  <img
                    src={capePreviewPNG}
                    alt={`${player.name} - ${t('general.cape')}`}
                    width="128"
                  />
                </picture>
              </a>
            )}
          </div>
        </div>
      ),
    })
  }

  const isDarkMode = document.body.classList.contains('dark-mode')

  const avatar = `${blessing.base_url}/avatar/player/${player.name}`
  const avatarPNG = `${avatar}?png`

  return (
    <Box className={clsx('info-box', { 'bg-gray-dark': isDarkMode })}>
      <div className="info-box-icon">
        <picture>
          <source srcSet={avatar} type="image/webp" />
          <img className="bs-avatar" src={avatarPNG} />
        </picture>
      </div>
      <div className="info-box-content">
        <div className="row">
          <div className="col-10">
            <b>{player.name}</b>
          </div>
          <div className="col-2">
            <div className="float-right dropdown">
              <a
                className="text-gray"
                href="#"
                data-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fas fa-cog"></i>
              </a>
              <div className="dropdown-menu dropdown-menu-right">
                <a
                  href="#"
                  className="dropdown-item"
                  onClick={handlePreviewTextures}
                >
                  <i className="fas fa-eye mr-2"></i>
                  {t('general.player.previews')}
                </a>
                <div className="dropdown-divider"></div>
                <a
                  href="#"
                  className="dropdown-item"
                  onClick={props.onUpdateName}
                >
                  <i className="fas fa-signature mr-2"></i>
                  {t('admin.changePlayerName')}
                </a>
                <a
                  href="#"
                  className="dropdown-item"
                  onClick={props.onUpdateOwner}
                >
                  <i className="fas fa-user-edit mr-2"></i>
                  {t('admin.changeOwner')}
                </a>
                <a
                  href="#"
                  className="dropdown-item"
                  onClick={props.onUpdateTexture}
                >
                  <i className="fas fa-tshirt mr-2"></i>
                  {t('admin.changeTexture')}
                </a>
                {uuid && (
                  <>
                    <div className="dropdown-divider"></div>
                    <h6 className="dropdown-header">
                      <i className="fas fa-chart-line mr-1"></i>
                      Telemetry Actions
                    </h6>
                    <a
                      href="#"
                      className="dropdown-item"
                      onClick={props.onDownloadTelemetry}
                    >
                      <i className="fas fa-download mr-2"></i>
                      Download Telemetry
                    </a>
                    <a
                      href="#"
                      className="dropdown-item text-danger"
                      onClick={props.onClearTelemetry}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Clear Telemetry
                    </a>
                  </>
                )}
                <div className="dropdown-divider"></div>
                <a
                  href="#"
                  className="dropdown-item dropdown-item-danger"
                  onClick={props.onDelete}
                >
                  <i className="fas fa-trash mr-2"></i>
                  {t('admin.deletePlayer')}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div>
            <span className="mr-2">PID: {player.pid}</span>
            <span className="mr-2">
              {t('general.player.owner')}: {player.uid}
            </span>
            {uuid && (
              <span
                className="mr-2 text-primary"
                style={{ cursor: 'pointer', fontFamily: 'monospace' }}
                onClick={() => props.onCopyUuid(uuid)}
                title="Click to copy UUID"
              >
                <i className="fas fa-copy mr-1"></i>
                <small>UUID: {uuid.slice(0, 8)}...</small>
              </span>
            )}
          </div>
          <div className="mt-1">
            {uuid && blocked !== null && (
              <span
                className={`badge ${blocked ? 'bg-danger' : 'bg-success'} mr-1`}
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
            {uuid && telemetryEnabled !== null && (
              <span
                className={`badge ${telemetryEnabled ? 'bg-info' : 'bg-secondary'} mr-1`}
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
                <i className="fas fa-chart-line mr-1"></i>
                {telemetryEnabled ? 'Telemetry ON' : 'Telemetry OFF'}
              </span>
            )}
            {uuid && optionalTelemetry !== null && (
              <span
                className={`badge ${optionalTelemetry ? 'bg-warning' : 'bg-secondary'} mr-1`}
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
                <i className="fas fa-star mr-1"></i>
                {optionalTelemetry ? 'Optional ON' : 'Optional OFF'}
              </span>
            )}
            {uuid && onlineChatEnabled !== null && (
              <span
                className={`badge ${onlineChatEnabled ? 'bg-success' : 'bg-secondary'} mr-1`}
                style={{ cursor: 'pointer' }}
                role="button"
                title={
                  onlineChatEnabled
                    ? 'Click to mute player'
                    : 'Click to unmute player'
                }
                onClick={(e) => {
                  e.preventDefault()
                  props.onToggleChat()
                }}
              >
                <i className="fas fa-comment mr-1"></i>
                {onlineChatEnabled ? 'Chat ON' : 'Muted'}
              </span>
            )}
            {uuid && multiplayerServerEnabled !== null && (
              <span
                className={`badge ${multiplayerServerEnabled ? 'bg-success' : 'bg-danger'} mr-1`}
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
                <i className="fas fa-server mr-1"></i>
                {multiplayerServerEnabled ? 'Server ON' : 'Server OFF'}
              </span>
            )}
          </div>
          <div>
            <small className="text-gray">
              {`${t('general.player.last-modified')}: `}
              {player.last_modified}
            </small>
          </div>
        </div>
      </div>
    </Box>
  )
}

export default Card