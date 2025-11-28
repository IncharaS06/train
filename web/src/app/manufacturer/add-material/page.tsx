"use client";

import { useState, FormEvent, useRef } from "react";
import {
    collection,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/shared/firebaseConfig";

import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";
import QRCode from "qrcode-generator";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// =============== MATERIAL TYPE ===============
type Material = {
    // Core IDs
    materialId: string;
    manufacturerId: string;
    manufacturerName: string;

    // Manufacturing + technical
    fittingType: string;
    drawingNumber: string;
    materialSpec: string;
    weightKg: string;
    boardGauge: string;
    manufacturingDate: string;
    expectedLifeYears: string;

    // UDM integration
    purchaseOrderNumber: string;
    batchNumber: string;
    depotCode: string;
    depotEntryDate: string;
    udmLotNumber: string;
    inspectionOfficer: string;

    // TMS integration / lifecycle
    tmsTrackId: string;
    gpsLocation: string;
    installationStatus: string;
    dispatchDate: string;
    warrantyExpiry: string;
    failureCount: string;
    lastMaintenanceDate: string;
};
const FITTING_TYPES = ["Elastic Rail Clip", "Rail Pad", "Liner", "Sleeper"];

// Define types locally since qrcode-generator doesn't export them properly
type TypeNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40;
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

// Helper to coerce any numeric input into the library's TypeNumber (0..40)
function toTypeNumber(n: number): TypeNumber {
    const clamped = Math.max(0, Math.min(40, Math.round(n)));
    return clamped as TypeNumber;
}

// =============== ID GENERATOR ===============
function generateMaterialId(manufacturerId: string, fittingType: string) {
    const shortFit = fittingType
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const timestamp = Date.now().toString(36).toUpperCase();
    const manu = manufacturerId.toUpperCase().slice(0, 6);

    return `${manu}-${shortFit}-${timestamp}`;
}

// =============== QR SVG GENERATOR (configurable) ===============
function buildQrSvg(
    payload: string,
    moduleSize = 5,
    margin = 2,
    color = "#000000",
    bgColor = "#ffffff",
    ecc: ErrorCorrectionLevel = "L",
    version: TypeNumber = 1 // Default to version 1 now
): string {
    // Create QR object with forced version 1
    const qr = QRCode(version, ecc);
    qr.addData(payload);
    
    try {
        qr.make();
    } catch (err) {
        // If version 1 fails (payload too big), fallback to auto
        console.warn("QR version 1 failed, falling back to auto", err);
        const qrAuto = QRCode(0, ecc);
        qrAuto.addData(payload);
        qrAuto.make();
        return buildQrSvgFromQR(qrAuto, moduleSize, margin, color, bgColor);
    }

    return buildQrSvgFromQR(qr, moduleSize, margin, color, bgColor);
}

// Helper function to build SVG from QR object
function buildQrSvgFromQR(
    qr: any,
    moduleSize: number,
    margin: number,
    color: string,
    bgColor: string
): string {
    const count = qr.getModuleCount();
    const size = (count + margin * 2) * moduleSize;
    let rects = "";

    for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
            if (qr.isDark(r, c)) {
                const x = (c + margin) * moduleSize;
                const y = (r + margin) * moduleSize;
                rects += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" />`;
            }
        }
    }

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <g fill="${color}" shape-rendering="crispEdges">${rects}</g>
    </svg>
  `;
}

// =============== DOWNLOAD HELPER ===============
function downloadFile(content: string | Blob, filename: string, mime?: string) {
    let blob: Blob;
    if (content instanceof Blob) {
        blob = content;
    } else {
        blob = new Blob([content], { type: mime || "application/octet-stream" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// =============== DATAURL -> BLOB HELPER ===============
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return blob;
}

// =============== SVG -> PNG helper (reliable) ===============
async function svgStringToPngDataUrl(svgString: string, scale = 2): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.documentElement;
    if (!svgEl || svgEl.nodeName !== "svg") {
        throw new Error("Invalid SVG");
    }

    const width = svgEl.getAttribute("width") || "400";
    const height = svgEl.getAttribute("height") || "400";
    svgEl.setAttribute("width", width);
    svgEl.setAttribute("height", height);

    const serialized = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const p = new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load SVG image"));
        });
        img.src = url;
        await p;

        const canvas = document.createElement("canvas");
        canvas.width = (img.naturalWidth || parseInt(width, 10)) * scale;
        canvas.height = (img.naturalHeight || parseInt(height, 10)) * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context missing");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/png");
        return dataUrl;
    } finally {
        URL.revokeObjectURL(url);
    }
}

// =============== SVG -> PNG/JPEG (alternative with requested scale) ===============
async function svgToRasterDataUrl(svgString: string, type: "png" | "jpeg" = "png", scale = 6): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.documentElement;
    if (!svgEl || svgEl.nodeName !== "svg") {
        throw new Error("Invalid SVG");
    }
    const width = Number(svgEl.getAttribute("width") || 400);
    const height = Number(svgEl.getAttribute("height") || 400);

    const serialized = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load SVG image"));
            img.src = url;
        });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context missing");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (type === "png") return canvas.toDataURL("image/png");
        return canvas.toDataURL("image/jpeg", 0.95);
    } finally {
        URL.revokeObjectURL(url);
    }
}

// =============== PDF DOWNLOAD (SVG → PDF: QR only) ===============
async function downloadPdfFromSvg(svgString: string, filename: string) {
    try {
        const imgDataUrl = await svgStringToPngDataUrl(svgString, 2);

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const img = new Image();
        img.src = imgDataUrl;
        await new Promise<void>((resolve) => {
            img.onload = () => resolve();
        });

        const imgWidth = img.width;
        const imgHeight = img.height;

        const margin = 20;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;

        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
        const drawWidth = imgWidth * ratio;
        const drawHeight = imgHeight * ratio;
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        pdf.addImage(imgDataUrl, "PNG", x, y, drawWidth, drawHeight);
        pdf.save(filename);
    } catch (err) {
        console.error("downloadPdfFromSvg error:", err);
    }
}

// =============== MAIN COMPONENT ===============
export default function AddMaterialPage() {
    const manufacturerId = auth.currentUser?.uid || "DEMO";

    const [form, setForm] = useState<Material>({
        materialId: "",
        manufacturerId,
        manufacturerName: "",

        fittingType: "",
        drawingNumber: "",
        materialSpec: "",
        weightKg: "",
        boardGauge: "",
        manufacturingDate: "",
        expectedLifeYears: "",

        purchaseOrderNumber: "",
        batchNumber: "",
        depotCode: "",
        depotEntryDate: "",
        udmLotNumber: "",
        inspectionOfficer: "",

        tmsTrackId: "",
        gpsLocation: "",
        installationStatus: "Not Installed",
        dispatchDate: "",
        warrantyExpiry: "",
        failureCount: "0",
        lastMaintenanceDate: "",
    });

    // QR and UI state
    const [qrSvg, setQrSvg] = useState<string | null>(null);
    const [qrText, setQrText] = useState<string | null>(null);
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    
    // QR settings (user-adjustable)
    const [qrColor, setQrColor] = useState<string>("#000000");
    const [qrBgColor, setQrBgColor] = useState<string>("#ffffff");
    const [qrModuleSize, setQrModuleSize] = useState<number>(6);
    const [qrMargin, setQrMargin] = useState<number>(2);
    const [qrEcc, setQrEcc] = useState<ErrorCorrectionLevel>("L");
    const [qrVersion, setQrVersion] = useState<TypeNumber>(1); // Default to version 1

    // ref for the pdf section (user provided: "pdf-section")
    const pdfRef = useRef<HTMLDivElement | null>(null);

    function handleChange(field: keyof Material, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setMsg(null);
        setSaving(true);

        try {
            const materialId = generateMaterialId(
                form.manufacturerId,
                form.fittingType
            );

            const payload: Material & { createdAt: any } = {
                ...form,
                materialId,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "materials"), payload);

            // Create the JSON data that will be shown when URL is visited
            const jsonData = {
                materialId,
                docId: docRef.id,
                manufacturerId: form.manufacturerId,
                manufacturerName: form.manufacturerName,
                fittingType: form.fittingType,
                drawingNumber: form.drawingNumber,
                materialSpec: form.materialSpec,
                batchNumber: form.batchNumber,
                poNumber: form.purchaseOrderNumber,
                depotCode: form.depotCode,
                manufacturingDate: form.manufacturingDate,
                tmsTrackId: form.tmsTrackId || undefined,
            };

            const qrPayload = JSON.stringify(jsonData);
            
// For page route (recommended for mobile scanning):
const displayUrl = `${window.location.origin}/material/${docRef.id}`;

// Or for API route (returns raw JSON):
// const displayUrl = `${window.location.origin}/api/material/${docRef.id}`;
            // Test if the API route exists
            try {
                const testResponse = await fetch(displayUrl);
                if (!testResponse.ok) {
                    console.warn('API route might not be set up yet');
                    // Continue anyway - the QR will still be generated
                }
            } catch (err) {
                console.warn('API route test failed:', err);
            }

            // Build QR code with the URL (not the raw JSON)
            let svg: string;
            try {
                svg = buildQrSvg(
                    displayUrl, // Use URL instead of raw JSON
                    qrModuleSize,
                    qrMargin,
                    qrColor,
                    qrBgColor,
                    qrEcc,
                    qrVersion
                );
            } catch (err) {
                // If forced version fails (payload too big), fallback to auto
                console.warn("Forced QR version failed, falling back to auto", err);
                svg = buildQrSvg(displayUrl, qrModuleSize, qrMargin, qrColor, qrBgColor, qrEcc, 0);
            }

            setQrSvg(svg);
            setQrText(qrPayload);
            setQrUrl(displayUrl);
            setMsg("Material saved & QR generated! QR contains URL that will show JSON data.");
        } catch (err) {
            console.error(err);
            setMsg("Error saving material.");
        }

        setSaving(false);
    }

    // Allow user to regenerate QR from existing qrText with current settings
    function regenerateQrFromPayload() {
        if (!qrUrl) return;
        try {
            const svg = buildQrSvg(qrUrl, qrModuleSize, qrMargin, qrColor, qrBgColor, qrEcc, qrVersion);
            setQrSvg(svg);
            setMsg("QR regenerated with new settings.");
        } catch (err) {
            console.warn("Regenerate with forced version failed, falling back to auto.", err);
            const svg = buildQrSvg(qrUrl, qrModuleSize, qrMargin, qrColor, qrBgColor, qrEcc, 0);
            setQrSvg(svg);
            setMsg("QR regenerated with fallback settings.");
        }
    }

    // =============== PDF (capture whole preview card: QR + details) ===============
    async function downloadPdf() {
        if (!pdfRef.current) return;

        await new Promise((r) => setTimeout(r, 150));

        const wrapper = pdfRef.current;
        const svgs = Array.from(wrapper.querySelectorAll("svg"));
        const replacements: { svg: SVGElement; imgEl: HTMLImageElement }[] = [];

        try {
            for (const svg of svgs) {
                const svgHtml = new XMLSerializer().serializeToString(svg);
                let dataUrl: string;
                try {
                    dataUrl = await svgStringToPngDataUrl(svgHtml, 2);
                } catch (err) {
                    const inner = svg.outerHTML || svgHtml;
                    dataUrl = await svgStringToPngDataUrl(inner, 2);
                }
                const img = document.createElement("img");
                img.src = dataUrl;
                img.style.display = "block";
                const rect = svg.getBoundingClientRect();
                img.style.width = rect.width + "px";
                img.style.height = rect.height + "px";

                svg.parentNode?.replaceChild(img, svg);
                replacements.push({ svg: svg as SVGElement, imgEl: img });
            }

            const oldBg = wrapper.style.background;
            wrapper.style.background = "#ffffff";

            const canvas = await html2canvas(wrapper, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#FFFFFF",
                logging: false,
            });

            wrapper.style.background = oldBg;

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const marginMm = 10;
            const pxToMm = (px: number) => (px * 25.4) / 96;
            const imgWidthMm = pxToMm(canvas.width);
            const imgHeightMm = pxToMm(canvas.height);

            const maxWidthMm = pageWidth - marginMm * 2;
            const ratio = Math.min(maxWidthMm / imgWidthMm, 1);

            const drawWidthMm = imgWidthMm * ratio;
            const drawHeightMm = imgHeightMm * ratio;
            const x = (pageWidth - drawWidthMm) / 2;
            const y = marginMm;

            pdf.addImage(imgData, "PNG", x, y, drawWidthMm, drawHeightMm);
            pdf.save(`${form.materialId || "material"}_qr_details.pdf`);
        } catch (err) {
            console.error("downloadPdf error:", err);
        } finally {
            for (const r of replacements) {
                const { svg, imgEl } = r;
                imgEl.parentNode?.replaceChild(svg, imgEl);
            }
        }
    }

    // Function to preview what the URL would show
    function previewJsonData() {
        if (!qrUrl) return;
        window.open(qrUrl, '_blank');
    }

    // =============== UI ===============
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            {/* FIXED HEADER */}
            <MainHeader />

            {/* FIXED SIDEBAR + CONTENT */}
            <div className="flex pt-[90px]">
                {/* SIDEBAR */}
                <ManufacturerSidebar />

                {/* MAIN CONTENT */}
                <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                    <h1 className="text-3xl font-extrabold text-[#A259FF] mb-1">
                        Add Material
                    </h1>
                    <p className="text-xs text-gray-600 mb-6">
                        Fill manufacturing details. Auto-generated Material ID and laser-compatible QR are linked to UDM (PO, lots) and TMS (track lifecycle).
                    </p>

                    {msg && (
                        <div className="px-4 py-2 rounded-xl bg-white shadow mb-4 text-xs">
                            {msg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-10">
                        {/* LEFT FORM – ALL SECTIONS */}
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-3xl shadow-xl p-6 text-xs space-y-6"
                        >
                            {/* ... (all your form sections remain exactly the same) ... */}
                            {/* SECTION 1: Manufacturer Details */}
                            <div>
                                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                                    Manufacturer Details
                                </h2>
                                <p className="text-[11px] text-gray-500 mb-3">
                                    Captured from the vendor portal; some fields are auto-populated based on login.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px]">Manufacturer ID (auto)</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            readOnly
                                            value={form.manufacturerId}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Manufacturer Name</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.manufacturerName}
                                            onChange={(e) =>
                                                handleChange("manufacturerName", e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Material Technical Specs */}
                            <div>
                                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                                    Material Technical Specification
                                </h2>
                                <p className="text-[11px] text-gray-500 mb-3">
                                    Fields aligned with drawing and IRS/BIS material standards.
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="text-[11px]">Fitting Type</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.fittingType}
                                            onChange={(e) =>
                                                handleChange("fittingType", e.target.value)
                                            }
                                            required
                                        >
                                            <option value="">Select</option>
                                            {FITTING_TYPES.map((t) => (
                                                <option key={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Drawing Number</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.drawingNumber}
                                            onChange={(e) =>
                                                handleChange("drawingNumber", e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="text-[11px]">Material Specification</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.materialSpec}
                                            onChange={(e) =>
                                                handleChange("materialSpec", e.target.value)
                                            }
                                            placeholder="e.g., IRS:T-31, IS:2062 E250, etc."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Weight (kg)</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.weightKg}
                                            onChange={(e) =>
                                                handleChange("weightKg", e.target.value)
                                            }
                                            placeholder="Numeric (approx.)"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px]">Board Gauge</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.boardGauge}
                                            onChange={(e) =>
                                                handleChange("boardGauge", e.target.value)
                                            }
                                            placeholder="e.g., BG / MG"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Manufacturing Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.manufacturingDate}
                                            onChange={(e) =>
                                                handleChange("manufacturingDate", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="text-[11px]">
                                            Expected Service Life (years)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.expectedLifeYears}
                                            onChange={(e) =>
                                                handleChange("expectedLifeYears", e.target.value)
                                            }
                                            placeholder="e.g., 10, 15"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Warranty Expiry</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.warrantyExpiry}
                                            onChange={(e) =>
                                                handleChange("warrantyExpiry", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: UDM Data (vendor + depot) */}
                            <div>
                                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                                    UDM Purchase & Lot Details
                                </h2>
                                <p className="text-[11px] text-gray-500 mb-3">
                                    Purchase Order and lot information linked with the UDM portal.
                                    Some fields are depot-controlled and may appear read-only.
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="text-[11px]">Purchase Order Number (UDM)</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.purchaseOrderNumber}
                                            onChange={(e) =>
                                                handleChange("purchaseOrderNumber", e.target.value)
                                            }
                                            placeholder="As per UDM PO"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Batch Number</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.batchNumber}
                                            onChange={(e) =>
                                                handleChange("batchNumber", e.target.value)
                                            }
                                            placeholder="Manufacturer batch ID"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="text-[11px]">Depot Code</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.depotCode}
                                            onChange={(e) =>
                                                handleChange("depotCode", e.target.value)
                                            }
                                            placeholder="e.g., SBC/DEPOT-01"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">UDM Lot Number</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.udmLotNumber}
                                            onChange={(e) =>
                                                handleChange("udmLotNumber", e.target.value)
                                            }
                                            placeholder="Lot as seen in UDM"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px]">
                                            Inspection Officer (RITES/RDSO)
                                        </label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border"
                                            value={form.inspectionOfficer}
                                            onChange={(e) =>
                                                handleChange("inspectionOfficer", e.target.value)
                                            }
                                            placeholder="Officer name / ID"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">
                                            Depot Entry Date (UDM)
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            value={form.depotEntryDate}
                                            readOnly
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Auto-filled by depot via UDM → synced into this system.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: TMS Lifecycle (read-only for manufacturer) */}
                            <div>
                                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                                    TMS Lifecycle & Track Mapping
                                </h2>
                                <p className="text-[11px] text-gray-500 mb-3">
                                    These fields are populated after installation by Track Staff /
                                    TMS and EV robot. Manufacturers can view but not modify.
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="text-[11px]">TMS Track ID</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            value={form.tmsTrackId}
                                            readOnly
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">GPS Installation Location</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            value={form.gpsLocation}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="text-[11px]">Installation Status</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            value={form.installationStatus}
                                            readOnly
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Dispatch Date to Field</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            value={form.dispatchDate}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px]">Failure Count</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            value={form.failureCount}
                                            readOnly
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Last Maintenance Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 rounded-xl border bg-gray-100"
                                            value={form.lastMaintenanceDate}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2 rounded-xl bg-[#A259FF] text-white font-semibold text-sm mt-4"
                            >
                                {saving ? "Saving..." : "Save Material & Generate QR"}
                            </button>
                        </form>

                        {/* RIGHT: QR PREVIEW CARD (pdf-section) */}
                        <div
                            id="pdf-section"
                            ref={pdfRef}
                            className="bg-white rounded-3xl shadow-xl p-6 text-xs flex flex-col items-center"
                        >
                            <h3 className="text-sm font-semibold text-[#A259FF] mb-3">
                                Laser-Compatible QR (Version 1)
                            </h3>

                            {/* QR SETTINGS UI */}
                            <div className="w-full mb-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px]">QR Color</label>
                                        <input
                                            type="text"
                                            value={qrColor}
                                            onChange={(e) => setQrColor(e.target.value)}
                                            placeholder="#000000"
                                            className="w-full px-2 py-1 rounded-xl border text-xs"
                                        />
                                        <input
                                            type="color"
                                            value={qrColor}
                                            onChange={(e) => setQrColor(e.target.value)}
                                            className="mt-1 w-full h-8 p-0 border rounded"
                                            title="Pick QR color"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Background Color</label>
                                        <input
                                            type="text"
                                            value={qrBgColor}
                                            onChange={(e) => setQrBgColor(e.target.value)}
                                            placeholder="#ffffff"
                                            className="w-full px-2 py-1 rounded-xl border text-xs"
                                        />
                                        <input
                                            type="color"
                                            value={qrBgColor}
                                            onChange={(e) => setQrBgColor(e.target.value)}
                                            className="mt-1 w-full h-8 p-0 border rounded"
                                            title="Pick background color"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    <div>
                                        <label className="text-[11px]">Module Size (px)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={qrModuleSize}
                                            onChange={(e) => setQrModuleSize(Number(e.target.value))}
                                            className="w-full px-2 py-1 rounded-xl border text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Margin (modules)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={qrMargin}
                                            onChange={(e) => setQrMargin(Number(e.target.value))}
                                            className="w-full px-2 py-1 rounded-xl border text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px]">Error Correction</label>
                                        <select
                                            value={qrEcc}
                                            onChange={(e) => setQrEcc(e.target.value as ErrorCorrectionLevel)}
                                            className="w-full px-2 py-1 rounded-xl border text-xs"
                                        >
                                            <option value="L">L (Low)</option>
                                            <option value="M">M (Medium)</option>
                                            <option value="Q">Q (Quartile)</option>
                                            <option value="H">H (High)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="text-[11px]">QR Version</label>
                                        <select
                                            value={qrVersion}
                                            onChange={(e) => setQrVersion(toTypeNumber(Number(e.target.value)))}
                                            className="w-full px-2 py-1 rounded-xl border text-xs"
                                        >
                                            <option value="1">1 (Smallest)</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="0">Auto</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Version 1 creates the smallest QR code
                                        </p>
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            onClick={regenerateQrFromPayload}
                                            className="w-full py-2 rounded-xl bg-[#4B3A7A] text-white text-xs"
                                            type="button"
                                        >
                                            Regenerate QR
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* QR PREVIEW / Downloads */}
                            {qrSvg ? (
                                <>
                                    <div
                                        className="bg-[#F7E8FF] p-3 rounded-xl mb-4"
                                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                                    />

                                    <p className="text-[11px] text-gray-500 mb-3 text-center">
                                        QR contains URL that displays material data as JSON when scanned.
                                    </p>

                                    {qrUrl && (
                                        <div className="w-full mb-3 p-2 bg-gray-100 rounded-lg">
                                            <p className="text-[10px] text-gray-600 mb-1">QR URL:</p>
                                            <p className="text-[9px] break-all">{qrUrl}</p>
                                        </div>
                                    )}

                                    {/* PREVIEW JSON BUTTON */}
                                    <button
                                        onClick={previewJsonData}
                                        className="w-full py-2 rounded-xl bg-[#10A37F] text-white text-xs mb-2"
                                    >
                                        Preview JSON Data
                                    </button>

                                    {/* SVG DOWNLOAD */}
                                    <button
                                        onClick={() =>
                                            qrSvg &&
                                            downloadFile(
                                                qrSvg,
                                                `${form.materialId || "material"}_qr.svg`,
                                                "image/svg+xml"
                                            )
                                        }
                                        className="w-full py-2 rounded-xl bg-[#A259FF] text-white text-xs mb-2"
                                    >
                                        Download SVG
                                    </button>

                                    {/* PNG DOWNLOAD */}
                                    <button
                                        onClick={async () => {
                                            if (!qrSvg) return;
                                            try {
                                                const dataUrl = await svgToRasterDataUrl(qrSvg, "png", 6);
                                                const blob = await dataUrlToBlob(dataUrl);
                                                downloadFile(blob, `${form.materialId || "material"}_qr.png`);
                                            } catch (err) {
                                                console.error("PNG download error:", err);
                                            }
                                        }}
                                        className="w-full py-2 rounded-xl bg-[#10A37F] text-white text-xs mb-2"
                                    >
                                        Download PNG (high-res)
                                    </button>

                                    {/* PDF DOWNLOAD: capture QR-only (from svg) */}
                                    <button
                                        onClick={() =>
                                            qrSvg &&
                                            downloadPdfFromSvg(
                                                qrSvg,
                                                `${form.materialId || "material"}_qr.svg_only.pdf`
                                            )
                                        }
                                        className="w-full py-2 rounded-xl bg-[#6B46C1] text-white text-xs mb-2"
                                    >
                                        Download PDF (QR only)
                                    </button>

                                    {/* PDF DOWNLOAD: capture card (QR + details) */}
                                    <button
                                        onClick={downloadPdf}
                                        className="w-full py-2 rounded-xl bg-[#4B3A7A] text-white text-xs mb-2"
                                    >
                                        Download PDF (QR + Details)
                                    </button>

                                    {/* JSON DOWNLOAD */}
                                    <button
                                        onClick={() =>
                                            qrText &&
                                            downloadFile(
                                                qrText,
                                                `${form.materialId || "material"}_qr.json`,
                                                "application/json"
                                            )
                                        }
                                        className="w-full py-2 rounded-xl border border-[#A259FF] text-[#A259FF] text-xs"
                                    >
                                        Download QR Payload (JSON)
                                    </button>
                                </>
                            ) : (
                                <p className="text-gray-500 text-[11px] text-center">
                                    After saving the material, a laser-compatible QR will appear
                                    here. The QR contains a URL that displays JSON data when visited.
                                </p>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}