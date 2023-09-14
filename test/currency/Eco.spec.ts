import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../utils/constants'
import { ERRORS } from '../utils/errors'
import {
    ECO,
  ECO__factory,
  ForwardProxy__factory,
  Policy,
} from '../../typechain-types'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const PLACEHOLDER_ADDRESS2 = '0x2222222222222222222222222222222222222222'

const INITIAL_SUPPLY = '1' + '000'.repeat(7) // 1000 eco initially

describe.only('Eco', () => {
    let alice: SignerWithAddress // default signer
    let bob: SignerWithAddress // pauser
    let charlie: SignerWithAddress 
    let dave: SignerWithAddress // distributer
    let policyImpersonater: SignerWithAddress
    before(async () => {
      ;[alice, bob, charlie, dave, policyImpersonater] =
        await ethers.getSigners()
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
    
        ECOimpl = await ECOfact
            .connect(policyImpersonater)
            .deploy(Fake__Policy.address, dave.address, INITIAL_SUPPLY, bob.address)


        const proxy = await new ForwardProxy__factory()
            .connect(policyImpersonater)
            .deploy(ECOimpl.address)

        ECOproxy = ECOfact.attach(proxy.address)

        expect(ECOproxy.address === proxy.address).to.be.true;
    })

    describe('role permissions', () => {
        describe('minter role', () => {
            it('can be added by the policy', async () => {
              await ECOproxy.connect(policyImpersonater).updateMinters(
                charlie.address,
                true,
              )
              const charlieMinting = await ECOproxy.minters(charlie.address)
              expect(charlieMinting).to.be.true
            })

            it('can be removed by the policy', async () => {
                await ECOproxy.connect(policyImpersonater).updateMinters(
                    charlie.address,
                    true,
                )
                await ECOproxy.connect(policyImpersonater).updateMinters(
                    charlie.address,
                    false,
                )
                const charlieMinting = await ECOproxy.minters(charlie.address)
                expect(charlieMinting).to.be.false
            })
        
            it('emits an event', async () => {
              expect(
                await ECOproxy.connect(policyImpersonater).updateMinters(
                    charlie.address,
                    true,
                )
              )
                .to.emit(ECOproxy, 'UpdatedMinters')
                .withArgs(charlie.address, true)
            })
        
            it('is onlyPolicy gated', async () => {
              await expect(
                ECOproxy.connect(charlie).updateMinters(
                    charlie.address,
                    true,
                )
              ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
            })
        })
        
        describe('burner role', () => {
            it('can be added by the policy', async () => {
              await ECOproxy.connect(policyImpersonater).updateBurners(
                charlie.address,
                true,
              )
              const charlieBurning = await ECOproxy.burners(charlie.address)
              expect(charlieBurning).to.be.true
            })

            it('can be removed by the policy', async () => {
                await ECOproxy.connect(policyImpersonater).updateBurners(
                    charlie.address,
                    true,
                )
                await ECOproxy.connect(policyImpersonater).updateBurners(
                    charlie.address,
                    false,
                )
                const charlieBurning = await ECOproxy.burners(charlie.address)
                expect(charlieBurning).to.be.false
            })
        
            it('emits an event', async () => {
              expect(
                await ECOproxy.connect(policyImpersonater).updateBurners(
                    charlie.address,
                    true,
                )
              )
                .to.emit(ECOproxy, 'UpdatedBurners')
                .withArgs(charlie.address, true)
            })
        
            it('is onlyPolicy gated', async () => {
              await expect(
                ECOproxy.connect(charlie).updateBurners(
                    charlie.address,
                    true,
                )
              ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
            })
        })

        describe('rebaser role', () => {
            it('can be added by the policy', async () => {
              await ECOproxy.connect(policyImpersonater).updateRebasers(
                charlie.address,
                true,
              )
              const charlieRebasing = await ECOproxy.rebasers(charlie.address)
              expect(charlieRebasing).to.be.true
            })

            it('can be removed by the policy', async () => {
                await ECOproxy.connect(policyImpersonater).updateRebasers(
                    charlie.address,
                    true,
                )
                await ECOproxy.connect(policyImpersonater).updateRebasers(
                    charlie.address,
                    false,
                )
                const charlieRebasing = await ECOproxy.rebasers(charlie.address)
                expect(charlieRebasing).to.be.false
            })
        
            it('emits an event', async () => {
              expect(
                await ECOproxy.connect(policyImpersonater).updateRebasers(
                    charlie.address,
                    true,
                )
              )
                .to.emit(ECOproxy, 'UpdatedRebasers')
                .withArgs(charlie.address, true)
            })
        
            it('is onlyPolicy gated', async () => {
              await expect(
                ECOproxy.connect(charlie).updateRebasers(
                    charlie.address,
                    true,
                )
              ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
            })
        })

        describe('snapshotter role', () => {
            it('can be added by the policy', async () => {
              await ECOproxy.connect(policyImpersonater).updateSnapshotters(
                charlie.address,
                true,
              )
              const charlieSnapshotting = await ECOproxy.snapshotters(charlie.address)
              expect(charlieSnapshotting).to.be.true
            })

            it('can be removed by the policy', async () => {
                await ECOproxy.connect(policyImpersonater).updateSnapshotters(
                    charlie.address,
                    true,
                )
                await ECOproxy.connect(policyImpersonater).updateSnapshotters(
                    charlie.address,
                    false,
                )
                const charlieSnapshotting = await ECOproxy.snapshotters(charlie.address)
                expect(charlieSnapshotting).to.be.false
            })
        
            it('emits an event', async () => {
              expect(
                await ECOproxy.connect(policyImpersonater).updateSnapshotters(
                    charlie.address,
                    true,
                )
              )
                .to.emit(ECOproxy, 'UpdatedSnapshotters')
                .withArgs(charlie.address, true)
            })
        
            it('is onlyPolicy gated', async () => {
              await expect(
                ECOproxy.connect(charlie).updateSnapshotters(
                    charlie.address,
                    true,
                )
              ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
            })
        })
    })
})