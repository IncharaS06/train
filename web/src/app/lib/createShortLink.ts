import { db } from "@/shared/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

function randomCode(length = 5) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

export async function createShortLink(docId: string) {
    const code = randomCode();

    await setDoc(doc(db, "shortUrls", code), {
        target: docId,
        createdAt: Date.now(),
    });

    const base = typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    return `${base}/s/${code}`;
}
