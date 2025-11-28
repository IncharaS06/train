"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import AppLoader from "@/components/AppLoader";   // 🔥 ADDED LOADER

export default function ManufacturerAdminLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true); // prevents blink

    // -------------------------------------------------------
    // AUTH CHECK (NO BLINK)
    // -------------------------------------------------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setChecking(false);
                return;
            }

            const snap = await getDoc(doc(db, "users", user.uid));

            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                router.replace("/manufacturer/admin/dashboard");
            } else {
                await signOut(auth);
                setChecking(false);
            }
        });

        return () => unsub();
    }, [router]);

    // -------------------------------------------------------
    // SHOW TRAIN LOADER DURING CHECKING
    // -------------------------------------------------------
    if (checking) {
        return <AppLoader />;  // 🔥 TRAIN LOADER HERE
    }

    // -------------------------------------------------------
    // LOGIN HANDLER
    // -------------------------------------------------------
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const snap = await getDoc(doc(db, "users", cred.user.uid));

            if (!snap.exists() || snap.data().role !== "manufacturerAdmin") {
                setMsg("You are not authorised as Manufacturer Admin.");
                await signOut(auth);
                return;
            }

            router.replace("/manufacturer/admin/dashboard");

        } catch (err: any) {
            setMsg(err.message);
        } finally {
            setLoading(false);
        }
    }

    // -------------------------------------------------------
    // UI
    // -------------------------------------------------------
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex pt-[120px] justify-center">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mt-4">

                    <h1 className="text-2xl font-extrabold text-[#A259FF] text-center mb-2">
                        Manufacturer Admin Login
                    </h1>

                    {msg && (
                        <p className="text-xs text-center text-red-500 mb-3">
                            {msg}
                        </p>
                    )}

                    <form onSubmit={handleLogin} className="space-y-3 text-sm">

                        <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-3 py-2 rounded-xl bg-[#A259FF] text-white disabled:opacity-50"
                        >
                            {loading ? "Checking…" : "Login as Admin"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
