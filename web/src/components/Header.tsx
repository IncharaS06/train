"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Header() {
    return (
        <motion.header
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="
                bg-white 
                shadow-md 
                py-4 
                w-full 
                sticky 
                top-0 
                z-50 
            "
        >
            <div className="flex items-center justify-between w-full max-w-[1650px] mx-auto px-16">

                {/* G20 Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Image src="/g20.png" width={190} height={190} alt="G20" />
                </motion.div>

                {/* Railway */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Image src="/railway.png" width={100} height={100} alt="Railway" />
                </motion.div>

                {/* Ministry */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Image src="/tourism.png" width={135} height={135} alt="Tourism" />
                </motion.div>

                {/* Vimarsha */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Image src="/vimarsha.png" width={135} height={135} alt="Vimarsha" />
                </motion.div>

            </div>
        </motion.header>
    );
}
