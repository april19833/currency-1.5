import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract, MockContractFactory } from '@defi-wonderland/smock'
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
const PLACEHOLDER_BYTES32 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
const PLACEHOLDER_UINT256 = 999

describe.only('MonetaryPolicyAdapter', () => {
    let alice: SignerWithAddress
    let bob: SignerWithAddress
    let cgImpersonater: SignerWithAddress
    let policyImpersonater: SignerWithAddress
    before(async () => {
      ;[cgImpersonater, policyImpersonater, alice, bob] =
        await ethers.getSigners()
    })
  
    let Enacter: MonetaryPolicyAdapter
    let DummyLeverMockFactory: MockContractFactory<DummyLever__factory>
    let DummyLever1: MockContract<DummyLever>
    let DummyLever2: MockContract<DummyLever>
    let DummyLever3: MockContract<DummyLever>
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

        DummyLeverMockFactory = await smock.mock<DummyLever__factory>('DummyLever')

        DummyLever1 = await DummyLeverMockFactory.deploy()
        DummyLever2 = await DummyLeverMockFactory.deploy()
        DummyLever3 = await DummyLeverMockFactory.deploy()
    })

    // TODO
    describe('roles', () => {})

    describe('dummy lever signatures', () => {
        it('check execute signature', async () => {
            const compiledSig = DummyLeverMockFactory.interface.getSighash('execute')
            const contractSig = await DummyLever1.executeFunctionSignature()
            expect(executeSig).to.eql(compiledSig).to.eql(contractSig)
        })

        it('check alwaysPass signature', async () => {
            const compiledSig = DummyLeverMockFactory.interface.getSighash('alwaysPass')
            const contractSig = await DummyLever1.alwaysPassFunctionSignature()
            expect(alwaysPassSig).to.eql(compiledSig).to.eql(contractSig)
        })

        it('check datalessPasser signature', async () => {
            const compiledSig = DummyLeverMockFactory.interface.getSighash('datalessPasser')
            const contractSig = await DummyLever1.datalessPasserFunctionSignature()
            expect(datalessPasserSig).to.eql(compiledSig).to.eql(contractSig)
        })

        it('check alwaysRevert signature', async () => {
            const compiledSig = DummyLeverMockFactory.interface.getSighash('alwaysRevert')
            const contractSig = await DummyLever1.alwaysRevertFunctionSignature()
            expect(alwaysRevertSig).to.eql(compiledSig).to.eql(contractSig)
        })
    })

    describe('enact', () => {
        

        describe.only('happy path', () => {
            it('can enact the simplest policy', async () => {
                const targets = [DummyLever1.address]
                const signatures = [alwaysPassSig]
                const calldatas = [PLACEHOLDER_BYTES32]
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
                const calldatas = [PLACEHOLDER_BYTES32]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                const count = await DummyLever1.executeMarker()
                expect(count.eq(11)).to.be.true
            })

            it('can enact a policy that reverts', async () => {
                const targets = [DummyLever1.address]
                const signatures = [alwaysRevertSig]
                const calldatas = [PLACEHOLDER_BYTES32]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                const count = await DummyLever1.executeMarker()
                expect(count.eq(0)).to.be.true
            })

            it('can enact the most complicated example calldata', async () => {
                const targets = [DummyLever1.address]
                const signatures = [executeSig]
                const calldatas = [ethers.utils.defaultAbiCoder.encode(['uint256','address','bytes32'], [PLACEHOLDER_UINT256, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32])]
                await Enacter.connect(cgImpersonater).enact(proposalId, targets, signatures, calldatas)
                const count = await DummyLever1.executeMarker()
                expect(count.eq(2)).to.be.true
            })
        })

        describe('reverts', () => {

        })
    })
})