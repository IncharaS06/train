"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import Link from "next/link";
import MainHeader from "@/components/Header";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");

    const reset = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            setMsg("Reset link sent to your email.");
        } catch (error) {
            setMsg("Failed to send reset link.");
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F7E8FF] px-6">
            <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-[#A259FF] mb-6">
                    Forgot Password
                </h1>

                {msg && <p className="text-center text-green-600 mb-3">{msg}</p>}

                <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-3 border rounded-xl mb-6"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button
                    onClick={reset}
                    className="w-full p-3 bg-[#A259FF] text-white rounded-xl font-semibold"
                >
                    Send Reset Link
                </button>

                <p className="mt-6 text-center text-[#7F57D1] font-semibold">
                    <Link href="/manufacturer/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}
