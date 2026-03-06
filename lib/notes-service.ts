import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "./firebase";

export interface SubTask {
  id: string;
  text: string;
  isCompleted: boolean;
  time?: string; 
}

// --- TAMBAHAN TIPE DATA UNTUK KOLABORATOR ---
export interface Collaborator {
  email: string;
  role: 'viewer' | 'editor';
}

export interface NoteData {
  title: string;
  content: string; 
  tags: string[];
  isTodo: boolean;
  dueDate?: string | null;
  dueTime?: string | null; 
  recurrence?: string; 
  isHidden?: boolean; 
  isPinned?: boolean; 
  isCompleted?: boolean;
  subTasks?: SubTask[]; 
  status?: 'todo' | 'in-progress' | 'done'; 
  mindmapCode?: string[] | null; 
  parentId?: string | null; 
  flashcards?: any[] | null; 
  collaborators?: Collaborator[]; // <-- DIDAFTARKAN DI SINI
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface HabitData {
  id?: string;
  userId: string;
  title: string;
  icon: string; 
  color: string; 
  completedDates: string[]; 
  createdAt?: any;
}

export interface FocusSession {
  id?: string;
  userId: string;
  durationMinutes: number; 
  completedAt: string; 
}

// --- FUNGSI CRUD CATATAN & TUGAS ---
export const addNote = async (data: NoteData) => {
  try {
    const docRef = await addDoc(collection(db, "notes"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding note: ", error);
    throw error;
  }
};

// FIX: Tambahkan parameter userEmail untuk menarik catatan kolaborasi
export const getUserNotes = async (userId: string, userEmail?: string) => {
  try {
    const notesRef = collection(db, "notes");
    
    // Query 1: Tarik semua catatan milik user sendiri
    const q1 = query(notesRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot1 = await getDocs(q1);
    
    const myNotes = snapshot1.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    let collabNotes: any[] = [];

    // Query 2: Tarik catatan di mana user diundang sebagai kolaborator
    // Karena Firestore sulit melakukan query array of objects secara kompleks, 
    // kita tarik semua data yang mengandung kata kunci email (nanti kita filter manual di client jika perlu)
    if (userEmail) {
      // Kita pakai pendekatan paling aman: Tarik catatan yang BUKAN milik kita
      const q2 = query(notesRef, where("userId", "!=", userId));
      const snapshot2 = await getDocs(q2);
      
      const potentialCollabs = snapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Filter manual di sisi klien (karena jumlah data tidak sampai puluhan ribu, ini sangat cepat)
      collabNotes = potentialCollabs.filter(note => 
        note.collaborators && 
        Array.isArray(note.collaborators) && 
        note.collaborators.some((c: any) => c.email === userEmail)
      );
    }

    // Gabungkan hasilnya
    return [...myNotes, ...collabNotes];

  } catch (error) {
    console.error("Error getting notes: ", error);
    throw error;
  }
};

export const deleteNote = async (noteId: string) => {
  try {
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    console.error("Error deleting note: ", error);
    throw error;
  }
};

export const getNote = async (noteId: string) => {
  try {
    const docRef = doc(db, "notes", noteId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as NoteData & { id: string };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting note: ", error);
    throw error;
  }
};

export const updateNote = async (noteId: string, data: Partial<NoteData>) => {
  try {
    const docRef = doc(db, "notes", noteId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating note: ", error);
    throw error;
  }
};

// --- FUNGSI CRUD HABIT ---
export const addHabit = async (data: HabitData) => {
  try {
    const docRef = await addDoc(collection(db, "habits"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding habit: ", error);
    throw error;
  }
};

export const getUserHabits = async (userId: string) => {
  try {
    const q = query(
      collection(db, "habits"),
      where("userId", "==", userId),
      orderBy("createdAt", "asc") 
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as HabitData[];
  } catch (error) {
    console.error("Error getting habits: ", error);
    throw error;
  }
};

export const updateHabit = async (habitId: string, data: Partial<HabitData>) => {
  try {
    const docRef = doc(db, "habits", habitId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating habit: ", error);
    throw error;
  }
};

export const deleteHabit = async (habitId: string) => {
  try {
    await deleteDoc(doc(db, "habits", habitId));
  } catch (error) {
    console.error("Error deleting habit: ", error);
    throw error;
  }
};

// --- FUNGSI CRUD FOCUS SESSIONS ---
export const addFocusSession = async (data: FocusSession) => {
  try {
    const docRef = await addDoc(collection(db, "focus_sessions"), {
      ...data,
      timestamp: serverTimestamp(), 
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding focus session: ", error);
    throw error;
  }
};

export const getUserFocusSessions = async (userId: string) => {
  try {
    const q = query(
      collection(db, "focus_sessions"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FocusSession[];
  } catch (error) {
    console.error("Error getting focus sessions: ", error);
    throw error;
  }
};

export interface GraphNodeData {
  id: string;
  title: string;
  tags: string[];
  links: string[];
  parentId?: string | null; 
}

export const getUserNotesGraphData = async (userId: string): Promise<GraphNodeData[]> => {
  try {
    const q = query(
      collection(db, "notes"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const content = data.content || "";
      
      const links: string[] = [];
      const regex = /data-id="([^"]+)"/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const targetId = match[1];
        if (targetId !== doc.id && !links.includes(targetId)) {
          links.push(targetId);
        }
      }

      return {
        id: doc.id,
        title: data.title || "Tanpa Judul",
        tags: data.tags || [],
        links: links,
        parentId: data.parentId || null
      };
    });
  } catch (error) {
    console.error("Error getting notes graph data: ", error);
    throw error;
  }
};