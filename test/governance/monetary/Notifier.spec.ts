/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { ERRORS } from '../../utils/errors'
import {
  Notifier,
  Notifier__factory,
  Policy,
  Eco,
} from '../../../typechain-types'
import { DAY } from '../../utils/constants'

describe('Notifier', () => {

  let policyImpersonator: SignerWithAddress
  let currencyGovernanceImpersonator: SignerWithAddress

  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress

  before(async () => {
    ;[
      policyImpersonator,
      alice,
      bob,
      charlie,
      dave,
    ] = await ethers.getSigners()
  })

  let policy: FakeContract<Policy>

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )
    // currencyGovernance = await smock.fake<CurrencyGovernance>(
    //   'CurrencyGovernance',
    //   { address: currencyGovernanceImpersonator.address }
    // )
    // const ecoXFactory: MockContractFactory<ECOx__factory> = await smock.mock(
    //   'ECOx'
    // )

    // const trustedNodesFactory = new TrustedNodes__factory()
    // trustedNodes = await trustedNodesFactory
    //   .connect(policyImpersonator)
    //   .deploy(
    //     policy.address,
    //     currencyGovernance.address,
    //     ecoX.address,
    //     initialTermLength,
    //     initialReward,
    //     [alice.address, bob.address]
    //   )
  })

  it ("constructs", async () => {
    
  })
})