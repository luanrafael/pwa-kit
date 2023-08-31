/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useReducer} from 'react'
import {Helmet} from 'react-helmet'

/** Origins that are allowed to run Storefront Preview. */
const TRUSTED_ORIGINS = [
    'https://runtime.commercecloud.com',
    'https://runtime-admin-staging.mobify-storefront.com',
    'https://runtime-admin-preview.mobify-storefront.com'
]

/** Detects whether the storefront is running in an iframe. */
const detectInIframe = () => typeof window !== 'undefined' && window.parent !== window.self

/** Gets the parent origin when running in an iframe. */
const getParentOrigin = () => {
    if (detectInIframe()) {
        if (window.location.ancestorOrigins) return window.location.ancestorOrigins[0]
        // ancestorOrigins does not exist in Firefox, so we use referrer as a fallback
        if (document.referrer) return new URL(document.referrer).origin
    }
}

const isParentOriginTrusted = (parentOrigin) => {
    return window.location.hostname === 'localhost'
        ? parentOrigin === 'http://localhost:4000' // Development
        : TRUSTED_ORIGINS.includes(parentOrigin) // Production
}

/** Detects whether the storefront is running in an iframe as part of Storefront Preview. */
const detectStorefrontPreview = () => {
    const parentOrigin = getParentOrigin()
    return Boolean(parentOrigin) && isParentOriginTrusted(parentOrigin)
}

/** Returns the URL to load the Storefront Preview client script from the parent origin. */
const getClientScript = () => {
    const parentOrigin = getParentOrigin() ?? 'https://runtime.commercecloud.com'
    return parentOrigin === 'http://localhost:4000'
        ? 'http://localhost:4000/mobify/bundle/development/static/storefront-preview.js'
        : `${parentOrigin}/cc/b2c/preview/preview.client.js`
}

/**
 * Initializes the `window.STOREFRONT_PREVIEW` object and returns a component that will create the
 * connection to Runtime Admin.
 * @param {object} customizations - Customizations to the Storefront Preview behavior
 * @param {boolean} enabled - Whether Storefront Preview is enabled. Defaults to detecting whether
 * the storefront is framed by Runtime Admin.
 */
export const useStorefrontPreview = (customizations = {}, enabled = detectStorefrontPreview()) => {
    const [, forceUpdate] = useReducer((x) => x + 1, 0)

    useEffect(() => {
        if (enabled) {
            window.STOREFRONT_PREVIEW = {
                rerender: () => forceUpdate(),
                ...window.STOREFRONT_PREVIEW,
                ...customizations
            }
        }
        return () => {
            // Avoid exposing the ability to re-render the wrong thing.
            if (window.STOREFRONT_PREVIEW?.rerender) window.STOREFRONT_PREVIEW.rerender = () => {}
        }
    }, [enabled, forceUpdate])

    const StorefrontPreview = () =>
        enabled && (
            <Helmet>
                <script src={getClientScript()} type="text/javascript"></script>
            </Helmet>
        )

    return StorefrontPreview
}
