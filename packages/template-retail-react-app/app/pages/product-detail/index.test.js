/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockMasterProduct} from '../../commerce-api/mock-data'
import {screen, waitFor} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import ProductDetail from '.'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'

jest.setTimeout(60000)

jest.useFakeTimers()

jest.mock('../../commerce-api/einstein')

const MockedComponent = () => {
    return (
        <Switch>
            <Route
                path={createPathWithDefaults('/product/:productId')}
                render={(props) => <ProductDetail {...props} />}
            />
        </Switch>
    )
}

beforeEach(() => {
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(mockMasterProduct))
        })
    )
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/uk/en-GB/product/701642811398M')
})
afterEach(() => {
    jest.resetModules()
})

test('should render product details page', async () => {
    global.server.use(
        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        }),
        // mock add item to product lists
        rest.post('*/customers/:customerId/product-lists/:listId/items', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200))
        })
    )
    renderWithProviders(<MockedComponent />)
    await waitFor(() => {
        const productName = screen.getAllByText(/Checked Silk Tie/)
        expect(productName.length).toEqual(2)
        expect(screen.getAllByText(/19.19/).length).toEqual(2)
        expect(screen.getAllByText(/Add to Cart/).length).toEqual(2)
        expect(screen.getAllByText(/Add to Wishlist/).length).toEqual(2)
    })

    await waitFor(() => {
        expect(screen.getAllByText(/Ties/).length).toEqual(2)
    })
})
