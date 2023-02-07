/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useEffect, useState} from 'react'
import {Page as PageType} from '../types'
import {Region} from '../Region'

type ComponentMap = {
    [typeId: string]: React.ComponentType
}

interface PageProps extends React.ComponentProps<'div'> {
    page: PageType
    components: ComponentMap
}

type PageContextValue =
    | {
          components: ComponentMap
      }
    | undefined

// This context will hold the component map as well as any other future context.
export const PageContext = React.createContext(undefined as PageContextValue)

// This hook allows sub-components to use the page context. In our case we use it
// so that the generic <Component /> can use the component map to know which react component
// to render.
export const usePageContext = () => {
    const value = useContext(PageContext)

    if (!value) {
        throw new Error('"usePageContext" cannot be used outside of a page component.')
    }

    return value
}

/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param PageProps
 * @returns JSX.Element
 */
export const Page = (props: PageProps) => {
    const {page, components, className = '', ...rest} = props
    const [contextValue, setContextValue] = useState({components} as PageContextValue)
    const {id, regions} = page || {}

    // NOTE: This probably is not required as the list of components is known at compile time,
    // but we might need this ability in the future if we are to lazy load components.
    useEffect(() => {
        setContextValue({
            ...contextValue,
            components
        })
    }, [components])

    return (
        <PageContext.Provider value={contextValue}>
            <div id={id} className={`page ${className}`} {...rest}>
                <div className="container">
                    {regions?.map((region) => (
                        <div key={region.id} className="row">
                            <Region region={region} />
                        </div>
                    ))}
                </div>
            </div>
        </PageContext.Provider>
    )
}

Page.displayName = 'Page'

export default Page
