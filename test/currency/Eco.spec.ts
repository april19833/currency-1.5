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
import { BigNumber, BigNumberish } from 'ethers'

const INITIAL_SUPPLY = ethers.BigNumber.from('1' + '0'.repeat(21)) // 1000 eco initially
const DENOMINATOR = ethers.BigNumber.from('1' + '0'.repeat(18))
const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'

describe.only('Eco', () => {
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
  let globalInflationMult: BigNumber

  beforeEach(async () => {
    const digits1to9 = Math.floor(Math.random() * 900000000) + 100000000
    const digits10to19 = Math.floor(Math.random() * 10000000000)
    globalInflationMult = ethers.BigNumber.from(`${digits10to19}${digits1to9}`)

    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
    )

    const ECOfact = new ECO__factory(alice)

    ECOimpl = await ECOfact.connect(policyImpersonater).deploy(
      Fake__Policy.address,
      PLACEHOLDER_ADDRESS1,
      0,
      bob.address
    )

    const proxy = await new ForwardProxy__factory()
      .connect(policyImpersonater)
      .deploy(ECOimpl.address)

    ECOproxy = ECOfact.attach(proxy.address)

    expect(ECOproxy.address === proxy.address).to.be.true

    // set a global inflation multiplier for supply
    await ECOproxy.connect(policyImpersonater).updateRebasers(
      policyImpersonater.address,
      true
    )
    await ECOproxy.connect(policyImpersonater).rebase(globalInflationMult)
    await ECOproxy.connect(policyImpersonater).updateRebasers(
      policyImpersonater.address,
      false
    )
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
      // mint initial tokens
      await ECOproxy.connect(policyImpersonater).updateMinters(
        policyImpersonater.address,
        true
      )
      await ECOproxy.connect(policyImpersonater).mint(
        dave.address,
        INITIAL_SUPPLY
      )
      await ECOproxy.connect(policyImpersonater).updateMinters(
        policyImpersonater.address,
        false
      )
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

  describe('rebase', () => {
    const digits1to9 = Math.floor(Math.random() * 900000000) + 100000000
    const digits10to19 = Math.floor(Math.random() * 10000000000)
    const newInflationMult = ethers.BigNumber.from(
      `${digits10to19}${digits1to9}`
    )
    let cumulativeInflationMult: BigNumberish

    beforeEach(async () => {
      // mint initial tokens
      await ECOproxy.connect(policyImpersonater).updateMinters(
        policyImpersonater.address,
        true
      )
      await ECOproxy.connect(policyImpersonater).mint(
        dave.address,
        INITIAL_SUPPLY
      )
      await ECOproxy.connect(policyImpersonater).updateMinters(
        policyImpersonater.address,
        false
      )
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)

      // charlie is the rebaser for this test
      await ECOproxy.connect(policyImpersonater).updateRebasers(
        charlie.address,
        true
      )

      cumulativeInflationMult = newInflationMult
        .mul(globalInflationMult)
        .div(DENOMINATOR)
    })

    describe('happy path', () => {
      it('can rebase', async () => {
        await ECOproxy.connect(charlie).rebase(newInflationMult)
      })

      it('emits an event', async () => {
        await expect(ECOproxy.connect(charlie).rebase(newInflationMult))
          .to.emit(ECOproxy, 'NewInflationMultiplier')
          .withArgs(newInflationMult, cumulativeInflationMult)
      })

      it('changes state', async () => {
        await ECOproxy.connect(charlie).rebase(newInflationMult)

        expect(await ECOproxy.getInflationMultiplier()).to.eq(
          cumulativeInflationMult
        )
        expect(await ECOproxy.balanceOf(dave.address)).to.eq(
          INITIAL_SUPPLY.mul(DENOMINATOR).div(newInflationMult)
        )
      })

      it('preserves historical multiplier', async () => {
        const blockNumber = await ethers.provider.getBlockNumber()

        await ECOproxy.connect(charlie).rebase(newInflationMult)

        expect(await ECOproxy.getInflationMultiplierAt(blockNumber)).to.eq(
          globalInflationMult
        )
      })
    })

    describe('reverts', () => {
      it('is rebasers gated', async () => {
        await expect(
          ECOproxy.connect(dave).rebase(newInflationMult)
        ).to.be.revertedWith(ERRORS.ECO.BAD_REBASER)
      })

      it('cannot rebase to zero', async () => {
        await expect(ECOproxy.connect(charlie).rebase(0)).to.be.revertedWith(
          ERRORS.ECO.REBASE_TO_ZERO
        )
      })
    })
  })

  describe.only('delegation', () => {
    const amount = INITIAL_SUPPLY
    let voteAmount: BigNumber

    beforeEach(async () => {
      // mint initial tokens
      await ECOproxy.connect(policyImpersonater).updateMinters(
        policyImpersonater.address,
        true
      )
      await ECOproxy.connect(policyImpersonater).mint(
        alice.address,
        amount
      )
      await ECOproxy.connect(policyImpersonater).mint(
        bob.address,
        amount
      )
      await ECOproxy.connect(policyImpersonater).mint(
        charlie.address,
        amount
      )
      await ECOproxy.connect(policyImpersonater).mint(
        dave.address,
        amount
      )
      await ECOproxy.connect(policyImpersonater).updateMinters(
        policyImpersonater.address,
        false
      )
      expect(await ECOproxy.balanceOf(alice.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(bob.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(charlie.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(amount)
      await ECOproxy.connect(charlie).enableDelegationTo()
      await ECOproxy.connect(dave).enableDelegationTo()

      voteAmount = globalInflationMult.mul(amount)
    })

    context('enableDelegationTo', () => {
      it('cannot enable if already delegated', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)

        await expect(
          ECOproxy.connect(alice).enableDelegationTo()
        ).to.be.revertedWith(
          'ERC20Delegated: cannot enable delegation if you have outstanding delegation'
        )
      })
    })

    context('disableDelegationTo', () => {
      it('can disable', async () => {
        await ECOproxy.connect(dave).disableDelegationTo()
      })

      it('can disable even if not enabled', async () => {
        await ECOproxy.connect(alice).disableDelegationTo()
      })

      it('disabling prevents delegation', async () => {
        await ECOproxy.connect(dave).disableDelegationTo()

        await expect(
          ECOproxy.connect(alice).delegate(dave.address)
        ).to.be.revertedWith('ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates')
      })

      it('disabling delegation is not sufficient to delegate', async () => {
        await ECOproxy.connect(dave).disableDelegationTo()

        await expect(
          ECOproxy.connect(dave).delegate(charlie.address)
        ).to.be.revertedWith(
          'ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates'
        )
      })

      it('can still disable delegation to you with outstanding delegations', async () => {
        await ECOproxy.connect(alice).delegate(dave.address)
        await ECOproxy.connect(dave).disableDelegationTo()

        await expect(
          ECOproxy.connect(bob).delegate(dave.address)
        ).to.be.revertedWith('ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates')
      })
    })

    context('reenableDelegating', () => {
      it('can re-enable delegation and then delegate', async () => {
        await ECOproxy.connect(dave).reenableDelegating()

        await ECOproxy.connect(dave).delegate(charlie.address)
      })

      it('you may disable delegating to you and then re-enable', async () => {
        await ECOproxy.connect(dave).disableDelegationTo()
        await ECOproxy.connect(dave).reenableDelegating()
      })

      it('can reenable if you did not disable delegating to you first, still disables delegating to you', async () => {
        await ECOproxy.connect(dave).reenableDelegating()

        await expect(
          ECOproxy.connect(alice).delegate(dave.address)
        ).to.be.revertedWith('ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates')
      })

      it('can reenable if not disabled', async () => {
        await ECOproxy.connect(alice).reenableDelegating()
      })

      it('delegations to you prevent re-enabling', async () => {
        await ECOproxy.connect(alice).delegate(dave.address)
        await ECOproxy.connect(dave).disableDelegationTo()

        await expect(
          ECOproxy.connect(dave).reenableDelegating()
        ).to.be.revertedWith(
          'ERC20Delegated: cannot re-enable delegating if you have outstanding delegations'
        )
      })
    })

    context('delegate', () => {
      it('correct votes when delegated', async () => {
        const tx1 = await ECOproxy.connect(alice).delegate(charlie.address)
        const receipt1 = await tx1.wait()
        console.log(receipt1.gasUsed)
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          voteAmount.mul(2)
        )

        const tx2 = await ECOproxy.connect(alice).delegate(dave.address)
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          voteAmount
        )
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          voteAmount.mul(2)
        )
      })

      it('does not allow delegation if not enabled', async () => {
        await expect(
          ECOproxy.connect(alice).delegate(PLACEHOLDER_ADDRESS1)
        ).to.be.revertedWith('ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates')
      })

      it('does not allow delegation to yourself', async () => {
        await expect(
          ECOproxy.connect(alice).delegate(alice.address)
        ).to.be.revertedWith('ERC20Delegated: use undelegate instead of delegating to yourself')
      })

      it('does not allow delegation if you are a delegatee', async () => {
        await expect(
          ECOproxy.connect(charlie).delegate(dave.address)
        ).to.be.revertedWith(
          'ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates'
        )
      })
    })

    context('undelegate', () => {
      it('correct state when undelegated after delegating', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)

        const tx2 = await ECOproxy.connect(alice).undelegate()
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)

        const votes1 = await ECOproxy.voteBalanceOf(alice.address)
        expect(votes1).to.equal(voteAmount)
        const votes2 = await ECOproxy.voteBalanceOf(charlie.address)
        expect(votes2).to.equal(voteAmount)
      })

      it('disallows undelegate() with no delegate', async () => {
        await expect(ECOproxy.connect(alice).undelegate()).to.be.revertedWith(
          'ERC20Delegated: must specifiy undelegate address when not using a Primary Delegate'
        )
      })
    })

    context('isOwnDelegate', () => {
      it('correct state when delegating and undelegating', async () => {
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.true

        await ECOproxy.connect(alice).delegate(charlie.address)
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.false

        await ECOproxy.connect(alice).undelegate()
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.true
      })
    })

    context('getPrimaryDelegate', () => {
      it('correct state when delegating and undelegating', async () => {
        expect(await ECOproxy.getPrimaryDelegate(alice.address)).to.equal(
          alice.address
        )

        await ECOproxy.connect(alice).delegate(charlie.address)
        expect(await ECOproxy.getPrimaryDelegate(alice.address)).to.equal(
          charlie.address
        )

        await ECOproxy.connect(alice).undelegate()
        expect(await ECOproxy.getPrimaryDelegate(alice.address)).to.equal(
          alice.address
        )
      })
    })

    context('delegate then transfer', () => {
      it('sender delegated', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)
        await ECOproxy.connect(alice).transfer(bob.address, amount)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(
          voteAmount.mul(2)
        )
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          voteAmount
        )
      })

      it('receiver delegated', async () => {
        await ECOproxy.connect(bob).delegate(dave.address)
        await ECOproxy.connect(alice).transfer(bob.address, amount)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          voteAmount.mul(3)
        )
      })

      it('both delegated', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)
        await ECOproxy.connect(bob).delegate(dave.address)
        await ECOproxy.connect(alice).transfer(bob.address, amount)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          voteAmount
        )
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          voteAmount.mul(3)
        )
      })
    })

    context('transfer gas testing', () => {
      it('no delegations', async () => {
        const tx = await ECOproxy.connect(alice).transfer(bob.address, amount)
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })

      it('sender delegated', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)
        const tx = await ECOproxy.connect(alice).transfer(bob.address, amount)
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })

      it('receiver delegated', async () => {
        await ECOproxy.connect(bob).delegate(dave.address)
        const tx = await ECOproxy.connect(alice).transfer(bob.address, amount)
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })

      it('both delegated', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)
        await ECOproxy.connect(bob).delegate(dave.address)
        const tx = await ECOproxy.connect(alice).transfer(bob.address, amount)
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })
    })
  })
})
