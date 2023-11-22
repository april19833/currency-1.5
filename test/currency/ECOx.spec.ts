import { ethers } from 'hardhat'
import { expect } from 'chai'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../utils/errors'
import { ECOx, ECOx__factory, Policy } from '../../typechain-types'
import { deployProxy } from '../../deploy/utils'

describe('EcoX', () => {
  let alice: SignerWithAddress // default signer
  let bob: SignerWithAddress // pauser
  let charlie: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  before(async () => {
    ;[alice, bob, charlie, policyImpersonator] = await ethers.getSigners()
  })

  let ecoXProxy: ECOx
  let Fake__Policy: FakeContract<Policy>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to make calls from the address
    )

    const ecoXDeployParams = [
      Fake__Policy.address, // policy
      bob.address, // pauser
    ]

    ecoXProxy = (await deployProxy(
      policyImpersonator,
      ECOx__factory,
      ecoXDeployParams
    ))[0] as ECOx
  })

  describe('initialization', async () => {
    it('initializes', async () => {
      expect(await ecoXProxy.policy()).to.eq(Fake__Policy.address)
      expect(await ecoXProxy.pauser()).to.eq(bob.address)
    })
  })

  describe('role permissions', () => {
    describe('minter role', () => {
      it('can be added by the policy', async () => {
        await ecoXProxy
          .connect(policyImpersonator)
          .updateMinters(charlie.address, true)
        const charlieMinting = await ecoXProxy.minters(charlie.address)
        expect(charlieMinting).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ecoXProxy
          .connect(policyImpersonator)
          .updateMinters(charlie.address, true)
        await ecoXProxy
          .connect(policyImpersonator)
          .updateMinters(charlie.address, false)
        const charlieMinting = await ecoXProxy.minters(charlie.address)
        expect(charlieMinting).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ecoXProxy
            .connect(policyImpersonator)
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
          .connect(policyImpersonator)
          .updateBurners(charlie.address, true)
        const charlieBurning = await ecoXProxy.burners(charlie.address)
        expect(charlieBurning).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ecoXProxy
          .connect(policyImpersonator)
          .updateBurners(charlie.address, true)
        await ecoXProxy
          .connect(policyImpersonator)
          .updateBurners(charlie.address, false)
        const charlieBurning = await ecoXProxy.burners(charlie.address)
        expect(charlieBurning).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ecoXProxy
            .connect(policyImpersonator)
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
            .connect(policyImpersonator)
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
      await ecoXProxy
        .connect(policyImpersonator)
        .updateBurners(bob.address, true)
      await ecoXProxy
        .connect(policyImpersonator)
        .updateMinters(bob.address, true)

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
        'Paused'
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
        'Unpaused'
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

  describe('mint', async () => {
    it('reverts when non-minter mints', async () => {
      await expect(
        ecoXProxy.connect(bob).mint(bob.address, 100)
      ).to.be.revertedWith(ERRORS.ERC20ROLES.ONLY_MINTERS)
    })
    it('mints', async () => {
      await ecoXProxy
        .connect(policyImpersonator)
        .updateMinters(bob.address, true)
      await expect(ecoXProxy.connect(bob).mint(bob.address, 100))
        .to.emit(ecoXProxy, 'Transfer')
        .withArgs(ethers.constants.AddressZero, bob.address, 100)
    })
  })
  describe('burn', async () => {
    it('reverts when non-burner non self burns', async () => {
      await ecoXProxy
        .connect(policyImpersonator)
        .updateMinters(bob.address, true)
      await ecoXProxy.connect(bob).mint(alice.address, 100)

      await expect(
        ecoXProxy.connect(bob).burn(alice.address, 100)
      ).to.be.revertedWith(ERRORS.ERC20ROLES.ONLY_BURNERS)
    })
    it('burns when non-burner burns for self', async () => {
      await ecoXProxy
        .connect(policyImpersonator)
        .updateMinters(bob.address, true)
      await ecoXProxy.connect(bob).mint(bob.address, 100)

      await expect(ecoXProxy.connect(bob).burn(bob.address, 100))
        .to.emit(ecoXProxy, 'Transfer')
        .withArgs(bob.address, ethers.constants.AddressZero, 100)
    })
    it('burns when burner burns for non-self', async () => {
      // ow
      await ecoXProxy
        .connect(policyImpersonator)
        .updateMinters(alice.address, true)
      await ecoXProxy
        .connect(policyImpersonator)
        .updateBurners(bob.address, true)

      await ecoXProxy.connect(alice).mint(alice.address, 100)

      await expect(ecoXProxy.connect(bob).burn(alice.address, 100))
        .to.emit(ecoXProxy, 'Transfer')
        .withArgs(alice.address, ethers.constants.AddressZero, 100)
    })
  })
})
