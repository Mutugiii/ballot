/* eslint-disable node/no-missing-import */
import { Contract, ethers } from "ethers";
import BallotArtifact from "../../artifacts/contracts/Ballot.sol/Ballot.json";
import { Ballot } from "../../typechain";
import { SignerProviderSetup } from "../utils/Signer";

async function main() {
  const { signer }: { signer: ethers.Signer } = await SignerProviderSetup();

  if (process.argv.length < 3) throw new Error("Ballot Address missing");
  const ballotAddress = process.argv[2];
  console.log(`Ballot Address is ${ballotAddress}`);
  if (process.argv.length < 4) throw new Error("delegateTo Address missing!");
  const delegateTo = process.argv[3];

  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    BallotArtifact.abi,
    signer
  ) as Ballot;

  // For an account to be delegated to it must have weight >= 1
  // Call this script only after giveVotingRights has been called
  // Delegating
  console.log(`Delegating to address ${delegateTo}`);
  const tx = await ballotContract.delegate(delegateTo);
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
