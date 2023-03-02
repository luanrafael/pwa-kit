/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperPromotions} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pick} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperPromotions<{shortCode: string}>
type Params<T extends keyof QueryKeys> = NonNullable<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getPromotions: ['/organizations/', string, '/promotions', Params<'getPromotions'>]
    getPromotionsForCampaign: [
        '/organizations/',
        string,
        '/promotions/campaigns/',
        string,
        Params<'getPromotionsForCampaign'>
    ]
}

// This is defined here, rather than `types.ts`, because it relies on `Client` and `QueryKeys`,
// and making those generic would add too much complexity.
type QueryKeyHelper<T extends keyof QueryKeys> = {
    /**
     * Reduces the given parameters (which may have additional, unknown properties) to an object
     * containing *only* the properties required for an endpoint.
     */
    parameters: (params: Params<T>) => Params<T>
    /** Generates the path component of the query key for an endpoint. */
    path: (params: Params<T>) => ExcludeTail<QueryKeys[T]>
    /** Generates the full query key for an endpoint. */
    queryKey: (params: Params<T>) => QueryKeys[T]
}

export const getPromotions: QueryKeyHelper<'getPromotions'> = {
    parameters: (params) => pick(params, ['organizationId', 'siteId', 'ids', 'locale']),
    path: (params) => ['/organizations/', params.organizationId, '/promotions'],
    queryKey: (params: Params<'getPromotions'>) => [
        ...getPromotions.path(params),
        getPromotions.parameters(params)
    ]
}

export const getPromotionsForCampaign: QueryKeyHelper<'getPromotionsForCampaign'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'campaignId',
            'siteId',
            'startDate',
            'endDate',
            'currency'
        ]),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/promotions/campaigns/',
        params.campaignId
    ],
    queryKey: (params: Params<'getPromotionsForCampaign'>) => [
        ...getPromotionsForCampaign.path(params),
        getPromotionsForCampaign.parameters(params)
    ]
}