import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { appNetwork } from "../config/network";

const connectors = [injected({ target: "metaMask" })];

export const wagmiConfig = createConfig({
  chains: [appNetwork.chain],
  connectors,
  transports: {
    [appNetwork.chain.id]: http(appNetwork.rpcUrl),
  },
  ssr: false,
});

export const injectedConnector = connectors[0];
