// src/app/intro/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function IntroPage() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => router.push("/home"), 4000);
        return () => clearTimeout(t);
    }, [router]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="w-full h-screen bg-[#F3E8FF] flex flex-col justify-center items-center"
        >
            {/* Logo animation */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
            >
                <Image src="/vimarsha.png" width={350} height={350} alt="logo" />
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="mt-6 text-4xl font-bold text-[#A259FF]"
            >
                Vimarsha
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 1 }}
                className="text-[#7F57D1] text-lg mt-2"
            >
                Track Fittings Digital Ecosystem
            </motion.p>
        </motion.div>
    );
}
