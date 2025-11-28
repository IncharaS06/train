"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/shared/firebaseConfig";

export default function ManufacturerSidebar() {
    const path = usePathname();

    const linkStyle = (href: string) =>
        `block px-4 py-2 rounded-xl text-sm font-medium transition 
        ${path === href
            ? "bg-[#A259FF] text-white shadow-md"
            : "text-gray-700 hover:bg-[#F2E6FF] hover:text-[#A259FF]"
        }`;

    function handleLogout() {
        auth.signOut();
        window.location.href = "/manufacturer/login";
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

            {/* GAP AT TOP */}
            <div className="h-6" />

            {/* MENU */}
            <nav className="flex flex-col gap-4 mt-4">
                <Link
                    href="/manufacturer/dashboard"
                    className={linkStyle("/manufacturer/dashboard")}
                >
                    📊 Dashboard
                </Link>

                <Link
                    href="/manufacturer/add-material"
                    className={linkStyle("/manufacturer/add-material")}
                >
                    ➕ Add Material
                </Link>

                <Link
                    href="/manufacturer/view"
                    className={linkStyle("/manufacturer/view")}
                >
                    📁 View Materials
                </Link>

                <Link
                    href="/manufacturer/profile"
                    className={linkStyle("/manufacturer/profile")}
                >
                    👤 Profile
                </Link>
            </nav>

            {/* LOGOUT BUTTON — OPTION A */}
            <button
                onClick={handleLogout}
                className="
                    mt-6
                    w-full
                    py-2
                    rounded-xl
                    border
                    border-gray-300
                    text-gray-700
                    text-sm
                    font-medium
                    hover:bg-gray-100
                    transition
                "
            >
                🚪 Logout
            </button>

            {/* FOOTER */}
            <div className="mt-auto text-[10px] text-gray-400 pt-6">
                Vimarsha – Track Fittings Ecosystem
            </div>
        </aside>
    );
}
