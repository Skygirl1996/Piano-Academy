import { db } from "./firebase.js";

import {
    collection,
    doc,
    increment,
    onSnapshot,
    serverTimestamp,
    setDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const studentRef = doc(
    db,
    "users",
    "kiamaher"
);


// ========================================
// General helpers
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

    return element
        ? Number(element.value) || 0
        : 0;
}


function getSelectText(id) {
    const element = getElement(id);

    if (!element) {
        return "None";
    }

    return element.options[
        element.selectedIndex
    ]?.textContent.trim() || "None";
}


// ========================================
// Status animation
// ========================================

function updateStatusAnimation(statusText) {
    const statusBox = getElement("status-box");
    const statusIcon = getElement("status-icon");

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

    const text = String(statusText || "")
        .toLowerCase();

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
// Live Firebase listener
// ========================================

function startStudentListener() {
    onSnapshot(
        studentRef,

        function (snapshot) {
            if (!snapshot.exists()) {
                console.error(
                    "Student document does not exist."
                );

                const statusBox = getElement("status");

                if (statusBox) {
                    statusBox.textContent =
                        "Student profile was not found.";
                }

                return;
            }

            const student = snapshot.data();

            const currentStatus =
                student.musicStatus ||
                "🎹 Waiting for your performance...";

            const xp = Number(student.xp) || 0;

            /*
            Firestore فعلاً level را صفر ذخیره کرده است.
            بنابراین مقدار کمتر از 1 را Level 1 نشان می‌دهیم.
            */
            const storedLevel =
                Number(student.level) || 1;

            const level =
                Math.max(storedLevel, 1);

            const statusBox = getElement("status");
            const scoreBox = getElement("score");
            const levelBox = getElement("level");
            const progressBar = getElement("progress");

            if (statusBox) {
                statusBox.textContent =
                    currentStatus;
            }

            if (scoreBox) {
                scoreBox.textContent =
                    `${xp} XP`;
            }

            if (levelBox) {
                levelBox.textContent =
                    `⭐ Level ${level}`;
            }

            if (progressBar) {
                const percentage =
                    Math.min(
                        (xp / 500) * 100,
                        100
                    );

                progressBar.style.width =
                    `${percentage}%`;
            }

            updateStatusAnimation(
                currentStatus
            );

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

            const statusBox = getElement("status");

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
// Change performance status
// ========================================

window.changeStatus =
async function changeStatus(newStatus) {
    try {
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
    }
};


// ========================================
// XP calculation
// ========================================

function getBonusData() {
    const checkedBonuses = Array.from(
        document.querySelectorAll(
            ".bonus:checked"
        )
    );

    const bonusXP = checkedBonuses.reduce(
        function (total, item) {
            return total + Number(item.value);
        },
        0
    );

    const bonusLabels = checkedBonuses.map(
        function (item) {
            return item.closest("label")
                ?.textContent
                .replace(/\s+/g, " ")
                .trim() || "Bonus";
        }
    );

    return {
        bonusXP,
        bonusLabels
    };
}


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

    /*
    امتیازهای منفی روی جمع اثر می‌گذارند،
    اما کل امتیاز یک ارزیابی کمتر از صفر نمی‌شود.
    */
    const finalXP = Math.max(
        0,
        Math.round(
            subtotal * difficultyMultiplier
        )
    );

    const reward = finalXP * 100;

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
            result.finalXP;
    }

    if (rewardBox) {
        rewardBox.textContent =
            result.reward.toLocaleString();
    }

    setParentMessage(
        `Calculated: ${result.finalXP} XP`,
        "success"
    );

    return result;
}


// ========================================
// Save performance
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

        /*
        یک Batch استفاده می‌کنیم تا گزارش و
        افزایش امتیاز با هم ثبت شوند.
        */
        const batch =
            writeBatch(db);

        const logRef =
            doc(
                collection(
                    db,
                    "performanceLogs"
                )
            );

        batch.set(
            logRef,
            {
                studentId: "kiamaher",
                ...latestReport,
                createdAt:
                    serverTimestamp()
            }
        );

        batch.set(
            studentRef,
            {
                xp:
                    increment(result.finalXP),

                moneyBalance:
                    increment(result.reward),

                totalEarnedMoney:
                    increment(result.reward),

                totalPerformances:
                    increment(1),

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

        await batch.commit();

        const xpBox =
            getElement("final-xp");

        const rewardBox =
            getElement("reward");

        if (xpBox) {
            xpBox.textContent =
                result.finalXP;
        }

        if (rewardBox) {
            rewardBox.textContent =
                result.reward.toLocaleString();
        }

        setParentMessage(
            `Saved successfully: +${result.finalXP} XP and ${result.reward.toLocaleString()} تومان`,
            "success"
        );

        alert(
            `Performance saved successfully!\n+${result.finalXP} XP`
        );

        console.log(
            "Performance saved:",
            latestReport
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
// Parent login and page buttons
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
                    passwordInput?.value === "1234"
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
            loginButton: Boolean(loginButton),
            calculateButton:
                Boolean(calculateButton),
            saveButton:
                Boolean(saveButton)
        }
    );
}


// ========================================
// Start app after HTML is ready
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        startStudentListener();
        initializeParentPanel();

        console.log(
            "app.js loaded successfully."
        );
    }
);
