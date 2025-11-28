"use client";

import Image from "next/image";

function ManufacturerSidebar() {
    return (
        <nav className="p-4">
            <ul className="space-y-2">
                <li>
                    <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">
                        Dashboard
                    </a>
                </li>
                <li>
                    <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">
                        Products
                    </a>
                </li>
                <li>
                    <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">
                        Orders
                    </a>
                </li>
                <li>
                    <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">
                        Settings
                    </a>
                </li>
            </ul>
        </nav>
    );
}

export default function ManufacturerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F7E8FF] flex flex-col">
            {/* HEADER ALWAYS ON TOP */}
            <header className="bg-white shadow-md py-4 w-full flex justify-center">
                <div className="flex items-center justify-evenly w-full max-w-[1500px] px-12">
                    <Image src="/g20.png" width={220} height={220} alt="G20" />
                    <Image src="/railway.png" width={130} height={130} alt="Railway" />
                    <Image src="/tourism.png" width={160} height={160} alt="Tourism" />
                    <Image src="/vimarsha.png" width={150} height={150} alt="Vimarsha" />
                </div>
            </header>

            {/* SIDEBAR COMES UNDER HEADER */}
            <div className="flex flex-row flex-1">

                {/* LEFT SIDEBAR */}
                <aside className="w-64 bg-white shadow-xl">
                    <ManufacturerSidebar />
                </aside>

                {/* MAIN PAGE CONTENT */}
                <main className="flex-1 p-8">
                    {children}
                </main>

            </div>
        </div>
    );
}
