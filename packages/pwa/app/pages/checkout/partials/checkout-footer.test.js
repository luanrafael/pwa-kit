/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import CheckoutFooter from './checkout-footer'
import {renderWithProviders} from '../../../utils/test-utils'

import {mockConfig} from '../../../../config/mocks/mockConfigData'
jest.mock('../../../utils/utils', () => {
    const original = jest.requireActual('../../../utils/utils')
    return {
        ...original,
        getConfig: jest.fn(() => mockConfig),
        getUrlConfig: jest.fn(() => mockConfig.app.url)
    }
})
test('renders component', () => {
    renderWithProviders(<CheckoutFooter />)
    expect(screen.getByRole('link', {name: 'Shipping'})).toBeInTheDocument()
})
