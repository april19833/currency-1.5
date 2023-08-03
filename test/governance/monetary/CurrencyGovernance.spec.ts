import { ethers } from 'hardhat'
import { Signer, constants, BigNumber } from 'ethers'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  TEST,
} from '../../utils/constants'
import { ERRORS } from '../../utils/errors'
import { TrustedNodes__factory, TrustedNodes, CurrencyGovernance__factory, CurrencyGovernance, Policy } from '../../../typechain-types'

describe('CurrencyGovernance', () => {
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

    let TrustedNodes: MockContract<TrustedNodes>
    let CurrencyGovernance: MockContract<CurrencyGovernance>
    let Fake__Policy: FakeContract<Policy>
    beforeEach(async () => {
        // Get a new mock L1 messenger
        Fake__Policy = await smock.fake<Policy>(
          'Policy',
          { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
        )
    
        TrustedNodes = await(
          await smock.mock<TrustedNodes__factory>(
            'TrustedNodes'
          )
        ).deploy(
          Fake__Policy.address,
          [
            bob.address,
            charlie.address,
            dave.address,
          ],
          0,
        )

        CurrencyGovernance = await (await smock.mock<CurrencyGovernance__factory>('CurrencyGovernance')).deploy(Fake__Policy.address,TrustedNodes.address,alice.address)
    })

    describe('trustee role', async () => {
      it('trustees can call onlyTrusted functions', async () => {
        await CurrencyGovernance.connect(bob).propose(0,1,1,1,1,1,'')
      })

      it('non-trustees cannot call onlyTrusted functions', async () => {
        await expect(
          CurrencyGovernance.connect(alice).propose(0,1,1,1,1,1,'')
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
      })
    })
})
