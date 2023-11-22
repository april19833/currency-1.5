import { ethers } from 'hardhat'
import { expect } from 'chai'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../utils/errors'
import { ECO, ECO__factory, Policy } from '../../typechain-types'
import { deployProxy } from '../../deploy/utils'
import { BigNumber, BigNumberish } from 'ethers'
import { delegateBySig } from '../utils/permit'

const INITIAL_SUPPLY = ethers.BigNumber.from('1' + '0'.repeat(21)) // 1000 ECO initially
const DENOMINATOR = ethers.BigNumber.from('1' + '0'.repeat(18))
const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'

describe('ECO', () => {
  let alice: SignerWithAddress // default signer
  let bob: SignerWithAddress // pauser
  let charlie: SignerWithAddress
  let dave: SignerWithAddress // distributer
  let matthew: SignerWithAddress // non-voter
  let nico: SignerWithAddress // non-voter
  let policyImpersonator: SignerWithAddress
  let minterImpersonator: SignerWithAddress
  let snapshotterImpersonator: SignerWithAddress
  let rebaserImpersonator: SignerWithAddress
  before(async () => {
    ;[
      alice,
      bob,
      charlie,
      dave,
      matthew,
      nico,
      policyImpersonator,
      minterImpersonator,
      snapshotterImpersonator,
      rebaserImpersonator,
    ] = await ethers.getSigners()
  })

  let ECOproxy: ECO
  let Fake__Policy: FakeContract<Policy>
  let globalInflationMult: BigNumber

  beforeEach(async () => {
    const digits1to9 = Math.floor(Math.random() * 900000000) + 100000000
    const digits10to19 = Math.floor(Math.random() * 10000000000)
    globalInflationMult = ethers.BigNumber.from(`${digits10to19}${digits1to9}`)

    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonator.getAddress() } // This allows us to make calls from the address
    )

    const ecoDeployParams = [Fake__Policy.address, bob.address]

    ECOproxy = (await deployProxy(alice, ECO__factory, ecoDeployParams))[0] as ECO

    // set impersonator roles
    await ECOproxy.connect(policyImpersonator).updateMinters(
      minterImpersonator.address,
      true
    )
    await ECOproxy.connect(policyImpersonator).updateSnapshotters(
      snapshotterImpersonator.address,
      true
    )
    await ECOproxy.connect(policyImpersonator).updateRebasers(
      rebaserImpersonator.address,
      true
    )

    // the main addresses need to be voters for the snapshot
    await ECOproxy.connect(alice).enableVoting()
    await ECOproxy.connect(bob).enableVoting()
    await ECOproxy.connect(charlie).enableVoting()
    await ECOproxy.connect(dave).enableVoting()

    // snapshot
    await ECOproxy.connect(snapshotterImpersonator).snapshot()

    // set a global inflation multiplier for supply
    await ECOproxy.connect(rebaserImpersonator).rebase(globalInflationMult)
  })

  describe('role permissions', () => {
    describe('minter role', () => {
      it('can be added by the policy', async () => {
        await ECOproxy.connect(policyImpersonator).updateMinters(
          charlie.address,
          true
        )
        const charlieMinting = await ECOproxy.minters(charlie.address)
        expect(charlieMinting).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonator).updateMinters(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonator).updateMinters(
          charlie.address,
          false
        )
        const charlieMinting = await ECOproxy.minters(charlie.address)
        expect(charlieMinting).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonator).updateMinters(
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
        await ECOproxy.connect(policyImpersonator).updateBurners(
          charlie.address,
          true
        )
        const charlieBurning = await ECOproxy.burners(charlie.address)
        expect(charlieBurning).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonator).updateBurners(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonator).updateBurners(
          charlie.address,
          false
        )
        const charlieBurning = await ECOproxy.burners(charlie.address)
        expect(charlieBurning).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonator).updateBurners(
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
        await ECOproxy.connect(policyImpersonator).updateRebasers(
          charlie.address,
          true
        )
        const charlieRebasing = await ECOproxy.rebasers(charlie.address)
        expect(charlieRebasing).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonator).updateRebasers(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonator).updateRebasers(
          charlie.address,
          false
        )
        const charlieRebasing = await ECOproxy.rebasers(charlie.address)
        expect(charlieRebasing).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonator).updateRebasers(
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
        await ECOproxy.connect(policyImpersonator).updateSnapshotters(
          charlie.address,
          true
        )
        const charlieSnapshotting = await ECOproxy.snapshotters(charlie.address)
        expect(charlieSnapshotting).to.be.true
      })

      it('can be removed by the policy', async () => {
        await ECOproxy.connect(policyImpersonator).updateSnapshotters(
          charlie.address,
          true
        )
        await ECOproxy.connect(policyImpersonator).updateSnapshotters(
          charlie.address,
          false
        )
        const charlieSnapshotting = await ECOproxy.snapshotters(charlie.address)
        expect(charlieSnapshotting).to.be.false
      })

      it('emits an event', async () => {
        expect(
          await ECOproxy.connect(policyImpersonator).updateSnapshotters(
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
      await ECOproxy.connect(minterImpersonator).mint(
        dave.address,
        INITIAL_SUPPLY
      )

      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
    })

    describe('mint', () => {
      beforeEach(async () => {
        await ECOproxy.connect(policyImpersonator).updateMinters(
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
        await ECOproxy.connect(policyImpersonator).updateBurners(
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
      await ECOproxy.connect(minterImpersonator).mint(
        dave.address,
        INITIAL_SUPPLY
      )

      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)

      // charlie is the rebaser for this test
      await ECOproxy.connect(policyImpersonator).updateRebasers(
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

        expect(await ECOproxy.inflationMultiplier()).to.eq(
          cumulativeInflationMult
        )
        expect(await ECOproxy.balanceOf(dave.address)).to.eq(
          INITIAL_SUPPLY.mul(globalInflationMult).div(cumulativeInflationMult)
        )
      })

      it('preserves historical multiplier', async () => {
        await ECOproxy.connect(snapshotterImpersonator).snapshot()
        expect(await ECOproxy.inflationMultiplier()).to.eq(globalInflationMult)

        await ECOproxy.connect(charlie).rebase(newInflationMult)

        await ECOproxy.connect(snapshotterImpersonator).snapshot()
        expect(await ECOproxy.inflationMultiplier()).to.eq(
          globalInflationMult.mul(newInflationMult).div(DENOMINATOR)
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

  describe('votes', () => {
    beforeEach(async () => {
      await ECOproxy.connect(minterImpersonator).mint(
        matthew.address,
        INITIAL_SUPPLY
      )
    })

    describe('enableVoting', () => {
      it('can enable voting', async () => {
        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
        expect(await ECOproxy.voter(matthew.address)).to.be.false

        await ECOproxy.connect(matthew).enableVoting()

        expect(await ECOproxy.voter(matthew.address)).to.be.true
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(
          INITIAL_SUPPLY
        )
      })

      it('emits an event', async () => {
        await expect(ECOproxy.connect(matthew).enableVoting())
          .to.emit(ECOproxy, 'VoteTransfer')
          .withArgs(
            ethers.constants.AddressZero,
            matthew.address,
            INITIAL_SUPPLY.mul(globalInflationMult)
          )
      })

      it('cannot enable if already enabled', async () => {
        await ECOproxy.connect(matthew).enableVoting()

        await expect(
          ECOproxy.connect(matthew).enableVoting()
        ).to.be.revertedWith('ERC20Delegated: voting already enabled')
      })

      it('non-voters are zero in every snapshot', async () => {
        expect(await ECOproxy.voteBalanceSnapshot(matthew.address)).to.eq(0)
        await ECOproxy.connect(snapshotterImpersonator).snapshot()
        expect(await ECOproxy.voteBalanceSnapshot(matthew.address)).to.eq(0)
        await ECOproxy.connect(minterImpersonator).mint(
          matthew.address,
          INITIAL_SUPPLY
        )
        await ECOproxy.connect(snapshotterImpersonator).snapshot()
        expect(await ECOproxy.voteBalanceSnapshot(matthew.address)).to.eq(0)

        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(
          INITIAL_SUPPLY.mul(2)
        )
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
      })
    })

    describe('transferring', () => {
      beforeEach(async () => {
        await ECOproxy.connect(minterImpersonator).mint(
          alice.address,
          INITIAL_SUPPLY
        )
      })

      it('transfer from a non-voter to a voter mints votes', async () => {
        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(alice.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.eq(
          INITIAL_SUPPLY
        )

        await expect(
          ECOproxy.connect(matthew).transfer(
            alice.address,
            INITIAL_SUPPLY.div(2)
          )
        )
          .to.emit(ECOproxy, 'VoteTransfer')
          .withArgs(
            ethers.constants.AddressZero,
            alice.address,
            INITIAL_SUPPLY.div(2).mul(globalInflationMult)
          )

        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(
          INITIAL_SUPPLY.div(2)
        )
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(alice.address)).to.eq(
          INITIAL_SUPPLY.mul(3).div(2)
        )
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.eq(
          INITIAL_SUPPLY.mul(3).div(2)
        )
      })

      it('transfer to a non-voter to a voter burns votes', async () => {
        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(alice.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.eq(
          INITIAL_SUPPLY
        )

        await expect(
          ECOproxy.connect(alice).transfer(
            matthew.address,
            INITIAL_SUPPLY.div(2)
          )
        )
          .to.emit(ECOproxy, 'VoteTransfer')
          .withArgs(
            alice.address,
            ethers.constants.AddressZero,
            INITIAL_SUPPLY.div(2).mul(globalInflationMult)
          )

        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(
          INITIAL_SUPPLY.mul(3).div(2)
        )
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(alice.address)).to.eq(
          INITIAL_SUPPLY.div(2)
        )
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.eq(
          INITIAL_SUPPLY.div(2)
        )
      })

      it('transfer from a non-voter to a delegated voter mints votes for the delegate', async () => {
        await ECOproxy.connect(dave).enableDelegationTo()
        await ECOproxy.connect(alice).delegate(dave.address)

        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(alice.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(dave.address)).to.eq(0)
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.eq(INITIAL_SUPPLY)

        await expect(
          ECOproxy.connect(matthew).transfer(
            alice.address,
            INITIAL_SUPPLY.div(2)
          )
        )
          .to.emit(ECOproxy, 'VoteTransfer')
          .withArgs(
            ethers.constants.AddressZero,
            dave.address,
            INITIAL_SUPPLY.div(2).mul(globalInflationMult)
          )

        expect(await ECOproxy.balanceOf(matthew.address)).to.eq(
          INITIAL_SUPPLY.div(2)
        )
        expect(await ECOproxy.voteBalanceOf(matthew.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(alice.address)).to.eq(
          INITIAL_SUPPLY.mul(3).div(2)
        )
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(dave.address)).to.eq(0)
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.eq(
          INITIAL_SUPPLY.mul(3).div(2)
        )
      })
    })
  })

  describe('delegation', () => {
    const amount = INITIAL_SUPPLY.div(4)

    beforeEach(async () => {
      // mint initial tokens
      await ECOproxy.connect(minterImpersonator).mint(alice.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(bob.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(charlie.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(dave.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(matthew.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(nico.address, amount)

      expect(await ECOproxy.balanceOf(alice.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(bob.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(charlie.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(matthew.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(nico.address)).to.eq(amount)

      await ECOproxy.connect(charlie).enableDelegationTo()
      await ECOproxy.connect(dave).enableDelegationTo()
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

      it('cannot enable if not a voter', async () => {
        await expect(
          ECOproxy.connect(matthew).enableDelegationTo()
        ).to.be.revertedWith(
          'ERC20Delegated: enable voting before enabling being a delegate'
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
        ).to.be.revertedWith(
          'ERC20Delegated: a primary delegate must enable delegation'
        )
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
        ).to.be.revertedWith(
          'ERC20Delegated: a primary delegate must enable delegation'
        )
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
        ).to.be.revertedWith(
          'ERC20Delegated: a primary delegate must enable delegation'
        )
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
          amount.mul(2)
        )

        const tx2 = await ECOproxy.connect(alice).delegate(dave.address)
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(amount)
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          amount.mul(2)
        )
      })

      it('does not allow delegation if not a voter', async () => {
        await expect(
          ECOproxy.connect(matthew).delegate(dave.address)
        ).to.be.revertedWith('ERC20Delegated: must be a voter to delegate')
      })

      it('does not allow delegation if not enabled', async () => {
        await expect(
          ECOproxy.connect(alice).delegate(PLACEHOLDER_ADDRESS1)
        ).to.be.revertedWith(
          'ERC20Delegated: a primary delegate must enable delegation'
        )
      })

      it('does not allow delegation to yourself', async () => {
        await expect(
          ECOproxy.connect(alice).delegate(alice.address)
        ).to.be.revertedWith(
          'ERC20Delegated: use undelegate instead of delegating to yourself'
        )
      })

      it('does not allow delegation to the zero address', async () => {
        await expect(
          ECOproxy.connect(alice).delegate(ethers.constants.AddressZero)
        ).to.be.revertedWith(
          'ERC20Delegated: a primary delegate must enable delegation'
        )
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

        const votes2 = await ECOproxy.voteBalanceOf(charlie.address)
        expect(votes2).to.equal(amount)
        const votes1 = await ECOproxy.voteBalanceOf(alice.address)
        expect(votes1).to.equal(amount)
      })

      it('disallows undelegate() with no delegate', async () => {
        await expect(ECOproxy.connect(alice).undelegate()).to.be.revertedWith(
          'ERC20Delegated: must specifiy undelegate address when not using a Primary Delegate'
        )
      })
    })

    context('revokeDelegation', () => {
      it('correct state when revokeDelegation after delegating', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)

        const tx2 = await ECOproxy.connect(charlie).revokeDelegation(
          alice.address
        )
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)

        const votes2 = await ECOproxy.voteBalanceOf(charlie.address)
        expect(votes2).to.equal(amount)
        const votes1 = await ECOproxy.voteBalanceOf(alice.address)
        expect(votes1).to.equal(amount)
      })

      it('revokeDelegation useable for intended purpose', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)

        await ECOproxy.connect(charlie).disableDelegationTo()
        await expect(
          ECOproxy.connect(charlie).reenableDelegating()
        ).to.be.revertedWith(
          'ERC20Delegated: cannot re-enable delegating if you have outstanding delegations'
        )

        await ECOproxy.connect(charlie).revokeDelegation(alice.address)
        await ECOproxy.connect(charlie).reenableDelegating()
      })

      it('disallows revokeDelegation if address is not delegated to you', async () => {
        await ECOproxy.connect(alice).delegate(dave.address)

        await expect(
          ECOproxy.connect(charlie).revokeDelegation(alice.address)
        ).to.be.revertedWith(
          'ERC20Delegated: can only revoke delegations to yourself'
        )
        await expect(
          ECOproxy.connect(charlie).revokeDelegation(bob.address)
        ).to.be.revertedWith(
          'ERC20Delegated: can only revoke delegations to yourself'
        )
      })

      it('disallows revokeDelegation from yourself', async () => {
        await expect(
          ECOproxy.connect(charlie).revokeDelegation(charlie.address)
        ).to.be.revertedWith(
          'ERC20Delegated: can only revoke delegations to yourself'
        )
        // also safe if you've not activated delegation at all
        await expect(
          ECOproxy.connect(alice).revokeDelegation(alice.address)
        ).to.be.revertedWith(
          'ERC20Delegated: can only revoke delegations to yourself'
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
          amount.mul(2)
        )
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(amount)
      })

      it('receiver delegated', async () => {
        await ECOproxy.connect(bob).delegate(dave.address)
        await ECOproxy.connect(alice).transfer(bob.address, amount)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          amount.mul(3)
        )
      })

      it('both delegated', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)
        await ECOproxy.connect(bob).delegate(dave.address)
        await ECOproxy.connect(alice).transfer(bob.address, amount)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(amount)
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          amount.mul(3)
        )
      })
    })

    context('transfer gas testing', () => {
      // can't use full balance because zeroing balance gives misleading gas costs
      const testAmount = amount.div(2)

      context('both voters', () => {
        it('after snapshot', async () => {
          await ECOproxy.connect(snapshotterImpersonator).snapshot()

          const tx = await ECOproxy.connect(bob).transfer(
            alice.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('no delegations', async () => {
          const tx = await ECOproxy.connect(bob).transfer(
            alice.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('sender delegated', async () => {
          await ECOproxy.connect(alice).delegate(charlie.address)
          const tx = await ECOproxy.connect(alice).transfer(
            bob.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('receiver delegated', async () => {
          await ECOproxy.connect(bob).delegate(dave.address)
          const tx = await ECOproxy.connect(alice).transfer(
            bob.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('both delegated', async () => {
          await ECOproxy.connect(alice).delegate(charlie.address)
          await ECOproxy.connect(bob).delegate(dave.address)
          const tx = await ECOproxy.connect(alice).transfer(
            bob.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('both delegated + snapshot', async () => {
          await ECOproxy.connect(alice).delegate(charlie.address)
          await ECOproxy.connect(bob).delegate(dave.address)

          await ECOproxy.connect(snapshotterImpersonator).snapshot()

          const tx = await ECOproxy.connect(alice).transfer(
            bob.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })
      })

      context('receiver voter', () => {
        it('after snapshot', async () => {
          await ECOproxy.connect(snapshotterImpersonator).snapshot()

          const tx = await ECOproxy.connect(nico).transfer(
            bob.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('no delegations', async () => {
          const tx = await ECOproxy.connect(nico).transfer(
            alice.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('receiver delegated', async () => {
          await ECOproxy.connect(bob).delegate(dave.address)
          const tx = await ECOproxy.connect(nico).transfer(
            bob.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('receiver delegated and unsnapshotted', async () => {
          await ECOproxy.connect(bob).delegate(charlie.address)
          await ECOproxy.connect(snapshotterImpersonator).snapshot()

          const tx = await ECOproxy.connect(nico).transfer(
            bob.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })
      })

      context('sender voter', () => {
        it('after snapshot', async () => {
          await ECOproxy.connect(snapshotterImpersonator).snapshot()

          const tx = await ECOproxy.connect(bob).transfer(
            matthew.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('no delegations', async () => {
          const tx = await ECOproxy.connect(bob).transfer(
            matthew.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('sender delegated', async () => {
          await ECOproxy.connect(alice).delegate(charlie.address)
          const tx = await ECOproxy.connect(alice).transfer(
            matthew.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })
      })

      context('neither voter', () => {
        it('after snapshot', async () => {
          await ECOproxy.connect(snapshotterImpersonator).snapshot()

          const tx = await ECOproxy.connect(nico).transfer(
            matthew.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })

        it('normal', async () => {
          const tx = await ECOproxy.connect(nico).transfer(
            matthew.address,
            testAmount
          )
          const receipt = await tx.wait()
          console.log(receipt.gasUsed)
        })
      })
    })
  })

  describe('delegation by signature', () => {
    const amount = INITIAL_SUPPLY.div(4)
    const delegator = ethers.Wallet.createRandom().connect(ethers.provider)
    const nonDelegatee = ethers.Wallet.createRandom().connect(ethers.provider)
    const delegateTransferRecipient = ethers.Wallet.createRandom().connect(
      ethers.provider
    )
    const delegatee = ethers.Wallet.createRandom().connect(ethers.provider)
    const otherDelegatee = ethers.Wallet.createRandom().connect(ethers.provider)
    const sender = ethers.Wallet.createRandom().connect(ethers.provider)
    let chainId: number

    before(async () => {
      ;({ chainId } = await ethers.provider.getNetwork())
    })

    beforeEach(async () => {
      // give ether to the new wallets
      await alice.sendTransaction({
        to: delegator.address,
        value: ethers.utils.parseUnits('10', 'ether'),
      })
      await alice.sendTransaction({
        to: nonDelegatee.address,
        value: ethers.utils.parseUnits('10', 'ether'),
      })
      await alice.sendTransaction({
        to: delegateTransferRecipient.address,
        value: ethers.utils.parseUnits('10', 'ether'),
      })
      await alice.sendTransaction({
        to: delegatee.address,
        value: ethers.utils.parseUnits('10', 'ether'),
      })
      await alice.sendTransaction({
        to: otherDelegatee.address,
        value: ethers.utils.parseUnits('10', 'ether'),
      })
      await alice.sendTransaction({
        to: sender.address,
        value: ethers.utils.parseUnits('10', 'ether'),
      })
      // mint initial tokens
      await ECOproxy.connect(minterImpersonator).mint(delegator.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(delegatee.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(
        otherDelegatee.address,
        amount
      )
      await ECOproxy.connect(minterImpersonator).mint(
        delegateTransferRecipient.address,
        amount
      )
      // all parties will be voters
      await ECOproxy.connect(delegator).enableVoting()
      await ECOproxy.connect(delegatee).enableVoting()
      await ECOproxy.connect(otherDelegatee).enableVoting()
      await ECOproxy.connect(delegateTransferRecipient).enableVoting()

      await ECOproxy.connect(delegatee).enableDelegationTo()
      await ECOproxy.connect(otherDelegatee).enableDelegationTo()
    })

    context('delegateBySig', () => {
      it('correct votes when delegated', async () => {
        const tx1 = await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          sender,
          {}
        )
        const receipt1 = await tx1.wait()
        console.log(receipt1.gasUsed)
        expect(await ECOproxy.voteBalanceOf(delegatee.address)).to.equal(
          amount.mul(2)
        )

        const tx2 = await delegateBySig(
          ECOproxy,
          delegator,
          otherDelegatee,
          chainId,
          sender,
          { nonce: '1' }
        )
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)
        expect(await ECOproxy.voteBalanceOf(delegatee.address)).to.equal(amount)
        expect(await ECOproxy.voteBalanceOf(otherDelegatee.address)).to.equal(
          amount.mul(2)
        )
      })

      it('does not allow delegation if not enabled', async () => {
        await expect(
          delegateBySig(ECOproxy, delegator, nonDelegatee, chainId, sender, {})
        ).to.be.revertedWith(
          'ERC20Delegated: a primary delegate must enable delegation'
        )
      })

      it('does not allow delegation to yourself', async () => {
        await expect(
          delegateBySig(ECOproxy, delegator, delegator, chainId, delegator, {})
        ).to.be.revertedWith(
          'ERC20Delegated: use undelegate instead of delegating to yourself'
        )
      })

      it('does not allow delegator to be the zero address', async () => {
        const zeroWallet = {
          address: ethers.constants.AddressZero,
          privateKey:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        }
        await expect(
          delegateBySig(ECOproxy, zeroWallet, delegatee, chainId, delegatee, {})
        ).to.be.revertedWith('invalid delegator')
      })

      it('allows executing own delegation', async () => {
        await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          delegatee,
          {}
        )
        expect(await ECOproxy.voteBalanceOf(delegatee.address)).to.equal(
          amount.mul(2)
        )
      })

      it('allows delegation by signer', async () => {
        await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          delegator,
          {}
        )
        expect(await ECOproxy.voteBalanceOf(delegatee.address)).to.equal(
          amount.mul(2)
        )
      })

      it('does not allow delegation if you are a delegatee', async () => {
        await expect(
          delegateBySig(
            ECOproxy,
            delegatee,
            otherDelegatee,
            chainId,
            delegatee,
            {}
          )
        ).to.be.revertedWith(
          'ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates'
        )
      })

      it('does not allow delegation after deadline', async () => {
        await expect(
          delegateBySig(ECOproxy, delegator, delegatee, chainId, sender, {
            deadline: Math.floor(new Date().getTime() / 1000 - 5),
          })
        ).to.be.revertedWith('DelegatePermit: expired deadline')
      })

      it('does not allow non-delegator signature', async () => {
        await expect(
          delegateBySig(ECOproxy, delegator, delegatee, chainId, sender, {
            signer: delegateTransferRecipient,
          })
        ).to.be.revertedWith('DelegatePermit: invalid signature')
      })

      it('does not allow non-monotonic nonce', async () => {
        await expect(
          delegateBySig(ECOproxy, delegator, delegatee, chainId, sender, {
            nonce: '100',
          })
        ).to.be.revertedWith('DelegatePermit: invalid signature')
      })

      it('does not allow nonce reuse', async () => {
        await delegateBySig(ECOproxy, delegator, delegatee, chainId, sender, {
          nonce: '0',
        })
        await expect(
          delegateBySig(ECOproxy, delegator, delegatee, chainId, sender, {
            nonce: '0',
          })
        ).to.be.revertedWith('DelegatePermit: invalid signature')
      })
    })

    context('undelegate', () => {
      it('correct state when undelegated after delegating', async () => {
        await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          delegatee,
          {}
        )

        const tx2 = await ECOproxy.connect(delegator).undelegate({
          gasLimit: 1000000,
        })
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)

        const votes1 = await ECOproxy.voteBalanceOf(delegator.address)
        expect(votes1).to.equal(amount)
        const votes2 = await ECOproxy.voteBalanceOf(delegatee.address)
        expect(votes2).to.equal(amount)
      })
    })

    context('isOwnDelegate', () => {
      it('correct state when delegating and undelegating', async () => {
        expect(await ECOproxy.isOwnDelegate(delegator.address)).to.be.true

        await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          delegatee,
          {}
        )
        expect(await ECOproxy.isOwnDelegate(delegator.address)).to.be.false

        await ECOproxy.connect(delegator).undelegate({ gasLimit: 1000000 })
        expect(await ECOproxy.isOwnDelegate(delegator.address)).to.be.true
      })
    })

    context('getPrimaryDelegate', () => {
      it('correct state when delegating and undelegating', async () => {
        expect(await ECOproxy.getPrimaryDelegate(delegator.address)).to.equal(
          delegator.address
        )

        await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          delegatee,
          {}
        )
        expect(await ECOproxy.getPrimaryDelegate(delegator.address)).to.equal(
          delegatee.address
        )

        await ECOproxy.connect(delegator).undelegate({ gasLimit: 1000000 })
        expect(await ECOproxy.getPrimaryDelegate(delegator.address)).to.equal(
          delegator.address
        )
      })
    })

    context('delegate then transfer', () => {
      it('sender delegated', async () => {
        await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          delegatee,
          {}
        )
        await ECOproxy.connect(delegator).transfer(
          delegateTransferRecipient.address,
          amount,
          {
            gasLimit: 1000000,
          }
        )
        expect(await ECOproxy.voteBalanceOf(delegator.address)).to.equal(0)
        expect(
          await ECOproxy.voteBalanceOf(delegateTransferRecipient.address)
        ).to.equal(amount.mul(2))
        expect(await ECOproxy.voteBalanceOf(delegatee.address)).to.equal(amount)
      })

      it('receiver delegated', async () => {
        await delegateBySig(
          ECOproxy,
          delegateTransferRecipient,
          otherDelegatee,
          chainId,
          delegateTransferRecipient,
          {}
        )
        await ECOproxy.connect(delegator).transfer(
          delegateTransferRecipient.address,
          amount,
          {
            gasLimit: 1000000,
          }
        )
        expect(await ECOproxy.voteBalanceOf(delegator.address)).to.equal(0)
        expect(
          await ECOproxy.voteBalanceOf(delegateTransferRecipient.address)
        ).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(otherDelegatee.address)).to.equal(
          amount.mul(3)
        )
      })

      it('both delegated', async () => {
        await delegateBySig(
          ECOproxy,
          delegator,
          delegatee,
          chainId,
          delegatee,
          {}
        )
        await delegateBySig(
          ECOproxy,
          delegateTransferRecipient,
          otherDelegatee,
          chainId,
          delegateTransferRecipient,
          {}
        )
        await ECOproxy.connect(delegator).transfer(
          delegateTransferRecipient.address,
          amount,
          {
            gasLimit: 1000000,
          }
        )
        expect(await ECOproxy.voteBalanceOf(delegator.address)).to.equal(0)
        expect(
          await ECOproxy.voteBalanceOf(delegateTransferRecipient.address)
        ).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(delegatee.address)).to.equal(amount)
        expect(await ECOproxy.voteBalanceOf(otherDelegatee.address)).to.equal(
          amount.mul(3)
        )
      })
    })
  })

  describe('partial delegation', () => {
    const amount = INITIAL_SUPPLY.div(4)
    let voteAmount: BigNumber

    beforeEach(async () => {
      // mint initial tokens
      await ECOproxy.connect(minterImpersonator).mint(alice.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(bob.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(charlie.address, amount)
      await ECOproxy.connect(minterImpersonator).mint(dave.address, amount)

      expect(await ECOproxy.balanceOf(alice.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(bob.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(charlie.address)).to.eq(amount)
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(amount)

      await ECOproxy.connect(charlie).enableDelegationTo()
      await ECOproxy.connect(dave).enableDelegationTo()

      voteAmount = globalInflationMult.mul(amount)
    })

    context('delegateAmount', () => {
      it('correct votes when delegated', async () => {
        const tx1 = await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        const receipt1 = await tx1.wait()
        console.log(receipt1.gasUsed)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(
          amount.div(2)
        )
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          amount.div(2).mul(3)
        )

        const tx2 = await ECOproxy.connect(alice).delegateAmount(
          dave.address,
          voteAmount.div(4)
        )
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(
          amount.div(4)
        )
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          amount.div(2).mul(3)
        )
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          amount.div(4).mul(5)
        )
      })

      it('does not allow delegation to yourself', async () => {
        await expect(
          ECOproxy.connect(alice).delegateAmount(
            alice.address,
            voteAmount.div(5)
          )
        ).to.be.revertedWith(
          'ERC20Delegated: use undelegate instead of delegating to yourself'
        )
      })

      it('does not allow delegation to the zero address', async () => {
        await expect(
          ECOproxy.connect(alice).delegateAmount(
            ethers.constants.AddressZero,
            voteAmount.div(5)
          )
        ).to.be.revertedWith(
          'ERC20Delegated: cannot delegate to the zero address'
        )
      })

      it('does not allow delegation if you are a delegatee', async () => {
        await expect(
          ECOproxy.connect(charlie).delegateAmount(
            dave.address,
            voteAmount.div(2)
          )
        ).to.be.revertedWith(
          'ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates'
        )
      })

      it('does not allow you to delegate more than your balance', async () => {
        await expect(
          ECOproxy.connect(alice).delegateAmount(
            dave.address,
            voteAmount.mul(3)
          )
        ).to.be.revertedWith(
          'ERC20Delegated: must have an undelegated amount available to cover delegation'
        )

        await ECOproxy.connect(alice).delegateAmount(
          dave.address,
          voteAmount.mul(2).div(3)
        )

        await expect(
          ECOproxy.connect(alice).delegateAmount(
            charlie.address,
            voteAmount.div(2)
          )
        ).to.be.revertedWith(
          'ERC20Delegated: must have an undelegated amount available to cover delegation'
        )
      })

      it('having a primary delegate means you cannot delegate an amount', async () => {
        await ECOproxy.connect(alice).delegate(dave.address)

        await expect(
          ECOproxy.connect(alice).delegateAmount(
            charlie.address,
            voteAmount.div(1000000)
          )
        ).to.be.revertedWith(
          'ERC20Delegated: must have an undelegated amount available to cover delegation'
        )
      })

      it('having delegated an amount does not allow you to full delegate', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          dave.address,
          voteAmount.div(1000000)
        )

        await expect(
          ECOproxy.connect(alice).delegate(charlie.address)
        ).to.be.revertedWith(
          'ERC20Delegated: must have an undelegated amount available to cover delegation'
        )
        await expect(
          ECOproxy.connect(alice).delegate(dave.address)
        ).to.be.revertedWith(
          'ERC20Delegated: must have an undelegated amount available to cover delegation'
        )
      })

      it('no exploit on self transfer', async () => {
        await ECOproxy.connect(bob).delegate(charlie.address)
        await ECOproxy.connect(alice).delegateAmount(
          bob.address,
          voteAmount.div(4)
        )

        await ECOproxy.connect(snapshotterImpersonator).snapshot()

        await ECOproxy.connect(bob).transfer(bob.address, amount.div(4))

        expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.equal(
          amount.mul(3).div(4)
        )
        expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.equal(
          amount.div(4)
        )
        expect(await ECOproxy.voteBalanceSnapshot(charlie.address)).to.equal(
          amount.mul(2)
        )

        await ECOproxy.connect(snapshotterImpersonator).snapshot()

        expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.equal(
          amount.mul(3).div(4)
        )
        expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.equal(
          amount.div(4)
        )
        expect(await ECOproxy.voteBalanceSnapshot(charlie.address)).to.equal(
          amount.mul(2)
        )

        await ECOproxy.connect(alice).undelegateFromAddress(bob.address)
        await ECOproxy.connect(alice).transfer(bob.address, amount)
      })
    })

    context('undelegate', () => {
      it('disallows undelegate() with no primary delegate', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )

        await expect(ECOproxy.connect(alice).undelegate()).to.be.revertedWith(
          'ERC20Delegated: must specifiy undelegate address when not using a Primary Delegate'
        )
      })

      it('correct state when undelegated after delegating', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        await ECOproxy.connect(alice).delegateAmount(
          dave.address,
          voteAmount.div(4)
        )

        const tx1 = await ECOproxy.connect(alice).undelegateFromAddress(
          dave.address
        )
        const receipt1 = await tx1.wait()
        console.log(receipt1.gasUsed)

        expect(
          await ECOproxy.connect(alice).voteBalanceOf(alice.address)
        ).to.equal(amount.div(2))
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(charlie.address)
        ).to.equal(amount.div(2).mul(3))
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(dave.address)
        ).to.equal(amount)

        const tx2 = await ECOproxy.connect(alice).undelegateFromAddress(
          charlie.address
        )
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)

        expect(
          await ECOproxy.connect(alice).voteBalanceOf(alice.address)
        ).to.equal(amount)
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(charlie.address)
        ).to.equal(amount)
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(dave.address)
        ).to.equal(amount)
      })
    })

    context('partial undelegateAmountFromAddress', () => {
      it('can undelegate partially', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        await ECOproxy.connect(alice).delegateAmount(
          dave.address,
          voteAmount.div(4)
        )

        const tx1 = await ECOproxy.connect(alice).undelegateAmountFromAddress(
          dave.address,
          voteAmount.div(8)
        )
        const receipt1 = await tx1.wait()
        console.log(receipt1.gasUsed)

        expect(
          await ECOproxy.connect(alice).voteBalanceOf(alice.address)
        ).to.equal(amount.div(8).mul(3))
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(charlie.address)
        ).to.equal(amount.div(2).mul(3))
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(dave.address)
        ).to.equal(amount.div(8).mul(9))

        const tx2 = await ECOproxy.connect(alice).undelegateAmountFromAddress(
          charlie.address,
          voteAmount.div(4)
        )
        const receipt2 = await tx2.wait()
        console.log(receipt2.gasUsed)

        expect(
          await ECOproxy.connect(alice).voteBalanceOf(alice.address)
        ).to.equal(amount.div(8).mul(5))
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(charlie.address)
        ).to.equal(amount.div(4).mul(5))
        expect(
          await ECOproxy.connect(alice).voteBalanceOf(dave.address)
        ).to.equal(amount.div(8).mul(9))
      })

      it('reverts if amount is too high', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )

        await expect(
          ECOproxy.connect(alice).undelegateAmountFromAddress(
            charlie.address,
            voteAmount
          )
        ).to.be.revertedWith('amount not available to undelegate')
      })

      it('reverts if you try to undelegateAmountFromAddress as a primary delegator', async () => {
        await ECOproxy.connect(alice).delegate(charlie.address)

        await expect(
          ECOproxy.connect(alice).undelegateAmountFromAddress(
            charlie.address,
            voteAmount.div(2)
          )
        ).to.be.revertedWith(
          'undelegating amounts is only available for partial delegators'
        )
      })
    })

    context('isOwnDelegate', () => {
      it('correct state when delegating and undelegating', async () => {
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.true

        await ECOproxy.connect(alice).delegateAmount(
          bob.address,
          voteAmount.div(4)
        )
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.false

        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(4)
        )
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.false

        await ECOproxy.connect(alice).undelegateFromAddress(charlie.address)
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.false

        await ECOproxy.connect(alice).undelegateFromAddress(bob.address)
        expect(await ECOproxy.isOwnDelegate(alice.address)).to.be.true
      })
    })

    context('getPrimaryDelegate', () => {
      it('delegateAmount does not give you a primary delegate', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        expect(await ECOproxy.getPrimaryDelegate(alice.address)).to.equal(
          alice.address
        )
      })
    })

    context('delegate then transfer', () => {
      it('sender delegated with enough to cover', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        await ECOproxy.connect(alice).transfer(bob.address, amount.div(2))
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(
          amount.mul(3).div(2)
        )
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          amount.mul(3).div(2)
        )
      })

      it('sender delegated without enough to cover', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        await expect(
          ECOproxy.connect(alice).transfer(bob.address, amount)
        ).to.be.revertedWith(
          'ERC20Delegated: delegation too complicated to transfer. Undelegate and simplify before trying again'
        )
      })

      it('receiver delegated', async () => {
        await ECOproxy.connect(bob).delegateAmount(
          dave.address,
          voteAmount.div(2)
        )
        await ECOproxy.connect(alice).transfer(bob.address, amount.div(2))
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(
          amount.div(2)
        )
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(amount)
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          amount.mul(3).div(2)
        )

        await ECOproxy.connect(alice).transfer(bob.address, amount.div(2))
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(
          amount.mul(3).div(2)
        )
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          amount.mul(3).div(2)
        )
      })

      it('both delegated', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        await ECOproxy.connect(bob).delegateAmount(
          dave.address,
          voteAmount.div(4)
        )
        await ECOproxy.connect(alice).transfer(bob.address, amount.div(2))
        expect(await ECOproxy.voteBalanceOf(alice.address)).to.equal(0)
        expect(await ECOproxy.voteBalanceOf(bob.address)).to.equal(
          amount.mul(5).div(4)
        )
        expect(await ECOproxy.voteBalanceOf(charlie.address)).to.equal(
          amount.mul(3).div(2)
        )
        expect(await ECOproxy.voteBalanceOf(dave.address)).to.equal(
          amount.mul(5).div(4)
        )
      })
    })

    context('transfer gas testing', () => {
      it('sender delegated', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        const tx = await ECOproxy.connect(alice).transfer(
          charlie.address,
          amount.div(3)
        )
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })

      it('receiver delegated', async () => {
        await ECOproxy.connect(bob).delegateAmount(
          dave.address,
          voteAmount.div(2)
        )
        const tx = await ECOproxy.connect(alice).transfer(bob.address, amount)
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })

      it('both delegated', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        await ECOproxy.connect(bob).delegateAmount(
          dave.address,
          voteAmount.div(2)
        )
        const tx = await ECOproxy.connect(alice).transfer(
          bob.address,
          amount.div(3)
        )
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })

      it('both delegated with receiver primary delegate', async () => {
        await ECOproxy.connect(alice).delegateAmount(
          charlie.address,
          voteAmount.div(2)
        )
        await ECOproxy.connect(bob).delegate(dave.address)
        const tx = await ECOproxy.connect(alice).transfer(
          bob.address,
          amount.div(3)
        )
        const receipt = await tx.wait()
        console.log(receipt.gasUsed)
      })
    })
  })

  describe('snapshotting', () => {
    context('snapshot', () => {
      context('happy path', () => {
        it('can snapshot', async () => {
          await ECOproxy.connect(snapshotterImpersonator).snapshot()
        })

        it('changes state', async () => {
          const snapshotBlock1 = await ECOproxy.currentSnapshotBlock()
          await ECOproxy.connect(snapshotterImpersonator).snapshot()
          const snapshotBlock2 = await ECOproxy.currentSnapshotBlock()

          expect(snapshotBlock2).to.be.greaterThan(snapshotBlock1)
        })

        it('emits an event', async () => {
          const snapshotBlockOld = await ECOproxy.currentSnapshotBlock()
          await expect(ECOproxy.connect(snapshotterImpersonator).snapshot())
            .to.emit(ECOproxy, 'NewSnapshotBlock')
            .withArgs(snapshotBlockOld + 2) // this is the number of blocks here
        })

        context('allows accessing previous balances', () => {
          beforeEach(async () => {
            await ECOproxy.connect(minterImpersonator).mint(
              alice.address,
              INITIAL_SUPPLY
            )
            await ECOproxy.connect(minterImpersonator).mint(
              bob.address,
              INITIAL_SUPPLY
            )
            await ECOproxy.connect(minterImpersonator).mint(
              charlie.address,
              INITIAL_SUPPLY.mul(2)
            )

            await ECOproxy.connect(charlie).enableDelegationTo()
            await ECOproxy.connect(dave).enableDelegationTo()
          })

          it("doesn't require an action to access current balances", async () => {
            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY.mul(2))
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(0)
          })

          it('triggers off of transfer', async () => {
            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            await ECOproxy.connect(alice).transfer(
              bob.address,
              INITIAL_SUPPLY.div(4)
            )
            await ECOproxy.connect(alice).transfer(
              charlie.address,
              INITIAL_SUPPLY.div(2)
            )
            await ECOproxy.connect(charlie).transfer(
              dave.address,
              INITIAL_SUPPLY
            )

            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY.mul(2))
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(0)

            await ECOproxy.connect(snapshotterImpersonator).snapshot()
            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY.div(4)
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY.mul(5).div(4)
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY.mul(3).div(2))
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(
              INITIAL_SUPPLY
            )
          })

          it('triggers off of delegate', async () => {
            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            await ECOproxy.connect(alice).delegate(dave.address)
            await ECOproxy.connect(bob).delegateAmount(
              dave.address,
              globalInflationMult.mul(INITIAL_SUPPLY).div(2)
            )
            await ECOproxy.connect(charlie).transfer(
              alice.address,
              INITIAL_SUPPLY
            )

            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY.mul(2))
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(0)

            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              0
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY.div(2)
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY)
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(
              INITIAL_SUPPLY.mul(5).div(2)
            )
          })

          it('triggers off of undelegate', async () => {
            await ECOproxy.connect(snapshotterImpersonator).snapshot()
            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY.mul(2))
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(0)

            await ECOproxy.connect(alice).delegate(dave.address)
            await ECOproxy.connect(bob).delegateAmount(
              dave.address,
              globalInflationMult.mul(INITIAL_SUPPLY).div(2)
            )
            await ECOproxy.connect(charlie).transfer(
              alice.address,
              INITIAL_SUPPLY
            )

            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY.mul(2))
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(0)

            await ECOproxy.connect(snapshotterImpersonator).snapshot()
            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              0
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY.div(2)
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY)
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(
              INITIAL_SUPPLY.mul(5).div(2)
            )

            await ECOproxy.connect(alice).undelegate()
            await ECOproxy.connect(bob).undelegateAmountFromAddress(
              dave.address,
              globalInflationMult.mul(INITIAL_SUPPLY).div(4)
            )

            await ECOproxy.connect(snapshotterImpersonator).snapshot()
            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY.mul(2)
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY.mul(3).div(4)
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY)
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(
              INITIAL_SUPPLY.div(4)
            )
          })

          it('rememebers old rebase values', async () => {
            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            const digits1to9 = Math.floor(Math.random() * 900000000) + 100000000
            const digits10to19 = Math.floor(Math.random() * 10000000000)
            const newInflationMult = ethers.BigNumber.from(
              `${digits10to19}${digits1to9}`
            )
            const cumulativeInflationMult = newInflationMult
              .mul(globalInflationMult)
              .div(DENOMINATOR)
            await ECOproxy.connect(rebaserImpersonator).rebase(newInflationMult)

            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(INITIAL_SUPPLY.mul(2))
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(0)

            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            expect(await ECOproxy.voteBalanceSnapshot(alice.address)).to.be.eq(
              INITIAL_SUPPLY.mul(globalInflationMult).div(
                cumulativeInflationMult
              )
            )
            expect(await ECOproxy.voteBalanceSnapshot(bob.address)).to.be.eq(
              INITIAL_SUPPLY.mul(globalInflationMult).div(
                cumulativeInflationMult
              )
            )
            expect(
              await ECOproxy.voteBalanceSnapshot(charlie.address)
            ).to.be.eq(
              INITIAL_SUPPLY.mul(2)
                .mul(globalInflationMult)
                .div(cumulativeInflationMult)
            )
            expect(await ECOproxy.voteBalanceSnapshot(dave.address)).to.be.eq(0)
          })

          it('old linear inflation interface still mostly operable', async () => {
            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            const snapshotInflationMult =
              await ECOproxy.inflationMultiplierSnapshot()
            expect(await ECOproxy.getPastLinearInflation(1234567)).to.eq(
              snapshotInflationMult
            )

            const digits1to9 = Math.floor(Math.random() * 900000000) + 100000000
            const digits10to19 = Math.floor(Math.random() * 10000000000)
            const newInflationMult = ethers.BigNumber.from(
              `${digits10to19}${digits1to9}`
            )
            const cumulativeInflationMult = newInflationMult
              .mul(globalInflationMult)
              .div(DENOMINATOR)
            await ECOproxy.connect(rebaserImpersonator).rebase(newInflationMult)

            await ECOproxy.connect(snapshotterImpersonator).snapshot()

            expect(cumulativeInflationMult).to.eq(
              await ECOproxy.inflationMultiplierSnapshot()
            )
            expect(cumulativeInflationMult).to.eq(
              await ECOproxy.getPastLinearInflation(1111111)
            )
          })
        })
      })
    })
  })
})
