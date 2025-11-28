import { Suspense } from "react";
import QRClient from "./qr-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading QR…</div>}>
      <QRClient />
    </Suspense>
  );
}