import { db } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const STUDENT_ID = "kiamaher";
const XP_PER_LEVEL = 500;

const studentRef = doc(
    db,
    "users",
    STUDENT_ID
);


// ========================================
// Helpers
// ========================================

function getElement(id) {
    return document.getElementById(id);
}


function getNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


function setParentMessage(message, type = "success") {
    const messageBox = getElement("message");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `message-${type}`;
}


function getSelectValue(id) {
    const element = getElement(id);

    if (!element) {
        return 0;
    }

    return getNumber(element.value);
}


function getSelectText(id) {
    const element = getElement(id);

    if (!element) {
        return "None";
    }

    const option =
        element.options[element.selectedIndex];

    return option
        ? option.textContent
            .replace(/\s+/g, " ")
            .trim()
        : "None";
}


// ========================================
// Level System
// ========================================

function calculateLevelData(totalXP) {
    const safeXP = Math.max(
        0,
        getNumber(totalXP)
    );

    const level =
        Math.floor(
            safeXP / XP_PER_LEVEL
        ) + 1;

    const xpInCurrentLevel =
        safeXP % XP_PER_LEVEL;

    const progressPercent =
        (
            xpInCurrentLevel /
            XP_PER_LEVEL
        ) * 100;

    return {
        totalXP: safeXP,
        level,
        xpInCurrentLevel,
        progressPercent
    };
}


// ========================================
// Status Animation
// ========================================

function updateStatusAnimation(statusText) {
    const statusBox =
        getElement("status-box");

    const statusIcon =
        getElement("status-icon");

    if (!statusBox || !statusIcon) {
        return;
    }

    statusBox.classList.remove(
        "status-connecting",
        "status-listening",
        "status-reviewing",
        "status-approved"
    );

    statusIcon.classList.remove(
        "status-connecting-icon",
        "status-listening-icon",
        "status-reviewing-icon",
        "status-approved-icon"
    );

    const text = String(
        statusText || ""
    ).toLowerCase();

    if (text.includes("listening")) {
        statusBox.classList.add(
            "status-listening"
        );

        statusIcon.classList.add(
            "status-listening-icon"
        );

        statusIcon.textContent = "🎧";
        return;
    }

    if (
        text.includes("review") ||
        text.includes("accuracy")
    ) {
        statusBox.classList.add(
            "status-reviewing"
        );

        statusIcon.classList.add(
            "status-reviewing-icon"
        );

        statusIcon.textContent = "🔍";
        return;
    }

    if (
        text.includes("approved") ||
        text.includes("congratulations")
    ) {
        statusBox.classList.add(
            "status-approved"
        );

        statusIcon.classList.add(
            "status-approved-icon"
        );

        statusIcon.textContent = "🏆";
        return;
    }

    statusBox.classList.add(
        "status-connecting"
    );

    statusIcon.classList.add(
        "status-connecting-icon"
    );

    statusIcon.textContent = "♪";
}


// ========================================
// Report Card
// ========================================

function setReportRow(
    rowId,
    valueId,
    value,
    shouldShow = true
) {
    const row = getElement(rowId);
    const valueBox = getElement(valueId);

    if (!row || !valueBox) {
        return;
    }

    row.hidden = !shouldShow;

    if (shouldShow) {
        valueBox.textContent = value;
    }
}


