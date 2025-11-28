"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import { useState } from "react";

export default function ManufacturerAdminSidebar() {
    const path = usePathname();
    const [loggingOut, setLoggingOut] = useState(false);

    const linkStyle = (href: string) =>
        `block px-4 py-2 rounded-xl text-sm font-medium transition 
        ${path === href
            ? "bg-[#A259FF] text-white shadow-md"
            : "text-gray-700 hover:bg-[#F2E6FF] hover:text-[#A259FF]"
        }`;

    async function handleLogout() {
        try {
            setLoggingOut(true);
            await signOut(auth);
            window.location.href = "/manufacturer/admin-login";
        } catch (err) {
            console.error(err);
            setLoggingOut(false);
        }
    }

    return (
        <aside
            className="
                fixed
                top-[150px]
                left-0
                w-64
                h-[calc(100vh-150px)]
                bg-white
                shadow-xl
                p-6
                flex flex-col
                z-40
                rounded-tr-2xl
            "
        >
            <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Manufacturer Admin
                </p>
                <h2 className="text-lg font-extrabold text-[#A259FF]">
                    Admin Console
                </h2>
            </div>

            <nav className="flex flex-col gap-3 mt-2">
                <Link
                    href="/manufacturer/admin/dashboard"
                    className={linkStyle("/manufacturer/admin/dashboard")}
                >
                    📊 Admin Dashboard
                </Link>

                <Link
                    href="/manufacturer/admin/employees"
                    className={linkStyle("/manufacturer/admin/employees")}
                >
                    👥 Employees
                </Link>

                <Link
                    href="/manufacturer/admin/materials"
                    className={linkStyle("/manufacturer/admin/materials")}
                >
                    🧩 All Materials
                </Link>
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 text-xs font-semibold 
                               rounded-xl py-2 bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                    {loggingOut ? "Logging out…" : "🚪 Logout"}
                </button>

                <p className="mt-3 text-[10px] text-gray-400">
                    Vimarsha – Track Fittings Ecosystem
                </p>
            </div>
        </aside>
    );
}
