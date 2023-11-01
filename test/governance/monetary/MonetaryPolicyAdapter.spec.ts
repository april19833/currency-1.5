import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract } from '@defi-wonderland/smock'
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
import { deploy } from '../../../deploy/utils'

const executeSig = ethers.utils
  .solidityKeccak256(['string'], ['execute(uint256,address,bytes32)'])
  .slice(0, 10)
const alwaysPassSig = ethers.utils
  .solidityKeccak256(['string'], ['alwaysPass(bytes32)'])
  .slice(0, 10)
const datalessPasserSig = ethers.utils
  .solidityKeccak256(['string'], ['datalessPasser()'])
  .slice(0, 10)
const alwaysRevertSig = ethers.utils
  .solidityKeccak256(['string'], ['alwaysRevert(bytes32)'])
  .slice(0, 10)
const veryExpensiveSig = ethers.utils
  .solidityKeccak256(['string'], ['veryExpensiveFunction()'])
  .slice(0, 10)

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

describe('MonetaryPolicyAdapter', () => {
  let cgImpersonater: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  let alice: SignerWithAddress
  before(async () => {
    ;[cgImpersonater, policyImpersonator, alice] = await ethers.getSigners()
  })

  let Enacter: MonetaryPolicyAdapter
  let DummyLeverFactory: DummyLever__factory
  let DummyLever1: DummyLever
  let DummyLever2: DummyLever
  let DummyLever3: DummyLever
  let Fake__CurrencyGovernance: FakeContract<CurrencyGovernance>
  let Fake__Policy: FakeContract<Policy>

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonator.getAddress() } // This allows us to make calls from the address
    )

    Fake__CurrencyGovernance = await smock.fake<CurrencyGovernance>(
      'CurrencyGovernance',
      { address: await cgImpersonater.getAddress() } // This allows us to make calls from the address
    )

    Enacter = await deploy(policyImpersonator, MonetaryPolicyAdapter__factory, [Fake__Policy.address, Fake__CurrencyGovernance.address]) as MonetaryPolicyAdapter

    DummyLeverFactory = new DummyLever__factory()
    DummyLever1 = await DummyLeverFactory.connect(policyImpersonator).deploy()
    DummyLever2 = await DummyLeverFactory.connect(policyImpersonator).deploy()
    DummyLever3 = await DummyLeverFactory.connect(policyImpersonator).deploy()
  })

  describe('roles', () => {
    describe('onlyCurrencyGovernance', () => {
      it('currency governance can call onlyCurrencyGovernance functions', async () => {
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          [DummyLever1.address],
          [datalessPasserSig],
          ['0x']
        )
      })

      it('non-cg cannot call onlyCurrencyGovernance functions', async () => {
        await expect(
          Enacter.enact(
            proposalId,
            [DummyLever1.address],
            [datalessPasserSig],
            ['0x']
          )
        ).to.be.revertedWith(
          ERRORS.MonetaryPolicyAdapter.CURRENCYGOVERNANCE_ONLY
        )
      })
    })

    describe('currencyGovernance role', () => {
      it('the policy contract can call the setter', async () => {
        await Enacter.connect(policyImpersonator).setCurrencyGovernance(
          alice.address
        )
      })

      it('emits an event', async () => {
        expect(
          await Enacter.connect(policyImpersonator).setCurrencyGovernance(
            alice.address
          )
        )
          .to.emit(Enacter, 'NewCurrencyGovernance')
          .withArgs(Fake__CurrencyGovernance.address, alice.address)
      })

      it('non-policy cannot call setter', async () => {
        await expect(
          Enacter.connect(alice).setCurrencyGovernance(alice.address)
        ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      })

      it('cannot set to zero', async () => {
        await expect(
          Enacter.connect(policyImpersonator).setCurrencyGovernance(
            constants.AddressZero
          )
        ).to.be.revertedWith(
          ERRORS.MonetaryPolicyAdapter.REQUIRE_NON_ZERO_CURRENCYGOVERNANCE
        )
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
      const compiledSig =
        DummyLeverFactory.interface.getSighash('datalessPasser')
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
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(3)
      })

      it('can enact a policy that passes empty calldata', async () => {
        const targets = [DummyLever1.address]
        const signatures = [datalessPasserSig]
        const calldatas = ['0x']
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(5)
      })

      it('can enact a policy that passes empty signature', async () => {
        const targets = [DummyLever1.address]
        const signatures = ['0x00000000'] // bytes4(0) signifies the fallback function
        const calldatas = [PLACEHOLDER_BYTES32_3]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(11)
      })

      it('can enact the most complicated example calldata', async () => {
        const targets = [DummyLever1.address]
        const signatures = [executeSig]
        const calldatas = [
          ethers.utils.defaultAbiCoder.encode(
            ['uint256', 'address', 'bytes32'],
            [PLACEHOLDER_UINT256_1, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_1]
          ),
        ]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(2)
      })

      it('can enact a policy that targets multiple levers', async () => {
        const targets = [
          DummyLever1.address,
          DummyLever2.address,
          DummyLever3.address,
        ]
        const signatures = [executeSig, alwaysPassSig, executeSig]
        const calldata1 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [PLACEHOLDER_UINT256_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1]
        )
        const calldata2 = PLACEHOLDER_BYTES32_3
        const calldata3 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [PLACEHOLDER_UINT256_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2]
        )
        const calldatas = [calldata1, calldata2, calldata3]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count1 = await DummyLever1.executeMarker()
        expect(count1).to.eq(2)
        const count2 = await DummyLever2.executeMarker()
        expect(count2).to.eq(3)
        const count3 = await DummyLever3.executeMarker()
        expect(count3).to.eq(2)
      })

      it('can enact a policy that targets the same lever multiple times', async () => {
        const targets = [
          DummyLever1.address,
          DummyLever1.address,
          DummyLever3.address,
        ]
        const signatures = [executeSig, alwaysPassSig, executeSig]
        const calldata1 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [PLACEHOLDER_UINT256_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1]
        )
        const calldata2 = PLACEHOLDER_BYTES32_3
        const calldata3 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [PLACEHOLDER_UINT256_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2]
        )
        const calldatas = [calldata1, calldata2, calldata3]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count1 = await DummyLever1.executeMarker()
        expect(count1).to.eq(5)
        const count2 = await DummyLever2.executeMarker()
        expect(count2).to.eq(0)
        const count3 = await DummyLever3.executeMarker()
        expect(count3).to.eq(2)
      })

      it('emits the EnactedMonetaryPolicy event', async () => {
        const targets = [
          DummyLever1.address,
          DummyLever2.address,
          DummyLever3.address,
        ]
        const signatures = [executeSig, alwaysPassSig, executeSig]
        const calldata1 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [PLACEHOLDER_UINT256_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1]
        )
        const calldata2 = PLACEHOLDER_BYTES32_3
        const calldata3 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [PLACEHOLDER_UINT256_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2]
        )
        const calldatas = [calldata1, calldata2, calldata3]
        await expect(
          Enacter.connect(cgImpersonater).enact(
            proposalId,
            targets,
            signatures,
            calldatas
          )
        )
          .to.emit(Enacter, 'EnactedMonetaryPolicy')
          .withArgs(proposalId, Fake__CurrencyGovernance.address, [true, true])
      })
    })

    // despite including reverts, these are still normal behavior tests as the revert safety is part of the normal functionality
    describe('reverts', () => {
      it('can enact a policy that reverts', async () => {
        const targets = [DummyLever1.address]
        const signatures = [alwaysRevertSig]
        const calldatas = [PLACEHOLDER_BYTES32_2]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(0)
      })

      it('can enact a policy that reverts due to input validation', async () => {
        const targets = [DummyLever1.address]
        const signatures = [executeSig]
        // the uint256 input is too high and causes a revert
        const calldatas = [
          ethers.utils.defaultAbiCoder.encode(
            ['uint256', 'address', 'bytes32'],
            [REVERTING_UINT156_1, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2]
          ),
        ]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(0)
      })

      it('can enact a policy that reverts due to bad input data', async () => {
        const targets = [DummyLever1.address]
        const signatures = [executeSig]
        // calldata is garbage and doesn't match the function
        const calldatas = [PLACEHOLDER_BYTES32_1]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(0)
      })

      it('can enact a policy that reverts due to mistyped data', async () => {
        const targets = [DummyLever1.address]
        const signatures = [executeSig]
        // calldata is mistyped
        const calldatas = [
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32'],
            [
              PLACEHOLDER_BYTES32_1,
              PLACEHOLDER_BYTES32_2,
              PLACEHOLDER_BYTES32_3,
            ]
          ),
        ]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count = await DummyLever1.executeMarker()
        expect(count).to.eq(0)
      })

      it("reverts don't block other txs in the policy", async () => {
        const targets = [
          DummyLever1.address,
          DummyLever2.address,
          DummyLever3.address,
        ]
        const signatures = [executeSig, alwaysPassSig, executeSig]
        const calldata1 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [REVERTING_UINT156_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1]
        )
        const calldata2 = PLACEHOLDER_BYTES32_3
        const calldata3 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [REVERTING_UINT156_3, PLACEHOLDER_ADDRESS1, PLACEHOLDER_BYTES32_2]
        )
        const calldatas = [calldata1, calldata2, calldata3]
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas
        )

        const count1 = await DummyLever1.executeMarker()
        expect(count1).to.eq(0)
        const count2 = await DummyLever2.executeMarker()
        expect(count2).to.eq(3)
        const count3 = await DummyLever3.executeMarker()
        expect(count3).to.eq(0)
      })

      it('reverts are reflected in the event', async () => {
        const targets = [
          DummyLever1.address,
          DummyLever2.address,
          DummyLever3.address,
        ]
        const signatures = [executeSig, alwaysPassSig, alwaysRevertSig]
        const calldata1 = ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'address', 'bytes32'],
          [REVERTING_UINT156_2, PLACEHOLDER_ADDRESS2, PLACEHOLDER_BYTES32_1]
        )
        const calldata2 = PLACEHOLDER_BYTES32_2
        const calldata3 = PLACEHOLDER_BYTES32_3
        const calldatas = [calldata1, calldata2, calldata3]
        await expect(
          Enacter.connect(cgImpersonater).enact(
            proposalId,
            targets,
            signatures,
            calldatas
          )
        )
          .to.emit(Enacter, 'EnactedMonetaryPolicy')
          .withArgs(proposalId, Fake__CurrencyGovernance.address, [
            false,
            true,
            false,
          ])
      })
    })

    describe('exploits', () => {
      it('revert due to out of gas reverts whole transaction', async () => {
        const targets = [DummyLever1.address, DummyLever2.address]
        const signatures = [alwaysPassSig, alwaysPassSig]
        const calldata1 = PLACEHOLDER_BYTES32_1
        const calldata2 = PLACEHOLDER_BYTES32_3
        const calldatas = [calldata1, calldata2]
        const necessaryGas1 = await Enacter.connect(
          cgImpersonater
        ).estimateGas.enact(proposalId, targets, signatures, calldatas)
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas,
          { gasLimit: necessaryGas1 }
        )
        const count1 = await DummyLever1.executeMarker()
        expect(count1).to.eq(3)
        const count2 = await DummyLever2.executeMarker()
        expect(count2).to.eq(3)

        // gas costs go down significantly for second call because count vars are already initialized
        const necessaryGas2 = await Enacter.connect(
          cgImpersonater
        ).estimateGas.enact(proposalId, targets, signatures, calldatas)
        // expect(...).to.be.revered is non-functional with lower level revert reasons like out of gas
        try {
          await Enacter.connect(cgImpersonater).enact(
            proposalId,
            targets,
            signatures,
            calldatas,
            { gasLimit: necessaryGas2.sub(1) }
          )
        } catch (error) {
          expect(String(error).split('\n')[0]).to.eql(
            'TransactionExecutionError: Transaction ran out of gas'
          )
        }
        // both low level actions are reverted
        const count3 = await DummyLever1.executeMarker()
        expect(count3).to.eq(3)
        const count4 = await DummyLever2.executeMarker()
        expect(count4).to.eq(3)
      })

      it('revert due to out of gas still safe at 350k+ gas', async () => {
        const targets = [DummyLever1.address, DummyLever2.address]
        const signatures = [alwaysPassSig, veryExpensiveSig]
        const calldata1 = PLACEHOLDER_BYTES32_1
        const calldata2 = '0x'
        const calldatas = [calldata1, calldata2]
        const necessaryGas1 = await Enacter.connect(
          cgImpersonater
        ).estimateGas.enact(proposalId, targets, signatures, calldatas)
        // console.log(necessaryGas1)
        await Enacter.connect(cgImpersonater).enact(
          proposalId,
          targets,
          signatures,
          calldatas,
          { gasLimit: necessaryGas1 }
        )
        const count1 = await DummyLever1.executeMarker()
        expect(count1).to.eq(3)
        const count2 = await DummyLever2.executeMarker()
        expect(count2).to.eq(750)

        // gas costs go down significantly for second call because count vars are already initialized
        const necessaryGas2 = await Enacter.connect(
          cgImpersonater
        ).estimateGas.enact(proposalId, targets, signatures, calldatas)
        // console.log(necessaryGas2)

        // gas estimation is less reliable at this level of expense so if we undercut by less, it's actually just enough gas for everything to succeed
        try {
          await Enacter.connect(cgImpersonater).enact(
            proposalId,
            targets,
            signatures,
            calldatas,
            { gasLimit: necessaryGas2.sub(1000) }
          )
        } catch (error) {
          // expect(...).to.be.revered is non-functional with lower level revert reasons like out of gas
          expect(String(error).split('\n')[0]).to.eql(
            'TransactionExecutionError: Transaction ran out of gas'
          )
        }
        // both low level actions are reverted
        const count3 = await DummyLever1.executeMarker()
        expect(count3).to.eq(3)
        const count4 = await DummyLever2.executeMarker()
        expect(count4).to.eq(750)
      })
    })
  })
})
