import { parseAbi } from "viem";
import { appNetwork } from "../config/network";

export const REGISTER_WITH_FEE_CHAIN_ID = appNetwork.chain.id;

export const REGISTER_WITH_FEE_ADDRESS = appNetwork.contracts.registerWithFee;

export const REGISTRAR_CONTROLLER_ADDRESS = appNetwork.contracts.registrarController;

export const REGISTER_WITH_FEE_ABI = parseAbi([
  "function registrar() view returns (address)",
  "function feeRecipient() view returns (address)",
  "function feeBps() view returns (uint96)",
  "function computeFee(uint256 registrarValue) view returns (uint256)",
  "function registerSimpleWithFee(string name, address owner, uint256 duration, uint256 registrarValue) payable",
  "function registerWithFee((string name,address owner,uint256 duration,address resolver,bytes[] data,bool reverseRecord) req, uint256 registrarValue) payable",
]);

export const REGISTRAR_CONTROLLER_ABI = parseAbi([
  "function available(string name) view returns (bool)",
  "function rentPrice(string name, uint256 duration) view returns (uint256)",
]);

export const SECONDS_PER_YEAR = 31_536_000n;
export const BPS_DENOMINATOR = 10_000n;
export const REGISTER_WITH_FEE_BPS = 10n;

export function calculateTotalWithFee(
  registrarValue: bigint,
  feeBps: bigint = REGISTER_WITH_FEE_BPS
): { total: bigint; fee: bigint } {
  if (registrarValue <= 0n) {
    return { total: 0n, fee: 0n };
  }
  if (feeBps < 0n || feeBps > BPS_DENOMINATOR) {
    throw new Error("Invalid fee basis points");
  }

  const fee = (registrarValue * feeBps) / BPS_DENOMINATOR;
  const total = registrarValue + fee;

  return { total, fee };
}
