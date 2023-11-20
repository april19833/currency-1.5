import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// import { expect } from 'chai'
import { Policy__factory, Policy } from '../../../typechain-types'
import { deployProxy } from '../../../deploy/utils'

describe('Policy Integration Tests', () => {
  let alice: SignerWithAddress
  let governanceImpersonator: SignerWithAddress
  before(async () => {
    ;[alice, governanceImpersonator] = await ethers.getSigners()
  })

  let policy: Policy

  beforeEach(async () => {
    policy = (await deployProxy(alice, Policy__factory, [
      governanceImpersonator.address,
    ])) as Policy
  })

  it('TODO: integration tests here testing proposals to hit every onlyPolicy function', async () => {
    console.log(governanceImpersonator.address)
    console.log(policy.address)
  })
})
