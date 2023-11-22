import { ethers } from 'hardhat'
import { expect } from 'chai'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../utils/errors'
import { ECO, ECO__factory, Policy } from '../../typechain-types'
import { createPermitMessageData, permit } from '../utils/permit'
import { BigNumberish } from 'ethers'
import { deployProxy } from '../../deploy/utils'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'

const INITIAL_SUPPLY = ethers.BigNumber.from('1' + '0'.repeat(21)) // 1000 eco initially

// a test for the ERC-20 specific features of the ECO contract
describe('Erc20', () => {
  let alice: SignerWithAddress // default signer
  let bob: SignerWithAddress // pauser
  let charlie: SignerWithAddress
  let dave: SignerWithAddress // distributer
  let policyImpersonator: SignerWithAddress
  let minterImpersonator: SignerWithAddress
  let rebaserImpersonator: SignerWithAddress
  before(async () => {
    ;[
      alice,
      bob,
      charlie,
      dave,
      policyImpersonator,
      minterImpersonator,
      rebaserImpersonator,
    ] = await ethers.getSigners()
  })

  let ECOproxy: ECO
  let Fake__Policy: FakeContract<Policy>
  let globalInflationMult: BigNumberish

  beforeEach(async () => {
    const digits1to9 = Math.floor(Math.random() * 900000000) + 100000000
    const digits10to19 = Math.floor(Math.random() * 10000000000)
    globalInflationMult = ethers.BigNumber.from(`${digits10to19}${digits1to9}`)

    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonator.getAddress() } // This allows us to make calls from the address
    )

    const ecoDeployParams = [Fake__Policy.address, bob.address]

    ECOproxy = (
      await deployProxy(alice, ECO__factory, ecoDeployParams)
    )[0] as ECO

    // set impersonator permissions
    await ECOproxy.connect(policyImpersonator).updateRebasers(
      rebaserImpersonator.address,
      true
    )
    await ECOproxy.connect(policyImpersonator).updateMinters(
      minterImpersonator.address,
      true
    )

    // set a global inflation multiplier for supply
    await ECOproxy.connect(rebaserImpersonator).rebase(globalInflationMult)

    // mint initial tokens
    await ECOproxy.connect(minterImpersonator).mint(
      dave.address,
      INITIAL_SUPPLY
    )
    expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
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

  describe('permit', () => {
    const permitSpender = ethers.Wallet.createRandom()
    const owner = ethers.Wallet.createRandom()
    let chainId: number

    before(async () => {
      ;({ chainId } = await ethers.provider.getNetwork())
    })

    context('when the source address has enough balance', async () => {
      const amount = ethers.utils.parseEther('1').mul(1000)

      it('fails if signed from non-owner', async () => {
        const deadline = Math.floor(new Date().getTime() / 1000 + 86400 * 3000)
        const nonce = await ECOproxy.nonces(owner.address)

        const permitData = createPermitMessageData({
          name: await ECOproxy.name(),
          address: ECOproxy.address,
          signer: owner.address,
          consumer: permitSpender.address,
          value: amount.toString(),
          nonce: nonce.toString(),
          chainId: chainId.toString(),
          deadline,
        })
        const sig = signTypedData({
          privateKey: Buffer.from(
            owner._signingKey().privateKey.slice(2),
            'hex'
          ),
          data: permitData,
          version: SignTypedDataVersion.V4,
        })
        const { v, r, s } = ethers.utils.splitSignature(sig)

        await expect(
          ECOproxy.permit(
            await permitSpender.getAddress(),
            owner.address,
            amount,
            deadline,
            v,
            r,
            s
          )
        ).to.be.revertedWith('ERC20Permit: invalid signature')
      })

      it('fails with invalid nonce', async () => {
        const deadline = Math.floor(new Date().getTime() / 1000 + 86400 * 3000)
        const nonce = await ECOproxy.nonces(owner.address)

        const permitData = createPermitMessageData({
          name: await ECOproxy.name(),
          address: ECOproxy.address,
          signer: owner.address,
          consumer: permitSpender.address,
          value: amount.toString(),
          nonce: nonce.add(1).toString(),
          chainId: chainId.toString(),
          deadline,
        })
        const sig = signTypedData({
          privateKey: Buffer.from(
            owner._signingKey().privateKey.slice(2),
            'hex'
          ),
          data: permitData,
          version: SignTypedDataVersion.V4,
        })
        const { v, r, s } = ethers.utils.splitSignature(sig)

        await expect(
          ECOproxy.permit(
            owner.address,
            await permitSpender.getAddress(),
            amount,
            deadline,
            v,
            r,
            s
          )
        ).to.be.revertedWith('ERC20Permit: invalid signature')
      })

      it('fails with invalid spender', async () => {
        const deadline = Math.floor(new Date().getTime() / 1000 + 86400 * 3000)
        const nonce = await ECOproxy.nonces(owner.address)

        const permitData = createPermitMessageData({
          name: await ECOproxy.name(),
          address: ECOproxy.address,
          signer: owner.address,
          consumer: permitSpender.address,
          value: amount.toString(),
          nonce: nonce.toString(),
          chainId: chainId.toString(),
          deadline,
        })
        const sig = signTypedData({
          privateKey: Buffer.from(
            owner._signingKey().privateKey.slice(2),
            'hex'
          ),
          data: permitData,
          version: SignTypedDataVersion.V4,
        })
        const { v, r, s } = ethers.utils.splitSignature(sig)

        await expect(
          ECOproxy.permit(
            owner.address,
            charlie.address,
            amount,
            deadline,
            v,
            r,
            s
          )
        ).to.be.revertedWith('ERC20Permit: invalid signature')
      })

      it('fails with invalid deadline', async () => {
        const deadline = Math.floor(new Date().getTime() / 1000 - 100)
        const nonce = await ECOproxy.nonces(owner.address)

        const permitData = createPermitMessageData({
          name: await ECOproxy.name(),
          address: ECOproxy.address,
          signer: owner.address,
          consumer: permitSpender.address,
          value: amount.toString(),
          nonce: nonce.toString(),
          chainId: chainId.toString(),
          deadline,
        })
        const sig = signTypedData({
          privateKey: Buffer.from(
            owner._signingKey().privateKey.slice(2),
            'hex'
          ),
          data: permitData,
          version: SignTypedDataVersion.V4,
        })
        const { v, r, s } = ethers.utils.splitSignature(sig)

        await expect(
          ECOproxy.permit(
            owner.address,
            await permitSpender.getAddress(),
            amount,
            deadline,
            v,
            r,
            s
          )
        ).to.be.revertedWith('ERC20Permit: expired deadline')
      })

      it('fails with signature reuse', async () => {
        const deadline = Math.floor(new Date().getTime() / 1000 + 86400 * 3000)
        const nonce = await ECOproxy.nonces(owner.address)

        const permitData = createPermitMessageData({
          name: await ECOproxy.name(),
          address: ECOproxy.address,
          signer: owner.address,
          consumer: permitSpender.address,
          value: amount.toString(),
          nonce: nonce.toString(),
          chainId: chainId.toString(),
          deadline,
        })
        const sig = signTypedData({
          privateKey: Buffer.from(
            owner._signingKey().privateKey.slice(2),
            'hex'
          ),
          data: permitData,
          version: SignTypedDataVersion.V4,
        })
        const { v, r, s } = ethers.utils.splitSignature(sig)

        await expect(
          ECOproxy.permit(
            owner.address,
            await permitSpender.getAddress(),
            amount,
            deadline,
            v,
            r,
            s
          )
        ).to.emit(ECOproxy, 'Approval')

        await expect(
          ECOproxy.permit(
            owner.address,
            await permitSpender.getAddress(),
            amount,
            deadline,
            v,
            r,
            s
          )
        ).to.be.revertedWith('ERC20Permit: invalid signature')
      })

      it('emits an Approval event', async () => {
        await expect(
          permit(ECOproxy, owner, permitSpender, chainId, amount)
        ).to.emit(ECOproxy, 'Approval')
      })

      it('increments the nonce', async () => {
        const nonce = await ECOproxy.nonces(owner.address)
        await permit(ECOproxy, owner, permitSpender, chainId, amount)
        const nonceAfter = await ECOproxy.nonces(owner.address)
        expect(nonceAfter.sub(nonce).sub(1)).to.equal(0)
      })

      it('returns proper domain separator', async () => {
        const domain = {
          name: await ECOproxy.name(),
          version: '1',
          chainId,
          verifyingContract: ECOproxy.address,
        }
        const expectedDomainSeparator =
          ethers.utils._TypedDataEncoder.hashDomain(domain)
        expect(await ECOproxy.DOMAIN_SEPARATOR()).to.equal(
          expectedDomainSeparator
        )
      })

      context('when there is no existing allowance', () => {
        it('sets the allowance', async () => {
          await expect(
            permit(ECOproxy, owner, permitSpender, chainId, amount)
          ).to.emit(ECOproxy, 'Approval')
          const allowance = await ECOproxy.allowance(
            owner.address,
            await permitSpender.getAddress()
          )
          expect(allowance).to.equal(amount)
        })
      })

      context('when there is a pre-existing allowance', () => {
        beforeEach(async () => {
          await permit(ECOproxy, owner, permitSpender, chainId, amount.sub(50))
        })

        it('replaces the existing allowance', async () => {
          await permit(ECOproxy, owner, permitSpender, chainId, amount)
          const allowance = await ECOproxy.allowance(
            owner.address,
            await permitSpender.getAddress()
          )

          expect(allowance).to.equal(amount)
        })

        it('emits the Approval event', async () => {
          await expect(
            permit(ECOproxy, owner, permitSpender, chainId, amount)
          ).to.emit(ECOproxy, 'Approval')
        })
      })
    })
  })
})
