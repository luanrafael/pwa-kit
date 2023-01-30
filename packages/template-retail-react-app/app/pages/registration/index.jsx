/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Container} from '@chakra-ui/react'
import {
    ShopperLoginHelpers,
    useShopperLoginHelper,
    useCustomerType
} from 'commerce-sdk-react-preview'
import {useForm} from 'react-hook-form'
import {useLocation} from 'react-router-dom'
import Seo from '../../components/seo'
import RegisterForm from '../../components/register'
import useNavigation from '../../hooks/use-navigation'
import useEinstein from '../../commerce-api/hooks/useEinstein'
import {API_ERROR_MESSAGE} from '../../constants'

const Registration = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const {isRegistered} = useCustomerType()
    const form = useForm()
    const einstein = useEinstein()
    const {pathname} = useLocation()
    const register = useShopperLoginHelper(ShopperLoginHelpers.Register)

    const submitForm = (data) => {
        const body = {
            customer: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                login: data.email
            },
            password: data.password
        }

        return register.mutateAsync(body, {
            onSuccess: () => navigate('/account'),
            onError: () => {
                form.setError('global', {type: 'manual', message: formatMessage(API_ERROR_MESSAGE)})
            }
        })
    }

    // If customer is registered push to account page
    useEffect(() => {
        if (isRegistered) {
            navigate('/account')
        }
    }, [])

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
    }, [])

    return (
        <Box data-testid="registration-page" bg="gray.50" py={[8, 16]}>
            <Seo title="Registration" description="Customer sign up" />
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                <RegisterForm
                    submitForm={submitForm}
                    form={form}
                    clickSignIn={() => navigate('/login')}
                />
            </Container>
        </Box>
    )
}

Registration.getTemplateName = () => 'registration'

Registration.propTypes = {
    match: PropTypes.object
}

export default Registration
