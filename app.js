import { db } from "./firebase.js";

import {
    doc,
    onSnapshot,
    updateDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/*
این نام باید دقیقاً با Document ID ساخته‌شده
در Firestore یکسان باشد.
*/
const studentRef = doc(db, "users", "kiamaher");

const defaultStatus = "🎹 Waiting for your performance...";


function showConnectionError(message) {
    const statusBox = document.getElementById("status");

    if (statusBox) {
        statusBox.textContent = message;
    }

    const adminMessage = document.getElementById("admin-message");

    if (adminMessage) {
        adminMessage.textContent = message;
        adminMessage.className = "admin-message error";
    }
}


function showAdminMessage(message) {
    const adminMessage = document.getElementById("admin-message");

    if (adminMessage) {
        adminMessage.textContent = message;
        adminMessage.className = "admin-message success";
    }
}


/*
دریافت زنده اطلاعات دانش‌آموز از Firestore
*/
onSnapshot(
    studentRef,

    (snapshot) => {
        if (!snapshot.exists()) {
            showConnectionError(
                "Student profile was not found in Firebase."
            );
            return;
        }

        const student = snapshot.data();

        const statusBox = document.getElementById("status");

        if (statusBox) {
            statusBox.textContent =
                student.musicStatus || defaultStatus;
        }

        const scoreBox = document.getElementById("score");

        if ( const scoreBox = document.getElementById("score");

        if (scoreBox) {
            const xp = Number(student.xp) || scoreBox) {
            const xp = Number(student.xp) || 0;
            scoreBox.textContent = `${xp} XP`;
        }

       0;
            scoreBox.textContent = `${xp} XP`;
        }

        const levelBox = document.getElementById("level");

        if (levelBox) {
 const levelBox = document.getElementById("level");

        if (levelBox) {
            const level = Number(student.level) ||             const level = Number(student.level) || 1;
            levelBox.textContent = `⭐ Level ${level}`;
        }
   1;
            levelBox.textContent = `⭐ Level ${level}`;
        }
    },

    (error) => {
        console.error("Firestore },

    (error) => {
        console.error("Firestore listener error:", error);

        showConnectionError(
            "Unable to connect listener error:", error);

        showConnectionError(
            "Unable to connect to the academy database to the academy database."
        );
    }
);


/*
تغییر وضعیت اجرا از پنل مادر
*/
window.changeStatus = async function changeStatus(newStatus) {
    try {
        await updateDoc(studentRef, {
            musicStatus: newStatus,
            updatedAt: serverTimestamp()
        });

        showAdminMessage("Performance status updated successfully.");
    } catch (error) {
        console.error("Status update error:", error);

        showConnectionError(
            "The performance status could not be updated."
        );

        throw error;
    }
};


/*
تأیید اجرا و افزایش امتیاز
*/
window.approveScore = async function approveScore(points) {
    const numericPoints = Number(points);

    if (
        !Number.isFinite(numericPoints) ||
        numericPoints <= 0
    ) {
        showConnectionError("The XP value is not valid.");
        return;
    }

    try {
        await updateDoc(studentRef, {
            musicStatus:
                "🎉 Congratulations! Your :contentReference[oaicite:1]{index=1}   xp: increment(numericPoints),

            updatedAt: serverTimestamp()
        });

        showAdminMessage(
            `Performance approved. +${numericPoints} XP awarded.`
        );
    } catch (error) {
        console.error("Approval error:", error);

        showConnectionError(
            "The performance could not be approved."
        );

        throw error;
    }
};
