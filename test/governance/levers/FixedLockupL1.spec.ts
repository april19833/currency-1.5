/* eslint-disable camelcase */
import {ethers} from 'hardhat';
import { BigNumber, Contract } from 'ethers';
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
import { FixedLockupL1 } from '../../../typechain-types';
import { FixedLockupL1__factory } from '../../../typechain-types';
import { DummyL2Eco } from '../../../typechain-types';
import { DummyL2Eco__factory } from '../../../typechain-types';
import { DummyL1Bridge} from '../../../typechain-types';
import { DummyL1Bridge__factory} from '../../../typechain-types';
import * as L1CrossDomainMessenger from '@eth-optimism/contracts/artifacts/contracts/L1/messaging/L1CrossDomainMessenger.sol/L1CrossDomainMessenger.json'

describe('FixedLockupL1', () => {
        let deployer: SignerWithAddress;
        let monetaryPolicyAdapter: SignerWithAddress;
        let user: SignerWithAddress;
        let policy: SignerWithAddress;
        let l2Lever: SignerWithAddress;

        before(async () => {
                [deployer, monetaryPolicyAdapter, user, policy, l2Lever] = await ethers.getSigners();
        });

        let fixedLockupL1: FixedLockupL1;
        let eco: MockContract<DummyL2Eco>;
        let ecoL2: MockContract<DummyL2Eco>;
        let bridge: MockContract<DummyL1Bridge>;
        let Fake__L1CrossDomainMessenger: FakeContract

        const dayLength = 24 * 60 * 60;
        const BASE = ethers.utils.parseEther("1.0");
        const testRate = ethers.utils.parseEther("0.1");
        const testWindow = 14 * dayLength;
        const testLength = 30 * dayLength;
        const testMaxRewards = ethers.utils.parseEther("10.0");

        const FINALIZATION_GAS = 1_200_000

    beforeEach(async () => {
        //new mock L1 messenger
        Fake__L1CrossDomainMessenger = await smock.fake<Contract>(L1CrossDomainMessenger.abi);

        //deploy mock eco
        const ecoFactory: MockContractFactory<DummyL2Eco__factory> = await smock.mock('DummyL2Eco');
        eco = await ecoFactory.deploy('Eco', 'ECO', BASE);

        //deploy mock ecoL2
        const ecoL2Factory: MockContractFactory<DummyL2Eco__factory> = await smock.mock('DummyL2Eco');
        ecoL2 = await ecoL2Factory.deploy('Eco', 'ECO', BASE);

        //deploy fake l1bridge
        const l2BridgeFactory: MockContractFactory<DummyL1Bridge__factory> = await smock.mock('DummyL1Bridge');
        bridge = await l2BridgeFactory.deploy(eco.address);

        //deploy fixedLockupL1

        fixedLockupL1 = await deploy(deployer, FixedLockupL1__factory, 
            [monetaryPolicyAdapter.address, eco.address, ecoL2.address, Fake__L1CrossDomainMessenger.address, policy.address, bridge.address, l2Lever.address]) as FixedLockupL1;

        });

    it('should revert if not called by the monetary policy adapter', async () => {
        await expect(fixedLockupL1.connect(user).newLockup(testRate, testWindow, testLength, testMaxRewards, 500000, 500000)).to.be.revertedWith(ERRORS.Lever.AUTHORIZED_ONLY);
    });

    it('should send a message to the L1 Bridge, L1 Messenger, and deposit tokens', async () => {
        const selector = ethers.utils.id("newLockup(uint256,uint256,uint256,uint256)").slice(0, 10);
        const bytesMessage = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256', 'uint256'], [testRate, testWindow, testLength, testMaxRewards]);
        const data = selector + bytesMessage.slice(2);

        await fixedLockupL1.connect(monetaryPolicyAdapter).newLockup(testRate, testWindow, testLength, testMaxRewards, 500000, 500000);
       
        expect((Fake__L1CrossDomainMessenger.sendMessage.getCall(0).args)).to.deep.equal([l2Lever.address, data, 500000])
        expect((eco.mint.getCall(0).args)).to.deep.equal([fixedLockupL1.address, testMaxRewards])
        expect((eco.approve.getCall(0).args)).to.deep.equal([bridge.address, testMaxRewards])
        expect((bridge.depositERC20To.getCall(0).args))
        .to.deep.equal([eco.address, ecoL2.address, l2Lever.address, testMaxRewards, 500000, "0x"])

        expect(await eco.balanceOf(bridge.address)).to.equal(testMaxRewards);
    });

    it ('burn tokens in address', async () => {
        await eco.mint(fixedLockupL1.address, testMaxRewards);
        await fixedLockupL1.connect(user).burnReserves();
        expect(await eco.balanceOf(fixedLockupL1.address)).to.equal(0);
    });
});