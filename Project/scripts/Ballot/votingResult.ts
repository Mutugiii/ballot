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
  const provider = ethers.providers.getDefaultProvider("ropsten");
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

  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    BallotArtifact.abi,
    signer
  ) as Ballot;

  const winningName = await ballotContract.winnerName();
  console.log(
    `Winning Proposal Name: ${ethers.utils.parseBytes32String(winningName)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
