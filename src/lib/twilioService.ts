// Twilio SMS Service
// Credentials are stored here for demo purposes.
// In production, proxy these calls through a backend server to keep credentials secure.

const TWILIO_ACCOUNT_SID = "ACca2cf2656fce9a06be245503b97b4b02";
const TWILIO_AUTH_TOKEN = "640175e214b4b2671904f6b54067eeae";
const TWILIO_PHONE_NUMBER = "+16183483311"; // Your Twilio number (purchased & active)

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface NotificationLog {
    caseId: string;
    caseNumber: string;
    clientName: string;
    phone_number: string;
    message: string;
    status: "sent" | "failed";
    recipient_type: "client" | "advocate";
    sent_at?: any;
    error?: string;
}

/**
 * Send an SMS via Twilio REST API
 */
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", TWILIO_PHONE_NUMBER);
    formData.append("Body", body);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, sid: data.sid };
        } else {
            return { success: false, error: data.message || "Failed to send SMS" };
        }
    } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
    }
}

/**
 * Generate reminder message from template
 */
export function generateClientMessage(caseData: {
    clientName: string;
    caseNumber: string;
    courtName: string;
    advocateName: string;
    hearingDate: string;
}): string {
    return `Court Hearing Reminder ⚖️\n\nDear ${caseData.clientName},\n\nThis is a reminder that your court hearing is scheduled tomorrow.\n\nCase Number: ${caseData.caseNumber}\nCourt: ${caseData.courtName}\nAdvocate: ${caseData.advocateName}\nHearing Date: ${caseData.hearingDate}\n\nPlease ensure your presence.`;
}

export function generateAdvocateMessage(caseData: {
    caseNumber: string;
    clientName: string;
    courtName: string;
    hearingDate: string;
}): string {
    return `⚖️ Advocate Reminder\n\nYou have a hearing tomorrow.\n\nCase: ${caseData.caseNumber}\nClient: ${caseData.clientName}\nCourt: ${caseData.courtName}\nDate: ${caseData.hearingDate}`;
}

/**
 * Log a notification to Firestore
 */
export async function logNotification(log: NotificationLog, userId: string): Promise<void> {
    try {
        await addDoc(collection(db, "notifications"), {
            ...log,
            userId,
            sent_at: serverTimestamp(),
        });
    } catch (err) {
        console.error("Failed to log notification:", err);
    }
}

/**
 * Send reminder for a case and log the result
 */
export async function sendCaseReminder(
    caseData: {
        id: string;
        number: string;
        title: string;
        court: string;
        judge: string;
        hearing: string;
        clientName: string;
        clientPhone: string;
        advocateName?: string;
        advocatePhone?: string;
    },
    userId: string
): Promise<{ clientResult: any; advocateResult?: any }> {
    const hearingDate = caseData.hearing;

    // Send client reminder
    const clientMessage = generateClientMessage({
        clientName: caseData.clientName || "Client",
        caseNumber: caseData.number,
        courtName: caseData.court,
        advocateName: caseData.advocateName || "Your Advocate",
        hearingDate,
    });

    let clientResult: { success: boolean; sid?: string; error?: string } = { success: false, error: "No phone number" };
    if (caseData.clientPhone) {
        clientResult = await sendSMS(caseData.clientPhone, clientMessage);
        await logNotification(
            {
                caseId: caseData.id,
                caseNumber: caseData.number,
                clientName: caseData.clientName || "Client",
                phone_number: caseData.clientPhone,
                message: clientMessage,
                status: clientResult.success ? "sent" : "failed",
                recipient_type: "client",
                error: clientResult.error,
            },
            userId
        );
    }

    // Send advocate reminder if phone is provided
    let advocateResult: any = undefined;
    if (caseData.advocatePhone) {
        const advocateMessage = generateAdvocateMessage({
            caseNumber: caseData.number,
            clientName: caseData.clientName || "Client",
            courtName: caseData.court,
            hearingDate,
        });
        advocateResult = await sendSMS(caseData.advocatePhone, advocateMessage);
        await logNotification(
            {
                caseId: caseData.id,
                caseNumber: caseData.number,
                clientName: caseData.clientName || "Client",
                phone_number: caseData.advocatePhone,
                message: advocateMessage,
                status: advocateResult.success ? "sent" : "failed",
                recipient_type: "advocate",
                error: advocateResult.error,
            },
            userId
        );
    }

    return { clientResult, advocateResult };
}

/**
 * Check if a hearing date is tomorrow
 */
export function isHearingTomorrow(hearingDateStr: string): boolean {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        // Normalize the hearing date string to YYYY-MM-DD
        const normalized = new Date(hearingDateStr).toISOString().split("T")[0];
        return normalized === tomorrowStr;
    } catch {
        return false;
    }
}
