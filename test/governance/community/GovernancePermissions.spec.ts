import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  Policy__factory,
  Policy,
  ForwardProxy__factory,
} from '../../../typechain-types'

describe('Policy Integration Tests', () => {
  let alice: SignerWithAddress
  let governanceImpersonator: SignerWithAddress
  before(async () => {
    ;[alice, governanceImpersonator] = await ethers.getSigners()
  })

  let Policy: Policy

  beforeEach(async () => {
    const Policyfact: Policy__factory = new Policy__factory(alice)

    const PolicyImpl = await Policyfact.connect(alice).deploy()

    const proxy = await new ForwardProxy__factory()
      .connect(alice)
      .deploy(PolicyImpl.address)

    Policy = Policyfact.attach(proxy.address)

    expect(Policy.address === proxy.address).to.be.true
  })

  it('TODO: integration tests here testing proposals to hit every onlyPolicy function', async () => {
    console.log(governanceImpersonator.address)
  })
})
