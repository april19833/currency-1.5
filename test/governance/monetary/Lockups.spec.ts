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
import { ERRORS } from '../../utils/errors'
import {
  Lockups,
  Policy,
  ECO,
  ECO__factory,
  Lockups__factory,
} from '../../../typechain-types'

describe('Lockups', () => {
  let policyImpersonator: SignerWithAddress

  let currencyGovernanceImpersonator: SignerWithAddress

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let lockups: Lockups

  let alice: SignerWithAddress

  let bob: SignerWithAddress

  let charlie: SignerWithAddress

  let dave: SignerWithAddress

  const depositWindow = 600

  before(async () => {
    ;[policyImpersonator, currencyGovernanceImpersonator, alice, bob, charlie, dave] =
      await ethers.getSigners()
  })

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )

    const ecoFactory: MockContractFactory<ECO__factory> = await smock.mock(
      'ECO'
    )
    eco = await ecoFactory.deploy(
      policy.address,
      policy.address, // distributor
      1000, // initial supply
      policy.address // initial pauser
    )
    await eco.setVariable('inflationMultiplier', "1000000000000000000")
    const lockupsFactory = new Lockups__factory()
    lockups = await lockupsFactory
      .connect(policyImpersonator)
      .deploy(
        policy.address,
        constants.AddressZero, //notifier
        eco.address,
        depositWindow
      )
  })

  it.only('constructs', async () => {
    expect(await lockups.eco()).to.eq(eco.address)
    expect(await lockups.depositWindow()).to.eq(depositWindow)
    expect(await lockups.currentInflationMultiplier()).to.eq('1000000000000000000')
  })

  describe('unpermissioned', async () => {
    it('doesnt let nonauthorized create a lockup', async () => {

    })

    it('doesnt let nonpolicy sweep funds', async () => {

    })
  })

  it('only lets authorized call execute', async () => {
  })
})
