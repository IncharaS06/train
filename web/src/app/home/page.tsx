"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import MainHeader from "@/components/Header"; // ⬅️ using extracted header

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null; // prevents hydration mismatch

    const roles = [
        { name: "Vendor", link: "/manufacturer/login" },
        { name: "Depot", link: "/depot" },
        { name: "Track Staff", link: "/track" },
        { name: "Admin", link: "/admin" },
    ];

    return (
        <div className="min-h-screen w-full bg-[#F7E8FF] flex flex-col">

            {/* GLOBAL HEADER (imported) */}
            <MainHeader />

            {/* PAGE BODY */}
            <main className="flex-1 flex flex-col justify-center items-center">

                {/* TITLE */}
                <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-5xl font-extrabold text-[#A259FF] mb-16"
                >
                    Select User Role
                </motion.h2>

                {/* ROLE BUTTONS */}
                <div className="flex gap-16 justify-center items-center">
                    {roles.map((role, i) => (
                        <Link href={role.link} key={role.name}>
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                whileHover={{
                                    scale: 1.12,
                                    boxShadow: "0px 20px 40px #c092ff55",
                                }}
                                whileTap={{ scale: 0.96 }}
                                className="
                                    w-64 h-60 
                                    bg-white 
                                    rounded-3xl 
                                    shadow-xl 
                                    flex items-center justify-center 
                                    text-2xl font-semibold text-[#2A2A2A]
                                    transition-all
                                "
                            >
                                {role.name}
                            </motion.button>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
