import { db } from "./firebase.js";

import {
    doc,
    onSnapshot,
    setDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const STUDENT_ID = "kiamaher";
const PARENT_PASSWORD = "1234";

const studentRef = doc(db, "users", STUDENT_ID);


/* =========================
   General helpers
========================= */

function getElement(id) {
    return document.getElementById(id);
}


function showAdminMessage(message, type = "success") {
    const messageBox = getElement("admin-message");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `admin-message ${type}`;
}


function setButtonsDisabled(disabled) {
    const buttonIds = [
        "listening-button",
        "reviewing-button",
        "approve-button"
    ];

    buttonIds.forEach((id) => {
        const button = getElement(id);

        if (button) {
            button.disabled = disabled;
        }
    });
}


/* =========================
   Live Firestore listener
========================= */

function startStudentListener() {
    onSnapshot(
        studentRef,

        (snapshot) => {
            if (!snapshot.exists()) {
                const statusBox = getElement("status");

                if (statusBox) {
                    statusBox.textContent =
                        "Student profile was not found.";
                }

                showAdminMessage(
                    "Student document was not found in Firestore.",
                    "error"
                );

                return;
            }

            const student = snapshot.data();

            const status =
                student.musicStatus ||
                "🎹 Waiting for your performance...";

            const xp = Number(student.xp) || 0;
            const level = Number(student.level) || 1;

            const statusBox = getElement("status");
            const scoreBox = getElement("score");
            const levelBox = getElement("level");
            const progressBar = getElement("progress");

            if (statusBox) {
                statusBox.textContent = status;
            }

            if (scoreBox) {
                scoreBox.textContent = `${xp} XP`;
            }

            if (levelBox) {
                levelBox.textContent = `⭐ Level ${level}`;
            }

            if (progressBar) {
                const progressPercent =
                    Math.min((xp % 500) / 5, 100);

                progressBar.style.width =
                    `${progressPercent}%`;
            }

            console.log(
                "Live Firebase data received:",
                student
            );
        },

        (error) => {
            console.error(
                "Firestore listener error:",
                error
            );

            const statusBox = getElement("status");

            if (statusBox) {
                statusBox.textContent =
                    "Unable to connect to Firebase.";
            }

            showAdminMessage(
                `Firebase read error: ${error.message}`,
                "error"
            );
        }
    );
}


/* =========================
   Firebase write functions
========================= */

async function updatePerformanceStatus(newStatus) {
    try {
        setButtonsDisabled(true);

        showAdminMessage(
            "Updating performance status...",
            "loading"
        );

        await setDoc(
            studentRef,
            {
                musicStatus: newStatus,
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

        showAdminMessage(
            "Performance status updated successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Firebase write error:",
            error
        );

        showAdminMessage(
            `Firebase write error: ${error.message}`,
            "error"
        );
    } finally {
        setButtonsDisabled(false);
    }
}


async function approvePerformance() {
    try {
        setButtonsDisabled(true);

        showAdminMessage(
            "Approving performance...",
            "loading"
        );

        await setDoc(
            studentRef,
            {
                musicStatus:
                    "🎉 Congratulations! Your performance has been approved.",

                xp: increment(50),

                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

        showAdminMessage(
            "Performance approved. Kiamahr earned 50 XP!",
            "success"
        );
    } catch (error) {
        console.error(
            "Firebase approval error:",
            error
        );

        showAdminMessage(
            `Firebase approval error: ${error.message}`,
            "error"
        );
    } finally {
        setButtonsDisabled(false);
    }
}


/* =========================
   Parent login
========================= */

function loginParent() {
    const passwordInput =
        getElement("password");

    const loginCard =
        getElement("login-card");

    const parentPanel =
        getElement("parent-panel");

    if (!passwordInput || !parentPanel) {
        return;
    }

    if (passwordInput.value === PARENT_PASSWORD) {
        parentPanel.hidden = false;

        if (loginCard) {
            loginCard.hidden = true;
        }

        showAdminMessage(
            "Parent panel unlocked.",
            "success"
        );
    } else {
        showAdminMessage(
            "Wrong password. Please try again.",
            "error"
        );

        passwordInput.value = "";
        passwordInput.focus();
    }
}


/* =========================
   Page initialization
========================= */

function initializePage() {
    startStudentListener();

    const loginButton =
        getElement("login-button");

    const passwordInput =
        getElement("password");

    const listeningButton =
        getElement("listening-button");

    const reviewingButton =
        getElement("reviewing-button");

    const approveButton =
        getElement("approve-button");

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            loginParent
        );
    }

    if (passwordInput) {
        passwordInput.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Enter") {
                    loginParent();
                }
            }
        );
    }

    if (listeningButton) {
        listeningButton.addEventListener(
            "click",
            () => {
                updatePerformanceStatus(
                    "🎧 We are listening to your performance..."
                );
            }
        );
    }

    if (reviewingButton) {
        reviewingButton.addEventListener(
            "click",
            () => {
                updatePerformanceStatus(
                    "🔍 Your rhythm and accuracy are being reviewed..."
                );
            }
        );
    }

    if (approveButton) {
        approveButton.addEventListener(
            "click",
            approvePerformance
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    initializePage
);
