/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { Signer, Contract, constants, BigNumber, providers, ethers } from 'ethers'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { helpers, time } from '@nomicfoundation/hardhat-network-helpers'
import { almost } from 'chai-almost'
import { expect } from 'chai'
import {
  TEST,
} from '../../utils/constants'
import { ERROR_STRINGS } from '../../utils/errors'
import { getABI } from '../../utils/testUtils'
import { TrustedNodes, CurrencyGovernance, ECOx, TrustedNodes__factory, MockToken, MockToken__factory, CurrencyGovernance__factory} from '../../../typechain-types'
import { currency } from '../../../typechain-types/contracts'
import { EthersEvent } from 'alchemy-sdk/dist/src/internal/ethers-event'
import { TypeFormatFlags } from 'typescript'

describe('TrustedNodes', () => {
    let policyImpersonator: SignerWithAddress
    let currencyGovernanceImpersonator: SignerWithAddress

    let alice: SignerWithAddress
    let bob: SignerWithAddress
    let charlie: SignerWithAddress
    let dave: SignerWithAddress

    let provider: providers.Provider

    let trustedNodesABI = getABI('artifacts/contracts/governance/monetary/TrustedNodes.sol/TrustedNodes.json')
    let ECOxABI = getABI('artifacts/contracts/test/MockToken.sol/MockToken.json')

    let initialReward: number = 100
    let initialTermLength: number = 3600*24

    before(async() => {
        ;[policyImpersonator, currencyGovernanceImpersonator, alice, bob, charlie, dave] = await ethers.getSigners()
        provider = ethers.getDefaultProvider()
    })

    let policy: FakeContract
    let currencyGovernance: FakeContract

    let trustedNodesFactory = new ethers.ContractFactory(trustedNodesABI.abi, trustedNodesABI.bytecode)
    let ecoXFactory = new ethers.ContractFactory(ECOxABI.abi, ECOxABI.bytecode)
    let trustedNodes: TrustedNodes
    // let currencyGovernance: MockContract<Contract>
    let ecoX: MockToken

    beforeEach(async() => {
        policy = await smock.fake<Contract>(
            'Policy',
            { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
        )
        currencyGovernance = await smock.fake<Contract>(
            'CurrencyGovernance',
            { address: currencyGovernanceImpersonator.address}
        )
        // currencyGovernance = await(
        //     await smock.mock('CurrencyGovernance')
        //     ).deploy(
        //         policy.address,
        //         constants.AddressZero, 
        //         constants.AddressZero
        // )
        ecoX = MockToken__factory.connect(
            (await ecoXFactory.connect(policyImpersonator)
                .deploy(
                    'ECOx',
                    'ECOX'
                )
            ).address,
            policyImpersonator
        )
        trustedNodes = TrustedNodes__factory.connect(
            (await trustedNodesFactory.connect(policyImpersonator)
                .deploy(
                    policy.address,
                    currencyGovernance.address,
                    ecoX.address,
                    initialTermLength,
                    initialReward,
                    [alice.address, bob.address]
                )
            ).address,
            policyImpersonator
        )

        await ecoX.mint(trustedNodes.address, 1000)
        // ecoX = await(
        //     await 
        //         smock.mock('ECOx')
        //     ).deploy(
        //         fake__Policy.address,
        //         await alice.getAddress(),
        //         await alice.getAddress(),
        //         await alice.getAddress(), // the eco address, but doesnt matter
        //         await alice.getAddress()
        //     )
    })

    describe('constructor', async () => {
        it('works', async () => {
            expect(await trustedNodes.policy()).to.eq(policy.address)
            expect(await trustedNodes.trusteeGovernanceRole()).to.eq(currencyGovernance.address)
            expect(await trustedNodes.EcoXAddress()).to.eq(ecoX.address)
            expect(await trustedNodes.termLength()).to.eq(3600*24)
            expect(await trustedNodes.voteReward()).to.eq(initialReward)

            expect(await trustedNodes.numTrustees()).to.eq(2)
            expect(await trustedNodes.trustees(0)).to.eq(alice.address)
            expect(await trustedNodes.trustees(1)).to.eq(bob.address)
            expect(await trustedNodes.trusteeNumbers(alice.address)).to.eq(1)
            expect(await trustedNodes.trusteeNumbers(bob.address)).to.eq(2)
        })
    })
    describe('permissions', async () => {
        it("doesn't allow non-policy address to trust, distrust, change the trusteeGovernance role, or sweep funds", async () => {
            await expect(
                trustedNodes.connect(alice).trust(charlie.address)
            ).to.be.revertedWith("Only the policy contract may call this method")
            await expect(
                trustedNodes.connect(alice).distrust(bob.address)
            ).to.be.revertedWith("Only the policy contract may call this method")
            await expect(
                trustedNodes.connect(alice).updateTrusteeGovernanceRole(constants.AddressZero)
            ).to.be.revertedWith("Only the policy contract may call this method")
            await expect(
                trustedNodes.connect(alice).sweep(alice.address)
            ).to.be.revertedWith("Only the policy contract may call this method")
        })
        it("doesn't allow non-trusteeGovernanceRole address to record a vote", async () => {
            await expect(
                trustedNodes.connect(alice).recordVote(alice.address)
            ).to.be.revertedWith("only the trusteeGovernanceRole holder may call this method")
        })
    })

    describe('trust', async () => {
        it('trusts address successfully', async () => {
            expect(await trustedNodes.numTrustees()).to.eq(2)
            await expect(
                trustedNodes.connect(policyImpersonator).trust(charlie.address)
            ).to.emit(trustedNodes, 'TrustedNodeAddition')
            .withArgs(charlie.address)
            expect(await trustedNodes.numTrustees()).to.eq(3)
            expect(await trustedNodes.trustees(2)).to.eq(charlie.address)
            expect(await trustedNodes.trusteeNumbers(charlie.address)).to.eq(3)
        })
        it('doesnt allow trusting already trusted addresses', async () => {
            await expect(
                trustedNodes.connect(policyImpersonator).trust(alice.address)
            ).to.be.revertedWith("Node already trusted")
        })
    })

    describe('distrust', async () => {
        it('distrusts address successfully', async () => {
            expect(await trustedNodes.numTrustees()).to.eq(2)
            expect(await trustedNodes.trustees(0)).to.eq(alice.address)
            expect(await trustedNodes.trustees(1)).to.eq(bob.address)

            await expect(
                trustedNodes.connect(policyImpersonator).distrust(alice.address)
            ).to.emit(trustedNodes, 'TrustedNodeRemoval')
            .withArgs(alice.address)
            
            expect(await trustedNodes.numTrustees()).to.eq(1)
            expect(await trustedNodes.trustees(0)).to.eq(bob.address)
            expect(await trustedNodes.trusteeNumbers(bob.address)).to.eq(1)
        })
        it('doesnt allow distrusting already not trusted addresses', async () => {
            await expect(
                trustedNodes.connect(policyImpersonator).distrust(charlie.address)
            ).to.be.revertedWith("Node already not trusted")
        })
    })

    describe('isTrusted', async () => {
        it('works', async () => {
            expect(await trustedNodes.isTrusted(alice.address)).to.be.true
            expect(await trustedNodes.isTrusted(charlie.address)).to.be.false
        })
    })

    describe('updateTrusteeGovernanceRole', async ()=> {
        it('works', async () => {
            expect(await trustedNodes.trusteeGovernanceRole()).to.eq(currencyGovernance.address)
            await expect(
                await trustedNodes.connect(policyImpersonator).updateTrusteeGovernanceRole(dave.address)
            ).to.emit(trustedNodes, "TrusteeGovernanceRoleChanged")
            .withArgs(dave.address)
            expect(await trustedNodes.trusteeGovernanceRole()).to.eq(dave.address)
        })
    })

    describe('recordVote', async () => {
        it('works', async () => {
            expect(await trustedNodes.votingRecord(alice.address)).to.eq(0)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            expect(await trustedNodes.votingRecord(alice.address)).to.eq(1)
        })
    })
    
    describe('currentlyWithdrawable', async () => {
        it('displays the correct amount when voting record is limiting factor', async () => {
            trustedNodes.connect(alice)
            expect(await trustedNodes.currentlyWithdrawable()).to.eq(0)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)// voted twice
            expect(await trustedNodes.votingRecord(alice.address)).to.eq(2)
            // console.log((await trustedNodes.termEnd()).toNumber())
            await time.increaseTo((await trustedNodes.termEnd()).toNumber() + 4*(await trustedNodes.generationTime()))// at this time you'd be able to withdraw 4 rewards
            expect(await trustedNodes.connect(alice).currentlyWithdrawable()).to.eq(2*initialReward)
        })
        it('displays the correct amount when time of withdrawal is limiting factor', async () => {
            trustedNodes.connect(alice)
            expect(await trustedNodes.currentlyWithdrawable()).to.eq(0)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)// voted twice
            expect(await trustedNodes.votingRecord(alice.address)).to.eq(2)
            // console.log((await trustedNodes.termEnd()).toNumber())
            await time.increaseTo((await trustedNodes.termEnd()).toNumber() + 1*(await trustedNodes.generationTime()))// at this time you'd be able to withdraw 4 rewards
            expect(await trustedNodes.connect(alice).currentlyWithdrawable()).to.eq(1*initialReward)
        })
    })

    describe('fullyVested', async() => {
        it('works', async() => {
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)// voted twice
            const data = await trustedNodes.connect(alice.address).fullyVested()
            expect(data[0]).to.eq(2*initialReward)
            expect(data[1]).to.eq((await trustedNodes.termEnd()).toNumber() + 2*(await trustedNodes.generationTime()))
        })
    })

    describe('withdraw', async() => {
        it('reverts when withdrawing 0', async () => {
            await expect (
                trustedNodes.connect(alice).withdraw()
            ).to.be.revertedWith('You have not vested any tokens')
        })
        it('allows correct withdrawal in simple case', async () => {
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await time.increaseTo((await trustedNodes.termEnd()).toNumber() + 1*(await trustedNodes.generationTime()))// at this time you'd be able to withdraw 4 rewards
            
            await expect (
                trustedNodes.connect(alice).withdraw()
            ).to.emit(trustedNodes, 'VotingRewardRedemption')
            .withArgs(alice.address, initialReward)
            expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
        })
        it('allows correct withdrawal when voting record is limiting factor', async () => {
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await time.increaseTo((await trustedNodes.termEnd()).toNumber() + 5*(await trustedNodes.generationTime()))

            await trustedNodes.connect(alice).withdraw()
            expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
        })
        it('allows correct withdrawal when withdrawal time is limiting factor', async () => {
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await time.increaseTo((await trustedNodes.termEnd()).toNumber() + 1*(await trustedNodes.generationTime()))
            
            await trustedNodes.connect(alice).withdraw()
            expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
        })
        it('withdrawing immediately again does not bypass withdrawal time restrictions', async () => {
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await trustedNodes.connect(currencyGovernanceImpersonator).recordVote(alice.address)
            await time.increaseTo((await trustedNodes.termEnd()).toNumber() + 1*(await trustedNodes.generationTime()))
           
            await trustedNodes.connect(alice).withdraw()
            expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
            // another one
            await expect(
                trustedNodes.connect(alice).withdraw()
            ).to.be.revertedWith('You have not vested any tokens')
        })
    })
    describe('sweep', async () => {
        it('works', async () => {
            expect(await ecoX.balanceOf(alice.address)).to.eq(0)
            await trustedNodes.connect(policyImpersonator).sweep(alice.address)
            expect(await ecoX.balanceOf(alice.address)).to.eq(1000)
        })
    })
    


})