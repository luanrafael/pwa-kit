/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryOptions, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

type Client = ApiClients['shopperPromotions']

/**
 * Returns an array of enabled promotions for a list of specified IDs. In the request URL, you can specify up to 50 IDs. If you specify an ID that contains either parentheses or the separator characters, you must URL encode these characters. Each request returns only enabled promotions as the server does not consider promotion qualifiers or schedules.
 * @returns A TanStack Query query hook with data from the Shopper Promotions `getPromotions` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-promotions?meta=getPromotions| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperpromotions.shopperpromotions-1.html#getpromotions | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePromotions = (
    apiOptions: Argument<Client['getPromotions']>,
    queryOptions: ApiQueryOptions<Client['getPromotions']> = {}
): UseQueryResult<DataType<Client['getPromotions']>> => {
    type Options = Argument<Client['getPromotions']>
    type Data = DataType<Client['getPromotions']>
    const {shopperPromotions: client} = useCommerceApi()
    const methodName = 'getPromotions'
    const requiredParameters = ['organizationId', 'siteId', 'ids'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Handles get promotion by filter criteria. Returns an array of enabled promotions matching the specified filter
criteria. In the request URL, you must provide a campaign_id parameter, and you can optionally specify a date
range by providing start_date and end_date parameters. Both parameters are required to specify a date range, as 
omitting one causes the server to return a MissingParameterException fault. Each request returns only enabled
promotions, since the server does not consider promotion qualifiers or schedules.
 * @returns A TanStack Query query hook with data from the Shopper Promotions `getPromotionsForCampaign` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-promotions?meta=getPromotionsForCampaign| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperpromotions.shopperpromotions-1.html#getpromotionsforcampaign | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePromotionsForCampaign = (
    apiOptions: Argument<Client['getPromotionsForCampaign']>,
    queryOptions: ApiQueryOptions<Client['getPromotionsForCampaign']> = {}
): UseQueryResult<DataType<Client['getPromotionsForCampaign']>> => {
    type Options = Argument<Client['getPromotionsForCampaign']>
    type Data = DataType<Client['getPromotionsForCampaign']>
    const {shopperPromotions: client} = useCommerceApi()
    const methodName = 'getPromotionsForCampaign'
    const requiredParameters = ['organizationId', 'campaignId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
