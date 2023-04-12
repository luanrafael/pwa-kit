/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')
const mockConfig = require(path.join(__dirname, 'config/mocks/default.js'))
require('raf/polyfill') // fix requestAnimationFrame issue with polyfill
require('@testing-library/jest-dom/extend-expect')
const {Crypto} = require('@peculiar/webcrypto')
const {setupServer} = require('msw/node')
const {rest} = require('msw')
import {registerUserToken} from './app/utils/test-utils'
const {configure: configureTestingLibrary} = require('@testing-library/react')

const {
    mockCategory,
    mockedRegisteredCustomer,
    exampleTokenReponse
} = require('./app/mocks/mock-data')

configureTestingLibrary({
    // Increase to: 6 x default timeout of 1 second
    ...(process.env.CI ? {asyncUtilTimeout: 6000} : {})
})

/**
 * Set up an API mocking server for testing purposes.
 * This mock server includes the basic oauth flow endpoints.
 */
export const setupMockServer = () => {
    return setupServer(
        rest.post('*/oauth2/authorize', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.get('*/oauth2/authorize', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.get('*/oauth2/logout', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(exampleTokenReponse))
        ),
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        ),
        rest.post('*/sessions', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'customerid',
                    // Is this token for guest or registered user?
                    access_token:
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoyNjczOTExMjYxLCJpYXQiOjI2NzM5MDk0NjF9.BDAp9G8nmArdBqAbsE5GUWZ3fiv2LwQKClEFDCGIyy8',
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            )
        ),
        rest.get('*/categories/:categoryId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockCategory))
        ),
        rest.post('*/baskets/actions/merge', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/v3/activities/EinsteinTestSite/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json({}))
        }),
        rest.post('*/v3/personalization/recs/EinsteinTestSite/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json({}))
        })
    )
}

beforeAll(() => {
    global.server = setupMockServer()
    global.server.listen({
        onUnhandledRequest(req) {
            console.error('Found an unhandled %s request to %s', req.method, req.url.href)
        }
    })
})
afterEach(() => {
    global.server.resetHandlers()
})
afterAll(() => {
    // Intentionally not closing the server!
    // We run into many race condition issues,
    // that was cause by the server close too soon
    // and the tests not well written in an proper async manner.
    // Let's not close the server and see how things goes.
    // We can revisit this.
    // global.server.close()
})

// Mock the application configuration to be used in all tests.
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => mockConfig
    }
})

// TextEncoder is a web API, need to import it
// from nodejs util in testing environment.
global.TextEncoder = require('util').TextEncoder

// This file consists of global mocks for jsdom.
class StorageMock {
    constructor() {
        this.store = {}
    }
    clear() {
        this.store = {}
    }
    getItem(key) {
        return this.store[key] || null
    }
    setItem(key, value) {
        this.store[key] = value?.toString()
    }
    removeItem(key) {
        delete this.store[key]
    }
}

Object.defineProperty(window, 'crypto', {
    value: new Crypto()
})

Object.defineProperty(window, 'localStorage', {
    value: new StorageMock()
})

Object.defineProperty(window, 'sessionStorage', {
    value: new StorageMock()
})

Object.defineProperty(window, 'scrollTo', {
    value: () => null
})

if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }))
    })
}

const defaultHandlers = [
    {
        path: '*/oauth2/authorize',
        method: 'post'
    },
    {
        path: '*/oauth2/authorize'
    },
    {
        path: '*/oauth2/login',
        method: 'post',
        res: () => {
            return mockedRegisteredCustomer
        }
    },
    {
        path: '*/oauth2/logout',
        res: () => {
            return exampleTokenReponse
        }
    },
    {
        path: '*/customers/:customerId',
        res: () => {
            return mockedRegisteredCustomer
        }
    },
    {
        path: '*/sessions',
        method: 'post'
    },
    {
        path: '*/oauth2/token',
        method: 'post',
        res: () => {
            return {
                customer_id: 'customerid',
                access_token: registerUserToken,
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId',
                id_token: 'testIdToken'
            }
        }
    },
    {
        path: '*/categories/:categoryId',
        res: () => {
            return mockCategory
        }
    },
    {
        path: '*/baskets/actions/merge',
        method: 'post'
    },
    {
        path: '*/v3/activities/EinsteinTestSite/*',
        method: 'post',
        res: () => {
            return {}
        }
    },
    {
        path: '*/v3/personalization/recs/EinsteinTestSite/*',
        method: 'post',
        res: () => {
            return {}
        }
    }
]

const setupHandlers = (handlerConfig = [], defaultHandlers = []) => {
    return [...defaultHandlers, ...handlerConfig].map((config) => {
        return rest[config.method || 'get'](config.path, (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(config.status || 200),
                config.res && ctx.json(config.res(req, res, ctx))
            )
        })
    })
}

// NOTE!!!: Never initialize the server in the global scope.
// call it within a test suite. e.g
// describe('test suite', () => {
//    createServer([
//       {
//            path: '*/oauth2/token',
//            method: 'post',
//            res: () => {
//            return {
//               customer_id: 'customerid_1',
//               access_token: registerUserToken,
//               refresh_token: 'testrefeshtoken_1',
//               usid: 'testusid_1',
//               enc_user_id: 'testEncUserId_1',
//               id_token: 'testIdToken_1'
//            }
//       }
//    ])
// })
export function createServer(handlerConfig) {
    const handlers = setupHandlers(handlerConfig, defaultHandlers)
    const server = setupServer(...handlers)

    const prependHandlersToServer = (handlerConfig = []) => {
        const handlers = setupHandlers(handlerConfig)
        server.use(...handlers)
    }

    beforeAll(() => {
        server.listen()
    })
    afterEach(() => {
        server.resetHandlers()
    })
    afterAll(() => {
        server.close()
    })

    return {server, prependHandlersToServer}
}
