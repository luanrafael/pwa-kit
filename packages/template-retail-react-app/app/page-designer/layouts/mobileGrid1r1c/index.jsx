/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {SimpleGrid} from '@chakra-ui/react'
import {Region, regionPropType} from 'commerce-sdk-react-preview/components'

/**
 * This layout component displays its children in a 1 x 1 grid on both mobile and desktop.
 *
 * @param {componentProps} props
 * @param {regionType []} props.regions - The page designer regions for this component.
 * @param {object} props.data - The data for the component.
 * @param {string} props.typeId - A mapping of typeId's to react components representing the type.
 * @returns {React.ReactElement} - Grid component.
 */
export const MobileGrid1r1c = ({regions}) => (
    <SimpleGrid className="mobile-1r-1c" columns={1}>
        {regions.map((region) => (
            <Region key={region.id} region={region} />
        ))}
    </SimpleGrid>
)

MobileGrid1r1c.displayName = 'MobileGrid1r1c'

MobileGrid1r1c.propTypes = {
    // Internally Provided
    regions: PropTypes.arrayOf(regionPropType).isRequired
}

export default MobileGrid1r1c
