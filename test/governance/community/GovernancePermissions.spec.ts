import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// import { expect } from 'chai'
import { deployProxy } from '../../../deploy/utils'
import { Policy } from '../../../typechain-types/contracts/policy'
import { Policy__factory } from '../../../typechain-types/factories/contracts/policy'

describe('Policy Integration Tests', () => {
  let alice: SignerWithAddress
  let governanceImpersonator: SignerWithAddress
  before(async () => {
    ;[alice, governanceImpersonator] = await ethers.getSigners()
  })

  let policy: Policy

  beforeEach(async () => {
    policy = (
      await deployProxy(alice, Policy__factory, [
        governanceImpersonator.address,
      ])
    )[0] as Policy
  })

  it('TODO: integration tests here testing proposals to hit every onlyPolicy function', async () => {
    console.log(governanceImpersonator.address)
    console.log(policy.address)
  })
})
