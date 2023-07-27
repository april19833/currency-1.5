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
import { L2ECO, L2ECOBridge, Policy } from '../../typechain-types'

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
          L1CrossDomainMessenger.abi,
          { address: await policyImpersonater.getAddress() } // This allows us to use an ethers override {from: Mock__L2CrossDomainMessenger.address} to mock calls
        )
    
        L1ERC20 = await (
          await smock.mock(
            '@helix-foundation/currency/contracts/currency/ECO.sol:ECO'
          )
        ).deploy(
          DUMMY_L1_ERC20_ADDRESS,
          alice.address,
          ethers.utils.parseEther('10000'),
          alice.address
        )
        L2ECOBridge = await (await smock.mock('L2ECOBridge')).deploy()
    })
})
