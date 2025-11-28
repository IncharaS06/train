"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VendorDashboard() {
    return (
        <div className="min-h-screen bg-[#F7E8FF] flex flex-col items-center pt-20">

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl font-bold text-[#A259FF] mb-10"
            >
                Manufacturer Dashboard
            </motion.h1>

            <div className="flex gap-10 mt-6">
                <Link href="/vendor/add">
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        className="bg-white w-64 h-48 rounded-2xl shadow-xl text-xl font-semibold"
                    >
                        ➕ Add Material
                    </motion.button>
                </Link>

                <Link href="/vendor/list">
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        className="bg-white w-64 h-48 rounded-2xl shadow-xl text-xl font-semibold"
                    >
                        📦 View Materials
                    </motion.button>
                </Link>
            </div>
        </div>
    );
}
