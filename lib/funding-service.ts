import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface DonationVerificationData {
  userId: string;
  userName: string;
  userEmail: string;
  proofTextRaw: string;
  status: "pending" | "verified" | "rejected";
}

// Fungsi untuk mengirim hasil OCR struk donasi ke Firestore
export const addDonationVerification = async (data: DonationVerificationData) => {
  try {
    const docRef = await addDoc(collection(db, "donations_verification"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding donation verification: ", error);
    throw error;
  }
};