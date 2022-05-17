import { ethers } from "ethers";
import "dotenv/config";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";
import BallotArtifact from "../../artifacts/contracts/Ballot.sol/Ballot.json";

const PROPASALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function main() {
  // Signer and Provider setup
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);

  const provider = ethers.providers.getDefaultProvider("ropsten");
  console.log(`Using address ${wallet.address}`);
  const signer = wallet.connect(provider);

  // Signer interaction
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(` Wallet balance ${balance}`);
  if (balance < 0.01) throw new Error("Not enough eth for deployment");

  // Provider interaction
  const lastBlock = await provider.getBlock("latest");
  console.log(
    ` Connected to the ropsten network at height ${lastBlock.number}`
  );

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
    convertStringArrayToBytes32(PROPASALS)
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
