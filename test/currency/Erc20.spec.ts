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
describe.only('Erc20', () => {
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

    describe('transfer', () => {
        beforeEach(async () => {
            expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
        })

        describe('reverts', () => {
            it('when the sender doesn\'t have enough balance', async () => {
                await expect(
                    ECOproxy.connect(bob).transfer(charlie.address, INITIAL_SUPPLY)
                ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_BAD_AMOUNT)
                await expect(
                    ECOproxy.connect(dave).transfer(charlie.address, INITIAL_SUPPLY.add(1))
                ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_BAD_AMOUNT)
            })

            it('when the recipient is the zero address', async () => {
                await expect(
                    ECOproxy.connect(dave).transfer(ethers.constants.AddressZero, INITIAL_SUPPLY)
                ).to.be.revertedWith(
                    ERRORS.ERC20.TRANSFER_NO_ZERO_ADDRESS,
                )
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
                await expect(ECOproxy.connect(dave).transfer(charlie.address, INITIAL_SUPPLY))
                    .to.emit(ECOproxy, 'Transfer')
                    .withArgs(dave.address, charlie.address, INITIAL_SUPPLY)
            })
        })
    })

    describe('transferFrom', () => {
        const allowance = INITIAL_SUPPLY.div(2)

        beforeEach(async () => {
            expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY)
            await ECOproxy.connect(dave).approve(charlie.address, allowance)
            expect(await ECOproxy.allowance(dave.address, charlie.address)).to.eq(allowance)
        })

        describe('reverts', () => {
            it('when there is no allowance', async () => {
                await expect(
                    ECOproxy.connect(bob).transferFrom(dave.address, bob.address, allowance)
                ).to.be.revertedWith(ERRORS.ERC20.TRANSFERFROM_BAD_ALLOWANCE)
                await ECOproxy.connect(dave).transfer(charlie.address, allowance)
                await expect(
                    ECOproxy.connect(bob).transferFrom(charlie.address, bob.address, allowance)
                ).to.be.revertedWith(ERRORS.ERC20.TRANSFERFROM_BAD_ALLOWANCE)
            })

            it('when the request is above the allowance', async () => {
                await expect(
                    ECOproxy.connect(charlie).transferFrom(dave.address, charlie.address, allowance.add(1))
                ).to.be.revertedWith(ERRORS.ERC20.TRANSFERFROM_BAD_ALLOWANCE)
            })

            it('when the request is above the balance', async () => {
                await ECOproxy.connect(dave).burn(dave.address, INITIAL_SUPPLY)
                await expect(
                    ECOproxy.connect(charlie).transferFrom(dave.address, charlie.address, allowance)
                ).to.be.revertedWith(ERRORS.ERC20.TRANSFER_BAD_AMOUNT)
            })

            it('when the recipient is the zero address', async () => {
                await expect(
                    ECOproxy.connect(charlie).transferFrom(dave.address, ethers.constants.AddressZero, allowance)
                ).to.be.revertedWith(
                    ERRORS.ERC20.TRANSFER_NO_ZERO_ADDRESS,
                )
            })
        })
    
        describe('happy path', () => {
            it('can transfer', async () => {
                await ECOproxy.connect(charlie).transferFrom(dave.address, bob.address, allowance)
            })

            it('changes state correctly', async () => {
                await ECOproxy.connect(charlie).transferFrom(dave.address, bob.address, allowance)
        
                expect(await ECOproxy.balanceOf(dave.address)).to.eq(INITIAL_SUPPLY.sub(allowance))
                expect(await ECOproxy.balanceOf(bob.address)).to.eq(allowance)
                expect(await ECOproxy.totalSupply()).to.eq(INITIAL_SUPPLY)
                expect(await ECOproxy.allowance(dave.address,charlie.address)).to.eq(0)
            })
        
            it('emits a Transfer event', async () => {
                await expect(ECOproxy.connect(charlie).transferFrom(dave.address, bob.address, allowance))
                    .to.emit(ECOproxy, 'Transfer')
                    .withArgs(dave.address, bob.address, allowance)
            })
        })
    })


})