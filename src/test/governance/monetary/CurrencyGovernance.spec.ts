/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { Signer, Contract, constants, BigNumber } from 'ethers'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  TEST,
} from '../../utils/constants'
import { ERROR_STRINGS } from '../../utils/errors'