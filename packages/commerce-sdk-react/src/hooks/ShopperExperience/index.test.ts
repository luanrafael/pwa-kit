/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperExperience} from 'commerce-sdk-isomorphic'
import {getUnimplementedEndpoints} from '../../test-utils'
import * as queries from './query'

describe('Shopper Experience hooks', () => {
    test('all endpoints have hooks', () => {
        const unimplemtented = getUnimplementedEndpoints(ShopperExperience, queries)
        expect(unimplemtented).toEqual([])
    })
})
