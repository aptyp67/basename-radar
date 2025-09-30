import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { UserRejectedRequestError, type Address } from "viem";
import {
  REGISTER_WITH_FEE_ABI,
  REGISTER_WITH_FEE_ADDRESS,
  REGISTER_WITH_FEE_BPS,
  REGISTER_WITH_FEE_CHAIN_ID,
  REGISTRAR_CONTROLLER_ABI,
  REGISTRAR_CONTROLLER_ADDRESS,
  SECONDS_PER_YEAR,
  calculateTotalWithFee,
} from "../services/registerWithFee.contract";

interface RegisterParams {
  name: string;
  years: number;
}

export interface RegisterResult {
  hash: `0x${string}`;
  registrarValue: bigint;
  fee: bigint;
  total: bigint;
  durationSeconds: bigint;
}

function assertAddress(value: Address | undefined): asserts value is Address {
  if (!value) {
    throw new Error("Wallet not connected");
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function useRegisterWithFee() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: REGISTER_WITH_FEE_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const [isRegistering, setIsRegistering] = useState(false);

  const register = useCallback(
    async ({ name, years }: RegisterParams): Promise<RegisterResult> => {
      assertAddress(address);
      if (!publicClient) {
        throw new Error("RPC client unavailable");
      }
      if (!Number.isFinite(years) || years < 1 || years > 5) {
        throw new Error("Registration duration must be between 1 and 5 years");
      }

      const normalized = normalizeName(name);
      if (!normalized) {
        throw new Error("Name is required");
      }

      const durationSeconds = BigInt(years) * SECONDS_PER_YEAR;
      if (durationSeconds <= 0n) {
        throw new Error("Invalid duration");
      }

      const registrarAddress = REGISTRAR_CONTROLLER_ADDRESS;
      const wrapperAddress = REGISTER_WITH_FEE_ADDRESS;

      setIsRegistering(true);
      try {
        const isAvailable = await publicClient.readContract({
          address: registrarAddress,
          abi: REGISTRAR_CONTROLLER_ABI,
          functionName: "available",
          args: [normalized],
        });

        if (!isAvailable) {
          throw new Error("Name is no longer available");
        }

        const registrarValue = await publicClient.readContract({
          address: registrarAddress,
          abi: REGISTRAR_CONTROLLER_ABI,
          functionName: "rentPrice",
          args: [normalized, durationSeconds],
        });

        if (typeof registrarValue !== "bigint" || registrarValue <= 0n) {
          throw new Error("Could not resolve rent price");
        }

        const { total, fee } = calculateTotalWithFee(registrarValue, REGISTER_WITH_FEE_BPS);

        const computedFee = await publicClient.readContract({
          address: wrapperAddress,
          abi: REGISTER_WITH_FEE_ABI,
          functionName: "computeFee",
          args: [total],
        });

        if (computedFee !== fee) {
          throw new Error("Fee calculation mismatch, please retry");
        }

        const hash = await writeContractAsync({
          address: wrapperAddress,
          abi: REGISTER_WITH_FEE_ABI,
          functionName: "registerSimpleWithFee",
          args: [normalized, address, durationSeconds, registrarValue],
          chainId: REGISTER_WITH_FEE_CHAIN_ID,
          account: address,
          value: total,
        });

        await publicClient.waitForTransactionReceipt({ hash });

        return {
          hash,
          registrarValue,
          fee,
          total,
          durationSeconds,
        };
      } catch (error) {
        if (error instanceof UserRejectedRequestError) {
          throw new Error("Transaction rejected in wallet");
        }
        throw error instanceof Error
          ? error
          : new Error("Registration failed, please try again");
      } finally {
        setIsRegistering(false);
      }
    },
    [address, publicClient, writeContractAsync]
  );

  return {
    register,
    isRegistering,
    address,
  };
}
