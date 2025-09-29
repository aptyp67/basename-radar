import { parseAbi } from "viem";
import { base, baseSepolia } from "viem/chains";

export const REGISTER_WITH_FEE_ADDRESS = {
  [baseSepolia.id]: "0x74B58255491897915f70d058daB756CF2a3fdc04" as const,
} as const satisfies Record<number, `0x${string}`>;

export const REGISTER_WITH_FEE_CHAIN_ID = baseSepolia.id;

export const REGISTRAR_CONTROLLER_ADDRESSES = {
  [base.id]: "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5" as const,
  [baseSepolia.id]: "0x49ae3cc2e3aa768b1e5654f5d3c6002144a59581" as const,
} as const satisfies Record<number, `0x${string}`>;

export const REGISTER_WITH_FEE_ABI = parseAbi([
  "function registrar() view returns (address)",
  "function feeRecipient() view returns (address)",
  "function feeBps() view returns (uint96)",
  "function computeFee(uint256 totalValue) view returns (uint256)",
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
  if (feeBps < 0n || feeBps >= BPS_DENOMINATOR) {
    throw new Error("Invalid fee basis points");
  }

  const denominator = BPS_DENOMINATOR - feeBps;
  let total = (registrarValue * BPS_DENOMINATOR + (denominator - 1n)) / denominator;
  let fee = (total * feeBps) / BPS_DENOMINATOR;
  let forwarded = total - fee;

  while (forwarded > registrarValue) {
    total -= 1n;
    fee = (total * feeBps) / BPS_DENOMINATOR;
    forwarded = total - fee;
  }

  while (forwarded < registrarValue) {
    total += 1n;
    fee = (total * feeBps) / BPS_DENOMINATOR;
    forwarded = total - fee;
  }

  return { total, fee };
}
