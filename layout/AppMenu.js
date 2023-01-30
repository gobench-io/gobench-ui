import getConfig from 'next/config'
import React, { useContext } from 'react'
import AppMenuitem from './AppMenuitem'
import { LayoutContext } from './context/layoutcontext'
import { MenuProvider } from './context/menucontext'
import Link from 'next/link'

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext)
    const contextPath = getConfig().publicRuntimeConfig.contextPath
    const model = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Documentation',
            items: [
                {
                    label: 'Example',
                    icon: 'pi pi-fw pi-question',
                    to: 'https://github.com/gobench-io/gobench/blob/master/examples/http/bench_http.go',
                    target: '_blank'
                },
                {
                    label: 'View Source',
                    icon: 'pi pi-fw pi-search',
                    url: 'https://github.com/gobench-io/gobench',
                    target: '_blank'
                }
            ]
        },
    ]

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>
                })}

            </ul>
        </MenuProvider>
    )
}

export default AppMenu
