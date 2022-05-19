/* eslint-disable node/no-missing-import */
import { Contract, ethers } from "ethers";
import BallotArtifact from "../../artifacts/contracts/Ballot.sol/Ballot.json";
import { Ballot } from "../../typechain";
import { SignerProviderSetup } from "../utils/Signer";

async function main() {
  const { signer }: { signer: ethers.Signer } = await SignerProviderSetup();

  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const ballotAddress = process.argv[2];
  if (process.argv.length < 4) throw new Error("Voter address missing");
  const voterAddress = process.argv[3];
  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );

  const ballotContract: Ballot = new Contract(
    ballotAddress,
    BallotArtifact.abi,
    signer
  ) as Ballot;

  const chairpersonAddress = await ballotContract.chairperson();
  const signerAddress = await signer.getAddress();
  if (chairpersonAddress !== signerAddress)
    throw new Error("Caller is not the chairperson for this contract");

  console.log(`Giving right to vote to ${voterAddress}`);
  const tx = await ballotContract.giveRightToVote(voterAddress);
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
