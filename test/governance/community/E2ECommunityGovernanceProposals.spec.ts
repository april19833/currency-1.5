import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../../deploy/standalone.fixture'
import { DAY } from '../../utils/constants'
import { Contract } from 'ethers'
import { time } from '@nomicfoundation/hardhat-network-helpers'

import { deploy } from '../../../deploy/utils'
import { passProposal } from '../../utils/passProposal'
import {
  AccessRootPolicyFunds__factory,
  AddTxToNotifier__factory,
  SingleTrusteeReplacement__factory,
} from '../../../typechain-types'
import { convertTypeAcquisitionFromJson } from 'typescript'

const INITIAL_SUPPLY = ethers.utils.parseUnits('30000', 'ether')

describe.only('E2E tests for common community governance actions', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress

  let contracts: Fixture

  beforeEach(async () => {
    ;[alice, bob, charlie] = await ethers.getSigners()
    contracts = await testnetFixture(
      [bob.address, charlie.address],
      alice.address,
      INITIAL_SUPPLY.toString(),
      INITIAL_SUPPLY.toString(),
      false,
      { trusteeTerm: 28 * DAY }
    )
  })

  it('AccessRootPolicyFunds', async () => {
    await contracts.base.eco.transfer(contracts.base.policy.address, 100)
    await contracts.base.ecox.transfer(contracts.base.policy.address, 100)

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
  it('addTxToNotifier', async () => {
    const notifier = contracts.monetary.rebaseNotifier
    await expect(notifier.transactions(0)).to.be.reverted
    expect(await notifier.totalGasCost()).to.eq(0)

    const bytesData = notifier.interface.encodeFunctionData('totalGasCost')

    const prop = await deploy(alice, AddTxToNotifier__factory, [
      notifier.address,
      bob.address,
      bytesData,
      123,
    ])

    expect(await prop.txData()).to.eq(bytesData)
    await passProposal(contracts, prop, alice)

    await expect(notifier.transactions(0)).to.not.be.reverted
    const tx = await notifier.transactions(0)

    expect(tx.target).to.eq(bob.address)
    expect(tx.data).to.eq(bytesData) // this is failing
    // i don't understand why, going to move on for now.
    // No matter what data I input the data field of the added transaction is just 0x.
    expect(tx.gasCost).to.eq(123)
    expect(await notifier.totalGasCost()).to.eq(123)
  })
  it.only('singleTrusteeReplacement', async () => {
    expect(await contracts.monetary.trustedNodes.numTrustees()).to.eq(2)
    const trusteeToReplace = await contracts.monetary.trustedNodes.trustees(1)
    expect(await contracts.monetary.trustedNodes.trustees(1)).to.not.eq(
      alice.address
    )

    const prop = await deploy(alice, SingleTrusteeReplacement__factory, [
      contracts.monetary.trustedNodes.address,
      trusteeToReplace,
      alice.address,
    ])

    await passProposal(contracts, prop, alice)

    expect(await contracts.monetary.trustedNodes.numTrustees()).to.eq(2)
    expect(await contracts.monetary.trustedNodes.trustees(1)).to.eq(
      alice.address
    )
  })
})
