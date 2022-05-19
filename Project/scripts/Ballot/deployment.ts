/* eslint-disable node/no-missing-import */
import { ethers } from "ethers";
import { Ballot } from "../../typechain";
import BallotArtifact from "../../artifacts/contracts/Ballot.sol/Ballot.json";
import { SignerProviderSetup } from "../utils/Signer";
import { PROPOSALS } from "../utils/Proposals";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function main() {
  const {
    signer,
    provider,
  }: { signer: ethers.Signer; provider: ethers.providers.BaseProvider } =
    await SignerProviderSetup();

  // Provider interaction
  const lastBlock = await provider.getBlock("latest");
  console.log(`Connected to the ropsten network at height ${lastBlock.number}`);

  // If you wish to pass the proposals as arguments and not in a predefined list
  // console.log("Enter Proposals: ");
  // const proposals = process.argv.slice(2);
  // if (proposals.length < 2) throw new Error("Not enough proposals provided");
  // proposals.forEach((element, index) => {
  //   console.log(`Proposal N. ${index} : ${element}`);
  // });

  // Lead up to Deployment
  const ballotFactory = new ethers.ContractFactory(
    BallotArtifact.abi,
    BallotArtifact.bytecode,
    signer
  );
  console.log("Deploying the contract");
  const ballotContract: Ballot = (await ballotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS)
  )) as Ballot;
  console.log("Awaiting confirmations");
  await ballotContract.deployed();
  console.log("Deployment completed");
  console.log(`Contract deployed at ${ballotContract.address}`);

  // Iterating over the proposals
  // for (let index = 0; index < PROPASALS.length; index++) {
  //   const proposal = await ballotContract.proposals(index);
  //   console.log(
  //     `Proposal at ${index} is named ${ethers.utils.parseBytes32String(
  //       proposal[0]
  //     )}`
  //   );
  // }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
