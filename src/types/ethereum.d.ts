interface EIP1193RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | Record<string, unknown>;
}

type EIP1193Event = "connect" | "disconnect" | "chainChanged" | "accountsChanged" | string;

type EIP1193EventHandler = (...args: unknown[]) => void;

export interface EthereumProvider {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request<T>(args: EIP1193RequestArguments): Promise<T>;
  on?(event: EIP1193Event, handler: EIP1193EventHandler): void;
  removeListener?(event: EIP1193Event, handler: EIP1193EventHandler): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
