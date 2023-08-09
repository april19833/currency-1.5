import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { smock, FakeContract, MockContract, MockContractFactory } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'

import { getABI } from '../../utils/testUtils'
import { TrustedNodes, TrustedNodes__factory, Policy, ECOx, ECOx__factory, CurrencyGovernance} from '../../../typechain-types'

describe('TrustedNodesFactory', () => {
    let policyImpersonator: SignerWithAddress
    
    let alice: SignerWithAddress
    let bob: SignerWithAddress

    let policy: FakeContract<Policy>

    let trustedNodesFactoryABI = getABI('artifacts/contracts/governance/monetary/TrustedNodesFactory.sol/TrustedNodesFactory.json')

    before(async() => {
        ;[policyImpersonator, alice, bob] = await ethers.getSigners()
    })

    beforeEach(async() => {
        policy = await smock.fake<Policy>(
            'Policy',
            { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
        )

    })
})