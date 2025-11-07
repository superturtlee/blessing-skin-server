import React, { useState, useEffect } from 'react'
import { hot } from 'react-hot-loader/root'
import { useImmer } from 'use-immer'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { Paginator, Texture, TextureType } from '@/scripts/types'
import { toast, showModal } from '@/scripts/notify'
import Loading from '@/components/Loading'
import Pagination from '@/components/Pagination'
import ViewerSkeleton from '@/components/ViewerSkeleton'
import type { Report, Status } from './types'
import ImageBox from './ImageBox'

const Previewer = React.lazy(() => import('@/components/Viewer'))

const YggdrasilReportsTools: React.FC = () => {
  const [reportId, setReportId] = useState('')
  const [profileUuid, setProfileUuid] = useState('')

  const api = {
    getAll: `${blessing.base_url}/admin/reports/yggdrasilreports/all`,
    delAll: `${blessing.base_url}/admin/reports/yggdrasilreports/all`,
    getById: (id: string) =>
      `${blessing.base_url}/admin/reports/yggdrasilreports/${encodeURIComponent(
        id.trim(),
      )}`,
    delById: (id: string) =>
      `${blessing.base_url}/admin/reports/yggdrasilreports/${encodeURIComponent(
        id.trim(),
      )}`,
    getByProfile: (pid: string) =>
      `${blessing.base_url}/admin/reports/yggdrasilreports/profile/${encodeURIComponent(
        pid.trim(),
      )}`,
    delByProfile: (pid: string) =>
      `${blessing.base_url}/admin/reports/yggdrasilreports/profile/${encodeURIComponent(
        pid.trim(),
      )}`,
  }

const getCsrfToken = () => {
  // 优先 meta 标签
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
  if (meta?.content) return meta.content
  // 退回全局变量（Blessing 通常会注入）
  // @ts-ignore
  if (window.blessing?.csrf_token) return window.blessing.csrf_token
  return ''
}

const del = async (url: string, okMsg = 'Success') => {
  try {
    const resp = await window.fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
        'Accept': 'application/json',
        // 某些环境下带上 Referer 更稳
        'Referer': window.location.href,
      },
      credentials: 'same-origin', // 一定要带 Cookie
    })
    if (resp.ok) {
      toast.success(okMsg)
    } else {
      const data = await resp.json().catch(() => ({}))
      toast.error(data?.errorMessage || `HTTP ${resp.status}`)
    }
  } catch (e) {
    toast.error(String(e))
  }
}

  const confirm = async (text: string) => {
    try {
      await showModal({ text, okButtonType: 'danger' })
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-header">
        <strong>Yggdrasil Reports</strong>
      </div>
      <div className="card-body">
        {/* 所有举报 */}
        <div className="mb-3">
          <a className="btn btn-primary mr-2" href={api.getAll} target="_blank" rel="noreferrer">
            Download All
          </a>
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (await confirm('Confirm delete all reports?')) {
                del(api.delAll, 'Deleted all reports')
              }
            }}
          >
            Delete All Reports
          </button>
        </div>

        <hr />

        {/* 特定举报（report_id） */}
        <div className="row g-3 align-items-end mb-3">
          <div className="col-md-5">
            <label htmlFor="reportIdInput" className="form-label">
              Specify a report(report_id)
            </label>
            <input
              type="text"
              id="reportIdInput"
              className="form-control"
              placeholder="Input report_id"
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
            />
          </div>
          <div className="col-md-7">
            <a
              className="btn btn-outline-primary mr-2"
              href={reportId.trim() ? api.getById(reportId) : '#'}
              target="_blank"
              onClick={(e) => {
                if (!reportId.trim()) {
                  e.preventDefault()
                  toast.error('Please input report_id')
                }
              }}
              rel="noreferrer"
            >
              Download Report
            </a>
            <button
              className="btn btn-outline-danger"
              onClick={async () => {
                const id = reportId.trim()
                if (!id) {
                  toast.error('Please input report_id')
                  return
                }
                if (await confirm('Confirm delete this report?')) {
                  del(api.delById(id), 'Deleted this report')
                }
              }}
            >
              Delete This Report
            </button>
          </div>
        </div>

        {/* 特定举报者（profile_uuid） */}
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label htmlFor="profileUuidInput" className="form-label">
              Specify a Reporter(profile_uuid)
            </label>
            <input
              type="text"
              id="profileUuidInput"
              className="form-control"
              placeholder="Please input profile_uuid"
              value={profileUuid}
              onChange={(e) => setProfileUuid(e.target.value)}
            />
          </div>
          <div className="col-md-7">
            <a
              className="btn btn-outline-primary mr-2"
              href={profileUuid.trim() ? api.getByProfile(profileUuid) : '#'}
              target="_blank"
              onClick={(e) => {
                if (!profileUuid.trim()) {
                  e.preventDefault()
                  toast.error('Please input profile_uuid')
                }
              }}
              rel="noreferrer"
            >
              Download All Reports by Reporter
            </a>
            <button
              className="btn btn-outline-danger"
              onClick={async () => {//
                const pid = profileUuid.trim()
                if (!pid) {
                  toast.error('Please input profile_uuid')
                  return
                }
                if (await confirm('Confirm delete all reports for this reporter?')) {
                  del(api.delByProfile(pid), 'Deleted all reports for this reporter')
                }
              }}
            >
              Delete All Reports by Reporter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useImmer<Report[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('status:0 sort:-report_at')
  const [viewingTexture, setViewingTexture] = useState<Texture | null>(null)

  const getReports = async () => {
    setIsLoading(true)
    const { data, last_page }: Paginator<Report> = await fetch.get(
      '/admin/reports/list',
      {
        q: query,
        page,
      },
    )
    setTotalPages(last_page)
    setReports(() => data)
    setIsLoading(false)
  }

  useEffect(() => {
    getReports()
  }, [page])

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  const handleSubmitQuery = (event: React.FormEvent) => {
    event.preventDefault()
    getReports()
  }

  const handleProceedReport = async (
    report: Report,
    index: number,
    action: 'ban' | 'delete' | 'reject',
  ) => {
    type Ok = { code: 0; message: string; data: { status: Status } }
    type Err = { code: 1; message: string }
    const resp = await fetch.put<Ok | Err>(`/admin/reports/${report.id}`, {
      action,
    })

    if (resp.code === 0) {
      toast.success(resp.message)
      setReports((reports) => {
        reports[index]!.status = resp.data.status
      })
    } else {
      toast.error(resp.message)
    }
  }

  const handleDelete = async (report: Report, index: number) => {
    try {
      await showModal({
        text: t('skinlib.deleteNotice'),
        okButtonType: 'danger',
      })
    } catch {
      return
    }

    handleProceedReport(report, index, 'delete')
  }

  const textureUrl =
    viewingTexture && `${blessing.base_url}/textures/${viewingTexture.hash}`

  return (
    <div className="row">
      <div className="col-lg-12">
        <YggdrasilReportsTools />
      </div>

      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <form className="input-group" onSubmit={handleSubmitQuery}>
              <input
                type="text"
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
          </div>
          {isLoading ? (
            <div className="card-body">
              <Loading />
            </div>
          ) : reports.length === 0 ? (
            <div className="card-body text-center">{t('general.noResult')}</div>
          ) : (
            <div className="card-body d-flex flex-wrap">
              {reports.map((report, i) => (
                <ImageBox
                  key={report.id}
                  report={report}
                  onClick={setViewingTexture}
                  onBan={() => handleProceedReport(report, i, 'ban')}
                  onDelete={() => handleDelete(report, i)}
                  onReject={() => handleProceedReport(report, i, 'reject')}
                />
              ))}
            </div>
          )}
          <div className="card-footer">
            <div className="float-right">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-4">
        <React.Suspense fallback={<ViewerSkeleton />}>
          <Previewer
            {...{
              [viewingTexture?.type === TextureType.Cape
                ? TextureType.Cape
                : 'skin']: textureUrl,
            }}
            isAlex={viewingTexture?.type === TextureType.Alex}
          />
        </React.Suspense>
      </div>
    </div>
  )
}

export default hot(ReportsManagement)
