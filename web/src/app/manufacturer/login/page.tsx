"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../../../shared/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";

export default function ManufacturerLoginPage() {
    const router = useRouter();

    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [empId, setEmpId] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // If already logged in, go to dashboard
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) router.push("/manufacturer/dashboard");
        });
        return () => unsub();
    }, [router]);

    async function ensureUserDoc(uid: string) {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, {
                uid,
                name: name || email.split("@")[0],
                email,
                empId,
                role: "manufacturer",
                joinedOn: new Date().toISOString().slice(0, 10),
                totalAdded: 0,
            });
        }
    }

    async function handleLogin() {
        setMsg(null);
        setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserDoc(cred.user.uid);
            router.push("/manufacturer/dashboard");
        } catch (err: any) {
            console.error(err);
            setMsg(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup() {
        setMsg(null);
        setLoading(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await ensureUserDoc(cred.user.uid);
            router.push("/manufacturer/dashboard");
        } catch (err: any) {
            console.error(err);
            setMsg(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleForgot() {
        if (!email) {
            setMsg("Enter your email above first.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setMsg("Password reset mail sent.");
        } catch (err: any) {
            console.error(err);
            setMsg(err.message || "Failed to send reset mail");
        }
    }

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F7E8FF] px-4">
            <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-[#A259FF] mb-2">
                    Manufacturer {mode === "login" ? "Login" : "Sign Up"}
                </h1>
                <p className="text-center text-xs text-gray-500 mb-6">
                    Use your registered email & employee ID.
                </p>

                {msg && (
                    <p className="mb-3 text-xs text-center text-red-500 whitespace-pre-line">
                        {msg}
                    </p>
                )}

                {/* NAME only in signup */}
                {mode === "signup" && (
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border rounded-xl mb-3 text-sm"
                    />
                )}

                <input
                    type="text"
                    placeholder="Employee ID"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    className="w-full p-3 border rounded-xl mb-3 text-sm"
                />

                <input
                    type="email"
                    placeholder="Official Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border rounded-xl mb-3 text-sm"
                />

                <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border rounded-xl mb-4 text-sm"
                />

                <button
                    onClick={mode === "login" ? handleLogin : handleSignup}
                    disabled={loading}
                    className="w-full p-3 rounded-xl bg-[#A259FF] text-white font-semibold hover:bg-[#8F3FEA] text-sm disabled:opacity-60"
                >
                    {loading
                        ? "Please wait..."
                        : mode === "login"
                            ? "Login"
                            : "Create Account"}
                </button>

                <button
                    type="button"
                    onClick={handleForgot}
                    className="mt-3 text-xs text-[#A259FF] hover:underline"
                >
                    Forgot password?
                </button>

                <div className="mt-4 text-xs text-center text-gray-600">
                    {mode === "login" ? (
                        <>
                            Don&apos;t have an account?{" "}
                            <button
                                className="text-[#A259FF] font-semibold"
                                onClick={() => setMode("signup")}
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already registered?{" "}
                            <button
                                className="text-[#A259FF] font-semibold"
                                onClick={() => setMode("login")}
                            >
                                Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
