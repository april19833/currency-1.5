import hre from 'hardhat'
import { Contract, ContractFactory, Signer } from 'ethers'
import { ForwardProxy__factory } from '../typechain-types'

/**
 * Deploy a contract with the given factory from a certain address
 * Will be deployed by the given deployer address with the given params
 */
export async function deploy<F extends ContractFactory>(
  from: Signer,
  FactoryType: { new (from: Signer): F },
  params: any[] = [],
  verify: boolean = false,
): Promise<Contract> {
  const factory = new FactoryType(from)
  const contract = await factory.deploy(...params)
  if (verify) {
    await contract.deployed()
    await hre.run('verify:verify', {
        address: contract.address,
        constructorArguments: params,
    })
  }

  return contract
}

/**
 * Deploy a proxied contract with the given factory from a certain address
 * Will be deployed with the given params
 */
export async function deployProxy<F extends ContractFactory>(
  from: Signer,
  FactoryType: { new (from: Signer): F },
  params: any[] = [],
  verify: boolean = false,
): Promise<Contract> {
  const factory = new FactoryType(from)
  const base = await factory.deploy(...params)
  await base.deployed()
  const proxy = await new ForwardProxy__factory(from).deploy(base.address)

  if (verify) {
    await hre.run('verify:verify', {
        address: base.address,
        constructorArguments: params,
    })
  }

  return factory.attach(proxy.address)
}
