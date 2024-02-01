/* eslint-disable camelcase */
import {ethers} from 'hardhat';
import { BigNumber } from 'ethers';
import {expect, assert} from 'chai';
import{
    smock,
    FakeContract,
    MockContract,
    MockContractFactory,
} from '@defi-wonderland/smock';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {impersonateAccount, setBalance, time} from '@nomicfoundation/hardhat-network-helpers';
import { ERRORS } from '../../utils/errors';
import { deploy } from '../../../deploy/utils';
import { FixedLockupL2 } from '../../../typechain-types/contracts/governance/levers/FixedLockupL2.sol/FixedLockupL2';
import { FixedLockupL2__factory } from '../../../typechain-types/factories/contracts/governance/levers/FixedLockupL2.sol/FixedLockupL2__factory';
import { DummyMessenger} from '../../../typechain-types/contracts/test/DummyL2Messenger.sol/DummyMessenger';
import { DummyMessenger__factory } from '../../../typechain-types/factories/contracts/test/DummyL2Messenger.sol/DummyMessenger__factory';
import { DummyL2Eco } from '../../../typechain-types';
import { DummyL2Eco__factory } from '../../../typechain-types';
import { DummyL2Bridge} from '../../../typechain-types';
import { DummyL2Bridge__factory} from '../../../typechain-types';

