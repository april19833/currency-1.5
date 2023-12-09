import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../../deploy/standalone.fixture'
import { DAY } from '../../utils/constants'
import { Contract } from 'ethers'
import { time } from '@nomicfoundation/hardhat-network-helpers'

import { deploy } from '../../../deploy/utils'
import { passProposal } from '../../utils/passProposal'
import { AccessRootPolicyFunds__factory } from '../../../typechain-types'

const INITIAL_SUPPLY = ethers.utils.parseUnits('30000', 'ether')

describe.only('E2E test to access funds in treasury', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress

  let contracts: Fixture

  before(async () => {
    ;[alice, bob, charlie] = await ethers.getSigners()
    contracts = await testnetFixture(
      [bob.address, charlie.address],
      alice.address,
      INITIAL_SUPPLY.toString(),
      INITIAL_SUPPLY.toString(),
      false,
      { trusteeTerm: 28 * DAY }
    )

    await contracts.base.eco.transfer(contracts.base.policy.address, 100)
    await contracts.base.ecox.transfer(contracts.base.policy.address, 100)
  })

  it('works', async () => {
    expect(
      await contracts.base.eco.balanceOf(contracts.base.policy.address)
    ).to.eq(100)
    expect(
      await contracts.base.ecox.balanceOf(contracts.base.policy.address)
    ).to.eq(100)
    expect(await contracts.base.eco.balanceOf(bob.address)).to.eq(0)
    expect(await contracts.base.ecox.balanceOf(bob.address)).to.eq(0)

    const prop = await deploy(alice, AccessRootPolicyFunds__factory, [
      bob.address,
      contracts.base.eco.address,
      contracts.base.ecox.address,
      25,
      49,
      'name',
      'description',
      'url',
    ])

    await passProposal(contracts, prop, alice)
    expect(
      await contracts.base.eco.balanceOf(contracts.base.policy.address)
    ).to.eq(75)
    expect(
      await contracts.base.ecox.balanceOf(contracts.base.policy.address)
    ).to.eq(51)
    expect(await contracts.base.eco.balanceOf(bob.address)).to.eq(25)
    expect(await contracts.base.ecox.balanceOf(bob.address)).to.eq(49)
  })
})
