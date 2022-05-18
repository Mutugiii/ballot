/* eslint-disable node/no-missing-import */
import { ethers } from "ethers";
import "dotenv/config";
import { EXPOSED_KEY } from "../utils/Key";

export const SignerProviderSetup = async () => {
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

  return { wallet, signer, provider };
};
