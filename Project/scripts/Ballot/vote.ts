/* eslint-disable node/no-missing-import */
import { Contract, ethers } from "ethers";
import BallotArtifact from "../../artifacts/contracts/Ballot.sol/Ballot.json";
import { Ballot } from "../../typechain";
import { SignerProviderSetup } from "../utils/Signer";

async function main() {
  const { signer }: { signer: any } = await SignerProviderSetup();

  if (process.argv.length < 3) throw new Error("Ballot Address missing");
  const ballotAddress = process.argv[2];
  console.log(`Ballot Address is ${ballotAddress}`);
  if (process.argv.length < 4) throw new Error("Proposal Index missing!");
  const proposalIndex = Number(process.argv[3]);
  if (proposalIndex < 0 || proposalIndex > 2) {
    throw new Error("Proposal index must  be between 0-2");
  }

  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    BallotArtifact.abi,
    signer
  ) as Ballot;

  // For an account to vote to it must have weight >= 1
  // Call this script only after giveVotingRights has been called
  // Voting
  // console.log(`Delegating to address ${delegateTo}`);
  // const tx = await ballotContract.delegate(delegateTo);
  const proposal = await ballotContract.proposals(proposalIndex);
  console.log(
    `Voting for proposal ${ethers.utils.parseBytes32String(proposal.name)}`
  );
  const tx = await ballotContract.vote(proposalIndex);
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
