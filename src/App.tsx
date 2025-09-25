import { Outlet, Route, Routes } from "react-router-dom";
import { HomePage } from "./app/home/HomePage";
import { MiniPage } from "./app/mini/MiniPage";
import { ToastContainer } from "./components/ui/ToastContainer";
import styles from "./App.module.css";

function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.navbar}>
        <span className={styles.brand}>Basename Radar</span>
      </header>
      <div className={styles.main}>
        <Outlet />
      </div>
      <footer className={styles.footer}>
        Mock data only — ready for onchain integration. Built for Base +
        Farcaster.
      </footer>
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="mini" element={<MiniPage />} />
      </Route>
    </Routes>
  );
}
