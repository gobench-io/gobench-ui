import getConfig from 'next/config'
import React, { useContext, useEffect, useState, useRef } from 'react'
import { Button } from 'primereact/button'
import { useRouter } from 'next/router'
import { Chart } from 'primereact/chart'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Menu } from 'primereact/menu'
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup'
import { classNames } from 'primereact/utils'
import Link from 'next/link'
import { get } from 'lodash'
import { Toast } from 'primereact/toast'
import { GobenchService } from '../app/service'
import { LayoutContext } from '../layout/context/layoutcontext'
import moment from 'moment'
import localStorage from 'local-storage'

const Dashboard = () => {
    const contextPath = getConfig().publicRuntimeConfig.contextPath
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState(null)
    const [limit, setLimit] = useState(20)
    const [offset, setOffset] = useState(0)
    const [order, setOrder] = useState(false)
    const [isAsc, setIAsc] = useState(false)
    const [keyword, setKeyword] = useState('')
    const router = useRouter()
    const { layoutConfig } = useContext(LayoutContext)
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' })
    const toast = useRef(null)
    const gobenchService = new GobenchService()

    const handleCatch = (error) => {
        setLoading(false)
        const message = get(error, ['response', 'data', 'error', 'message'], error.message)
        toast.current.show({ severity: 'error', summary: 'Error', detail: message, life: 3000 })
        console.error({ error })
        if (error.response && error.response.status === 401) {
            router.push('/auth/login')
            return
        }
    }
    const searchApplications = (event = {}) => {
        const search = event.query || keyword

        gobenchService.getApplications({ keyword: search, limit, offset, isAsc, order }).then((data) => {
            if (Array.isArray(data)) {
                setApplications(data)
            }
            setLoading(false)
        }).catch(handleCatch)
    }

    const destroy = (event, application) => {
        confirmPopup({
            target: event.currentTarget,
            message: `Are you sure delete application ${application.name}?`,
            icon: 'pi pi-exclamation-triangle',
            accept,
            reject
        })
    }
    const cancel = (event, application) => {
        confirmPopup({
            target: event.currentTarget,
            message: `Are you sure cancel application ${application.name}?`,
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                gobenchService.cancelApplication({ id: application.id }).then((data) => {

                    toast.current.show({ severity: 'success', summary: 'Application cancelation', detail: 'Application cancelation request sent', life: 3000 })
                    // poll in a min
                    searchApplications({})
                }).catch(handleCatch)
            },
            // reject
        })
    }
    const clone = (application) => {
        localStorage.set('cloneItem', application)
        router.push({
            pathname: '/application/new',
            query: {
                cloneId: application.id
            }
        })
    }
    useEffect(() => {
        searchApplications()
    }, [])
    const statusBodyTemplate = (rowData) => {
        return <span className={`customer-badge status-${rowData.status}`}>{rowData.status}</span>
    }
    const tagBodyTemplate = (rowData) => {
        return <></>
    }
    const dateBodyTemplate = (rowData) => {
        return <span>{moment(rowData.start_at).format('MMMM DD, YYYY HH:mm:ss')}</span>
    }
    const durationBodyTemplate = (rowData) => {
        const { started_at: startedAt, updated_at: updated } = rowData
        const start = moment(startedAt).utc()
        if (['provisioning', 'pending', 'error'].includes(rowData.status)) {
            return <span />
        }
        if (['finished', 'cancel'].includes(rowData.status)) {
            const end = moment(updated).utc()
            const diff = end.diff(start)
            const duration = moment.utc(diff).format('HH:mm:ss.SSS')
            return <span>{duration}</span>
        }
        const diff = moment.utc().diff(start)
        const duration = moment.utc(diff).format('HH:mm:ss.SSS')
        return <span>{duration}</span>
    }
    const actionBodyTemplate = (application) => {
        return (<>
            <Button label="Clone" className="p-button-outlined" onClick={() => clone(application)} />
            {['running', 'pending', 'finished'].includes(application.status) && (
                <>
                    <ConfirmPopup />
                    <Button onClick={e => cancel(e, application)} label="Cancel" className="p-button-outlined p-button-warning ml-2" />
                </>
            )}
            {['finished', 'pending', 'error', 'cancel'].includes(application.status) && (
                <>
                    <ConfirmPopup />
                    <Button onClick={e => destroy(e, application)} label="Delete" className="p-button-outlined p-button-danger ml-2" />
                </>
            )}
        </>)
    }
    const statusFilterTemplate = (options) => {
        return <></>
    }
    const tagFilterTemplate = (options) => {
        return <></>
    }
    const dateFilterTemplate = (options) => {
        return <></>
    }
    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12 ">
                <div className="card">
                    <h5>Scenarios</h5>
                    <DataTable
                        value={applications}
                        paginator
                        className="p-datatable-gridlines"
                        showGridlines
                        rows={10}
                        dataKey="id"
                        filters={filters}
                        filterDisplay="menu"
                        loading={loading}
                        responsiveLayout="scroll"
                        emptyMessage="No applications found."
                    // header={header}
                    >
                        <Column field="id" header="ID" filter style={{ minWidth: '3rem' }} />
                        <Column field="status" header="Status" filterMenuStyle={{ width: '14rem' }} style={{ minWidth: '12rem' }} body={statusBodyTemplate} filter filterElement={statusFilterTemplate} />
                        <Column field="name" header="Name" filter filterPlaceholder="Search by name" style={{ minWidth: '12rem' }} />
                        <Column field="tags" header="Tags" filterMenuStyle={{ width: '14rem' }} style={{ minWidth: '12rem' }} body={tagBodyTemplate} filter filterElement={tagFilterTemplate} />
                        <Column field='started_at' header="Started At" filterField="date" dataType="date" style={{ minWidth: '10rem' }} body={dateBodyTemplate} filter filterElement={dateFilterTemplate} />
                        <Column header="Duration" filterField="date" dataType="date" style={{ minWidth: '10rem' }} body={durationBodyTemplate} filter filterElement={dateFilterTemplate} />
                        <Column header="Action" style={{ minWidth: '10rem' }} body={actionBodyTemplate} />
                    </DataTable>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
