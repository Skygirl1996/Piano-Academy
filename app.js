import { db } from "./firebase.js";

import {
    collection,
    doc,
    onSnapshot,
    runTransaction,
    serverTimestamp,
    setDoc
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

    return Number(element.value) || 0;
}


function getSelectText(id) {
    const element = getElement(id);

    if (!element) {
        return "None";
    }

    return (
        element.options[element.selectedIndex]
            ?.textContent
            .replace(/\s+/g, " ")
            .trim() || "None"
    );
}


// ========================================
// Level System
// ========================================

function calculateLevelData(totalXP) {
    const safeXP = Math.max(
        0,
        Number(totalXP) || 0
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

    const xpRemaining =
        XP_PER_LEVEL -
        xpInCurrentLevel;

    return {
        totalXP: safeXP,
        level,
        xpInCurrentLevel,
        progressPercent,
        xpRemaining
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
// Update Child Academy Page
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

    const currentLevelXP =
        getElement("current-level-xp");

    const nextLevelXP =
        getElement("next-level-xp");

    if (statusBox) {
        statusBox.textContent =
            currentStatus;
    }

    /*
    امتیاز کل کودک
    */
    if (scoreBox) {
        scoreBox.textContent =
            `${levelData.totalXP.toLocaleString()} XP`;
    }

    /*
    Level محاسبه‌شده از روی XP
    */
    if (levelBox) {
        levelBox.textContent =
            `⭐ Level ${levelData.level}`;
    }

    /*
    نوار پیشرفت Level فعلی
    */
    if (progressBar) {
        progressBar.style.width =
            `${levelData.progressPercent}%`;

        progressBar.setAttribute(
            "aria-valuenow",
            String(
                Math.round(
                    levelData.progressPercent
                )
            )
        );
    }

    /*
    این بخش‌ها اختیاری هستند.
    اگر در HTML وجود داشته باشند آپدیت می‌شوند.
    */
    if (progressText) {
        progressText.textContent =
            `${levelData.xpInCurrentLevel} / ${XP_PER_LEVEL} XP`;
    }

    if (currentLevelXP) {
        currentLevelXP.textContent =
            levelData.xpInCurrentLevel;
    }

    if (nextLevelXP) {
        nextLevelXP.textContent =
            XP_PER_LEVEL;
    }

    updateStatusAnimation(
        currentStatus
    );
}


// ========================================
// Live Firebase Listener
// ========================================

function startStudentListener() {
    onSnapshot(
        studentRef,

        function (snapshot) {
            if (!snapshot.exists()) {
                console.error(
                    "Student document does not exist."
                );

                const statusBox =
                    getElement("status");

                if (statusBox) {
                    statusBox.textContent =
                        "Student profile was not found.";
                }

                return;
            }

            const student =
                snapshot.data();

            updateAcademyPage(student);

            console.log(
                "Firebase student updated:",
                student
            );
        },

        function (error) {
            console.error(
                "Firebase listener error:",
                error
            );

            const statusBox =
                getElement("status");

            if (statusBox) {
                statusBox.textContent =
                    `Firebase error: ${error.message}`;
            }

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

    const bonusXP =
        checkedBonuses.reduce(
            function (total, item) {
                return (
                    total +
                    Number(item.value)
                );
            },
            0
        );

    const bonusLabels =
        checkedBonuses.map(
            function (item) {
                return (
                    item
                        .closest("label")
                        ?.textContent
                        .replace(/\s+/g, " ")
                        .trim() ||
                    "Bonus"
                );
            }
        );

    return {
        bonusXP,
        bonusLabels
    };
}


// ========================================
// Calculate Performance XP
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

    const xpBox =
        getElement("final-xp");

    const rewardBox =
        getElement("reward");

    if (xpBox) {
        xpBox.textContent =
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

        const latestReport = {
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

            savedAt:
                Date.now()
        };

        const logRef = doc(
            collection(
                db,
                "performanceLogs"
            )
        );

        const savedResult =
            await runTransaction(
                db,

                async function (transaction) {
                    const studentSnapshot =
                        await transaction.get(
                            studentRef
                        );

                    if (
                        !studentSnapshot.exists()
                    ) {
                        throw new Error(
                            "Student profile does not exist."
                        );
                    }

                    const student =
                        studentSnapshot.data();

                    const currentXP =
                        Math.max(
                            0,
                            Number(student.xp) || 0
                        );

                    const currentMoney =
                        Math.max(
                            0,
                            Number(
                                student.moneyBalance
                            ) || 0
                        );

                    const totalEarnedMoney =
                        Math.max(
                            0,
                            Number(
                                student.totalEarnedMoney
                            ) || 0
                        );

                    const totalPerformances =
                        Math.max(
                            0,
                            Number(
                                student.totalPerformances
                            ) || 0
                        );

                    const newTotalXP =
                        currentXP +
                        result.finalXP;

                    const newLevelData =
                        calculateLevelData(
                            newTotalXP
                        );

                    const newMoneyBalance =
                        currentMoney +
                        result.reward;

                    const newTotalEarned =
                        totalEarnedMoney +
                        result.reward;

                    transaction.set(
                        logRef,
                        {
                            studentId:
                                STUDENT_ID,

                            previousXP:
                                currentXP,

                            newTotalXP,

                            level:
                                newLevelData.level,

                            ...latestReport,

                            createdAt:
                                serverTimestamp()
                        }
                    );

                    transaction.set(
                        studentRef,
                        {
                            xp:
                                newTotalXP,

                            level:
                                newLevelData.level,

                            moneyBalance:
                                newMoneyBalance,

                            totalEarnedMoney:
                                newTotalEarned,

                            totalPerformances:
                                totalPerformances + 1,

                            latestReport,

                            musicStatus:
                                "🎉 Congratulations! Your performance has been approved.",

                            updatedAt:
                                serverTimestamp()
                        },
                        {
                            merge: true
                        }
                    );

                    return {
                        previousXP:
                            currentXP,

                        addedXP:
                            result.finalXP,

                        totalXP:
                            newTotalXP,

                        level:
                            newLevelData.level,

                        levelXP:
                            newLevelData
                                .xpInCurrentLevel,

                        reward:
                            result.reward
                    };
                }
            );

        const xpBox =
            getElement("final-xp");

        const rewardBox =
            getElement("reward");

        if (xpBox) {
            xpBox.textContent =
                result.finalXP.toLocaleString();
        }

        if (rewardBox) {
            rewardBox.textContent =
                result.reward.toLocaleString();
        }

        setParentMessage(
            `Saved: +${savedResult.addedXP.toLocaleString()} XP | Total: ${savedResult.totalXP.toLocaleString()} XP | Level ${savedResult.level}`,
            "success"
        );

        alert(
            `Performance saved successfully!\n\n` +
            `Added XP: ${savedResult.addedXP.toLocaleString()}\n` +
            `Total XP: ${savedResult.totalXP.toLocaleString()}\n` +
            `Level: ${savedResult.level}\n` +
            `Level progress: ${savedResult.levelXP} / ${XP_PER_LEVEL} XP`
        );

        console.log(
            "Performance saved:",
            savedResult
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
// Compatibility: Manual XP Approval
// ========================================

window.approveScore =
async function approveScore(points) {
    const addedXP = Math.max(
        0,
        Number(points) || 0
    );

    try {
        const result =
            await runTransaction(
                db,

                async function (transaction) {
                    const snapshot =
                        await transaction.get(
                            studentRef
                        );

                    if (!snapshot.exists()) {
                        throw new Error(
                            "Student profile does not exist."
                        );
                    }

                    const student =
                        snapshot.data();

                    const currentXP =
                        Math.max(
                            0,
                            Number(student.xp) || 0
                        );

                    const newTotalXP =
                        currentXP + addedXP;

                    const levelData =
                        calculateLevelData(
                            newTotalXP
                        );

                    transaction.set(
                        studentRef,
                        {
                            xp:
                                newTotalXP,

                            level:
                                levelData.level,

                            musicStatus:
                                "🎉 Congratulations! Your performance has been approved.",

                            updatedAt:
                                serverTimestamp()
                        },
                        {
                            merge: true
                        }
                    );

                    return {
                        totalXP:
                            newTotalXP,

                        level:
                            levelData.level
                    };
                }
            );

        alert(
            `Approved +${addedXP} XP\n` +
            `Total XP: ${result.totalXP}\n` +
            `Level: ${result.level}`
        );
    } catch (error) {
        console.error(error);

        alert(
            `Approval failed:\n${error.message}`
        );
    }
};


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
        "Parent controls initialized:",
        {
            login:
                Boolean(loginButton),

            calculate:
                Boolean(calculateButton),

            save:
                Boolean(saveButton)
        }
    );
}


// ========================================
// Start Application
// ========================================

let applicationStarted = false;

function startApplication() {
    if (applicationStarted) {
        return;
    }

    applicationStarted = true;

    startStudentListener();
    initializeParentPanel();

    console.log(
        "app.js loaded successfully."
    );
}


if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        startApplication
    );
} else {
    startApplication();
}
