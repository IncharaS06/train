import { Suspense } from "react";
import MaterialDetailsClient from "./MaterialDetailsClient";

export default function Page() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-sm text-gray-600">Loading material…</p>
                </div>
            }
        >
            <MaterialDetailsClient />
        </Suspense>
    );
}
