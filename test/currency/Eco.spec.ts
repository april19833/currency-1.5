import { ethers } from 'hardhat'
import { expect } from 'chai'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../utils/errors'
import {
  ECO,
  ECO__factory,
  ForwardProxy__factory,
  Policy,
} from '../../typechain-types'
import { createPermitMessageData, permit } from '../utils/permit'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const PLACEHOLDER_ADDRESS2 = '0x2222222222222222222222222222222222222222'

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
