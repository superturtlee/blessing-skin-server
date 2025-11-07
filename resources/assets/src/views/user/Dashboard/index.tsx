import React, { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { hot } from 'react-hot-loader/root'
import useEmitMounted from '@/scripts/hooks/useEmitMounted'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import useTween from '@/scripts/hooks/useTween'
import urls from '@/scripts/urls'
import * as breakpoints from '@/styles/breakpoints'
import InfoBox from './InfoBox'
import SignButton from './SignButton'
import * as scoreUtils from './scoreUtils'

type ScoreInfo = {
  signAfterZero: boolean
  signGapTime: number
  rate: { players: number; storage: number }
  usage: { players: number; storage: number }
  user: { score: number; lastSignAt: string }
}

type SignReturn = {
  score: number
}

type BlocklistEntry = {
  uuid: string
  name: string | null
}

type ProfileInfo = {
  id: string
  name: string
}

const ScoreTitle = styled.p`
  font-weight: bold;
  margin-top: 5px;
  ${breakpoints.lessThan(breakpoints.Breakpoint.md)} {
    margin-top: 12px;
  }
`
const Score = styled.p`
  font-family: 'Minecraft';
  font-size: 50px;
  margin-top: 20px;
  cursor: help;
`
const ScoreNotice = styled.p`
  font-size: smaller;
  margin-top: 20px;
`

const BlocklistSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #dee2e6;
`

const BlocklistHeader = styled.h4`
  font-weight: bold;
  margin-bottom: 1rem;
`

const BlocklistTable = styled.table`
  width: 100%;
  margin-top: 1rem;
  
  thead {
    background-color: #f8f9fa;
  }
  
  th {
    padding: 0.75rem;
    font-weight: 600;
  }
  
  td {
    padding: 0.75rem;
    vertical-align: middle;
  }
`

const BlocklistControls = styled.div`
  margin-top: 1.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`

const BlocklistInput = styled.input`
  flex: 1;
  min-width: 200px;
  max-width: 400px;
`

const EmptyMessage = styled.p`
  color: #6c757d;
  font-style: italic;
  margin-top: 1rem;
`

const UuidText = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  color: #6c757d;
`

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState(0)
  const [storage, setStorage] = useState(0)
  const [score, setScore] = useState(0)
  const [tweenedScore, setTweenedScore] = useTween(0)
  const [playersRate, setPlayersRate] = useState(1)
  const [storageRate, setStorageRate] = useState(1)
  const [lastSign, setLastSign] = useState(new Date())
  const [canSignAfterZero, setCanSignAfterZero] = useState(false)
  const [signGap, setSignGap] = useState(24)

  // Blocklist state
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [newBlockName, setNewBlockName] = useState('')
  const [blocklistLoading, setBlocklistLoading] = useState(false)

  useEmitMounted()

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true)
      const data = await fetch.get<ScoreInfo>(urls.user.score())
      setPlayers(data.usage.players)
      setStorage(data.usage.storage)
      setTweenedScore(data.user.score)
      setScore(data.user.score)
      setPlayersRate(data.rate.players)
      setStorageRate(data.rate.storage)
      setLastSign(new Date(data.user.lastSignAt))
      setCanSignAfterZero(data.signAfterZero)
      setSignGap(data.signGapTime)
      setLoading(false)
    }
    fetchInfo()
  }, [])

  const handleSign = useCallback(async () => {
    setLoading(true)
    const { code, message, data } = await fetch.post<
      fetch.ResponseBody<SignReturn>
    >(urls.user.sign())

    if (code === 0) {
      toast.success(message)
      setLastSign(new Date())
      setTweenedScore(data.score)
      setScore(data.score)
    } else if (code === 1) {
      const remainingTime = scoreUtils.remainingTime(
        lastSign,
        signGap,
        canSignAfterZero,
      )
      toast.warning(scoreUtils.remainingTimeText(remainingTime))
    } else {
      toast.error(message)
    }
    setLoading(false)
  }, [lastSign, signGap, canSignAfterZero])

  // Query profile by name to get UUID
  const queryProfileByName = async (name: string): Promise<ProfileInfo | null> => {
    try {
      const response = await fetch.post<ProfileInfo[]>(
        '/api/yggdrasil/api/profiles/minecraft',
        [name]
      )
      if (response && response.length > 0) {
        return response[0]
      }
      return null
    } catch (error) {
      console.error('Error querying profile:', error)
      return null
    }
  }

  // Query profile by UUID to get name
  const queryProfileByUuid = async (uuid: string): Promise<ProfileInfo | null> => {
    try {
      const response = await fetch.get<ProfileInfo>(
        `/api/yggdrasil/sessionserver/session/minecraft/profile/${uuid}?unsigned=true`
      )
      return response
    } catch (error) {
      // 204 No Content means profile doesn't exist
      return null
    }
  }

  // Fetch the blocklist with resolved names
  const fetchBlocklist = useCallback(async () => {
    setBlocklistLoading(true)
    try {
      const { blocklist: uuids } = await fetch.get<{ blocklist: string[] }>(
        urls.user.blocklist.get()
      )
      
      // Query names for each UUID one by one (to prevent CC attack)
      const entries: BlocklistEntry[] = []
      for (const uuid of uuids) {
        const profile = await queryProfileByUuid(uuid)
        entries.push({
          uuid,
          name: profile?.name || null
        })
      }
      
      setBlocklist(entries)
    } catch (error) {
      toast.error('Failed to fetch blocklist')
    } finally {
      setBlocklistLoading(false)
    }
  }, [])

  // Add a user to the blocklist by name
  const handleAddToBlocklist = async () => {
    const trimmedName = newBlockName.trim()
    if (!trimmedName) {
      toast.warning('Please enter a player name')
      return
    }

    setBlocklistLoading(true)
    try {
      // Query UUID by name
      const profile = await queryProfileByName(trimmedName)
      
      if (!profile) {
        toast.error(`Player "${trimmedName}" not found`)
        setBlocklistLoading(false)
        return
      }

      // Add to blocklist using UUID
      await fetch.put(urls.user.blocklist.set(profile.id))
      toast.success(`Added "${profile.name}" to blocklist`)
      setNewBlockName('')
      await fetchBlocklist()
    } catch (error) {
      toast.error('Failed to add player to blocklist')
    } finally {
      setBlocklistLoading(false)
    }
  }

  // Remove a user from the blocklist
  const handleRemoveFromBlocklist = async (uuid: string, name: string | null) => {
    setBlocklistLoading(true)
    try {
      await fetch.del(urls.user.blocklist.remove(uuid))
      toast.success(`Removed ${name || 'player'} from blocklist`)
      await fetchBlocklist()
    } catch (error) {
      toast.error('Failed to remove player from blocklist')
    } finally {
      setBlocklistLoading(false)
    }
  }

  // Clear the blocklist
  const handleClearBlocklist = async () => {
    if (!confirm('Are you sure you want to clear your entire blocklist?')) {
      return
    }

    setBlocklistLoading(true)
    try {
      await fetch.del(urls.user.blocklist.clear())
      toast.success('Blocklist cleared')
      setBlocklist([])
    } catch (error) {
      toast.error('Failed to clear blocklist')
    } finally {
      setBlocklistLoading(false)
    }
  }

  useEffect(() => {
    fetchBlocklist()
  }, [fetchBlocklist])

  return (
    <>
      <div className="card card-primary card-outline">
        <div className="card-header">
          <h3 className="card-title">{t('user.used.title')}</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-1"></div>
            <div className="col-md-6">
              <InfoBox
                color="teal"
                icon="gamepad"
                name={t('user.used.players')}
                used={players}
                unused={score / playersRate}
                unit=""
              />
              {storage > 1024 ? (
                <InfoBox
                  color="maroon"
                  icon="hdd"
                  name={t('user.used.storage')}
                  used={~~(storage / 1024)}
                  unused={~~(score / storageRate / 1024)}
                  unit="MB"
                />
              ) : (
                <InfoBox
                  color="maroon"
                  icon="hdd"
                  name={t('user.used.storage')}
                  used={storage}
                  unused={score / storageRate}
                  unit="KB"
                />
              )}
            </div>
            <div className="col-md-4 text-center">
              <ScoreTitle>{t('user.cur-score')}</ScoreTitle>
              <Score data-toggle="modal" data-target="#modal-score-instruction">
                {~~tweenedScore}
              </Score>
              <ScoreNotice>{t('user.score-notice')}</ScoreNotice>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <SignButton
            isLoading={loading}
            lastSign={lastSign}
            canSignAfterZero={canSignAfterZero}
            signGap={signGap}
            onClick={handleSign}
          />
        </div>
      </div>

      {/* Blocklist Management Section */}
      <div className="card card-secondary card-outline">
        <div className="card-header">
          <h3 className="card-title">Blocklist Management</h3>
        </div>
        <div className="card-body">
          <BlocklistSection>
            <BlocklistHeader>Your Blocklist</BlocklistHeader>
            <p className="text-muted">
              Block players by their Minecraft username. Blocked players will be added to your personal blocklist.
            </p>

            {blocklistLoading ? (
              <div className="text-center">
                <i className="fas fa-spinner fa-spin"></i> Loading...
              </div>
            ) : blocklist.length === 0 ? (
              <EmptyMessage>Your blocklist is empty.</EmptyMessage>
            ) : (
              <BlocklistTable className="table table-striped">
                <thead>
                  <tr>
                    <th>Player Name</th>
                    <th>UUID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blocklist.map((entry) => (
                    <tr key={entry.uuid}>
                      <td>
                        <strong>{entry.name || 'Unknown'}</strong>
                      </td>
                      <td>
                        <UuidText>{entry.uuid}</UuidText>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveFromBlocklist(entry.uuid, entry.name)}
                          disabled={blocklistLoading}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </BlocklistTable>
            )}

            <BlocklistControls>
              <BlocklistInput
                type="text"
                className="form-control"
                placeholder="Enter player name (e.g., Steve)"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddToBlocklist()
                  }
                }}
                disabled={blocklistLoading}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddToBlocklist}
                disabled={blocklistLoading}
              >
                <i className="fas fa-plus mr-1"></i>
                Add to Blocklist
              </button>
              {blocklist.length > 0 && (
                <button
                  className="btn btn-warning"
                  onClick={handleClearBlocklist}
                  disabled={blocklistLoading}
                >
                  <i className="fas fa-eraser mr-1"></i>
                  Clear All
                </button>
              )}
            </BlocklistControls>
          </BlocklistSection>
        </div>
      </div>
    </>
  )
}

export default hot(Dashboard)