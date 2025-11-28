// src/app/loader/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoaderPage() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => router.push("/intro"), 2500);
        return () => clearTimeout(t);
    }, [router]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="w-full h-screen bg-[#F3E8FF] flex justify-center items-center relative overflow-hidden"
        >
            {/* Train GIF */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <Image src="/loader.gif" width={380} height={380} alt="loading" />
            </motion.div>

            {/* Glow shadow */}
            <motion.div
                className="absolute bottom-28 w-40 h-2 bg-[#C985E6]/20 blur-xl rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.div>
    );
}
