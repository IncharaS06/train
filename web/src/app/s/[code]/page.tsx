"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function ShortRedirect() {
    const router = useRouter();
    const { code } = useParams();

    useEffect(() => {
        async function run() {
            const shortRef = doc(db, "shortUrls", code as string);
            const snap = await getDoc(shortRef);

            if (snap.exists()) {
                const target = snap.data().target;
                router.replace(`/manufacturer/view/${target}`);
            } else {
                router.replace("/404");
            }
        }
        run();
    }, [code]);

    return <div className="p-10 text-center">Redirecting...</div>;
}
