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
import { TrustedNodes, CurrencyGovernance } from '../../../typechain-types'

describe('L1ECOBridge', () => {
    let alice: SignerWithAddress
    let bob: SignerWithAddress
    let charlie: SignerWithAddress
    let dave: SignerWithAddress
    let niko: SignerWithAddress
    let mila: SignerWithAddress
    let policyImpersonater: SignerWithAddress
    before(async () => {
      ;[policyImpersonater, alice, bob, charlie, dave, niko, mila] = await ethers.getSigners()
    })

    let TrustedNodes: MockContract<Contract>
    let CurrencyGovernance: MockContract<Contract>
    let Fake__Policy: FakeContract
    beforeEach(async () => {
        // Get a new mock L1 messenger
        Fake__Policy = await smock.fake<Contract>(
          'Policy',
          { address: await policyImpersonater.getAddress() } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
        )
    
        TrustedNodes = await (
          await smock.mock(
            'TrustedNodes'
          )
        ).deploy(
          Fake__Policy.address,
          [
            bob.address,
            charlie.address,
            dave.address,
          ],
          0,
        )

        CurrencyGovernance = await (await smock.mock('CurrencyGovernance')).deploy(Fake__Policy.address,TrustedNodes.address,alice.address)
    })
})