function renderLatestReport(report) {
    const emptyBox =
        getElement("report-empty");

    const contentBox =
        getElement("report-content");

    if (!emptyBox || !contentBox) {
        return;
    }

    if (!report) {
        emptyBox.hidden = false;
        contentBox.hidden = true;
        return;
    }

    emptyBox.hidden = true;
    contentBox.hidden = false;

    const song =
        report.song ||
        "Practice Session";

    const performanceXP =
        getNumber(report.performanceXP);

    const repetitionXP =
        getNumber(report.repetitionXP);

    const difficultyMultiplier =
        getNumber(
            report.difficultyMultiplier
        ) || 1;

    const rhythmXP =
        getNumber(report.rhythmXP);

    const notesXP =
        getNumber(report.notesXP);

    const expressionXP =
        getNumber(report.expressionXP);

    const bonusXP =
        getNumber(report.bonusXP);

    const finalXP =
        getNumber(
            report.finalXP ??
            report.totalXP
        );

    const reward =
        getNumber(report.reward);

    setReportRow(
        "report-song-row",
        "report-song",
        song,
        true
    );

    setReportRow(
        "report-performance-row",
        "report-performance",
        report.performanceLabel ||
        `${performanceXP} XP`,
        performanceXP !== 0
    );

    setReportRow(
        "report-repetition-row",
        "report-repetition",
        report.repetitionLabel ||
        `${repetitionXP} XP`,
        repetitionXP !== 0
    );

    setReportRow(
        "report-difficulty-row",
        "report-difficulty",
        report.difficultyLabel ||
        `×${difficultyMultiplier}`,
        true
    );

    const bonusLabels =
        Array.isArray(report.bonusLabels)
            ? report.bonusLabels
            : [];

    setReportRow(
        "report-bonus-row",
        "report-bonus",
        bonusLabels.length > 0
            ? bonusLabels.join(" • ")
            : `${bonusXP} XP`,
        bonusXP !== 0 ||
        bonusLabels.length > 0
    );

    setReportRow(
        "report-rhythm-row",
        "report-rhythm",
        report.rhythmLabel ||
        `${rhythmXP} XP`,
        rhythmXP !== 0
    );

    setReportRow(
        "report-notes-row",
        "report-notes",
        report.notesLabel ||
        `${notesXP} XP`,
        notesXP !== 0
    );

    setReportRow(
        "report-expression-row",
        "report-expression",
        report.expressionLabel ||
        `${expressionXP} XP`,
        expressionXP !== 0
    );

    const totalXPBox =
        getElement("report-total-xp");

    const rewardBox =
        getElement("report-reward");

    if (totalXPBox) {
        totalXPBox.textContent =
            finalXP.toLocaleString();
    }

    if (rewardBox) {
        rewardBox.textContent =
            reward.toLocaleString();
    }
}


// ========================================
// Update Academy Page
// ========================================

function updateAcademyPage(student) {
    const currentStatus =
        student.musicStatus ||
        "🎹 Waiting for your performance...";

    const levelData =
        calculateLevelData(student.xp);

    const statusBox =
        getElement("status");

    const scoreBox =
        getElement("score");

    const levelBox =
        getElement("level");

    const progressBar =
        getElement("progress");

    const progressText =
        getElement("progress-text");

    if (statusBox) {
        statusBox.textContent =
            currentStatus;
    }

    if (scoreBox) {
        scoreBox.textContent =
            `${levelData.totalXP.toLocaleString()} XP`;
    }

    if (levelBox) {
        levelBox.textContent =
            `⭐ Level ${levelData.level}`;
    }

    if (progressBar) {
        progressBar.style.width =
            `${levelData.progressPercent}%`;
    }

    if (progressText) {
        progressText.textContent =
            `${levelData.xpInCurrentLevel} / ${XP_PER_LEVEL} XP`;
    }

    updateStatusAnimation(
        currentStatus
    );

    renderLatestReport(
        student.latestReport
    );
}


// ========================================
// Firebase Live Listener
// ========================================

function startStudentListener() {
    onSnapshot(
        studentRef,

        function (snapshot) {
            if (!snapshot.exists()) {
                console.error(
                    "Student document does not exist."
                );

                setParentMessage(
                    "Student profile does not exist.",
                    "error"
                );

                return;
            }

            const student =
                snapshot.data();

            updateAcademyPage(student);

            console.log(
                "Firebase data received:",
                student
            );
        },

        function (error) {
            console.error(
                "Firebase listener error:",
                error
            );

            setParentMessage(
                `Firebase error: ${error.message}`,
                "error"
            );
        }
    );
}


// ========================================
// Change Status
// ========================================

