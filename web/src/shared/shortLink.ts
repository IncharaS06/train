import { db } from "@/shared/firebaseConfig";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateShortCode(length = 6) {
    let code = "";
    for (let i = 0; i < length; i++) {
        code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    return code;
}

export async function createShortLink(materialDocId: string) {
    const code = generateShortCode(6);

    await setDoc(doc(db, "shortLinks", code), {
        materialDocId,
        createdAt: serverTimestamp()
    });

    return `${window.location.origin}/m/${code}`;
}
