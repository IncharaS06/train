"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ManufacturerRegister() {
    const router = useRouter();

    const [form, setForm] = useState({
        empId: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        company: "",
    });

    const update = (e: any) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const register = async () => {
        try {
            if (form.password.length < 6) {
                alert("Password must be at least 6 characters");
                return;
            }

            // create auth user
            const res = await createUserWithEmailAndPassword(
                auth,
                form.email,
                form.password
            );

            // save full profile in firestore
            await setDoc(doc(db, "users", res.user.uid), {
                empId: form.empId,
                name: form.name,
                email: form.email,
                phone: form.phone,
                company: form.company,
                role: "manufacturer",
                createdAt: new Date().toISOString(),
            });

            router.push("/manufacturer/login");
        } catch (error) {
            alert("Registration failed");
        }
    };

    return (
        <div className="min-h-screen bg-[#F7E8FF] flex justify-center items-center px-6">
            <div className="bg-white shadow-2xl p-10 rounded-3xl w-full max-w-lg">
                <h1 className="text-3xl font-bold text-center text-[#A259FF] mb-6">
                    Manufacturer Registration
                </h1>

                <div className="grid grid-cols-1 gap-4">

                    <input name="empId" placeholder="Employee ID"
                        className="p-3 border rounded-xl" onChange={update} />

                    <input name="name" placeholder="Full Name"
                        className="p-3 border rounded-xl" onChange={update} />

                    <input name="email" placeholder="Email"
                        className="p-3 border rounded-xl" onChange={update} />

                    <input name="phone" placeholder="Phone Number"
                        className="p-3 border rounded-xl" onChange={update} />

                    <input name="company" placeholder="Company Name"
                        className="p-3 border rounded-xl" onChange={update} />

                    <input type="password" name="password" placeholder="Password"
                        className="p-3 border rounded-xl" onChange={update} />
                </div>

                <button
                    onClick={register}
                    className="w-full mt-6 p-3 bg-[#A259FF] hover:bg-[#8F3FEA] text-white rounded-xl font-semibold"
                >
                    Create Account
                </button>

                <p
                    onClick={() => router.push("/manufacturer/login")}
                    className="mt-4 text-center text-[#7F57D1] font-semibold cursor-pointer"
                >
                    Already have an account? Login
                </p>

            </div>
        </div>
    );
}
