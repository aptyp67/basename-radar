import { parseAbi } from "viem";
import { appNetwork } from "../config/network";

export const REGISTER_WITH_FEE_CHAIN_ID = appNetwork.chain.id;

export const REGISTER_WITH_FEE_ADDRESS = appNetwork.contracts.registerWithFee;

export const REGISTRAR_CONTROLLER_ADDRESS = appNetwork.contracts.registrarController;

export const REGISTER_WITH_FEE_ABI = parseAbi([
  "function registrar() view returns (address)",
  "function feeRecipient() view returns (address)",
  "function feeBps() view returns (uint96)",
  "function computeFee(uint256 price) view returns (uint256)",
  "function registerSimpleWithFee(string name, address owner, uint256 duration) payable",
]);

export const REGISTRAR_CONTROLLER_ABI = parseAbi([
  "function available(string name) view returns (bool)",
  "function registerPrice(string name, uint256 duration) view returns (uint256)",
]);

export const SECONDS_PER_YEAR = 31_557_600n;
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

export type RegisterPriceResult = bigint | { base: bigint; premium: bigint } | readonly [bigint, bigint];

function isTuple(value: RegisterPriceResult): value is readonly [bigint, bigint] {
  return Array.isArray(value);
}

function isStruct(value: RegisterPriceResult): value is { base: bigint; premium: bigint } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toRegistrarValue(result: RegisterPriceResult): bigint {
  if (typeof result === "bigint") {
    return result;
  }

  if (isTuple(result)) {
    const [base, premium] = result;
    return (base ?? 0n) + (premium ?? 0n);
  }

  if (isStruct(result)) {
    return (result.base ?? 0n) + (result.premium ?? 0n);
  }

  throw new Error("Unsupported register price result shape");
}
