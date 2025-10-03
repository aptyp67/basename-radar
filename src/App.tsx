import clsx from "clsx";
import { useEffect } from "react";
import { Outlet, Route, Routes, Link } from "react-router-dom";
import { HomePage } from "./app/home/HomePage";
import { RegisterPage } from "./app/register/RegisterPage";
import { ToastContainer } from "./components/ui/ToastContainer";
import { Button } from "./components/ui/Button";
import { useWalletStore } from "./store/wallet.store";
import { useFarcasterView } from "./hooks/useFarcasterView";
import styles from "./App.module.css";

function Layout() {
  const isFarcasterView = useFarcasterView();
  const showShellChrome = !isFarcasterView;
  const isConnected = useWalletStore((state) => state.isConnected);
  const address = useWalletStore((state) => state.address);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const initializeWallet = useWalletStore((state) => state.initialize);

  useEffect(() => {
    void initializeWallet();
  }, [initializeWallet]);

  const handleWalletClick = () => {
    if (isConnected) {
      void disconnect();
    } else {
      void connect();
    }
  };

  return (
    <div className={clsx(styles.shell, !showShellChrome && styles.shellCompact)}>
      {showShellChrome && (
        <header className={styles.navbar}>
          <Link to="/" className={styles.brandLink}>
            <span className={styles.brandTile} aria-hidden="true">
              <span className={styles.brandGlyph}>B</span>
            </span>
            <span className={styles.brandLabel}>Basename Radar</span>
          </Link>
          <Button
            type="button"
            size="sm"
            className={styles.walletButton}
            onClick={handleWalletClick}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting…" : isConnected ? shortenAddress(address) : "Sign In"}
          </Button>
        </header>
      )}
      <div className={clsx(styles.main, !showShellChrome && styles.mainCompact)}>
        <Outlet />
      </div>
      {showShellChrome && (
        <footer className={styles.footer}>
          Questions or support? Email popovartur0393@gmail.com.
        </footer>
      )}
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="register/:name" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}

function shortenAddress(value?: string | null): string {
  if (!value) {
    return "Wallet";
  }
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
