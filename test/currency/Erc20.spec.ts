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

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const PLACEHOLDER_ADDRESS2 = '0x2222222222222222222222222222222222222222'

const INITIAL_SUPPLY = ethers.BigNumber.from('1' + '000'.repeat(7)) // 1000 eco initially

// a test for the ERC-20 specific features of the ECO contract
describe('Erc20', () => {
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

  describe('balanceOf', () => {
    it('returns balance', async () => {
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
    })

    it("doesn't care if address has never had tokens", async () => {
      expect(await ECOproxy.balanceOf(PLACEHOLDER_ADDRESS1)).to.eq(0)
    })
  })

  describe('totalSupply', () => {
    it('fetches total supply', async () => {
      expect(await ECOproxy.totalSupply()).to.eq(INITIAL_SUPPLY)
    })
  })

  describe('metadata', () => {
    it('has the standard 18 decimals', async () => {
      expect(await ECOproxy.decimals()).to.be.equal(18)
    })

    it('has the right name', async () => {
      expect(await ECOproxy.name()).to.be.equal('ECO')
    })

    it('has the right symbol', async () => {
      expect(await ECOproxy.symbol()).to.be.equal('ECO')
    })
  })

  describe('transfer', () => {
    beforeEach(async () => {
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
    })

    describe('reverts', () => {
      it("when the sender doesn't have enough balance", async () => {
        await expect(
          ECOproxy.connect(bob).transfer(charlie.address, INITIAL_SUPPLY)
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_BAD_AMOUNT)
        await expect(
          ECOproxy.connect(dave).transfer(
            charlie.address,
            INITIAL_SUPPLY.add(1)
          )
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_BAD_AMOUNT)
      })

      it('when the recipient is the zero address', async () => {
        await expect(
          ECOproxy.connect(dave).transfer(
            ethers.constants.AddressZero,
            INITIAL_SUPPLY
          )
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_NO_ZERO_ADDRESS)
      })
    })

    describe('happy path', () => {
      it('can transfer', async () => {
        await ECOproxy.connect(dave).transfer(charlie.address, INITIAL_SUPPLY)
      })

      it('changes state correctly', async () => {
        await ECOproxy.connect(dave).transfer(charlie.address, INITIAL_SUPPLY)

        expect(await ECOproxy.balanceOf(dave.address)).to.eq(0)
        expect(await ECOproxy.balanceOf(charlie.address)).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.totalSupply()).to.eq(INITIAL_SUPPLY)
      })

      it('emits a Transfer event', async () => {
        await expect(
          ECOproxy.connect(dave).transfer(charlie.address, INITIAL_SUPPLY)
        )
          .to.emit(ECOproxy, 'Transfer')
          .withArgs(dave.address, charlie.address, INITIAL_SUPPLY)
      })
    })
  })

  describe('approvals and allowances', () => {
    const approvalAmount = INITIAL_SUPPLY.div(5)

    beforeEach(async () => {
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
    })

    describe('approve', () => {
      describe('happy path', () => {
        it('can approve', async () => {
          await ECOproxy.connect(dave).approve(charlie.address, approvalAmount)
        })

        it('approval not gated by balance', async () => {
          await ECOproxy.connect(dave).approve(
            charlie.address,
            INITIAL_SUPPLY.mul(10)
          )
          expect(await ECOproxy.balanceOf(bob.address)).to.eq(0)
          await ECOproxy.connect(bob).approve(charlie.address, approvalAmount)
        })

        it('changes state correctly', async () => {
          await ECOproxy.connect(bob).approve(charlie.address, approvalAmount)

          expect(await ECOproxy.allowance(bob.address, charlie.address)).to.eq(
            approvalAmount
          )
        })

        it('subsequent approvals override', async () => {
          const newApprovalAmount = approvalAmount.mul(2)

          await ECOproxy.connect(bob).approve(charlie.address, approvalAmount)

          await ECOproxy.connect(bob).approve(
            charlie.address,
            newApprovalAmount
          )
          expect(await ECOproxy.allowance(bob.address, charlie.address)).to.eq(
            newApprovalAmount
          )
        })

        it('emits an Approval event', async () => {
          await expect(
            ECOproxy.connect(bob).approve(charlie.address, approvalAmount)
          )
            .to.emit(ECOproxy, 'Approval')
            .withArgs(bob.address, charlie.address, approvalAmount)
        })
      })

      describe('reverts', () => {
        it('when the spender is the zero address', async () => {
          await expect(
            ECOproxy.connect(bob).approve(
              ethers.constants.AddressZero,
              approvalAmount
            )
          ).to.be.revertedWith(ERRORS.ERC20.APPROVE_NO_ZERO_ADDRESS)
        })
      })
    })

    describe('increaseAllowance', () => {
      const increaseAmount = INITIAL_SUPPLY.div(10)

      beforeEach(async () => {
        await ECOproxy.connect(dave).approve(charlie.address, approvalAmount)
      })

      describe('happy path', () => {
        it('can increase', async () => {
          await ECOproxy.connect(dave).increaseAllowance(
            charlie.address,
            increaseAmount
          )
        })

        it('changes state', async () => {
          await ECOproxy.connect(dave).increaseAllowance(
            charlie.address,
            increaseAmount
          )

          expect(await ECOproxy.allowance(dave.address, charlie.address)).to.eq(
            increaseAmount.add(approvalAmount)
          )
        })

        it('does not need existing allowance to increase', async () => {
          await ECOproxy.connect(dave).increaseAllowance(
            bob.address,
            increaseAmount
          )

          expect(await ECOproxy.allowance(dave.address, bob.address)).to.eq(
            increaseAmount
          )
        })

        it('emits an Approval event', async () => {
          await expect(
            ECOproxy.connect(dave).increaseAllowance(
              charlie.address,
              increaseAmount
            )
          )
            .to.emit(ECOproxy, 'Approval')
            .withArgs(
              dave.address,
              charlie.address,
              increaseAmount.add(approvalAmount)
            )
        })
      })

      // no reverts
    })

    describe('decreaseAllowance', () => {
      const decreaseAmount = approvalAmount.div(2)

      beforeEach(async () => {
        await ECOproxy.connect(dave).approve(charlie.address, approvalAmount)
      })

      describe('happy path', () => {
        it('can decrease', async () => {
          await ECOproxy.connect(dave).decreaseAllowance(
            charlie.address,
            decreaseAmount
          )
        })

        it('changes state', async () => {
          await ECOproxy.connect(dave).decreaseAllowance(
            charlie.address,
            decreaseAmount
          )

          expect(await ECOproxy.allowance(dave.address, charlie.address)).to.eq(
            approvalAmount.sub(decreaseAmount)
          )
        })

        it('can decrease to zero', async () => {
          await ECOproxy.connect(dave).decreaseAllowance(
            charlie.address,
            approvalAmount
          )

          expect(await ECOproxy.allowance(dave.address, charlie.address)).to.eq(
            0
          )
        })

        it('emits an Approval event', async () => {
          await expect(
            ECOproxy.connect(dave).decreaseAllowance(
              charlie.address,
              decreaseAmount
            )
          )
            .to.emit(ECOproxy, 'Approval')
            .withArgs(
              dave.address,
              charlie.address,
              approvalAmount.sub(decreaseAmount)
            )
        })
      })

      describe('reverts', () => {
        it('when decreasing more than existing', async () => {
          await expect(
            ECOproxy.connect(dave).decreaseAllowance(
              charlie.address,
              approvalAmount.add(1)
            )
          ).to.be.revertedWith(ERRORS.ERC20.DECREASEALLOWANCE_UNDERFLOW)
        })
      })
    })
  })

  describe('transferFrom', () => {
    const allowance = INITIAL_SUPPLY.div(2)

    beforeEach(async () => {
      expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
      await ECOproxy.connect(dave).approve(charlie.address, allowance)
      expect(await ECOproxy.allowance(dave.address, charlie.address)).to.eq(
        allowance
      )
    })

    describe('reverts', () => {
      it('when there is no allowance', async () => {
        await expect(
          ECOproxy.connect(bob).transferFrom(
            dave.address,
            bob.address,
            allowance
          )
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFERFROM_BAD_ALLOWANCE)
        await ECOproxy.connect(dave).transfer(charlie.address, allowance)
        await expect(
          ECOproxy.connect(bob).transferFrom(
            charlie.address,
            bob.address,
            allowance
          )
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFERFROM_BAD_ALLOWANCE)
      })

      it('when the request is above the allowance', async () => {
        await expect(
          ECOproxy.connect(charlie).transferFrom(
            dave.address,
            charlie.address,
            allowance.add(1)
          )
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFERFROM_BAD_ALLOWANCE)
      })

      it('when the request is above the balance', async () => {
        await ECOproxy.connect(dave).burn(dave.address, INITIAL_SUPPLY)
        await expect(
          ECOproxy.connect(charlie).transferFrom(
            dave.address,
            charlie.address,
            allowance
          )
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_BAD_AMOUNT)
      })

      it('when the recipient is the zero address', async () => {
        await expect(
          ECOproxy.connect(charlie).transferFrom(
            dave.address,
            ethers.constants.AddressZero,
            allowance
          )
        ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_NO_ZERO_ADDRESS)
      })
    })

    describe('happy path', () => {
      it('can transfer', async () => {
        await ECOproxy.connect(charlie).transferFrom(
          dave.address,
          bob.address,
          allowance
        )
      })

      it('changes state correctly', async () => {
        await ECOproxy.connect(charlie).transferFrom(
          dave.address,
          bob.address,
          allowance
        )

        expect(await ECOproxy.balanceOf(dave.address)).to.eq(
          INITIAL_SUPPLY.sub(allowance)
        )
        expect(await ECOproxy.balanceOf(bob.address)).to.eq(allowance)
        expect(await ECOproxy.totalSupply()).to.eq(INITIAL_SUPPLY)
        expect(await ECOproxy.allowance(dave.address, charlie.address)).to.eq(0)
      })

      it('emits a Transfer and Approval event', async () => {
        await expect(
          ECOproxy.connect(charlie).transferFrom(
            dave.address,
            bob.address,
            allowance
          )
        )
          .to.emit(ECOproxy, 'Transfer')
          .withArgs(dave.address, bob.address, allowance)
          .to.emit(ECOproxy, 'Approval')
          .withArgs(dave.address, charlie.address, 0)
      })
    })
  })
})
