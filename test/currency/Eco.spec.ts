import { ethers } from 'hardhat'
import { expect } from 'chai'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../utils/errors'
import {
  ECO,
  ECO__factory,
  ForwardProxy__factory,
  Policy,
} from '../../typechain-types'

const INITIAL_SUPPLY = ethers.BigNumber.from('1' + '000'.repeat(7)) // 1000 eco initially

describe('Eco', () => {
  let alice: SignerWithAddress // default signer
  let bob: SignerWithAddress // pauser
  let charlie: SignerWithAddress
  let dave: SignerWithAddress // distributer
  let policyImpersonater: SignerWithAddress
  before(async () => {
    ;[alice, bob, charlie, dave, policyImpersonater] = await ethers.getSigners()
  })

  let ECOimpl: ECO
  let ECOproxy: ECO
  let Fake__Policy: FakeContract<Policy>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
    )

    const ECOfact = new ECO__factory(alice)

    ECOimpl = await ECOfact.connect(policyImpersonater).deploy(
      Fake__Policy.address,
      dave.address,
      INITIAL_SUPPLY,
      bob.address
    )

    const proxy = await new ForwardProxy__factory()
      .connect(policyImpersonater)
      .deploy(ECOimpl.address)

    ECOproxy = ECOfact.attach(proxy.address)

    expect(ECOproxy.address === proxy.address).to.be.true
  })

  describe('role permissions', () => {
    describe('minter role', () => {
      it('can be added by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateMinters(
          charlie.address,
          true
        )
        const charlieMinting = await ECOproxy.minters(charlie.address)
        expect(charlieMinting).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateMinters(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonater).updateMinters(
          charlie.address,
          false
        )
        const charlieMinting = await ECOproxy.minters(charlie.address)
        expect(charlieMinting).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonater).updateMinters(
            charlie.address,
            true
          )
        )
          .to.emit(ECOproxy, 'UpdatedMinters')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ECOproxy.connect(charlie).updateMinters(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('burner role', () => {
      it('can be added by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateBurners(
          charlie.address,
          true
        )
        const charlieBurning = await ECOproxy.burners(charlie.address)
        expect(charlieBurning).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateBurners(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonater).updateBurners(
          charlie.address,
          false
        )
        const charlieBurning = await ECOproxy.burners(charlie.address)
        expect(charlieBurning).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonater).updateBurners(
            charlie.address,
            true
          )
        )
          .to.emit(ECOproxy, 'UpdatedBurners')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ECOproxy.connect(charlie).updateBurners(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('rebaser role', () => {
      it('can be added by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateRebasers(
          charlie.address,
          true
        )
        const charlieRebasing = await ECOproxy.rebasers(charlie.address)
        expect(charlieRebasing).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateRebasers(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonater).updateRebasers(
          charlie.address,
          false
        )
        const charlieRebasing = await ECOproxy.rebasers(charlie.address)
        expect(charlieRebasing).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonater).updateRebasers(
            charlie.address,
            true
          )
        )
          .to.emit(ECOproxy, 'UpdatedRebasers')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ECOproxy.connect(charlie).updateRebasers(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })

    describe('snapshotter role', () => {
      it('can be added by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateSnapshotters(
          charlie.address,
          true
        )
        const charlieSnapshotting = await ECOproxy.snapshotters(charlie.address)
        expect(charlieSnapshotting).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonater).updateSnapshotters(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonater).updateSnapshotters(
          charlie.address,
          false
        )
        const charlieSnapshotting = await ECOproxy.snapshotters(charlie.address)
        expect(charlieSnapshotting).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonater).updateSnapshotters(
            charlie.address,
            true
          )
        )
          .to.emit(ECOproxy, 'UpdatedSnapshotters')
          .withArgs(charlie.address, true)
      })

      it('is onlyPolicy gated', async () => {
        await expect(
          ECOproxy.connect(charlie).updateSnapshotters(charlie.address, true)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })
    })
  })

  describe('mint/burn', () => {
    beforeEach(async () => {
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
    })

    describe('mint', () => {
      beforeEach(async () => {
        await ECOproxy.connect(policyImpersonater).updateMinters(
          charlie.address,
          true
        )
      })

      describe('reverts', () => {
        it('when the recipient is the zero address', async () => {
          await expect(
            ECOproxy.connect(charlie).mint(
              ethers.constants.AddressZero,
              INITIAL_SUPPLY
            )
          ).to.be.revertedWith(ERRORS.ERC20.BAD_MINT_TARGET)
        })

        it('when the sender is not a minter', async () => {
          await expect(
            ECOproxy.connect(bob).mint(bob.address, INITIAL_SUPPLY)
          ).to.be.revertedWith(ERRORS.ECO.BAD_MINTER)
        })
      })

      describe('happy path', () => {
        it('can mint', async () => {
          await ECOproxy.connect(charlie).mint(bob.address, INITIAL_SUPPLY)
        })

        it('changes state correctly', async () => {
          await ECOproxy.connect(charlie).mint(bob.address, INITIAL_SUPPLY)

          expect(await ECOproxy.balanceOf(bob.address)).to.eq(INITIAL_SUPPLY)
          expect(await ECOproxy.totalSupply()).to.eq(INITIAL_SUPPLY.mul(2))
        })

        it('emits a Transfer event', async () => {
          await expect(
            ECOproxy.connect(charlie).mint(bob.address, INITIAL_SUPPLY)
          )
            .to.emit(ECOproxy, 'Transfer')
            .withArgs(ethers.constants.AddressZero, bob.address, INITIAL_SUPPLY)
        })
      })
    })

    describe('burn', () => {
      beforeEach(async () => {
        await ECOproxy.connect(policyImpersonater).updateBurners(
          charlie.address,
          true
        )
      })

      describe('reverts', () => {
        it("when the sender doesn't have enough balance", async () => {
          await expect(
            ECOproxy.connect(bob).burn(bob.address, INITIAL_SUPPLY)
          ).to.be.revertedWith(ERRORS.ERC20.BURN_BAD_AMOUNT)
        })

        it('when the sender is not the burning address', async () => {
          await expect(
            ECOproxy.connect(bob).burn(dave.address, INITIAL_SUPPLY)
          ).to.be.revertedWith(ERRORS.ECO.BAD_BURNER)
        })
      })

      describe('happy path', () => {
        it('can burn self', async () => {
          await ECOproxy.connect(dave).burn(dave.address, INITIAL_SUPPLY)
        })

        it('can burn others if burner', async () => {
          await ECOproxy.connect(charlie).burn(dave.address, INITIAL_SUPPLY)
        })

        it('changes state correctly', async () => {
          await ECOproxy.connect(charlie).burn(dave.address, INITIAL_SUPPLY)

          expect(await ECOproxy.balanceOf(dave.address)).to.eq(0)
          expect(await ECOproxy.totalSupply()).to.eq(0)
        })

        it('emits a Transfer event', async () => {
          await expect(
            ECOproxy.connect(dave).burn(dave.address, INITIAL_SUPPLY)
          )
            .to.emit(ECOproxy, 'Transfer')
            .withArgs(
              dave.address,
              ethers.constants.AddressZero,
              INITIAL_SUPPLY
            )
        })
      })
    })
  })
})
