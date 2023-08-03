/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Stack, useDisclosure, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import ProductItem from '@salesforce/retail-react-app/app/components/product-item/index'
import CartSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {
    useShopperBasketsMutation,
    useShippingMethodsForShipment,
    useProducts,
    useShopperCustomersMutation
} from '@salesforce/commerce-sdk-react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useIntl} from 'react-intl'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_ITEM_FROM_CART
} from '@salesforce/retail-react-app/app/constants'
import debounce from 'lodash/debounce'

const ProductItems = () => {
    // TODO: useProductItems()
    const {data: basket, isLoading} = useCurrentBasket()

    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: products} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(productIds),
            select: (result) => {
                // Convert array into key/value object with key is the product id
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )
    const {data: customer} = useCurrentCustomer()
    const {customerId, isRegistered} = customer

    /*****************Basket Mutation************************/
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    const updateShippingMethodForShipmentsMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )
    /*****************Basket Mutation************************/

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const [isCartItemLoading, setCartItemLoading] = useState(false)

    const {isOpen, onOpen, onClose} = useDisclosure()
    const {formatMessage} = useIntl()
    const toast = useToast()
    const navigate = useNavigation()
    const modalProps = useDisclosure()

    /******************* Shipping Methods for basket shipment *******************/
    // do this action only if the basket shipping method is not defined
    // we need to fetch the shippment methods to get the default value before we can add it to the basket
    // TODO: turn into a hook with better name -> useAssignDefaultShippingMethod(basket)
    useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: 'me'
            }
        },
        {
            // only fetch if basket is has no shipping method in the first shipment
            enabled:
                !!basket?.basketId &&
                basket.shipments.length > 0 &&
                !basket.shipments[0].shippingMethod,
            onSuccess: (data) => {
                updateShippingMethodForShipmentsMutation.mutate({
                    parameters: {
                        basketId: basket?.basketId,
                        shipmentId: 'me'
                    },
                    body: {
                        id: data.defaultShippingMethodId
                    }
                })
            }
        }
    )

    /************************* Error handling ***********************/
    const showError = () => {
        toast({
            title: formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }
    /************************* Error handling ***********************/

    /**************** Wishlist ****************/
    const {data: wishlist} = useWishList()

    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    // TODO: useWishlistHandler()
    const handleAddToWishlist = async (product) => {
        try {
            if (!customerId || !wishlist) {
                return
            }
            await createCustomerProductListItem.mutateAsync({
                parameters: {
                    listId: wishlist.id,
                    customerId
                },
                body: {
                    // NOTE: APi does not respect quantity, it always adds 1
                    quantity: product.quantity,
                    productId: product.productId,
                    public: false,
                    priority: 1,
                    type: 'product'
                }
            })
            toast({
                title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                status: 'success',
                action: (
                    // it would be better if we could use <Button as={Link}>
                    // but unfortunately the Link component is not compatible
                    // with Chakra Toast, since the ToastManager is rendered via portal
                    // and the toast doesn't have access to intl provider, which is a
                    // requirement of the Link component.
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        } catch {
            showError()
        }
    }
    /**************** Wishlist ****************/

    /***************************** Update quantity **************************/
    const changeItemQuantity = debounce(async (quantity, product) => {
        // This local state allows the dropdown to show the desired quantity
        // while the API call to update it is happening.
        const previousQuantity = localQuantity[product.itemId]
        setLocalQuantity({...localQuantity, [product.itemId]: quantity})
        setCartItemLoading(true)
        setSelectedItem(product)

        await updateItemInBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket?.basketId, itemId: product.itemId},
                body: {
                    productId: product.id,
                    quantity: parseInt(quantity)
                }
            },
            {
                onSettled: () => {
                    // reset the state
                    setCartItemLoading(false)
                    setSelectedItem(undefined)
                },
                onSuccess: () => {
                    setLocalQuantity({...localQuantity, [product.itemId]: undefined})
                },
                onError: () => {
                    // reset the quantity to the previous value
                    setLocalQuantity({...localQuantity, [product.itemId]: previousQuantity})
                    showError()
                }
            }
        )
    }, 750)

    // TODO: useItemQuantityHandler()
    const handleChangeItemQuantity = async (product, value) => {
        const {stockLevel} = products[product.productId].inventory

        // Handle removing of the items when 0 is selected.
        if (value === 0) {
            // Flush last call to keep ui in sync with data.
            changeItemQuantity.flush()

            // Set the selected item to the current product to the modal acts on it.
            setSelectedItem(product)

            // Show the modal.
            modalProps.onOpen()

            // Return false as 0 isn't valid section.
            return false
        }

        // Cancel any pending handlers.
        changeItemQuantity.cancel()

        // Allow use to selected values above the inventory.
        if (value > stockLevel || value === product.quantity) {
            return true
        }

        // Take action.
        changeItemQuantity(value, product)

        return true
    }
    /***************************** Update quantity **************************/

    /***************************** Remove Item from basket **************************/
    // TODO: useItemRemovalHandler()
    const handleRemoveItem = async (product) => {
        setSelectedItem(product)
        setCartItemLoading(true)
        await removeItemFromBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket.basketId, itemId: product.itemId}
            },
            {
                onSettled: () => {
                    // reset the state
                    setCartItemLoading(false)
                    setSelectedItem(undefined)
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {quantity: 1}),
                        status: 'success'
                    })
                },
                onError: () => {
                    showError()
                }
            }
        )
    }

    return (
        <Stack spacing={4}>
            {basket.productItems?.map((productItem, idx) => {
                return (
                    <ProductItem
                        key={productItem.productId}
                        index={idx}
                        secondaryActions={
                            <CartSecondaryButtonGroup
                                onAddToWishlistClick={handleAddToWishlist}
                                onEditClick={(product) => {
                                    setSelectedItem(product)
                                    onOpen()
                                }}
                                onRemoveItemClick={handleRemoveItem}
                            />
                        }
                        product={{
                            ...productItem,
                            ...(products && products[productItem.productId]),
                            price: productItem.price,
                            quantity: localQuantity[productItem.itemId]
                                ? localQuantity[productItem.itemId]
                                : productItem.quantity
                        }}
                        onItemQuantityChange={handleChangeItemQuantity.bind(this, productItem)}
                        showLoading={
                            isCartItemLoading && selectedItem?.itemId === productItem.itemId
                        }
                        handleRemoveItem={handleRemoveItem}
                    />
                )
            })}
        </Stack>
    )
}

export default ProductItems
