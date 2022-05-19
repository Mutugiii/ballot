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

  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    BallotArtifact.abi,
    signer
  ) as Ballot;

  const proposals = await ballotContract.getProposals();
  proposals.forEach((proposal) => {
    console.log(`Proposal ${ethers.utils.parseBytes32String(proposal.name)}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
