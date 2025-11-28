"use client";

import { Suspense } from "react";
import MaterialDetails from "./MaterialDetails";

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <MaterialDetails />
    </Suspense>
  );
}
