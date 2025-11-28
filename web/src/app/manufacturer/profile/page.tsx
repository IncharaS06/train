"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";
import { auth, db, storage } from "@/shared/firebaseConfig";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type ProfileData = {
    name: string;
    email: string;
    company: string;
    phone: string;
    photoUrl?: string;
};

export default function ManufacturerProfile() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<ProfileData>({
        name: "",
        email: "",
        company: "",
        phone: "",
        photoUrl: "",
    });

    const [saving, setSaving] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!mounted) return;
        const user = auth.currentUser;

        if (user) {
            setUserId(user.uid);
            setForm((p) => ({
                ...p,
                email: user.email || "",
                name: user.displayName || "",
            }));
        } else {
            setLoading(false);
        }
    }, [mounted]);

    useEffect(() => {
        if (!userId) return;

        async function loadProfile() {
            const refDoc = doc(db, "manufacturerUsers", userId!);
            const snap = await getDoc(refDoc);

            if (snap.exists()) {
                const data = snap.data() as ProfileData;
                setProfile(data);
                setForm(data);
                setIsEditing(false);
            } else {
                setProfile(null);
                setIsEditing(true);
            }

            setLoading(false);
        }
        loadProfile();
    }, [userId]);

    function handleChange(field: keyof ProfileData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!userId) return;
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoUploading(true);
        const fileRef = ref(storage, `manufacturerProfiles/${userId}.jpg`);
        await uploadBytes(fileRef, file);

        const url = await getDownloadURL(fileRef);
        setForm((prev) => ({ ...prev, photoUrl: url }));

        setPhotoUploading(false);
    }

    async function handleSave() {
        if (!userId) return;

        setSaving(true);

        const refDoc = doc(db, "manufacturerUsers", userId!);
        const payload = { ...form, updatedAt: serverTimestamp() };

        if (profile) await updateDoc(refDoc, payload);
        else await setDoc(refDoc, payload);

        setProfile(payload);
        setIsEditing(false);
        setSaving(false);
    }

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#F7E8FF]">
                Loading Profile…
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* FIXED SIDEBAR + CONTENT */}
            <div className="flex pt-[140px]">
                <ManufacturerSidebar />

                {/* MAIN CONTENT CENTERED */}
                <main className="ml-64 flex-1 px-8 py-10 flex justify-center">
                    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-10">

                        <h1 className="text-3xl font-extrabold text-[#A259FF] mb-10">
                            Manufacturer Profile
                        </h1>

                        {/* Avatar */}
                        <div className="flex justify-center mb-10">
                            <div className="relative">
                                <Image
                                    src={form.photoUrl || "/profile.png"}
                                    width={160}
                                    height={160}
                                    className="rounded-full shadow-2xl object-cover"
                                    alt="Profile"
                                />

                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-[#A259FF] px-3 py-1 text-white text-xs rounded-full cursor-pointer shadow">
                                        {photoUploading ? "Uploading…" : "Change"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* FORM */}
                        <div className="space-y-5 text-sm">
                            <div>
                                <label className="text-xs text-gray-500">Name</label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2"
                                    disabled={!isEditing}
                                    value={form.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Email</label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 bg-gray-100"
                                    disabled
                                    value={form.email}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Company</label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2"
                                    disabled={!isEditing}
                                    value={form.company}
                                    onChange={(e) => handleChange("company", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Phone</label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2"
                                    disabled={!isEditing}
                                    value={form.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="mt-10 flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            if (profile) setForm(profile);
                                            setIsEditing(false);
                                        }}
                                        className="px-4 py-2 border rounded-xl text-sm"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-5 py-2 bg-[#A259FF] text-white rounded-xl text-sm"
                                    >
                                        {saving ? "Saving…" : "Save Changes"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-5 py-2 bg-[#A259FF] text-white rounded-xl text-sm"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
