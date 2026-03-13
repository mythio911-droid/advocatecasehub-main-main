import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";
import { firebaseConfig } from "./firebase";

// Demo configurations
const DEMO_USERS = [
  { name: "Sr. Associate Sarah", email: "sarah@firm.com", role: "user", roleTitle: "Senior Associate" },
  { name: "Managing Partner Mike", email: "mike@firm.com", role: "admin", roleTitle: "Managing Partner" },
  { name: "Paralegal Paul", email: "paul@firm.com", role: "user", roleTitle: "Paralegal" },
];

const DEFAULT_PASSWORD = "Password123!";

/**
 * Creates 3 distinct users with predefined demo data.
 * It uses a secondary Firebase App instance to avoid logging out the current active Admin user.
 */
export const seedDemoData = async (onProgress: (msg: string) => void) => {
  // 1. Initialize a secondary, temporary Firebase app
  // This prevents `createUserWithEmailAndPassword` from changing the active Auth state of the main app
  const tempApp = initializeApp(firebaseConfig, "TempSeederApp_" + Date.now());
  const tempAuth = getAuth(tempApp);
  const db = getFirestore(tempApp);

  try {
    for (let i = 0; i < DEMO_USERS.length; i++) {
        const u = DEMO_USERS[i];
        onProgress(`Creating account for ${u.name}...`);
        
        // 2. Register the user in Auth
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(tempAuth, u.email, DEFAULT_PASSWORD);
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                onProgress(`Skipping Auth creation for ${u.name} (already exists). Demo data will fail if UID is required.`);
                continue;
            }
            throw e;
        }

        const uid = userCredential.user.uid;

        // 3. Create Profile Document
        onProgress(`Creating profile for ${u.name}...`);
        await setDoc(doc(db, "users", uid), {
            name: u.name,
            email: u.email,
            role: u.role,
            status: "approved", // auto-approve our demo users
            createdAt: new Date().toISOString()
        });

        // 4. Seed Cases
        onProgress(`Seeding Cases for ${u.name}...`);
        for (let c = 1; c <= 5; c++) {
            await addDoc(collection(db, "cases"), {
                userId: uid,
                title: `${u.roleTitle} Case ${c}`,
                caseNumber: `CS-${2024}-${1000 + i * 10 + c}`,
                client: `Demo Client ${c}`,
                type: c % 2 === 0 ? "Civil" : "Criminal",
                status: c === 1 ? "Closed" : "Active",
                nextHearing: new Date(Date.now() + c * 86400000).toISOString(),
                createdAt: new Date().toISOString()
            });
        }

        // 5. Seed Clients
        onProgress(`Seeding Clients for ${u.name}...`);
        for (let c = 1; c <= 5; c++) {
            await addDoc(collection(db, "clients"), {
                userId: uid,
                name: `Demo Client ${c}`,
                phone: `+1 555-010${c}`,
                email: `client${c}@demo.com`,
                status: c === 2 ? "Inactive" : "Active",
                cases: c,
                lastContact: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString()
            });
        }

        // 6. Seed Documents
        onProgress(`Seeding Documents for ${u.name}...`);
        const docTypes = ["PDF", "DOCX", "JPG"];
        for (let c = 1; c <= 5; c++) {
            await addDoc(collection(db, "documents"), {
                userId: uid,
                name: `Evidence_00${c}.${docTypes[c % 3]}`,
                type: docTypes[c % 3],
                case: `CS-${2024}-${1000 + i * 10 + (c%5 || 1)}`,
                client: `Demo Client ${c}`,
                size: `${(Math.random() * 5 + 0.1).toFixed(1)} MB`,
                date: new Date().toLocaleDateString(),
                category: c % 2 === 0 ? "Legal Filing" : "Evidence",
                createdAt: new Date().toISOString()
            });
        }

        // 7. Seed Calendar Events
        onProgress(`Seeding Calendar for ${u.name}...`);
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const eventTypes = ["hearing", "meeting", "deadline"];
        for (let c = 1; c <= 3; c++) {
            await addDoc(collection(db, "events"), {
                userId: uid,
                title: `${eventTypes[c-1].toUpperCase()}: ${u.name}`,
                type: eventTypes[c-1],
                time: `1${c}:00 PM`,
                dateKey: todayStr,
                caseId: `CS-${2024}-${1000 + i * 10 + c}`,
                createdAt: new Date().toISOString()
            });
        }
    }

    onProgress("Demo data seeding completed successfully!");
  } catch (error) {
    console.error("Seeding Error:", error);
    onProgress("Error during seeding. Check console.");
    throw error;
  }
};
