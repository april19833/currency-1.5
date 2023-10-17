import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../utils/constants'
import { ERRORS } from '../utils/errors'
import {
  ECOx,
  ECOxStaking,
  ECOxStaking__factory,
  ECOx__factory,
  ForwardProxy__factory,
  Policy,
} from '../../typechain-types'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const one = ethers.utils.parseEther('1')
const INITIAL_BALANCE = one.mul(1000)
const stakeX = INITIAL_BALANCE.div(2)

describe('ECOxStaking', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress // no approval address
  let policyImpersonater: SignerWithAddress
  let ecoXminterImpersonator: SignerWithAddress

  before(async () => {
    ;[alice, bob, charlie, policyImpersonater, ecoXminterImpersonator] =
      await ethers.getSigners()
  })

  let Fake__Policy: FakeContract<Policy>
  let ecoX: MockContract<ECOx>
  let ecoXStaking: ECOxStaking

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
    )

    const EcoXFact: MockContractFactory<ECOx__factory> = await smock.mock(
      'ECOx'
    )
    ecoX = await EcoXFact.connect(policyImpersonater).deploy(
      Fake__Policy.address,
      PLACEHOLDER_ADDRESS1,
      PLACEHOLDER_ADDRESS1
    )

    await ecoX
      .connect(policyImpersonater)
      .updateMinters(ecoXminterImpersonator.address, true)
    await ecoX
      .connect(ecoXminterImpersonator)
      .mint(alice.address, INITIAL_BALANCE)
    await ecoX
      .connect(ecoXminterImpersonator)
      .mint(bob.address, INITIAL_BALANCE)
    await ecoX
      .connect(ecoXminterImpersonator)
      .mint(charlie.address, INITIAL_BALANCE)

    const ecoXStakingFact = new ECOxStaking__factory(policyImpersonater)

    await expect(
      ecoXStakingFact.deploy(Fake__Policy.address, ethers.constants.AddressZero)
    ).to.be.revertedWith(ERRORS.ECOxStaking.CONSTRUCTOR_ZERO_ECOX_ADDRESS)

    const ecoXStakingImpl = await ecoXStakingFact.deploy(
      Fake__Policy.address,
      ecoX.address
    )

    const proxy = await new ForwardProxy__factory()
      .connect(policyImpersonater)
      .deploy(ecoXStakingImpl.address)

    ecoXStaking = ecoXStakingFact.attach(proxy.address)

    expect(ecoXStaking.address === proxy.address).to.be.true

    // set approvals
    await ecoX.connect(alice).approve(ecoXStaking.address, stakeX)
    await ecoX.connect(bob).approve(ecoXStaking.address, INITIAL_BALANCE)
  })

  context('deposit and withdrawal', () => {
    describe('deposit', () => {
      context('happy path', () => {
        it('can deposit', async () => {
          await ecoXStaking.connect(alice).deposit(stakeX)
        })

        it('changes state', async () => {
          expect(await ecoXStaking.balanceOf(alice.address)).to.eq(0)
          await ecoXStaking.connect(alice).deposit(stakeX)
          expect(await ecoXStaking.balanceOf(alice.address)).to.eq(stakeX)
        })

        it('emits events', async () => {
          await expect(ecoXStaking.connect(alice).deposit(stakeX))
            .to.emit(ecoXStaking, `Deposit`)
            .withArgs(alice.address, stakeX)
        })
      })

      context('reverts', () => {
        it('without an allowance', async () => {
          await expect(
            ecoXStaking.connect(charlie).deposit(stakeX)
          ).to.be.revertedWith(ERRORS.ERC20.TRANSFERFROM_BAD_ALLOWANCE)
        })

        it('without tokens for your allowance allowance', async () => {
          await ecoX
            .connect(bob)
            .increaseAllowance(ecoXStaking.address, INITIAL_BALANCE)
          await expect(
            ecoXStaking.connect(bob).deposit(INITIAL_BALANCE.mul(2))
          ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_BAD_AMOUNT)
        })
      })
    })

    describe('withdraw', () => {
      context('happy path', () => {
        beforeEach(async () => {
          await ecoXStaking.connect(alice).deposit(stakeX)
        })

        it('can withdraw', async () => {
          await ecoXStaking.connect(alice).withdraw(stakeX)
        })

        it('can withdraw partial', async () => {
          await ecoXStaking.connect(alice).withdraw(stakeX.div(2))
        })

        it('changes state', async () => {
          expect(await ecoXStaking.balanceOf(alice.address)).to.eq(stakeX)
          await ecoXStaking.connect(alice).withdraw(stakeX.div(2))
          expect(await ecoXStaking.balanceOf(alice.address)).to.eq(
            stakeX.div(2)
          )
          expect(await ecoX.balanceOf(alice.address)).to.eq(
            stakeX.mul(3).div(2)
          )
          await ecoXStaking.connect(alice).withdraw(stakeX.div(2))
          expect(await ecoXStaking.balanceOf(alice.address)).to.eq(0)
          expect(await ecoX.balanceOf(alice.address)).to.eq(INITIAL_BALANCE)
        })

        it('emits events', async () => {
          await expect(ecoXStaking.connect(alice).withdraw(stakeX))
            .to.emit(ecoXStaking, `Withdrawal`)
            .withArgs(alice.address, stakeX)
        })
      })

      context('reverts', () => {
        it('no funds', async () => {
          await expect(
            ecoXStaking.connect(charlie).withdraw(stakeX)
          ).to.be.revertedWith(ERRORS.ERC20.BURN_BAD_AMOUNT)
        })

        it('overdraw', async () => {
          await expect(
            ecoXStaking.connect(alice).withdraw(stakeX.mul(3))
          ).to.be.revertedWith(ERRORS.ERC20.BURN_BAD_AMOUNT)
        })
      })
    })
  })

  context('disabled ERC20 functionality', () => {
    beforeEach(async () => {
      await ecoXStaking.connect(alice).deposit(stakeX)
    })

    it('reverts on transfer', async () => {
      await expect(ecoXStaking.transfer(alice.address, 1)).to.be.revertedWith(
        ERRORS.ECOxStaking.ATTEMPTED_TRANSFER
      )
    })

    it('reverts on transferFrom', async () => {
      await expect(
        ecoXStaking.transferFrom(alice.address, bob.address, 1)
      ).to.be.revertedWith(ERRORS.ECOxStaking.ATTEMPTED_TRANSFER)
    })
  })

  context('checkpointing', () => {
    let blockNumber1: number
    let blockNumber2: number

    beforeEach(async () => {
      await ecoXStaking.connect(bob).deposit(INITIAL_BALANCE)

      blockNumber1 = await time.latestBlock()

      await ecoXStaking.connect(alice).deposit(stakeX)

      blockNumber2 = await time.latestBlock()

      await time.increase(DAY)
    })

    context('basic token and checkpoints data', async () => {
      // Confirm the internal balance method works
      it('can get the balance', async () => {
        expect(await ecoXStaking.balanceOf(alice.address)).to.equal(stakeX)
      })

      it('can get the past total supply', async () => {
        const pastTotalSupply1 = await ecoXStaking.totalSupplyAt(blockNumber1)
        expect(pastTotalSupply1).to.be.equal(INITIAL_BALANCE)
        const pastTotalSupply2 = await ecoXStaking.totalSupplyAt(blockNumber2)
        expect(pastTotalSupply2).to.be.equal(stakeX.add(INITIAL_BALANCE))
      })

      it('can get a past balance', async () => {
        const pastBalance1 = await ecoXStaking.getPastVotes(
          alice.address,
          blockNumber1
        )
        expect(pastBalance1).to.be.equal(0)
        const pastBalance2 = await ecoXStaking.getPastVotes(
          alice.address,
          blockNumber2
        )
        expect(pastBalance2).to.be.equal(stakeX)
      })
    })
  })

  context('delegation and withdrawals', () => {
    beforeEach(async () => {
      await ecoXStaking.connect(alice).deposit(stakeX)

      await ecoXStaking.connect(bob).deposit(INITIAL_BALANCE)

      await ecoXStaking.connect(bob).enableDelegationTo()
    })

    describe('delegate', () => {
      it('can delegate', async () => {
        const blockNumber1 = await time.latestBlock()
        await ecoXStaking.connect(alice).delegate(bob.address)
        const blockNumber2 = await time.latestBlock()
        time.advanceBlock()
        expect(await ecoXStaking.getVotingGons(bob.address)).to.equal(
          INITIAL_BALANCE.add(stakeX)
        )
        expect(
          await ecoXStaking.votingECOx(bob.address, blockNumber1)
        ).to.equal(INITIAL_BALANCE)
        expect(
          await ecoXStaking.votingECOx(bob.address, blockNumber2)
        ).to.equal(INITIAL_BALANCE.add(stakeX))
      })

      it('can withdraw if delegated', async () => {
        await ecoXStaking.connect(alice).delegate(bob.address)

        expect(await ecoXStaking.getVotingGons(bob.address)).to.equal(
          INITIAL_BALANCE.add(stakeX)
        )

        await ecoXStaking.connect(alice).withdraw(stakeX)

        expect(await ecoXStaking.getVotingGons(bob.address)).to.equal(
          INITIAL_BALANCE
        )
      })
    })

    context('undelegate', () => {
      context('full delegation', () => {
        beforeEach(async () => {
          await ecoXStaking.connect(alice).delegate(bob.address)
        })

        it('no effect on withdrawal', async () => {
          await ecoXStaking.connect(alice).undelegate()
          await ecoXStaking.connect(alice).withdraw(stakeX)
        })

        it('can withdraw without undelegating', async () => {
          await ecoXStaking.connect(alice).withdraw(stakeX)
        })
      })

      it('partial delegation allows withdrawing the rest', async () => {
        await ecoXStaking
          .connect(alice)
          .delegateAmount(bob.address, stakeX.div(2))
        await ecoXStaking.connect(alice).withdraw(stakeX.div(2))
      })

      it('partial delegation reverts otherwise', async () => {
        await ecoXStaking
          .connect(alice)
          .delegateAmount(bob.address, stakeX.div(2))
        await expect(
          ecoXStaking.connect(alice).withdraw(stakeX)
        ).to.be.revertedWith(
          'Delegation too complicated to transfer. Undelegate and simplify before trying again'
        )
      })
    })
  })
})
