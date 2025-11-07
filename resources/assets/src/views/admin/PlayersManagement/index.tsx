import React, { useState, useEffect, useLayoutEffect } from 'react'
import { hot } from 'react-hot-loader/root'
import { useImmer } from 'use-immer'
import useIsLargeScreen from '@/scripts/hooks/useIsLargeScreen'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import type { Player, Paginator } from '@/scripts/types'
import { toast, showModal } from '@/scripts/notify'
import urls from '@/scripts/urls'
import Pagination from '@/components/Pagination'
import Header from '../UsersManagement/Header'
import Card from './Card'
import LoadingCard from './LoadingCard'
import Row from './Row'
import LoadingRow from './LoadingRow'
import ModalUpdateTexture from './ModalUpdateTexture'

type PlayerExtras = {
  uuid: string | null
  online_chat_enabled: boolean | null
  multiplayer_server_enabled: boolean | null
  blocked: boolean | null
  telemetry_enabled: boolean | null
  optional_telemetry: boolean | null
}

const PlayersManagement: React.FC = () => {
  const [players, setPlayers] = useImmer<Player[]>([])
  const [extras, setExtras] = useImmer<Record<number, PlayerExtras>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const isLargeScreen = useIsLargeScreen()
  const [isTableMode, setIsTableMode] = useState(false)
  const [query, setQuery] = useState('')
  const [textureUpdating, setTextureUpdating] = useState(-1)

  // Lookup PID by UUID
  const [uuidLookup, setUuidLookup] = useState('')

  useLayoutEffect(() => {
    if (isLargeScreen) {
      setIsTableMode(true)
    }
  }, [isLargeScreen])

  const loadExtras = async (list: Player[]) => {
    const results = await Promise.all(
      list.map(async (p) => {
        try {
          const [uuidRes, attrs] = await Promise.all([
            fetch.get<{ uuid: string; name: string }>(
              `/admin/getuuid/${encodeURIComponent(String(p.pid))}`,
            ),
            fetch.get<{
              multiplayer_server_enabled: boolean
              online_chat_enabled: boolean
            }>(`/admin/players/${encodeURIComponent(String(p.pid))}/attributes`),
          ])
          
          const uuid = uuidRes?.uuid ?? null
          
          let blocked = null
          let telemetry_enabled = null
          let optional_telemetry = null
          
          if (uuid) {
            try {
              const [blockedRes, telemetryRes] = await Promise.all([
                fetch.get<{ blocked: boolean }>(
                  `/admin/players/blocked/${encodeURIComponent(uuid)}`,
                ).catch(() => null),
                fetch.get<{ telemetry_enabled: boolean; optional_telemetry: boolean }>(
                  `/admin/players/telemetry/${encodeURIComponent(uuid)}/status`,
                ).catch(() => null),
              ])
              blocked = blockedRes?.blocked ?? null
              telemetry_enabled = telemetryRes?.telemetry_enabled ?? null
              optional_telemetry = telemetryRes?.optional_telemetry ?? null
            } catch {
              blocked = null
              telemetry_enabled = null
              optional_telemetry = null
            }
          }

          return {
            pid: p.pid,
            uuid,
            online_chat_enabled:
              typeof attrs?.online_chat_enabled === 'boolean'
                ? attrs.online_chat_enabled
                : null,
            multiplayer_server_enabled:
              typeof attrs?.multiplayer_server_enabled === 'boolean'
                ? attrs.multiplayer_server_enabled
                : null,
            blocked,
            telemetry_enabled,
            optional_telemetry,
          }
        } catch {
          return {
            pid: p.pid,
            uuid: null,
            online_chat_enabled: null,
            multiplayer_server_enabled: null,
            blocked: null,
            telemetry_enabled: null,
            optional_telemetry: null,
          }
        }
      }),
    )

    setExtras((draft) => {
      results.forEach((r) => {
        draft[r.pid] = {
          uuid: r.uuid,
          online_chat_enabled: r.online_chat_enabled,
          multiplayer_server_enabled: r.multiplayer_server_enabled,
          blocked: r.blocked,
          telemetry_enabled: r.telemetry_enabled,
          optional_telemetry: r.optional_telemetry,
        }
      })
    })
  }

  const getPlayers = async () => {
    setIsLoading(true)
    const { data, last_page }: Paginator<Player> = await fetch.get(
      urls.admin.players.list(),
      {
        q: query,
        page,
      },
    )
    setTotalPages(last_page)
    setPlayers(() => data)
    await loadExtras(data)
    setIsLoading(false)
  }

  useEffect(() => {
    getPlayers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsTableMode(event.target.value === 'table')
  }

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  const handleSubmitQuery = (event: React.FormEvent) => {
    event.preventDefault()
    getPlayers()
  }

  const handleUpdateName = async (player: Player, index: number) => {
    let name: string
    try {
      const { value } = await showModal({
        mode: 'prompt',
        text: t('admin.changePlayerNameNotice'),
        input: player.name,
        validator: (value: string) => {
          if (!value) {
            return t('admin.emptyPlayerName')
          }
        },
      })
      name = value
    } catch {
      return
    }

    const { code, message } = await fetch.put<fetch.ResponseBody>(
      urls.admin.players.name(player.pid),
      { player_name: name },
    )
    if (code === 0) {
      toast.success(message)
      setPlayers((players) => {
        players[index]!.name = name
      })
    } else {
      toast.error(message)
    }
  }

  const handleUpdateOwner = async (player: Player, index: number) => {
    let uid: number
    try {
      const { value } = await showModal({
        mode: 'prompt',
        text: t('admin.changePlayerOwner'),
        input: player.uid.toString(),
        inputMode: 'numeric',
      })
      uid = Number.parseInt(value)
    } catch {
      return
    }

    const { code, message } = await fetch.put<fetch.ResponseBody>(
      urls.admin.players.owner(player.pid),
      { uid },
    )
    if (code === 0) {
      toast.success(message)
      setPlayers((players) => {
        players[index]!.uid = uid
      })
    } else {
      toast.error(message)
    }
  }

  const handleCloseModalUpdateTexture = () => setTextureUpdating(-1)

  const handleUpdateTexture = async (type: 'skin' | 'cape', tid: number) => {
    const { code, message } = await fetch.put<fetch.ResponseBody>(
      urls.admin.players.texture(players[textureUpdating]!.pid),
      { type, tid },
    )

    if (code === 0) {
      toast.success(message)
      setPlayers((players) => {
        const field = `tid_${type}` as const
        players[textureUpdating]![field] = tid
      })
    } else {
      toast.error(message)
    }
  }

  const handleDelete = async (player: Player) => {
    try {
      await showModal({
        text: t('admin.deletePlayerNotice'),
        okButtonType: 'danger',
      })
    } catch {
      return
    }

    const { code, message } = await fetch.del<fetch.ResponseBody>(
      urls.admin.players.delete(player.pid),
    )
    if (code === 0) {
      setPlayers((players) => players.filter(({ pid }) => pid !== player.pid))
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  const attributeUrl = (
    pid: number,
    attr: 'online_chat_enabled' | 'multiplayer_server_enabled',
  ) =>
    `/admin/players/${encodeURIComponent(String(pid))}/attributes/${encodeURIComponent(
      attr,
    )}`

  const handleToggleChat = async (player: Player) => {
    try {
      const resp = await fetch.get<any>(
        attributeUrl(player.pid, 'online_chat_enabled'),
      )
      const val =
        typeof resp?.online_chat_enabled === 'boolean'
          ? resp.online_chat_enabled
          : !(extras[player.pid]?.online_chat_enabled ?? false)

      setExtras((draft) => {
        draft[player.pid] = {
          ...draft[player.pid],
          online_chat_enabled: val,
        }
      })

      toast.success(val ? 'Chat allowed' : 'Muted')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleToggleMultiplayer = async (player: Player) => {
    try {
      const resp = await fetch.get<any>(
        attributeUrl(player.pid, 'multiplayer_server_enabled'),
      )
      const val =
        typeof resp?.multiplayer_server_enabled === 'boolean'
          ? resp.multiplayer_server_enabled
          : !(extras[player.pid]?.multiplayer_server_enabled ?? true)

      setExtras((draft) => {
        draft[player.pid] = {
          ...draft[player.pid],
          multiplayer_server_enabled: val,
        }
      })

      toast.success(val ? 'Server access allowed' : 'Server access blocked')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleQueryPidByUuid = async (event: React.FormEvent) => {
    event.preventDefault()
    const uuid = uuidLookup.trim()
    if (!uuid) {
      toast.error('Please input a UUID')
      return
    }
    try {
      const data = await fetch.get<{ pid: number; name: string }>(
        `/admin/getpid/${encodeURIComponent(uuid)}`,
      )
      await showModal({
        text: `UUID: ${uuid}\nPlayer: ${data.name}\nPID: ${data.pid}`,
        mode: 'alert',
      })
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleCopyUuid = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid)
      toast.success('UUID copied to clipboard!')
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = uuid
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        toast.success('UUID copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy UUID')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleToggleBlocklist = async (player: Player) => {
    const uuid = extras[player.pid]?.uuid
    if (!uuid) {
      toast.error('UUID not found for this player')
      return
    }

    try {
      const resp = await fetch.get<{ blocked: boolean; uuid?: string }>(
        `/admin/players/blocked/${encodeURIComponent(uuid)}/toggle`,
      )
      const blocked =
        typeof resp?.blocked === 'boolean' ? resp.blocked : null

      setExtras((draft) => {
        draft[player.pid] = {
          ...draft[player.pid],
          blocked,
        }
      })

      toast.success(blocked ? 'Player blocked' : 'Player unblocked')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleViewBlocklist = async () => {
    try {
      const resp = await fetch.get<{ blocklist: string[] }>(
        '/admin/players/blocked',
      )
      const blocklist = resp?.blocklist ?? []

      if (blocklist.length === 0) {
        await showModal({
          text: 'System blocklist is empty.',
          mode: 'alert',
        })
      } else {
        await showModal({
          title: `System Blocklist (${blocklist.length} players)`,
          text: blocklist.join('\n'),
          mode: 'alert',
        })
      }
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleClearBlocklist = async () => {
    try {
      await showModal({
        text: 'Are you sure you want to clear the entire system blocklist?',
        okButtonType: 'danger',
      })
    } catch {
      return
    }

    try {
      const resp = await fetch.get<{ deleted: number }>(
        '/admin/players/blocked/clear',
      )
      const deleted = resp?.deleted ?? 0

      setExtras((draft) => {
        Object.keys(draft).forEach((pid) => {
          draft[Number(pid)]!.blocked = false
        })
      })

      toast.success(`Cleared ${deleted} players from blocklist`)
    } catch (e) {
      toast.error(String(e))
    }
  }

  // ====== Telemetry Management ======

  const handleToggleTelemetry = async (player: Player) => {
    const uuid = extras[player.pid]?.uuid
    if (!uuid) {
      toast.error('UUID not found for this player')
      return
    }

    try {
      const resp = await fetch.get<{ telemetry_enabled: boolean }>(
        `/admin/players/telemetry/${encodeURIComponent(uuid)}/toggle`,
      )
      const telemetry_enabled =
        typeof resp?.telemetry_enabled === 'boolean'
          ? resp.telemetry_enabled
          : null

      setExtras((draft) => {
        draft[player.pid] = {
          ...draft[player.pid],
          telemetry_enabled,
        }
      })

      toast.success(
        telemetry_enabled ? 'Telemetry enabled' : 'Telemetry disabled',
      )
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleToggleOptionalTelemetry = async (player: Player) => {
    const uuid = extras[player.pid]?.uuid
    if (!uuid) {
      toast.error('UUID not found for this player')
      return
    }

    try {
      const resp = await fetch.get<{ optional_telemetry: boolean }>(
        `/admin/players/telemetry/${encodeURIComponent(uuid)}/toggle-optional`,
      )
      const optional_telemetry =
        typeof resp?.optional_telemetry === 'boolean'
          ? resp.optional_telemetry
          : null

      setExtras((draft) => {
        draft[player.pid] = {
          ...draft[player.pid],
          optional_telemetry,
        }
      })

      toast.success(
        optional_telemetry
          ? 'Optional telemetry enabled'
          : 'Optional telemetry disabled',
      )
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDownloadTelemetry = async (player: Player) => {
    const uuid = extras[player.pid]?.uuid
    if (!uuid) {
      toast.error('UUID not found for this player')
      return
    }

    try {
      // Fetch the JSON data
      const data = await fetch.get<{
        uuid: string
        total_events: number
        events: any[]
      }>(`/admin/players/telemetry/${encodeURIComponent(uuid)}`)

      if (data.total_events === 0) {
        toast.warning('No telemetry events found for this player')
        return
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(data, null, 2)

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `telemetry_${player.name}_${uuid}_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Downloaded ${data.total_events} telemetry events`)
    } catch (e) {
      toast.error('Failed to download telemetry data: ' + String(e))
    }
  }

  const handleClearTelemetry = async (player: Player) => {
    const uuid = extras[player.pid]?.uuid
    if (!uuid) {
      toast.error('UUID not found for this player')
      return
    }

    try {
      await showModal({
        text: `Are you sure you want to clear telemetry data for ${player.name}?\n\nThis will permanently delete all telemetry events for this player.`,
        okButtonType: 'danger',
      })
    } catch {
      return
    }

    try {
      const resp = await fetch.del<{
        uuid: string
        deleted_events: number
        message: string
      }>(`/admin/players/telemetry/${encodeURIComponent(uuid)}`)
      
      toast.success(resp.message || `Cleared ${resp.deleted_events} telemetry events`)
    } catch (e) {
      toast.error('Failed to clear telemetry: ' + String(e))
    }
  }

  const handleDownloadAllTelemetry = async () => {
    try {
      // Fetch the JSON data
      const data = await fetch.get<{
        total_players: number
        total_events: number
        generated_at: string
        data: any[]
      }>('/admin/players/telemetry/all')

      if (data.total_events === 0) {
        toast.warning('No telemetry events found')
        return
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(data, null, 2)

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `telemetry_all_${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Downloaded telemetry data: ${data.total_events} events from ${data.total_players} players`)
    } catch (e) {
      toast.error('Failed to download all telemetry data: ' + String(e))
    }
  }

  const handleClearAllTelemetry = async () => {
    try {
      await showModal({
        text: 'Are you sure you want to clear ALL telemetry data?\n\nThis action cannot be undone!\n\nAll telemetry events from all players will be permanently deleted.',
        okButtonType: 'danger',
      })
    } catch {
      return
    }

    try {
      const resp = await fetch.del<{
        deleted_events: number
        message: string
      }>('/admin/players/telemetry/all')
      
      toast.success(resp.message || `Cleared ${resp.deleted_events} telemetry events`)
    } catch (e) {
      toast.error('Failed to clear all telemetry: ' + String(e))
    }
  }

  return (
    <div className="card">
      <Header className="card-header">
        <form className="input-group" onSubmit={handleSubmitQuery}>
          <input
            type="text"
            inputMode="search"
            className="form-control"
            title={t('vendor.datatable.search')}
            value={query}
            onChange={handleQueryChange}
          />
          <div className="input-group-append">
            <button className="btn btn-primary" type="submit">
              {t('vendor.datatable.search')}
            </button>
          </div>
        </form>

        {/* Lookup PID by UUID */}
        <form
          className="input-group ml-2"
          onSubmit={handleQueryPidByUuid}
          style={{ maxWidth: 420 }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Input UUID to lookup PID"
            value={uuidLookup}
            onChange={(e) => setUuidLookup(e.target.value)}
          />
          <div className="input-group-append">
            <button className="btn btn-secondary" type="submit">
              Lookup PID
            </button>
          </div>
        </form>

        {/* System Blocklist Actions */}
        <div className="btn-group ml-2">
          <button
            className="btn btn-info"
            type="button"
            onClick={handleViewBlocklist}
            title="View system blocklist"
          >
            <i className="fas fa-list mr-1"></i>
            View Blocklist
          </button>
          <button
            className="btn btn-warning"
            type="button"
            onClick={handleClearBlocklist}
            title="Clear entire system blocklist"
          >
            <i className="fas fa-eraser mr-1"></i>
            Clear Blocklist
          </button>
        </div>

        {/* Telemetry Actions */}
        <div className="btn-group ml-2">
          <button
            className="btn btn-success"
            type="button"
            onClick={handleDownloadAllTelemetry}
            title="Download all telemetry data"
          >
            <i className="fas fa-download mr-1"></i>
            Download All Telemetry
          </button>
          <button
            className="btn btn-danger"
            type="button"
            onClick={handleClearAllTelemetry}
            title="Clear all telemetry data"
          >
            <i className="fas fa-trash mr-1"></i>
            Clear All Telemetry
          </button>
        </div>

        <div className="btn-group btn-group-toggle ml-2">
          <label
            className={`btn btn-secondary ${isTableMode ? 'active' : ''}`}
            title="Table Mode"
          >
            <input
              type="radio"
              value="table"
              checked={isTableMode}
              onChange={handleModeChange}
            />
            <i className="fas fa-list"></i>
          </label>
          <label
            className={`btn btn-secondary ${isTableMode ? '' : 'active'}`}
            title="Card Mode"
          >
            <input
              type="radio"
              value="card"
              checked={!isTableMode}
              onChange={handleModeChange}
            />
            <i className="fas fa-grip-vertical"></i>
          </label>
        </div>
      </Header>
      {players.length === 0 && !isLoading ? (
        <div className="card-body text-center">{t('general.noResult')}</div>
      ) : isTableMode ? (
        <div className="card-body table-responsive p-0">
          <table className={`table ${isLoading ? '' : 'table-striped'}`}>
            <thead>
              <tr>
                <th>PID</th>
                <th>UUID</th>
                <th>{t('general.player.player-name')}</th>
                <th>{t('general.player.owner')}</th>
                <th>{t('general.player.previews')}</th>
                <th>{t('general.player.last-modified')}</th>
                <th>Muted</th>
                <th>Server Access</th>
                <th>Blocked</th>
                <th>Telemetry</th>
                <th>Optional Telemetry</th>
                <th>{t('admin.operationsTitle')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? new Array(10).fill(null).map((_, i) => <LoadingRow key={i} />)
                : players.map((player, i) => (
                    <Row
                      key={player.pid}
                      player={player}
                      uuid={extras[player.pid]?.uuid ?? null}
                      onlineChatEnabled={
                        extras[player.pid]?.online_chat_enabled ?? null
                      }
                      multiplayerServerEnabled={
                        extras[player.pid]?.multiplayer_server_enabled ?? null
                      }
                      blocked={extras[player.pid]?.blocked ?? null}
                      telemetryEnabled={
                        extras[player.pid]?.telemetry_enabled ?? null
                      }
                      optionalTelemetry={
                        extras[player.pid]?.optional_telemetry ?? null
                      }
                      onUpdateName={() => handleUpdateName(player, i)}
                      onUpdateOwner={() => handleUpdateOwner(player, i)}
                      onUpdateTexture={() => setTextureUpdating(i)}
                      onDelete={() => handleDelete(player)}
                      onToggleChat={() => handleToggleChat(player)}
                      onToggleMultiplayer={() => handleToggleMultiplayer(player)}
                      onToggleBlocklist={() => handleToggleBlocklist(player)}
                      onToggleTelemetry={() => handleToggleTelemetry(player)}
                      onToggleOptionalTelemetry={() =>
                        handleToggleOptionalTelemetry(player)
                      }
                      onDownloadTelemetry={() => handleDownloadTelemetry(player)}
                      onClearTelemetry={() => handleClearTelemetry(player)}
                      onCopyUuid={handleCopyUuid}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-body d-flex flex-wrap">
          {isLoading
            ? new Array(10).fill(null).map((_, i) => <LoadingCard key={i} />)
            : players.map((player, i) => (
                <Card
                  key={player.pid}
                  player={player}
                  uuid={extras[player.pid]?.uuid ?? null}
                  blocked={extras[player.pid]?.blocked ?? null}
                  telemetryEnabled={
                    extras[player.pid]?.telemetry_enabled ?? null
                  }
                  optionalTelemetry={
                    extras[player.pid]?.optional_telemetry ?? null
                  }
                  onlineChatEnabled={
                    extras[player.pid]?.online_chat_enabled ?? null
                  }
                  multiplayerServerEnabled={
                    extras[player.pid]?.multiplayer_server_enabled ?? null
                  }
                  onUpdateName={() => handleUpdateName(player, i)}
                  onUpdateOwner={() => handleUpdateOwner(player, i)}
                  onUpdateTexture={() => setTextureUpdating(i)}
                  onDelete={() => handleDelete(player)}
                  onToggleBlocklist={() => handleToggleBlocklist(player)}
                  onToggleTelemetry={() => handleToggleTelemetry(player)}
                  onToggleOptionalTelemetry={() =>
                    handleToggleOptionalTelemetry(player)
                  }
                  onToggleChat={() => handleToggleChat(player)}
                  onToggleMultiplayer={() => handleToggleMultiplayer(player)}
                  onDownloadTelemetry={() => handleDownloadTelemetry(player)}
                  onClearTelemetry={() => handleClearTelemetry(player)}
                  onCopyUuid={handleCopyUuid}
                />
              ))}
        </div>
      )}
      <div className="card-footer">
        <div className="float-right">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
      <ModalUpdateTexture
        open={textureUpdating > -1}
        onSubmit={handleUpdateTexture}
        onClose={handleCloseModalUpdateTexture}
      />
    </div>
  )
}

export default hot(PlayersManagement)
