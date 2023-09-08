import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../../utils/errors'
import {
  CurrencyGovernance,
  Policy,
  MonetaryPolicyAdapter,
  MonetaryPolicyAdapter__factory,
  DummyLever,
  DummyLever__factory,
} from '../../../typechain-types'

const executeSig = ethers.utils.solidityKeccak256(['string'], ['execute(uint256,address,bytes32)']).slice(0,10)
const alwaysPassSig = ethers.utils.solidityKeccak256(['string'], ['alwaysPass(bytes32)']).slice(0,10)
const datalessPasserSig = ethers.utils.solidityKeccak256(['string'], ['datalessPasser()']).slice(0,10)
const alwaysRevertSig = ethers.utils.solidityKeccak256(['string'], ['alwaysRevert(bytes32)']).slice(0,10)

// proposalId doesn't matter but we want to check that it's passed through correctly
const proposalId = ethers.utils.hexlify(ethers.utils.randomBytes(32))
const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const PLACEHOLDER_ADDRESS2 = '0x2222222222222222222222222222222222222222'
const PLACEHOLDER_BYTES32_1 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
const PLACEHOLDER_BYTES32_2 = '0x' + '00'.repeat(32)
const PLACEHOLDER_BYTES32_3 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
const PLACEHOLDER_UINT256_1 = 999
const PLACEHOLDER_UINT256_2 = 1
const PLACEHOLDER_UINT256_3 = 0
const REVERTING_UINT156_1 = 1000
const REVERTING_UINT156_2 = 1001
const REVERTING_UINT156_3 = 1001932810298400

