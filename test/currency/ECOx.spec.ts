import { ethers } from 'hardhat'
import { expect } from 'chai'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../utils/errors'
import {
  ECOx,
  ECOx__factory,
  ForwardProxy__factory,
  Policy,
} from '../../typechain-types'

describe('EcoX', () => {
  let alice: SignerWithAddress // default signer
  let bob: SignerWithAddress // pauser
  let charlie: SignerWithAddress
  let policyImpersonater: SignerWithAddress
  before(async () => {
    ;[alice, bob, charlie, policyImpersonater] = await ethers.getSigners()
  })

  let ecoXImpl: ECOx
  let ecoXProxy: ECOx
  let Fake__Policy: FakeContract<Policy>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
    )

    const EcoXFact = new ECOx__factory(alice)

    ecoXImpl = await EcoXFact.connect(policyImpersonater).deploy(
      Fake__Policy.address, // policy
      Fake__Policy.address, // ecoxstaking
      Fake__Policy.address, // ecoxexchange
      bob.address // pauser
    )

    const proxy = await new ForwardProxy__factory()
      .connect(policyImpersonater)
      .deploy(ecoXImpl.address)

    ecoXProxy = EcoXFact.attach(proxy.address)

    expect(ecoXProxy.address === proxy.address).to.be.true
  })

  describe('role permissions', () => {
    describe('minter role', () => {
      it('can be added by the policy', async () => {
        await ecoXProxy
          .connect(policyImpersonater)
          .updateMinters(charlie.address, true)
        const charlieMinting = await ecoXProxy.minters(charlie.address)
        expect(charlieMinting).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ecoXProxy
          .connect(policyImpersonater)
          .updateMinters(charlie.address, true)
        await ecoXProxy
          .connect(policyImpersonater)
          .updateMinters(charlie.address, false)
        const charlieMinting = await ecoXProxy.minters(charlie.address)
        expect(charlieMinting).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ecoXProxy
            .connect(policyImpersonater)
            .updateMinters(charlie.address, true)
        )
          .to.emit(ecoXProxy, 'UpdatedMinters')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ecoXProxy.connect(charlie).updateMinters(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('burner role', () => {
      it('can be added by the policy', async () => {
        await ecoXProxy
          .connect(policyImpersonater)
          .updateBurners(charlie.address, true)
        const charlieBurning = await ecoXProxy.burners(charlie.address)
        expect(charlieBurning).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ecoXProxy
          .connect(policyImpersonater)
          .updateBurners(charlie.address, true)
        await ecoXProxy
          .connect(policyImpersonater)
          .updateBurners(charlie.address, false)
        const charlieBurning = await ecoXProxy.burners(charlie.address)
        expect(charlieBurning).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ecoXProxy
            .connect(policyImpersonater)
            .updateBurners(charlie.address, true)
        )
          .to.emit(ecoXProxy, 'UpdatedBurners')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ecoXProxy.connect(charlie).updateBurners(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('ECOxStaking role', () => {
      it('is onlyPolicy gated', async () => {
        await expect(
          ecoXProxy.connect(charlie).updateECOxStaking(charlie.address)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
      it('swaps out the addresses if called by policy', async () => {
        const oldStaking = await ecoXProxy.ecoXStaking()
        expect(oldStaking).to.not.eq(charlie.address)

        await expect(
          ecoXProxy
            .connect(policyImpersonater)
            .updateECOxStaking(charlie.address)
        )
          .to.emit(ecoXProxy, 'UpdatedECOxStaking')
          .withArgs(oldStaking, charlie.address)

        expect(await ecoXProxy.ecoXStaking()).to.eq(charlie.address)
      })
    })

    describe('ECOxExchange role', () => {
      it('is onlyPolicy gated', async () => {
        await expect(
          ecoXProxy.connect(charlie).updateECOxExchange(charlie.address)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
      it('swaps out the addresses if called by policy', async () => {
        const oldExchange = await ecoXProxy.ecoXExchange()
        expect(oldExchange).to.not.eq(charlie.address)

        await expect(
          ecoXProxy
            .connect(policyImpersonater)
            .updateECOxExchange(charlie.address)
        )
          .to.emit(ecoXProxy, 'UpdatedECOxExchange')
          .withArgs(oldExchange, charlie.address)

        expect(await ecoXProxy.ecoXExchange()).to.eq(charlie.address)
      })
    })
  })
  describe('mint', async () => {
    it('mints', async () => {
      await ecoXProxy
        .connect(policyImpersonater)
        .updateMinters(bob.address, true)
      await expect(ecoXProxy.connect(bob).mint(bob.address, 100))
        .to.emit(ecoXProxy, 'Transfer')
        .withArgs(ethers.constants.AddressZero, bob.address, 100)
    })
  })
  describe('burn', async () => {
    it('burns', async () => {
      await ecoXProxy
        .connect(policyImpersonater)
        .updateMinters(bob.address, true)
      await ecoXProxy
        .connect(policyImpersonater)
        .updateBurners(bob.address, true)

      await ecoXProxy.connect(bob).mint(bob.address, 100)
      // ow
      await expect(ecoXProxy.connect(bob).burn(bob.address, 100))
        .to.emit(ecoXProxy, 'Transfer')
        .withArgs(bob.address, ethers.constants.AddressZero, 100)
    })
  })
})
