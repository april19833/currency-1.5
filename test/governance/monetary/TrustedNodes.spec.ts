/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { Signer, Contract, constants, BigNumber } from 'ethers'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  TEST,
} from '../../utils/constants'
import { ERROR_STRINGS } from '../../utils/errors'
import { getABI } from '../../utils/testUtils'
// import { TrustedNodes, CurrencyGovernance, ECOx, TrustedNodes__factory } from '../../../typechain-types'

describe('TrustedNodes', () => {
    let policyImpersonator: SignerWithAddress

    let alice: SignerWithAddress
    let bob: SignerWithAddress
    let charlie: SignerWithAddress
    let dave: SignerWithAddress

    let trustedNodesABI = getABI('artifacts/contracts/governance/monetary/TrustedNodes.sol/TrustedNodes.json')

    let initialReward: number = 1000

    before(async() => {
        ;[policyImpersonator, alice, bob, charlie, dave] = await ethers.getSigners()
    })

    let fake__Policy: FakeContract

    let trustedNodesFactory = new ethers.ContractFactory(trustedNodesABI.abi, trustedNodesABI.bytecode)
    let trustedNodes
    let currencyGovernance: MockContract<Contract>
    let ecoX: MockContract<Contract>

    beforeEach(async() => {
        console.log(policyImpersonator)
        fake__Policy = await smock.fake<Contract>(
            'Policy',
            { address: await policyImpersonator.getAddress() } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
        )
        // trustedNodes = TrustedNodes__factory.connect(
        //     (await trustedNodesFactory.connect(policyImpersonator)
        //         .deploy(
        //             fake__Policy.address,
        //             [await alice.getAddress(), await bob.getAddress()],
        //             initialReward
        //         )
        //     ).address,
        //     policyImpersonator
        // )
        trustedNodes = await trustedNodesFactory
                .connect(policyImpersonator)
                .deploy(
                    fake__Policy.address,
                    [await alice.getAddress(), await bob.getAddress()],
                    initialReward
                )
        currencyGovernance = await(
            await 
                smock.mock('CurrencyGovernance')
            ).deploy(
                fake__Policy.address,
                trustedNodes.address,
                await alice.getAddress()
            )
        ecoX = await(
            await 
                smock.mock('EcoX')
            ).deploy(
                fake__Policy.address,
                await alice.getAddress(),
                await alice.getAddress(),
                await alice.getAddress(), // the eco address, but doesnt matter
                await alice.getAddress()
            )
    })

    it('works', async () => {
        console.log('womp')
    })
    
})