describe('FixedLockupL2', () => {
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let l1Contract: SignerWithAddress;
    let deployer: SignerWithAddress;
    let messengerImpersonator: SignerWithAddress;

    let eco: MockContract<DummyL2Eco>;
    let messenger: MockContract<DummyMessenger>;
    let lockups: FixedLockupL2;
    let l2Bridge: MockContract<DummyL2Bridge>;

    let rate: any;
    let window: any;
    let length: any;
    let maxRewards: any;
    let lockupAmount: any;

    const BASE = ethers.utils.parseEther("1.0");
    const dayLength = 24 * 60 * 60;

    //set defaults of 10% rate, 14 day window, 30 day length, 10 eco max rewards
    const testRate = ethers.utils.parseEther("0.1");
    const testWindow = 14 * dayLength;
    const testLength = 30 * dayLength;
    const testMaxRewards = ethers.utils.parseEther("10.0");

    const aliceMint=ethers.utils.parseEther("50.0");
    const bobMint=ethers.utils.parseEther("100.0");
    const charlieMint=ethers.utils.parseEther("300.0");
    

    before(async () => {
        [alice, bob, charlie, l1Contract, deployer, messengerImpersonator] = await ethers.getSigners();
    });

    beforeEach(async () => {
        //deploy mock messenger
        const smockFactory: MockContractFactory<DummyMessenger__factory> = await smock.mock('DummyMessenger');
        messenger = await smockFactory.deploy(l1Contract.address);
        messengerImpersonator = await ethers.getSigner(messenger.address);
        await setBalance(messenger.address, ethers.utils.parseEther("1000000.0"))


        //deploy mock eco
        const ecoFactory: MockContractFactory<DummyL2Eco__factory> = await smock.mock('DummyL2Eco');
        eco = await ecoFactory.deploy('Eco', 'ECO', BASE);

        //deploy fake l2bridge
        const l2BridgeFactory: MockContractFactory<DummyL2Bridge__factory> = await smock.mock('DummyL2Bridge');
        l2Bridge = await l2BridgeFactory.deploy(eco.address);

        //deploy lockups
        lockups = await deploy(deployer, FixedLockupL2__factory, [eco.address, messenger.address, l1Contract.address, l2Bridge.address]) as FixedLockupL2;

        //mint initial tokens
        await eco.connect(deployer).mint(alice.address, aliceMint);
        await eco.connect(deployer).mint(bob.address, bobMint);
        await eco.connect(deployer).mint(charlie.address, charlieMint);
    });

    describe('constructor', () => {
        it('should initialize variables', async () => {
            expect(await lockups.eco()).to.equal(eco.address);
            expect(await lockups.messenger()).to.equal(messenger.address);
            expect(await lockups.l1Contract()).to.equal(l1Contract.address);
        });
    });

    describe('l1 contract restriction works' , () => {
        it('doesnt let non-messenger contracts create a lockup', async () => {
            await expect(lockups.connect(alice).newLockup(testRate, testWindow, testLength, testMaxRewards)).to.be.revertedWith("OVM_XCHAIN: messenger contract unauthenticated");
        });
        it ('doesnt let the messenger contract create a lockup when the l1 messenger is wrong', async () => {
            await messenger.changeSender(alice.address);
            await expect(lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards)).to.be.revertedWith("OVM_XCHAIN: wrong sender of cross-domain message");
        });
        it ('lets the messenger create a lockup when the L1 address is correct', async () => {
            await expect(lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards)).to.emit(lockups, 'NewLockup');
        });
    });

    describe('newLockups', () => {
        it('creates a new lockup', async () => {
            await expect(lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards))
            .to.emit(lockups, 'NewLockup').withArgs(0, testRate, testWindow, testLength, testMaxRewards);
            const blockTime= await time.latest();
            const lockup = await lockups.lockups(0);
            const ecoMultiplier = await eco.linearInflationMultiplier();

            expect(lockup.rate).to.equal(testRate);
            expect(lockup.cutoff).to.equal(testWindow+blockTime);
            expect(lockup.duration).to.equal(testLength);
            expect(lockup.rewardsRemaining).to.equal(testMaxRewards.mul(ecoMultiplier));
        });
    });

    describe('deposit', () => {
        let aliceDeposit=aliceMint.div(2);
        let bobDeposit=bobMint.div(2);
        let charlieDeposit=charlieMint.div(2);

        beforeEach(async () => {
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            
            await time.increase(testWindow/2);

            await eco.connect(alice).approve(lockups.address, aliceDeposit);
            await eco.connect(bob).approve(lockups.address, bobDeposit);
            await eco.connect(charlie).approve(lockups.address, charlieDeposit);

            await eco.connect(deployer).mint(lockups.address, testMaxRewards);
        });

        it('does single deposit properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const net = aliceDeposit.add(testMaxRewards);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const blockTime= await time.latest();
            const lockup = await lockups.lockups(0);
            const deposit = await lockups.getDeposit(0, alice.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(net);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit));
            expect(deposit.gons).to.equal(aliceGons);
            expect(deposit.end).to.equal(lockup.duration.add(blockTime));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
        });

        it ('does multiple deposits from same person properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const net = aliceDeposit.mul(2).add(testMaxRewards);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);
            const aliceBlockTime1= await time.latest();

            await eco.connect(alice).approve(lockups.address, aliceDeposit);
            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);
            const aliceBlockTime2= await time.latest();

            const lockup = await lockups.lockups(0);
            const aliceLockupDeposit1 = await lockups.getDeposit(0, alice.address, 0);
            const aliceLockupDeposit2 = await lockups.getDeposit(0, alice.address, 1);

            expect(await eco.balanceOf(lockups.address)).to.equal(net);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit.mul(2)));
            expect(aliceLockupDeposit1.gons).to.equal(aliceGons);
            expect(aliceLockupDeposit1.end).to.equal(lockup.duration.add(aliceBlockTime1));
            expect(aliceLockupDeposit2.gons).to.equal(aliceGons);
            expect(aliceLockupDeposit2.end).to.equal(lockup.duration.add(aliceBlockTime2));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest.mul(2)));
        });

        it ('does multiple deposits from same person, two different lockup properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const net = aliceDeposit.mul(2).add(testMaxRewards.mul(2));
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const blockTime= await time.latest();
            const lockup = await lockups.lockups(0);
            const deposit = await lockups.getDeposit(0, alice.address, 0);

            await eco.connect(alice).approve(lockups.address, aliceDeposit);
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            await expect(lockups.connect(alice).deposit(1, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(1, alice.address, aliceGons);
            const blockTime2= await time.latest();
            const lockup2 = await lockups.lockups(1);
            const deposit2 = await lockups.getDeposit(1, alice.address, 0);
            await eco.connect(deployer).mint(lockups.address, testMaxRewards);

            expect(await eco.balanceOf(lockups.address)).to.equal(net);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit.mul(2)));
            expect(deposit.gons).to.equal(aliceGons);
            expect(deposit.end).to.equal(lockup.duration.add(blockTime));
            expect(deposit2.gons).to.equal(aliceGons);
            expect(deposit2.end).to.equal(lockup2.duration.add(blockTime2));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
            expect(lockup2.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
        });

        it ('does multiple deposits from different persons properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const bobGons = bobDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const bobInterest = bobGons.mul(testRate).div(BASE);
            const net = aliceDeposit.add(bobDeposit).add(testMaxRewards);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);
            const aliceBlockTime= await time.latest();

            await expect(lockups.connect(bob).deposit(0, bobDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, bob.address, bobGons);
            const bobBlockTime= await time.latest();

            const blockTime= await time.latest();
            const lockup = await lockups.lockups(0);
            const aliceLockupDeposit = await lockups.getDeposit(0, alice.address, 0);
            const bobLockupDeposit = await lockups.getDeposit(0, bob.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(net);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit));
            expect(await eco.balanceOf(bob.address)).to.equal(bobMint.sub(bobDeposit));
            expect(aliceLockupDeposit.gons).to.equal(aliceGons);
            expect(aliceLockupDeposit.end).to.equal(lockup.duration.add(aliceBlockTime));
            expect(bobLockupDeposit.gons).to.equal(bobGons);
            expect(bobLockupDeposit.end).to.equal(lockup.duration.add(bobBlockTime));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest).sub(bobInterest));
        });

        it ('does multiple deposits from different persons, two different lockup properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const bobGons = bobDeposit.mul(ecoMultiplier);
            const bobInterest = bobGons.mul(testRate).div(BASE);
            const net = aliceDeposit.add(testMaxRewards.mul(2)).add(bobDeposit);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const blockTime= await time.latest();
            const lockup = await lockups.lockups(0);
            const deposit = await lockups.getDeposit(0, alice.address, 0);

            await eco.connect(bob).approve(lockups.address, bobDeposit);
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            await expect(lockups.connect(bob).deposit(1, bobDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(1, bob.address, bobGons);
            const blockTime2= await time.latest();
            const lockup2 = await lockups.lockups(1);
            const deposit2 = await lockups.getDeposit(1, bob.address, 0);
            await eco.connect(deployer).mint(lockups.address, testMaxRewards);

            expect(await eco.balanceOf(lockups.address)).to.equal(net);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit));
            expect(await eco.balanceOf(bob.address)).to.equal(bobMint.sub(bobDeposit));
            expect(deposit.gons).to.equal(aliceGons);
            expect(deposit.end).to.equal(lockup.duration.add(blockTime));
            expect(deposit2.gons).to.equal(bobGons);
            expect(deposit2.end).to.equal(lockup2.duration.add(blockTime2));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
            expect(lockup2.rewardsRemaining).to.equal(rewardGons.sub(bobInterest));
        });

        //no deposits past max rewards 
        it ('doesnt let you deposit past max rewards', async () => {
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, aliceDeposit.mul(testRate).div(BASE));
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const net = aliceDeposit.add(testMaxRewards);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(1, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(1, alice.address, aliceGons);

            const blockTime= await time.latest();
            const lockup = await lockups.lockups(1);
            const deposit = await lockups.getDeposit(1, alice.address, 0);

            console.log(lockup.rewardsRemaining.toString());
            await eco.approve(lockups.address, 1);
            await expect(lockups.connect(alice).deposit(1, 1,{ gasLimit: 10000000 })).to.be.revertedWith("Not enough rewards remaining");
        });

        //no deposits after window
        it ('doesnt let you deposit after window', async () => {
            const lockup = await lockups.lockups(0);
            await time.setNextBlockTimestamp(lockup.cutoff.add(1));
            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 })).to.be.revertedWith("Lockup period has ended");
        });

        //depositFor
        it ('does depositFor properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const net = aliceDeposit.add(testMaxRewards);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(bob).depositFor(0, alice.address, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const blockTime= await time.latest();
            const lockup = await lockups.lockups(0);
            const deposit = await lockups.getDeposit(0, alice.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(net);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit));
            expect(deposit.gons).to.equal(aliceGons);
            expect(deposit.end).to.equal(lockup.duration.add(blockTime));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
        });
    });

    describe('withdraw', () => {
        let aliceDeposit=aliceMint.div(2);
        let bobDeposit=bobMint.div(2);
        let charlieDeposit=charlieMint.div(2);

        beforeEach(async () => {
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            
            await time.increase(testWindow/2);

            await eco.connect(alice).approve(lockups.address, aliceDeposit);
            await eco.connect(bob).approve(lockups.address, bobDeposit);
            await eco.connect(charlie).approve(lockups.address, charlieDeposit);

            await eco.connect(deployer).mint(lockups.address, testMaxRewards);
        });

        //standard individual deposit
        it ('does withdraw properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);
            const deposit = await lockups.getDeposit(0, alice.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceDeposit));
            await time.setNextBlockTimestamp(deposit.end);

            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.add(aliceInterest));
            const lockup = await lockups.lockups(0);

            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.add(aliceRewards));
            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.sub(aliceRewards));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));

            try {
                await lockups.getDeposit(0, alice.address, 0);
                assert.fail();
            } catch (error: any) {
                //not sure how to specify its an ethers call error
                assert(error.message);
            }
        });

        it ('does two withdrawals properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            const aliceDeposit2=aliceDeposit.div(2);
            const aliceGons2 = aliceDeposit2.mul(ecoMultiplier);
            const aliceInterest2 = aliceGons2.mul(testRate).div(BASE);
            const aliceRewards2 = aliceInterest2.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            await eco.approve(lockups.address, aliceDeposit2);
            await expect(lockups.connect(alice).deposit(0, aliceDeposit2,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons2);

            const deposit1 = await lockups.getDeposit(0, alice.address, 0);
            const deposit2 = await lockups.getDeposit(0, alice.address, 1);
            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceDeposit).add(aliceDeposit2));

            await time.setNextBlockTimestamp(deposit2.end);

            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.add(aliceInterest));

            //ensure second deposit shifted to first
            const shiftedDeposit= await lockups.getDeposit(0, alice.address, 0);
            expect(shiftedDeposit.gons).to.equal(aliceGons2);
            expect(shiftedDeposit.end).to.equal(deposit2.end);

            //ensure first deposit removed
            try {
                await lockups.getDeposit(0, alice.address, 1);
                assert.fail();
            } catch (error: any) {
                //not sure how to specify its an ethers call error
                assert(error.message);
            }

            //second withdrawal
            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons2.add(aliceInterest2));

            const lockup1 = await lockups.lockups(0);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.add(aliceRewards).add(aliceRewards2));
            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.sub(aliceRewards).sub(aliceRewards2));

            //ensure second deposit removed
            try {
                await lockups.getDeposit(0, alice.address, 0);
                assert.fail();
            } catch (error: any) {
                //not sure how to specify its an ethers call error
                assert(error.message);
            }

            //ensure lockup rewards remaining is correct
            expect(lockup1.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest).sub(aliceInterest2));

        });

        it ('does a withdrawal from two different people properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            const bobGons = bobDeposit.mul(ecoMultiplier);
            const bobInterest = bobGons.mul(testRate).div(BASE);
            const bobRewards = bobInterest.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            await expect(lockups.connect(bob).deposit(0, bobDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, bob.address, bobGons);

            const deposit1 = await lockups.getDeposit(0, alice.address, 0);
            const deposit2 = await lockups.getDeposit(0, bob.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceDeposit).add(bobDeposit));

            await time.setNextBlockTimestamp(deposit2.end);

            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.add(aliceInterest));

            await expect(lockups.connect(bob).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, bob.address, 0, bobGons.add(bobInterest));

            const lockup = await lockups.lockups(0);

            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.add(aliceRewards));
            expect(await eco.balanceOf(bob.address)).to.equal(bobMint.add(bobRewards));
            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.sub(aliceRewards).sub(bobRewards));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest).sub(bobInterest));
        });
        
        //multiple individual deposits, two different lockups
        it ('does two withdrawals from two different lockups properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const rewardGons = testMaxRewards.mul(ecoMultiplier);
            
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            const aliceDeposit2=aliceDeposit.div(2);
            const aliceGons2 = aliceDeposit2.mul(ecoMultiplier);
            const aliceInterest2 = aliceGons2.mul(testRate).div(BASE);
            const aliceRewards2 = aliceInterest2.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            await eco.approve(lockups.address, aliceDeposit2);
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            await expect(lockups.connect(alice).deposit(1, aliceDeposit2,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(1, alice.address, aliceGons2);

            const deposit1 = await lockups.getDeposit(0, alice.address, 0);
            const deposit2 = await lockups.getDeposit(1, alice.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceDeposit).add(aliceDeposit2));

            await time.setNextBlockTimestamp(deposit2.end);

            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.add(aliceInterest));

            await expect(lockups.connect(alice).withdraw(1, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(1, alice.address, 0, aliceGons2.add(aliceInterest2));

            const lockup = await lockups.lockups(0);
            const lockup2 = await lockups.lockups(1);

            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.add(aliceRewards).add(aliceRewards2));
            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.sub(aliceRewards).sub(aliceRewards2));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
            expect(lockup2.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest2));
        });

        it ('does a withdrawal from two different people, two different lockups properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            const bobGons = bobDeposit.mul(ecoMultiplier);
            const bobInterest = bobGons.mul(testRate).div(BASE);
            const bobRewards = bobInterest.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);

            await expect(lockups.connect(bob).deposit(1, bobDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(1, bob.address, bobGons);

            const deposit1 = await lockups.getDeposit(0, alice.address, 0);
            const deposit2 = await lockups.getDeposit(1, bob.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceDeposit).add(bobDeposit));

            await time.setNextBlockTimestamp(deposit2.end);

            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.add(aliceInterest));

            await expect(lockups.connect(bob).withdraw(1, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(1, bob.address, 0, bobGons.add(bobInterest));

            const lockup = await lockups.lockups(0);
            const lockup2 = await lockups.lockups(1);

            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.add(aliceRewards));
            expect(await eco.balanceOf(bob.address)).to.equal(bobMint.add(bobRewards));
            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.sub(aliceRewards).sub(bobRewards));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
            expect(lockup2.rewardsRemaining).to.equal(rewardGons.sub(bobInterest));
        });

        it('does early withdrawal penalty properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);
            const deposit = await lockups.getDeposit(0, alice.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceDeposit));
            await time.setNextBlockTimestamp(deposit.end.sub(1));

            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.sub(aliceInterest));
            const lockup = await lockups.lockups(0);

            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceRewards));
            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceRewards));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.add(aliceInterest));

            try {
                await lockups.getDeposit(0, alice.address, 0);
                assert.fail();
            } catch (error: any) {
                //not sure how to specify its an ethers call error
                assert(error.message);
            }
        });

        //withdrawFor early does not work
        it('prevents withdraw early for another person', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);
            const deposit = await lockups.getDeposit(0, alice.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.add(aliceDeposit));
            await time.setNextBlockTimestamp(deposit.end.sub(1));

            await expect(lockups.connect(bob).withdrawFor(0, alice.address, 0,{ gasLimit: 10000000 })).to.be.revertedWith("Cannot withdraw on behalf before lockup period has ended");
        });
    });

    describe('get functions', () => {
        let aliceDeposit=aliceMint.div(2);
        let bobDeposit=bobMint.div(2);
        let charlieDeposit=charlieMint.div(2);

        beforeEach(async () => {
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            
            await time.increase(testWindow/2);

            await eco.connect(alice).approve(lockups.address, aliceDeposit);
            await eco.connect(bob).approve(lockups.address, bobDeposit);
            await eco.connect(charlie).approve(lockups.address, charlieDeposit);

            await eco.connect(deployer).mint(lockups.address, testMaxRewards);
        });

        it('getDeposit', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const blockTime= await time.latest();

            const deposit = await lockups.getDeposit(0, alice.address, 0);


            expect(deposit.gons).to.equal(aliceGons);
            expect(deposit.end).to.equal(blockTime+testLength);
        });

        it('getDeposits', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const blockTime= await time.latest();

            await eco.approve(lockups.address, aliceDeposit.div(2));
            await expect(lockups.connect(alice).deposit(0, aliceDeposit.div(2),{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons.div(2));

            const blockTime2= await time.latest();

            const deposit1 = await lockups.getDeposit(0, alice.address, 0);
            const deposit2 = await lockups.getDeposit(0, alice.address, 1);


            expect(deposit1.gons).to.equal(aliceGons);
            expect(deposit1.end).to.equal(blockTime+testLength);
            expect(deposit2.gons).to.equal(aliceGons.div(2));
            expect(deposit2.end).to.equal(blockTime2+testLength);
        });

        it('getLockup', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            const blockTime= await time.latest();
                        await expect(lockups.connect(alice).deposit(0, aliceDeposit.div(2),{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons.div(2));
            const lockup = await lockups.getLockup(1);

            expect(lockup[0]).to.equal(testRate);
            expect(lockup[1]).to.equal(testWindow+blockTime);
            expect(lockup[2]).to.equal(testLength);
            expect(lockup[3]).to.equal(testMaxRewards.mul(ecoMultiplier));
        });
    });

    describe('sweep', () => {
        let aliceDeposit=aliceMint.div(2);
        let bobDeposit=bobMint.div(2);
        let charlieDeposit=charlieMint.div(2);

        beforeEach(async () => {
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            
            await time.increase(testWindow/2);

            await eco.connect(alice).approve(lockups.address, aliceDeposit);
            await eco.connect(bob).approve(lockups.address, bobDeposit);
            await eco.connect(charlie).approve(lockups.address, charlieDeposit);

            await eco.connect(deployer).mint(lockups.address, testMaxRewards);
        });

        it ('does not allow sweep before window', async () => {
            await expect(lockups.connect(deployer).sweep(0, 150000)).to.be.revertedWith("Lockup period has not ended");
        });

        it ('sweep functions properly', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const aliceRewards = aliceInterest.div(ecoMultiplier);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);
            const aliceNet = aliceDeposit.add(aliceRewards);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const lockup = await lockups.lockups(0);

            await time.setNextBlockTimestamp(lockup.cutoff.add(1));
            await expect(lockups.connect(deployer).sweep(0, 150000)).to.emit(lockups, 'LockupSweep').withArgs(0, rewardGons.sub(aliceInterest));

            expect(await eco.balanceOf(lockups.address)).to.equal(aliceNet);
            expect(await eco.balanceOf(l2Bridge.address)).to.equal(testMaxRewards.sub(aliceRewards));
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit));
        });

        it ('sweep functions properly with multiple lockups', async () => {

            const ecoMultiplier = await eco.linearInflationMultiplier();
            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const aliceRewards = aliceInterest.div(ecoMultiplier);
            const rewardGons = testMaxRewards.mul(ecoMultiplier);
            const aliceNet = aliceDeposit.add(aliceRewards);

            const aliceDeposit2=aliceDeposit.div(2);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            const lockup = await lockups.lockups(0);

            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            //check to make sure I do this everywhere, I think I forgot in previous tests
            await eco.connect(deployer).mint(lockups.address, testMaxRewards);
            await eco.approve(lockups.address, aliceDeposit2);
            await expect(lockups.connect(alice).deposit(1, aliceDeposit2,{ gasLimit: 10000000 }))

            await time.setNextBlockTimestamp(lockup.cutoff.add(1));
            await expect(lockups.connect(deployer).sweep(0, 150000)).to.emit(lockups, 'LockupSweep').withArgs(0, rewardGons.sub(aliceInterest));
            console.log(await eco.balanceOf(lockups.address));
            expect(await eco.balanceOf(lockups.address)).to.equal(aliceNet.add(testMaxRewards).add(aliceDeposit2));
            expect(await eco.balanceOf(l2Bridge.address)).to.equal(testMaxRewards.sub(aliceRewards));
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit).sub(aliceDeposit2));
        
        });
    });

    describe('rebases', () => {
        let aliceDeposit=aliceMint.div(2);
        let bobDeposit=bobMint.div(2);

        beforeEach(async () => {
            await lockups.connect(messengerImpersonator).newLockup(testRate, testWindow, testLength, testMaxRewards);
            
            await time.increase(testWindow/2);

            await eco.connect(alice).approve(lockups.address, aliceDeposit);
            await eco.connect(bob).approve(lockups.address, bobDeposit);

            await eco.connect(deployer).mint(lockups.address, testMaxRewards);
        });

        it ('deposits and withdrawals work with negative rebases', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            await eco.rebase(BASE.mul(2));
            const ecoMultiplier2 = await eco.linearInflationMultiplier();

            bobDeposit=bobDeposit.div(2);

            const bobGons = bobDeposit.mul(ecoMultiplier2);
            const bobInterest = bobGons.mul(testRate).div(BASE);
            const bobRewards = bobInterest.div(ecoMultiplier2);

            await expect(lockups.connect(bob).deposit(0, bobDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, bob.address, bobGons);

            const lockup = await lockups.lockups(0);
            const aliceLockupDeposit = await lockups.getDeposit(0, alice.address, 0);
            const bobLockupDeposit = await lockups.getDeposit(0, bob.address, 0);

            expect(await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.div(2).add(aliceDeposit.div(2)).add(bobDeposit));
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit).div(2));
            expect(await eco.balanceOf(bob.address)).to.equal(bobMint.div(2).sub(bobDeposit));
            expect(aliceLockupDeposit.gons).to.equal(aliceGons);
            expect(bobLockupDeposit.gons).to.equal(bobGons);

            await time.setNextBlockTimestamp(aliceLockupDeposit.end);
            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.add(aliceInterest));

            const postRebaseAndWithdrawalLockupBalance = testMaxRewards.div(2).add(bobDeposit).sub(aliceInterest.div(ecoMultiplier2))
            expect(await eco.balanceOf(lockups.address)).to.equal(postRebaseAndWithdrawalLockupBalance);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit).div(2).add(aliceInterest.div(ecoMultiplier2)).add(aliceGons.div(ecoMultiplier2)));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest).sub(bobInterest));

            await eco.rebase(BASE.mul(4));
            const ecoMultiplier3 = await eco.linearInflationMultiplier();
            await time.setNextBlockTimestamp(bobLockupDeposit.end);
            await expect(lockups.connect(bob).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, bob.address, 0, bobGons.add(bobInterest));

            expect(await eco.balanceOf(lockups.address)).to.equal(postRebaseAndWithdrawalLockupBalance.div(2).sub(bobInterest.div(ecoMultiplier3).add(bobGons.div(ecoMultiplier3))));
            expect(await eco.balanceOf(bob.address)).to.equal(bobMint.div(2).sub(bobDeposit).div(2).add(bobInterest.div(ecoMultiplier3)).add(bobGons.div(ecoMultiplier3)));
        });

        it ('deposits and withdrawals work with positive rebases', async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            await eco.rebase(BASE.div(2));
            const ecoMultiplier2 = await eco.linearInflationMultiplier();

            bobDeposit=bobDeposit.mul(2);

            const bobGons = bobDeposit.mul(ecoMultiplier2);
            const bobInterest = bobGons.mul(testRate).div(BASE);
            const bobRewards = bobInterest.div(ecoMultiplier2);

            await eco.connect(bob).approve(lockups.address, bobDeposit);
            await expect(lockups.connect(bob).deposit(0, bobDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, bob.address, bobGons);

            const lockup = await lockups.lockups(0);
            const aliceLockupDeposit = await lockups.getDeposit(0, alice.address, 0);
            const bobLockupDeposit = await lockups.getDeposit(0, bob.address, 0);

            expect (await eco.balanceOf(lockups.address)).to.equal(testMaxRewards.mul(2).add(aliceDeposit.mul(2)).add(bobDeposit));
            expect (await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit).mul(2));
            expect (await eco.balanceOf(bob.address)).to.equal(bobMint.mul(2).sub(bobDeposit));
            expect (aliceLockupDeposit.gons).to.equal(aliceGons);
            expect (bobLockupDeposit.gons).to.equal(bobGons);

            await time.setNextBlockTimestamp(aliceLockupDeposit.end);
            await expect(lockups.connect(alice).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, alice.address, 0, aliceGons.add(aliceInterest));

            const postRebaseAndWithdrawalLockupBalance = testMaxRewards.mul(2).add(bobDeposit).sub(aliceInterest.div(ecoMultiplier2))
            expect(await eco.balanceOf(lockups.address)).to.equal(postRebaseAndWithdrawalLockupBalance);
            expect(await eco.balanceOf(alice.address)).to.equal(aliceMint.sub(aliceDeposit).mul(2).add(aliceInterest.div(ecoMultiplier2)).add(aliceGons.div(ecoMultiplier2)));
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest).sub(bobInterest));

            await eco.rebase(BASE.div(4));
            const ecoMultiplier3 = await eco.linearInflationMultiplier();
            await time.setNextBlockTimestamp(bobLockupDeposit.end);
            await expect(lockups.connect(bob).withdraw(0, 0,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupWithdraw').withArgs(0, bob.address, 0, bobGons.add(bobInterest));

            expect(await eco.balanceOf(lockups.address)).to.equal(postRebaseAndWithdrawalLockupBalance.mul(2).sub(bobInterest.div(ecoMultiplier3).add(bobGons.div(ecoMultiplier3))));
            expect(await eco.balanceOf(bob.address)).to.equal(bobMint.mul(2).sub(bobDeposit).mul(2).add(bobInterest.div(ecoMultiplier3)).add(bobGons.div(ecoMultiplier3)));

        });
        
        it("rebasing works with sweep", async () => {
            const ecoMultiplier = await eco.linearInflationMultiplier();
            const rewardGons = testMaxRewards.mul(ecoMultiplier);

            const aliceGons = aliceDeposit.mul(ecoMultiplier);
            const aliceInterest = aliceGons.mul(testRate).div(BASE);
            const aliceRewards = aliceInterest.div(ecoMultiplier);

            await expect(lockups.connect(alice).deposit(0, aliceDeposit,{ gasLimit: 10000000 }))
            .to.emit(lockups, 'LockupDeposit').withArgs(0, alice.address, aliceGons);

            await eco.rebase(BASE.mul(2));


            const aliceLockupDeposit = await lockups.getDeposit(0, alice.address, 0);

            await time.setNextBlockTimestamp(testWindow +(await time.latest()));

            const lockup = await lockups.lockups(0);
            expect(lockup.rewardsRemaining).to.equal(rewardGons.sub(aliceInterest));
            await expect(lockups.connect(deployer).sweep(0, 150000)).to.emit(lockups, 'LockupSweep').withArgs(0, rewardGons.sub(aliceInterest));
            expect(await eco.balanceOf(lockups.address)).to.equal(aliceDeposit.add(aliceRewards).div(2));
        });

    });

})