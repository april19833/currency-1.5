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
  let fakeStaking: SignerWithAddress
  let fakeExchange: SignerWithAddress
  before(async () => {
    ;[alice, bob, charlie, policyImpersonater, fakeStaking, fakeExchange] = await ethers.getSigners()
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
      fakeStaking.address, // ecoxstaking
      fakeExchange.address, // ecoxexchange
      [alice.address, bob.address], // minters
      [bob.address, alice.address], // burners
      bob.address // pauser
    )

    const proxy = await new ForwardProxy__factory()
      .connect(policyImpersonater)
      .deploy(ecoXImpl.address)

    ecoXProxy = EcoXFact.attach(proxy.address)

    expect(ecoXProxy.address === proxy.address).to.be.true
  })

  describe('construction + initialization', async () => {
    it('constructs', async () => {
      expect(await ecoXImpl.policy()).to.eq(Fake__Policy.address)
      expect(await ecoXImpl.ecoXStaking()).to.eq(fakeStaking.address)
      expect(await ecoXImpl.ecoXExchange()).to.eq(fakeExchange.address)

      expect(await ecoXImpl.minters(alice.address)).to.be.true
      expect(await ecoXImpl.initialMinters(0)).to.eq(alice.address)
      expect(await ecoXImpl.minters(bob.address)).to.be.true
      expect(await ecoXImpl.initialMinters(1)).to.eq(bob.address)

      expect(await ecoXImpl.burners(bob.address)).to.be.true
      expect(await ecoXImpl.initialBurners(0)).to.eq(bob.address)
      expect(await ecoXImpl.burners(alice.address)).to.be.true
      expect(await ecoXImpl.initialBurners(1)).to.eq(alice.address)

      expect(await ecoXImpl.pauser()).to.eq(bob.address)
    })
    it('initializes', async () => {
      expect(await ecoXImpl.policy()).to.eq(Fake__Policy.address)
      expect(await ecoXImpl.ecoXStaking()).to.eq(fakeStaking.address)
      expect(await ecoXImpl.ecoXExchange()).to.eq(fakeExchange.address)

      expect(await ecoXImpl.minters(alice.address)).to.be.true
      expect(await ecoXImpl.minters(bob.address)).to.be.true

      expect(await ecoXImpl.burners(bob.address)).to.be.true
      expect(await ecoXImpl.burners(alice.address)).to.be.true

      expect(await ecoXImpl.pauser()).to.eq(bob.address)
    })
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

  describe('pausable', async () => {
    beforeEach(async () => {
      expect(await ecoXProxy.paused()).to.be.false

      await ecoXProxy.connect(bob).mint(bob.address, 1000)
      expect(await ecoXProxy.balanceOf(bob.address)).to.eq(1000)
    })
    it('cant be paused by non-pauser', async () => {
      await expect(ecoXProxy.pause()).to.be.revertedWith(
        ERRORS.ERC20PAUSABLE.ONLY_PAUSER
      )
    })
    it('cant be unpaused when already unpaused', async () => {
      await expect(ecoXProxy.connect(bob).unpause()).to.be.revertedWith(
        ERRORS.PAUSABLE.REQUIRE_PAUSED
      )
    })
    it('cant mint or burn or transfer if pause is successful', async () => {
      // can do all that shit before
      await ecoXProxy.connect(bob).mint(alice.address, 1)
      expect(await ecoXProxy.balanceOf(alice.address)).to.eq(1)
      await ecoXProxy.connect(alice).transfer(bob.address, 1)
      expect(await ecoXProxy.balanceOf(bob.address)).to.eq(1001)
      await ecoXProxy.connect(bob).burn(bob.address, 1)
      expect(await ecoXProxy.balanceOf(bob.address)).to.eq(1000)

      // emits on pause
      await expect(await ecoXProxy.connect(bob).pause()).to.emit(
        ecoXProxy,
        'ECOxPaused'
      )

      // cant do it anymore
      await expect(
        ecoXProxy.connect(bob).mint(alice.address, 1)
      ).to.be.revertedWith(ERRORS.PAUSABLE.REQUIRE_NOT_PAUSED)
      await expect(
        ecoXProxy.connect(bob).burn(alice.address, 1)
      ).to.be.revertedWith(ERRORS.PAUSABLE.REQUIRE_NOT_PAUSED)
      await expect(
        ecoXProxy.connect(bob).transfer(alice.address, 1)
      ).to.be.revertedWith(ERRORS.PAUSABLE.REQUIRE_NOT_PAUSED)
    })
    it('cant be unpaused by non-pauser', async () => {
      await ecoXProxy.connect(bob).pause()
      await expect(ecoXProxy.pause()).to.be.revertedWith(
        ERRORS.ERC20PAUSABLE.ONLY_PAUSER
      )
    })
    it('cant be paused when already paused', async () => {
      await ecoXProxy.connect(bob).pause()
      await expect(ecoXProxy.connect(bob).pause()).to.be.revertedWith(
        ERRORS.PAUSABLE.REQUIRE_NOT_PAUSED
      )
    })
    it('can mint or burn or transfer if unpause is successful', async () => {
      await ecoXProxy.connect(bob).pause()

      // cant do anything when paused
      await expect(
        ecoXProxy.connect(bob).mint(alice.address, 1)
      ).to.be.revertedWith(ERRORS.PAUSABLE.REQUIRE_NOT_PAUSED)
      await expect(
        ecoXProxy.connect(bob).burn(alice.address, 1)
      ).to.be.revertedWith(ERRORS.PAUSABLE.REQUIRE_NOT_PAUSED)
      await expect(
        ecoXProxy.connect(bob).transfer(alice.address, 1)
      ).to.be.revertedWith(ERRORS.PAUSABLE.REQUIRE_NOT_PAUSED)

      // emits on unpause
      await expect(await ecoXProxy.connect(bob).unpause()).to.emit(
        ecoXProxy,
        'ECOxUnpaused'
      )

      // can do all that shit again
      await ecoXProxy.connect(bob).mint(alice.address, 1)
      expect(await ecoXProxy.balanceOf(alice.address)).to.eq(1)
      await ecoXProxy.connect(alice).transfer(bob.address, 1)
      expect(await ecoXProxy.balanceOf(bob.address)).to.eq(1001)
      await ecoXProxy.connect(bob).burn(bob.address, 1)
      expect(await ecoXProxy.balanceOf(bob.address)).to.eq(1000)
    })
  })
})
