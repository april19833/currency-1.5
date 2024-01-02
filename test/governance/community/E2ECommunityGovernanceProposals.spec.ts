import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../../deploy/standalone.fixture'
import { DAY } from '../../utils/constants'
import { Contract } from 'ethers'

import { deploy } from '../../../deploy/utils'
import { passProposal } from '../../utils/passProposal'
import {
  AccessRootPolicyFunds__factory,
  AddTxToNotifier__factory,
  NewTrusteeCohort__factory,
  OZProxy__factory,
  SingleTrusteeReplacement__factory,
  TrustedNodesFactory__factory,
  UpgradedWrapper__factory,
  WrapperUpgradeProposal__factory,
  Wrapper__factory,
} from '../../../typechain-types'
import { TrustedNodes__factory } from '../../../typechain-types/factories/contracts/governance/monetary'

const INITIAL_SUPPLY = ethers.utils.parseUnits('30000', 'ether')

describe('E2E tests for common community governance actions', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress
  let edith: SignerWithAddress
  let francine: SignerWithAddress

  let contracts: Fixture

  beforeEach(async () => {
    ;[alice, bob, charlie, dave, edith, francine] = await ethers.getSigners()
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

    await passProposal(contracts, alice, prop)
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
    await passProposal(contracts, alice, prop)

    await expect(notifier.transactions(0)).to.not.be.reverted
    const tx = await notifier.transactions(0)

    expect(tx.target).to.eq(bob.address)
    expect(tx.gasCost).to.eq(123)
    expect(await notifier.totalGasCost()).to.eq(123)
    expect(tx.data).to.eq(bytesData)
  })

  it('singleTrusteeReplacement', async () => {
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

    await passProposal(contracts, alice, prop)

    expect(await contracts.monetary.trustedNodes.numTrustees()).to.eq(2)
    expect(await contracts.monetary.trustedNodes.trustees(1)).to.eq(
      alice.address
    )
  })

  it('NewTrusteeCohort', async () => {
    expect(await contracts.monetary.trustedNodes.numTrustees()).to.eq(2)
    let trustees = await contracts.monetary.trustedNodes.getTrustees()
    expect(trustees[0]).to.eq(bob.address)
    expect(trustees[1]).to.eq(charlie.address)
    expect(await contracts.monetary.trustedNodes.termLength()).to.eq(2419200)
    expect(await contracts.monetary.trustedNodes.voteReward()).to.eq(1000)

    const initialTrustedNodesAddress =
      await contracts.monetary.monetaryGovernance.trustedNodes()

    const trustedNodesFactory = await deploy(
      alice,
      TrustedNodesFactory__factory,
      [
        contracts.base.policy.address,
        contracts.monetary.monetaryGovernance.address,
        contracts.base.ecox.address,
      ]
    )

    const prop = await deploy(alice, NewTrusteeCohort__factory, [
      trustedNodesFactory.address,
      [dave.address, edith.address, francine.address],
      10101010,
      12341234,
    ])

    await passProposal(contracts, alice, prop)

    const newTrustedNodesAddress =
      await contracts.monetary.monetaryGovernance.trustedNodes()
    expect(newTrustedNodesAddress).to.not.eq(initialTrustedNodesAddress)
    const newTrustedNodes = new Contract(
      newTrustedNodesAddress,
      TrustedNodes__factory.abi,
      alice
    )

    expect(await newTrustedNodes.termLength()).to.eq(10101010)
    expect(await newTrustedNodes.voteReward()).to.eq(12341234)

    expect(await newTrustedNodes.numTrustees()).to.eq(3)
    trustees = await newTrustedNodes.getTrustees()
    expect(trustees[0]).to.eq(dave.address)
    expect(trustees[1]).to.eq(edith.address)
    expect(trustees[2]).to.eq(francine.address)
  })

  it('Transparent Upgradable Proxy upgrade', async () => {
    // deploy impls
    const oldImpl = await deploy(alice, Wrapper__factory)
    const newImpl = await deploy(alice, UpgradedWrapper__factory)
    // deploy proxy
    const proxy = await deploy(alice, OZProxy__factory, [
      oldImpl.address,
      contracts.base.policy.address,
    ])
    // test proxy
    const whoiamtest = await proxy.connect(alice).whoAmINonAdmin()
    expect(whoiamtest).to.equal(4)
    // created proxied impl object
    const oldTypedProxy = new Wrapper__factory(alice).attach(proxy.address)
    // test typed object
    await expect(oldTypedProxy.connect(alice).whoAmI())
      .to.emit(oldTypedProxy, 'HereIAm')
      .withArgs(1)

    // construct proposal
    const proposal = await deploy(alice, WrapperUpgradeProposal__factory, [
      newImpl.address,
      proxy.address,
    ])
    const name = await proposal.name()
    expect(name).to.equal('I am the wrapper upgrade proposal')
    const description = await proposal.description()
    expect(description).to.equal('I upgrade the wrapper to say it is poodled')
    const url = await proposal.url()
    expect(url).to.equal('www.wrapper-upgrayedd.com')

    await passProposal(contracts, alice, proposal)

    // confirm that upgrade occured
    const newTypedProxy = new UpgradedWrapper__factory(alice).attach(
      proxy.address
    )
    await expect(proxy.connect(alice).whoAmI())
      .to.emit(newTypedProxy, 'HereIAm')
      .withArgs(2)
  })
})
