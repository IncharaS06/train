"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";

export default function LogoutPage() {
    useEffect(() => {
        // remove cookie
        document.cookie = "__session=; Max-Age=0; path=/";

        signOut(auth).then(() => {
            window.location.href = "/manufacturer/login";
        });
    }, []);

    return <p>Logging out…</p>;
}
