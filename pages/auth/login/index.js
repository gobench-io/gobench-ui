import React, { useContext, useEffect, useState, useRef } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { Checkbox } from 'primereact/checkbox'
import { Button } from 'primereact/button'
import { Password } from 'primereact/password'
import { InputText } from 'primereact/inputtext'
import { classNames } from 'primereact/utils'
import { Chart } from 'primereact/chart'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Menu } from 'primereact/menu'
import Link from 'next/link'
import { Toast } from 'primereact/toast'
import localStorage from 'local-storage'
import { get } from 'lodash'
import AppConfig from '../../../layout/AppConfig'
import { LayoutContext } from '../../../layout/context/layoutcontext'
import { GobenchService } from '../../../app/service'

const LoginPage = () => {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [checked, setChecked] = useState(false)
    const { layoutConfig } = useContext(LayoutContext)
    const contextPath = getConfig().publicRuntimeConfig.contextPath
    const router = useRouter()
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' })
    const toast = useRef(null)
    const gobenchService = new GobenchService()

    const handleCatch = (error) => {
        setLoading(false)
        const message = get(error, ['response', 'data', 'error', 'message'], error.message)
        toast.current.show({ severity: 'error', summary: 'Error', detail: message, life: 3000 })
        console.error({ error })
    }
    const login = () => {
        if (!password) {
            toast.current.show({ severity: 'error', summary: 'Validation Failed', detail: 'Please input password', life: 3000 })
            return
        }

        gobenchService.login({ password }).then((data) => {
            if (!data || !data.id) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Get token failed', life: 3000 })
                return
            }
            localStorage.set('token', data.id)
            router.push('/')
            setLoading(false)
        }).catch(handleCatch)
    }
    return (
        <div className={containerClassName}>
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`${contextPath}/layout/images/gobench-logo.png`} alt="Sakai logo" className="mb-5 w-18rem flex-shrink-0" />
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src={`${contextPath}/layout/images/favicon.png`} alt="Image" height="50" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-3">Welcome, Isabel!</div>
                            <span className="text-600 font-medium">Enter password to continue</span>
                        </div>

                        <div>

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password inputid="password1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" toggleMask className="w-full mb-5" inputClassName='w-full p-3 md:w-30rem'></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox inputid="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked)} className="mr-2"></Checkbox>
                                    <label htmlFor="rememberme1">
                                        Remember me
                                    </label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Don't need authentication?
                                </a>
                            </div>
                            <Button label="Sign In" className="w-full p-3 text-xl" onClick={login}></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

LoginPage.getLayout = function getLayout(page) {
    return (
        <React.Fragment>
            {page}
            <AppConfig simple />
        </React.Fragment>
    )
}
export default LoginPage