describe.only('MonetaryPolicyAdapter', () => {
    let cgImpersonater: SignerWithAddress
    let policyImpersonater: SignerWithAddress
    let alice: SignerWithAddress
    before(async () => {
      ;[cgImpersonater, policyImpersonater, alice] =
        await ethers.getSigners()
    })
  
    let Enacter: MonetaryPolicyAdapter
    let DummyLeverFactory: DummyLever__factory
    let DummyLever1: DummyLever
    let DummyLever2: DummyLever
    let DummyLever3: DummyLever
    let Fake__CurrencyGovernance: FakeContract<CurrencyGovernance>
    let Fake__Policy: FakeContract<Policy>
  
    beforeEach(async () => {
        // Get a new mock L1 messenger
        Fake__Policy = await smock.fake<Policy>(
            'Policy',
            { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
        )

        Fake__CurrencyGovernance = await smock.fake<CurrencyGovernance>(
            'CurrencyGovernance',
            { address: await cgImpersonater.getAddress() } // This allows us to make calls from the address
        )
    
        Enacter = await new MonetaryPolicyAdapter__factory()
            .connect(policyImpersonater)
            .deploy(Fake__Policy.address, Fake__CurrencyGovernance.address)

        DummyLeverFactory = new DummyLever__factory()
        DummyLever1 = await DummyLeverFactory.connect(policyImpersonater).deploy()
        DummyLever2 = await DummyLeverFactory.connect(policyImpersonater).deploy()
        DummyLever3 = await DummyLeverFactory.connect(policyImpersonater).deploy()
    })

    describe.only('roles', () => {
        describe('CG role', () => {
            it('currency governance can call onlyCurrencyGovernance functions', async () => {
                await Enacter.connect(cgImpersonater).enact(
                    proposalId,
                    [DummyLever1.address],
                    [datalessPasserSig],
                    ['0x']
                )
            })
        
            it('non-trustees cannot call onlyTrusted functions', async () => {
              await expect(
                Enacter.enact(
                    proposalId,
                    [DummyLever1.address],
                    [datalessPasserSig],
                    ['0x']
                )
              ).to.be.revertedWith(ERRORS.MonetaryPolicyAdapter.CURRENCYGOVERNANCE_ONLY)
            })
        })

        describe('CG role setter', () => {
            it('the policy contract can call the setter', async () => {
                await Enacter.connect(policyImpersonater).setCurrencyGovernance(alice.address)
            })
        
            it('non-policy cannot call setter', async () => {
              await expect(
                Enacter.connect(alice).setCurrencyGovernance(alice.address)
              ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
            })
        
            it('cannot set to zero', async () => {
              await expect(
                Enacter.connect(policyImpersonater).setCurrencyGovernance(constants.AddressZero)
              ).to.be.revertedWith(ERRORS.MonetaryPolicyAdapter.REQUIRE_NON_ZERO_CURRENCYGOVERNANCE)
            })
        })
    })

    describe('dummy lever signatures', () => {
        it('check execute signature', async () => {
            const compiledSig = DummyLeverFactory.interface.getSighash('execute')
            const contractSig = await DummyLever1.executeFunctionSignature()
            expect(executeSig).to.eql(compiledSig).to.eql(contractSig)
        })

        it('check alwaysPass signature', async () => {
            const compiledSig = DummyLeverFactory.interface.getSighash('alwaysPass')
            const contractSig = await DummyLever1.alwaysPassFunctionSignature()
            expect(alwaysPassSig).to.eql(compiledSig).to.eql(contractSig)
        })

        it('check datalessPasser signature', async () => {
            const compiledSig = DummyLeverFactory.interface.getSighash('datalessPasser')
            const contractSig = await DummyLever1.datalessPasserFunctionSignature()
            expect(datalessPasserSig).to.eql(compiledSig).to.eql(contractSig)
        })

        it('check alwaysRevert signature', async () => {
            const compiledSig = DummyLeverFactory.interface.getSighash('alwaysRevert')
            const contractSig = await DummyLever1.alwaysRevertFunctionSignature()
            expect(alwaysRevertSig).to.eql(compiledSig).to.eql(contractSig)
        })
    })

    describe('enact', () => {
        describe('happy path', () => {
            it('can enact the simplest policy', async () => {
                const targets = [DummyLever1.address]
                const signatures = [alwaysPassSig]
                const calldatas = [PLACEHOLDER_BYTES32_1]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(3)).to.be.true
            })

            it('can enact a policy that passes empty calldata', async () => {
                const targets = [DummyLever1.address]
                const signatures = [datalessPasserSig]
                const calldatas = ['0x']
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(5)).to.be.true
            })

            it('can enact a policy that passes empty signature', async () => {
                const targets = [DummyLever1.address]
                const signatures = ['0x00000000'] // bytes4(0) signifies the fallback function
                const calldatas = [PLACEHOLDER_BYTES32_3]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(11)).to.be.true
            })

            it('can enact the most complicated example calldata', async () => {
                const targets = [DummyLever1.address]
                const signatures = [executeSig]
                const calldatas = [ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256_1, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_1])]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(2)).to.be.true
            })

            it('can enact a policy that targets multiple levers', async () => {
                const targets = [DummyLever1.address, DummyLever2.address, DummyLever3.address]
                const signatures = [executeSig, alwaysPassSig, executeSig]
                const calldata1 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1])
                const calldata2 = PLACEHOLDER_BYTES32_3
                const calldata3 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2])
                const calldatas = [calldata1, calldata2, calldata3]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count1 = await DummyLever1.executeMarker()
                expect(count1.eq(2)).to.be.true
                const count2 = await DummyLever2.executeMarker()
                expect(count2.eq(3)).to.be.true
                const count3 = await DummyLever3.executeMarker()
                expect(count3.eq(2)).to.be.true
            })

            it('can enact a policy that targets the same lever multiple times', async () => {
                const targets = [DummyLever1.address, DummyLever1.address, DummyLever3.address]
                const signatures = [executeSig, alwaysPassSig, executeSig]
                const calldata1 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1])
                const calldata2 = PLACEHOLDER_BYTES32_3
                const calldata3 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2])
                const calldatas = [calldata1, calldata2, calldata3]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count1 = await DummyLever1.executeMarker()
                expect(count1.eq(5)).to.be.true
                const count2 = await DummyLever2.executeMarker()
                expect(count2.eq(0)).to.be.true
                const count3 = await DummyLever3.executeMarker()
                expect(count3.eq(2)).to.be.true
            })

            it('emits the EnactedMonetaryPolicy event', async () => {
                const targets = [DummyLever1.address, DummyLever2.address, DummyLever3.address]
                const signatures = [executeSig, alwaysPassSig, executeSig]
                const calldata1 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1])
                const calldata2 = PLACEHOLDER_BYTES32_3
                const calldata3 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2])
                const calldatas = [calldata1, calldata2, calldata3]
                await expect(Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas))
                    .to.emit(Enacter, 'EnactedMonetaryPolicy')
                    .withArgs(proposalId, Fake__CurrencyGovernance.address, [true, true, true])
                

            })
        })

        // despite including reverts, these are still normal behavior tests as the revert safety is part of the normal functionality
        describe('reverts', () => {
            it('can enact a policy that reverts', async () => {
                const targets = [DummyLever1.address]
                const signatures = [alwaysRevertSig]
                const calldatas = [PLACEHOLDER_BYTES32_2]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(0)).to.be.true
            })

            it('can enact a policy that reverts due to input validation', async () => {
                const targets = [DummyLever1.address]
                const signatures = [executeSig]
                // the uint256 input is too high and causes a revert
                const calldatas = [ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [REVERTING_UINT156_1, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2])]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(0)).to.be.true
            })

            it('can enact a policy that reverts due to bad input data', async () => {
                const targets = [DummyLever1.address]
                const signatures = [executeSig]
                // calldata is garbage and doesn't match the function
                const calldatas = [PLACEHOLDER_BYTES32_1]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(0)).to.be.true
            })

            it('can enact a policy that reverts due to mistyped data', async () => {
                const targets = [DummyLever1.address]
                const signatures = [executeSig]
                // calldata is mistyped
                const calldatas = [ethers.utils.defaultAbiCoder.encode(['bytes32','bytes32','bytes32'], [PLACEHOLDER_BYTES32_1, PLACEHOLDER_BYTES32_2, PLACEHOLDER_BYTES32_3])]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count = await DummyLever1.executeMarker()
                expect(count.eq(0)).to.be.true
            })

            it('reverts don\'t block other txs in the policy', async () => {
                const targets = [DummyLever1.address, DummyLever2.address, DummyLever3.address]
                const signatures = [executeSig, alwaysPassSig, executeSig]
                const calldata1 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [REVERTING_UINT156_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1])
                const calldata2 = PLACEHOLDER_BYTES32_3
                const calldata3 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [REVERTING_UINT156_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2])
                const calldatas = [calldata1, calldata2, calldata3]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                
                const count1 = await DummyLever1.executeMarker()
                expect(count1.eq(0)).to.be.true
                const count2 = await DummyLever2.executeMarker()
                expect(count2.eq(3)).to.be.true
                const count3 = await DummyLever3.executeMarker()
                expect(count3.eq(0)).to.be.true
            })

            it('reverts are reflected in the event', async () => {
                const targets = [DummyLever1.address, DummyLever2.address, DummyLever3.address]
                const signatures = [executeSig, alwaysPassSig, alwaysRevertSig]
                const calldata1 = ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [REVERTING_UINT156_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1])
                const calldata2 = PLACEHOLDER_BYTES32_2
                const calldata3 = PLACEHOLDER_BYTES32_3
                const calldatas = [calldata1, calldata2, calldata3]
                await expect(Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas))
                    .to.emit(Enacter, 'EnactedMonetaryPolicy')
                    .withArgs(proposalId, Fake__CurrencyGovernance.address, [false, true, false])
            })
        })

        describe('exploits', () => {
            it('revert due to out of gas reverts whole transaction', async () => {
                const targets = [DummyLever1.address, DummyLever2.address]
                const signatures = [alwaysPassSig, alwaysPassSig]
                const calldata1 = PLACEHOLDER_BYTES32_1
                const calldata2 = PLACEHOLDER_BYTES32_3
                const calldatas = [calldata1, calldata2]
                const necessaryGas1 = await Enacter.connect(cgImpersonater).estimateGas.enact(proposalId, targets, signatures, calldatas)
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas, {gasLimit: necessaryGas1})
                const count1 = await DummyLever1.executeMarker()
                expect(count1.eq(3)).to.be.true
                const count2 = await DummyLever2.executeMarker()
                expect(count2.eq(3)).to.be.true

                // gas costs go down significantly for second call because count vars are already initialized
                const necessaryGas2 = await Enacter.connect(cgImpersonater).estimateGas.enact(proposalId, targets, signatures, calldatas)
                // expect(...).to.be.revered is non-functional with lower level revert reasons like out of gas
                try {
                    await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas, {gasLimit: necessaryGas2.sub(1)})
                } catch (error) {
                    expect(String(error).split('\n')[0]).to.eql('TransactionExecutionError: Transaction ran out of gas')
                }
                // both low level actions are reverted
                const count3 = await DummyLever1.executeMarker()
                expect(count3.eq(3)).to.be.true
                const count4 = await DummyLever2.executeMarker()
                expect(count4.eq(3)).to.be.true                
            }) 
        })
    })
})