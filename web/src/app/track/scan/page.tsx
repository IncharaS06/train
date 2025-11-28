"use client";

import { Suspense } from "react";
import ScanClient from "./scan-client"; // Your component that uses useSearchParams

export default function Page() {
  return (
    <Suspense fallback={<div>Loading scan…</div>}>
      <ScanClient />
    </Suspense>
  );
}