window.changeStatus =
async function changeStatus(newStatus) {
    try {
        await setDoc(
            studentRef,
            {
                musicStatus: newStatus,
                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        setParentMessage(
            "Performance status updated.",
            "success"
        );
    } catch (error) {
        console.error(
            "Status update error:",
            error
        );

        setParentMessage(
            `Status update failed: ${error.message}`,
            "error"
        );

        alert(
            `Status update failed:\n${error.message}`
        );
    }
};


// ========================================
// Bonuses
// ========================================

function getBonusData() {
    const checkedBonuses =
        Array.from(
            document.querySelectorAll(
                ".bonus:checked"
            )
        );

    let bonusXP = 0;
    const bonusLabels = [];

    checkedBonuses.forEach(
        function (checkbox) {
            bonusXP +=
                getNumber(checkbox.value);

            const label =
                checkbox.closest("label");

            if (label) {
                bonusLabels.push(
                    label.textContent
                        .replace(/\s+/g, " ")
                        .trim()
                );
            }
        }
    );

    return {
        bonusXP,
        bonusLabels
    };
}


// ========================================
// Calculate Form
// ========================================

function calculatePerformance() {
    const performanceXP =
        getSelectValue("performance");

    const repetitionXP =
        getSelectValue("repetition");

    let difficultyMultiplier =
        getSelectValue("difficulty");

    const rhythmXP =
        getSelectValue("rhythm");

    const notesXP =
        getSelectValue("notes");

    const expressionXP =
        getSelectValue("expression");

    if (difficultyMultiplier <= 0) {
        difficultyMultiplier = 1;
    }

    const {
        bonusXP,
        bonusLabels
    } = getBonusData();

    const subtotal =
        performanceXP +
        repetitionXP +
        rhythmXP +
        notesXP +
        expressionXP +
        bonusXP;

    const finalXP = Math.max(
        0,
        Math.round(
            subtotal *
            difficultyMultiplier
        )
    );

    const reward =
        finalXP * 100;

    return {
        performanceXP,
        performanceLabel:
            getSelectText("performance"),

        repetitionXP,
        repetitionLabel:
            getSelectText("repetition"),

        difficultyMultiplier,
        difficultyLabel:
            getSelectText("difficulty"),

        rhythmXP,
        rhythmLabel:
            getSelectText("rhythm"),

        notesXP,
        notesLabel:
            getSelectText("notes"),

        expressionXP,
        expressionLabel:
            getSelectText("expression"),

        bonusXP,
        bonusLabels,

        subtotal,
        finalXP,
        reward
    };
}


function calculateXP() {
    const result =
        calculatePerformance();

    const finalXPBox =
        getElement("final-xp");

    const rewardBox =
        getElement("reward");

    if (finalXPBox) {
        finalXPBox.textContent =
            result.finalXP.toLocaleString();
    }

    if (rewardBox) {
        rewardBox.textContent =
            result.reward.toLocaleString();
    }

    setParentMessage(
        `Calculated: ${result.finalXP.toLocaleString()} XP`,
        "success"
    );

    return result;
}


// ========================================
// Save Performance
// ========================================

async function savePerformance() {
    const saveButton =
        getElement("save-button");

    try {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                "Saving...";
        }

        setParentMessage(
            "Saving performance...",
            "loading"
        );

        const result =
            calculatePerformance();

        const songInput =
            getElement("song-name");

        const song =
            songInput?.value.trim() ||
            "Practice Session";

        const studentSnapshot =
            await getDoc(studentRef);

        if (!studentSnapshot.exists()) {
            throw new Error(
                "Student profile does not exist."
            );
        }

        const student =
            studentSnapshot.data();

        const currentXP =
            Math.max(
                0,
                getNumber(student.xp)
            );

        const currentMoney =
            Math.max(
                0,
                getNumber(
                    student.moneyBalance
                )
            );

        const currentEarnedMoney =
            Math.max(
                0,
                getNumber(
                    student.totalEarnedMoney
                )
            );

        const currentPerformances =
            Math.max(
                0,
                getNumber(
                    student.totalPerformances
                )
            );

        const newTotalXP =
            currentXP +
            result.finalXP;

        const newLevelData =
            calculateLevelData(
                newTotalXP
            );

        const report = {
            studentId: STUDENT_ID,

            song,

            performanceXP:
                result.performanceXP,

            performanceLabel:
                result.performanceLabel,

            repetitionXP:
                result.repetitionXP,

            repetitionLabel:
                result.repetitionLabel,

            difficultyMultiplier:
                result.difficultyMultiplier,

            difficultyLabel:
                result.difficultyLabel,

            rhythmXP:
                result.rhythmXP,

            rhythmLabel:
                result.rhythmLabel,

            notesXP:
                result.notesXP,

            notesLabel:
                result.notesLabel,

            expressionXP:
                result.expressionXP,

            expressionLabel:
                result.expressionLabel,

            bonusXP:
                result.bonusXP,

            bonusLabels:
                result.bonusLabels,

            subtotal:
                result.subtotal,

            finalXP:
                result.finalXP,

            reward:
                result.reward,

            totalXPAfterSave:
                newTotalXP,

            levelAfterSave:
                newLevelData.level,

            savedAt:
                Date.now()
        };

        const logRef = doc(
            collection(
                db,
                "performanceLogs"
            )
        );

        const batch =
            writeBatch(db);

        batch.set(
            logRef,
            {
                ...report,
                createdAt:
                    serverTimestamp()
            }
        );

        batch.set(
            studentRef,
            {
                xp:
                    newTotalXP,

                level:
                    newLevelData.level,

                moneyBalance:
                    currentMoney +
                    result.reward,

                totalEarnedMoney:
                    currentEarnedMoney +
                    result.reward,

                totalPerformances:
                    currentPerformances + 1,

                latestReport:
                    report,

                musicStatus:
                    "🎉 Congratulations! Your performance has been approved.",

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        await batch.commit();

        const finalXPBox =
            getElement("final-xp");

        const rewardBox =
            getElement("reward");

        if (finalXPBox) {
            finalXPBox.textContent =
                result.finalXP.toLocaleString();
        }

        if (rewardBox) {
            rewardBox.textContent =
                result.reward.toLocaleString();
        }

        setParentMessage(
            `Saved successfully: +${result.finalXP.toLocaleString()} XP | Total: ${newTotalXP.toLocaleString()} XP | Level ${newLevelData.level}`,
            "success"
        );

        alert(
            `Performance saved successfully!\n\n` +
            `Added XP: ${result.finalXP.toLocaleString()}\n` +
            `Total XP: ${newTotalXP.toLocaleString()}\n` +
            `Level: ${newLevelData.level}`
        );

        console.log(
            "Performance saved:",
            report
        );
    } catch (error) {
        console.error(
            "Save performance error:",
            error
        );

        setParentMessage(
            `Save failed: ${error.message}`,
            "error"
        );

        alert(
            `Save failed:\n${error.message}`
        );
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent =
                "Save Performance";
        }
    }
}


// ========================================
// Parent Panel
// ========================================

function initializeParentPanel() {
    const loginButton =
        getElement("login-button");

    const passwordInput =
        getElement("password");

    const loginCard =
        getElement("login-card");

    const parentPanel =
        getElement("parent-panel");

    const listeningButton =
        getElement("listening-button");

    const reviewingButton =
        getElement("reviewing-button");

    const calculateButton =
        getElement("calculate-button");

    const saveButton =
        getElement("save-button");

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            function () {
                if (
                    passwordInput?.value ===
                    "1234"
                ) {
                    if (loginCard) {
                        loginCard.style.display =
                            "none";
                    }

                    if (parentPanel) {
                        parentPanel.style.display =
                            "block";
                    }

                    setParentMessage(
                        "Parent panel unlocked.",
                        "success"
                    );
                } else {
                    alert("Wrong password");
                }
            }
        );
    }

    if (passwordInput) {
        passwordInput.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Enter" &&
                    loginButton
                ) {
                    loginButton.click();
                }
            }
        );
    }

    if (listeningButton) {
        listeningButton.addEventListener(
            "click",
            function () {
                window.changeStatus(
                    "🎧 We are listening to your performance..."
                );
            }
        );
    }

    if (reviewingButton) {
        reviewingButton.addEventListener(
            "click",
            function () {
                window.changeStatus(
                    "🔍 Your rhythm and accuracy are being reviewed..."
                );
            }
        );
    }

    if (calculateButton) {
        calculateButton.addEventListener(
            "click",
            calculateXP
        );
    }

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            savePerformance
        );
    }

    console.log(
        "Parent controls:",
        {
            loginButton:
                Boolean(loginButton),

            calculateButton:
                Boolean(calculateButton),

            saveButton:
                Boolean(saveButton)
        }
    );
}


// ========================================
// Start
// ========================================

let appStarted = false;

function startApplication() {
    if (appStarted) {
        return;
    }

    appStarted = true;

    startStudentListener();
    initializeParentPanel();

    console.log(
        "app.js loaded successfully."
    );
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startApplication
    );
} else {
    startApplication();
}
