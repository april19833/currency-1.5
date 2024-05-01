import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../../deploy/standalone.fixture'
import { DAY } from '../../utils/constants'

import { deploy } from '../../../deploy/utils'
import { passProposal } from '../../utils/passProposal'
import { AddMinters__factory } from '../../../typechain-types'

const INITIAL_SUPPLY = ethers.utils.parseUnits('30000000', 'ether')

describe('test for add minters comm gov proposal', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress

  let contracts: Fixture
  before(async () => {
    ;[alice, bob, charlie] = await ethers.getSigners()
    contracts = await testnetFixture(
      [bob.address, charlie.address],
      alice.address,
      INITIAL_SUPPLY.toString(), // eco supply
      INITIAL_SUPPLY.div(20).toString(), // ecox supply, different amount to make ecox voting power less than eco to allow supermajority passing  without having to stake
      false,
      { trusteeTerm: 28 * DAY }
    )
  })
  it('works', async () => {
    expect(await contracts.base.eco.minters(alice.address)).to.be.false
    expect(await contracts.base.eco.minters(bob.address)).to.be.false
    const prop = await deploy(alice, AddMinters__factory, [
      [alice.address, bob.address],
      contracts.base.eco.address,
      contracts.base.ecox.address,
      'minterAdder',
      'adds minters',
      'www.add.min/ters',
    ])
    await passProposal(contracts, alice, prop)
    expect(await contracts.base.eco.minters(alice.address)).to.be.true
    expect(await contracts.base.eco.minters(bob.address)).to.be.true
  })
})
