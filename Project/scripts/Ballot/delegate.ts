import { Contract, ethers } from "ethers";
import "dotenv/config";
import BallotArtifact from "../../artifacts/contracts/Ballot.sol/Ballot.json";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

async function main() {
  // Wallet selection
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);

  // Set up provider and signer
  const provider = ethers.providers.getDefaultProvider("ropsten", {
    alchemy: process.env.ALCHEMY_KEY,
  });
  const signer = wallet.connect(provider);

  // Check for wallet balance from provider
  const balance = Number(ethers.utils.formatEther(await signer.getBalance()));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }

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
