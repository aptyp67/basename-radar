interface OnchainKitConfig {
  projectName: string;
  appUrl: string;
  feeRecipient: string;
}

export function getOnchainKitConfig(): OnchainKitConfig {
  return {
    projectName: "Basename Radar",
    appUrl: import.meta.env.VITE_APP_URL ?? "https://your-domain.xyz",
    feeRecipient: import.meta.env.VITE_FEE_RECIPIENT ?? "0x0000000000000000000000000000000000000000",
  };
}
