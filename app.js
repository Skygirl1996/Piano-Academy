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
const TOMAN_PER_XP = 100;

const studentRef = doc(
    db,
    "users",
    STUDENT_ID
);

function getElement(id) {
    return document.getElementById(id);
}

function getNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
    return Math.round(
        getNumber(value)
    ).toLocaleString();
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
    return element ? getNumber(element.value) : 0;
}

function getSelectText(id) {
    const element = getElement(id);

    if (!element) {
        return "None";
    }

    const option = element.options[element.selectedIndex];

    return option
        ? option.textContent.replace(/\s+/g, " ").trim()
        : "None";
}

function calculateLevelData(totalXP) {
    const safeXP = Math.max(
        0,
        Math.round(getNumber(totalXP))
    );

    const level = Math.floor(
        safeXP / XP_PER_LEVEL
    ) + 1;

    const xpInCurrentLevel =
        safeXP % XP_PER_LEVEL;

    const progressPercent =
        (xpInCurrentLevel / XP_PER_LEVEL) * 100;

    return {
        totalXP: safeXP,
        level,
        xpInCurrentLevel,
        progressPercent
    };
}

function calculateWallet(student) {
    const totalXP = Math.max(
        0,
        Math.round(getNumber(student?.xp))
    );

    const totalReward =
        totalXP * TOMAN_PER_XP;

    const totalWithdrawn = Math.max(
        0,
        Math.round(
            getNumber(student?.totalWithdrawnMoney)
        )
    );

    const availableBalance = Math.max(
        0,
        totalReward - totalWithdrawn
    );

    return {
        totalXP,
        totalReward,
        totalWithdrawn,
        availableBalance
    };
}

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
        "status-approved",
        "status-complete"
    );

    statusIcon.classList.remove(
        "status-connecting-icon",
        "status-listening-icon",
        "status-reviewing-icon",
        "status-approved-icon",
        "status-complete-icon"
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
        text.includes("complete") ||
        text.includes("finished")
    ) {
        statusBox.classList.add(
            "status-complete"
        );

        statusIcon.classList.add(
            "status-complete-icon"
        );

        statusIcon.textContent = "✅";
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

function updateChildListeningControl(statusText) {
    const button = getElement(
        "child-listening-button"
    );

    const buttonText = getElement(
        "child-listening-button-text"
    );

    const feedback = getElement(
        "child-listening-feedback"
    );

    if (!button || !buttonText || !feedback) {
        return;
    }

    const text = String(
        statusText || ""
    ).toLowerCase();

    button.classList.remove(
        "is-listening",
        "is-reviewing",
        "is-ready"
    );

    if (text.includes("listening")) {
        button.disabled = true;
        button.classList.add("is-listening");
        buttonText.textContent =
            "Listening Now...";
        feedback.textContent =
            "The academy is listening to your performance.";
        return;
    }

    if (
        text.includes("review") ||
        text.includes("accuracy")
    ) {
        button.disabled = true;
        button.classList.add("is-reviewing");
        buttonText.textContent =
            "Review in Progress";
        feedback.textContent =
            "Your performance is being reviewed.";
        return;
    }

    button.disabled = false;
    button.classList.add("is-ready");

    if (
        text.includes("complete") ||
        text.includes("finished") ||
        text.includes("approved") ||
        text.includes("congratulations")
    ) {
        buttonText.textContent =
            "Start a New Performance";
        feedback.textContent =
            "Press when you are ready to play again.";
        return;
    }

    buttonText.textContent =
        "I'm Ready to Play";
    feedback.textContent =
        "Press the button when you are ready to begin.";
}

async function startChildPerformance() {
    const button = getElement(
        "child-listening-button"
    );

    const buttonText = getElement(
        "child-listening-button-text"
    );

    const feedback = getElement(
        "child-listening-feedback"
    );

    if (!button) {
        return;
    }

    try {
        button.disabled = true;

        if (buttonText) {
            buttonText.textContent =
                "Starting...";
        }

        if (feedback) {
            feedback.textContent =
                "Connecting to the academy...";
        }

        await setDoc(
            studentRef,
            {
                musicStatus:
                    "🎧 We are listening to your performance...",
                performanceStartedAt:
                    serverTimestamp(),
                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );
    } catch (error) {
        console.error(
            "Child performance start error:",
            error
        );

        button.disabled = false;

        if (buttonText) {
            buttonText.textContent =
                "I'm Ready to Play";
        }

        if (feedback) {
            feedback.textContent =
                `Could not start listening: ${error.message}`;
        }

        alert(
            `Could not start listening:
${error.message}`
        );
    }
}

function initializeChildControls() {
    const childListeningButton = getElement(
        "child-listening-button"
    );

    if (!childListeningButton) {
        return;
    }

    childListeningButton.addEventListener(
        "click",
        startChildPerformance
    );

    console.log(
        "Child listening control initialized."
    );
}

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
    const emptyBox = getElement("report-empty");
    const contentBox = getElement("report-content");

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

    const performanceXP = getNumber(
        report.performanceXP
    );

    const repetitionXP = getNumber(
        report.repetitionXP
    );

    const difficultyMultiplier =
        getNumber(report.difficultyMultiplier) || 1;

    const rhythmXP = getNumber(
        report.rhythmXP
    );

    const notesXP = getNumber(
        report.notesXP
    );

    const expressionXP = getNumber(
        report.expressionXP
    );

    const bonusXP = getNumber(
        report.bonusXP
    );

    const finalXP = getNumber(
        report.finalXP ?? report.totalXP
    );

    const reward = getNumber(
        report.reward
    );

    setReportRow(
        "report-song-row",
        "report-song",
        report.song || "Practice Session",
        true
    );

    setReportRow(
        "report-performance-row",
        "report-performance",
        report.performanceLabel || `${performanceXP} XP`,
        performanceXP !== 0
    );

    setReportRow(
        "report-repetition-row",
        "report-repetition",
        report.repetitionLabel || `${repetitionXP} XP`,
        repetitionXP !== 0
    );

    setReportRow(
        "report-difficulty-row",
        "report-difficulty",
        report.difficultyLabel || `×${difficultyMultiplier}`,
        true
    );

    const bonusLabels = Array.isArray(
        report.bonusLabels
    )
        ? report.bonusLabels
        : [];

    setReportRow(
        "report-bonus-row",
        "report-bonus",
        bonusLabels.length > 0
            ? bonusLabels.join(" • ")
            : `${bonusXP} XP`,
        bonusXP !== 0 || bonusLabels.length > 0
    );

    setReportRow(
        "report-rhythm-row",
        "report-rhythm",
        report.rhythmLabel || `${rhythmXP} XP`,
        rhythmXP !== 0
    );

    setReportRow(
        "report-notes-row",
        "report-notes",
        report.notesLabel || `${notesXP} XP`,
        notesXP !== 0
    );

    setReportRow(
        "report-expression-row",
        "report-expression",
        report.expressionLabel || `${expressionXP} XP`,
        expressionXP !== 0
    );

    const totalXPBox = getElement(
        "report-total-xp"
    );

    const rewardBox = getElement(
        "report-reward"
    );

    if (totalXPBox) {
        totalXPBox.textContent =
            formatNumber(finalXP);
    }

    if (rewardBox) {
        rewardBox.textContent =
            formatNumber(reward);
    }
}

function updateWalletDisplay(student) {
    const wallet = calculateWallet(student);

    const fields = {
        "total-reward": wallet.totalReward,
        "total-withdrawn": wallet.totalWithdrawn,
        "available-balance": wallet.availableBalance,
        "parent-total-reward": wallet.totalReward,
        "parent-total-withdrawn": wallet.totalWithdrawn,
        "parent-available-balance": wallet.availableBalance
    };

    Object.entries(fields).forEach(
        function ([id, value]) {
            const element = getElement(id);

            if (element) {
                element.textContent =
                    formatNumber(value);
            }
        }
    );

    const paymentInput = getElement(
        "payment-amount"
    );

    if (paymentInput) {
        paymentInput.max = String(
            wallet.availableBalance
        );
    }
}

function updateAcademyPage(student) {
    const currentStatus =
        student.musicStatus ||
        "🎹 Waiting for your performance...";

    const levelData = calculateLevelData(
        student.xp
    );

    const statusBox = getElement("status");
    const scoreBox = getElement("score");
    const levelBox = getElement("level");
    const progressBar = getElement("progress");
    const progressText = getElement("progress-text");
    const teacherMessageCard = getElement(
        "teacher-message-card"
    );
    const teacherMessageBox = getElement(
        "teacher-message"
    );
    const teacherMessageInput = getElement(
        "teacher-message-input"
    );

    const teacherMessage = String(
        student.teacherMessage || ""
    ).trim();

    if (teacherMessageCard) {
        teacherMessageCard.hidden = !teacherMessage;
    }

    if (teacherMessageBox) {
        teacherMessageBox.textContent = teacherMessage;
    }

    if (
        teacherMessageInput &&
        document.activeElement !== teacherMessageInput
    ) {
        teacherMessageInput.value = teacherMessage;
    }

    if (statusBox) {
        statusBox.textContent = currentStatus;
    }

    if (scoreBox) {
        scoreBox.textContent =
            `${formatNumber(levelData.totalXP)} XP`;
    }

    if (levelBox) {
        levelBox.textContent =
            `⭐ Level ${levelData.level}`;
    }

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

    if (progressText) {
        progressText.textContent =
            `${levelData.xpInCurrentLevel} / ${XP_PER_LEVEL} XP`;
    }

    updateStatusAnimation(currentStatus);
    updateChildListeningControl(currentStatus);
    renderLatestReport(student.latestReport);
    updateWalletDisplay(student);
}

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

            const student = snapshot.data();
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

window.changeStatus = async function changeStatus(
    newStatus
) {
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

        alert(
            `Status update failed:\n${error.message}`
        );
    }
};

async function saveTeacherMessage() {
    const input = getElement(
        "teacher-message-input"
    );

    const button = getElement(
        "save-teacher-message-button"
    );

    const message = String(
        input?.value || ""
    ).trim();

    try {
        if (button) {
            button.disabled = true;
            button.textContent =
                "Saving Message...";
        }

        setParentMessage(
            "Saving teacher's message...",
            "loading"
        );

        await setDoc(
            studentRef,
            {
                teacherMessage: message,
                teacherMessageUpdatedAt:
                    serverTimestamp(),
                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        setParentMessage(
            message
                ? "Teacher's message saved."
                : "Teacher's message cleared.",
            "success"
        );
    } catch (error) {
        console.error(
            "Teacher message save error:",
            error
        );

        setParentMessage(
            `Message save failed: ${error.message}`,
            "error"
        );

        alert(
            `Message save failed:\n${error.message}`
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "Save / Clear Teacher's Message";
        }
    }
}

function getBonusData() {
    const checkedBonuses = Array.from(
        document.querySelectorAll(
            ".bonus:checked"
        )
    );

    let bonusXP = 0;
    const bonusLabels = [];

    checkedBonuses.forEach(
        function (checkbox) {
            bonusXP += getNumber(
                checkbox.value
            );

            const label = checkbox.closest(
                "label"
            );

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

function calculatePerformance() {
    const performanceXP = getSelectValue(
        "performance"
    );

    const repetitionXP = getSelectValue(
        "repetition"
    );

    let difficultyMultiplier = getSelectValue(
        "difficulty"
    );

    const rhythmXP = getSelectValue(
        "rhythm"
    );

    const notesXP = getSelectValue(
        "notes"
    );

    const expressionXP = getSelectValue(
        "expression"
    );

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
            subtotal * difficultyMultiplier
        )
    );

    const reward =
        finalXP * TOMAN_PER_XP;

    return {
        performanceXP,
        performanceLabel: getSelectText(
            "performance"
        ),

        repetitionXP,
        repetitionLabel: getSelectText(
            "repetition"
        ),

        difficultyMultiplier,
        difficultyLabel: getSelectText(
            "difficulty"
        ),

        rhythmXP,
        rhythmLabel: getSelectText(
            "rhythm"
        ),

        notesXP,
        notesLabel: getSelectText(
            "notes"
        ),

        expressionXP,
        expressionLabel: getSelectText(
            "expression"
        ),

        bonusXP,
        bonusLabels,
        subtotal,
        finalXP,
        reward
    };
}

function calculateXP() {
    const result = calculatePerformance();

    const finalXPBox = getElement("final-xp");
    const rewardBox = getElement("reward");

    if (finalXPBox) {
        finalXPBox.textContent =
            formatNumber(result.finalXP);
    }

    if (rewardBox) {
        rewardBox.textContent =
            formatNumber(result.reward);
    }

    setParentMessage(
        `Calculated: ${formatNumber(result.finalXP)} XP`,
        "success"
    );

    return result;
}

async function savePerformance() {
    const saveButton = getElement(
        "save-button"
    );

    try {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        setParentMessage(
            "Saving performance...",
            "loading"
        );

        const result = calculatePerformance();

        const songInput = getElement(
            "song-name"
        );

        const song =
            songInput?.value.trim() ||
            "Practice Session";

        const logRef = doc(
            collection(
                db,
                "performanceLogs"
            )
        );

        const savedResult = await runTransaction(
            db,
            async function (transaction) {
                const studentSnapshot =
                    await transaction.get(
                        studentRef
                    );

                if (!studentSnapshot.exists()) {
                    throw new Error(
                        "Student profile does not exist."
                    );
                }

                const student =
                    studentSnapshot.data();

                const currentXP = Math.max(
                    0,
                    Math.round(
                        getNumber(student.xp)
                    )
                );

                const currentWithdrawn = Math.max(
                    0,
                    Math.round(
                        getNumber(
                            student.totalWithdrawnMoney
                        )
                    )
                );

                const currentPerformances = Math.max(
                    0,
                    Math.round(
                        getNumber(
                            student.totalPerformances
                        )
                    )
                );

                const newTotalXP =
                    currentXP + result.finalXP;

                const newLevelData =
                    calculateLevelData(
                        newTotalXP
                    );

                const newTotalReward =
                    newTotalXP * TOMAN_PER_XP;

                const newBalance = Math.max(
                    0,
                    newTotalReward - currentWithdrawn
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
                    totalRewardAfterSave:
                        newTotalReward,
                    totalWithdrawnAfterSave:
                        currentWithdrawn,
                    balanceAfterSave:
                        newBalance,
                    savedAt:
                        Date.now()
                };

                transaction.set(
                    logRef,
                    {
                        ...report,
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
                        totalEarnedMoney:
                            newTotalReward,
                        totalWithdrawnMoney:
                            currentWithdrawn,
                        moneyBalance:
                            newBalance,
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

                return {
                    newTotalXP,
                    newLevel:
                        newLevelData.level,
                    newTotalReward,
                    currentWithdrawn,
                    newBalance
                };
            }
        );

        const finalXPBox = getElement(
            "final-xp"
        );

        const rewardBox = getElement(
            "reward"
        );

        if (finalXPBox) {
            finalXPBox.textContent =
                formatNumber(result.finalXP);
        }

        if (rewardBox) {
            rewardBox.textContent =
                formatNumber(result.reward);
        }

        setParentMessage(
            `Saved: +${formatNumber(result.finalXP)} XP | Total reward: ${formatNumber(savedResult.newTotalReward)} تومان | Balance: ${formatNumber(savedResult.newBalance)} تومان`,
            "success"
        );

        alert(
            "Performance saved successfully!\n\n" +
            `Added XP: ${formatNumber(result.finalXP)}\n` +
            `Total XP: ${formatNumber(savedResult.newTotalXP)}\n` +
            `Level: ${savedResult.newLevel}\n` +
            `Available balance: ${formatNumber(savedResult.newBalance)} تومان`
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

async function recordPayment() {
    const paymentButton = getElement(
        "record-payment-button"
    );

    const amountInput = getElement(
        "payment-amount"
    );

    const noteInput = getElement(
        "payment-note"
    );

    const amount = Math.round(
        getNumber(amountInput?.value)
    );

    const note = String(
        noteInput?.value || ""
    ).trim();

    if (amount <= 0) {
        setParentMessage(
            "Enter a payment amount greater than zero.",
            "error"
        );

        alert(
            "Please enter a valid payment amount."
        );
        return;
    }

    const confirmed = window.confirm(
        `Record a payment of ${formatNumber(amount)} تومان to the child?`
    );

    if (!confirmed) {
        return;
    }

    try {
        if (paymentButton) {
            paymentButton.disabled = true;
            paymentButton.textContent =
                "Recording Payment...";
        }

        setParentMessage(
            "Recording payment...",
            "loading"
        );

        const paymentLogRef = doc(
            collection(
                db,
                "paymentLogs"
            )
        );

        const paymentResult = await runTransaction(
            db,
            async function (transaction) {
                const studentSnapshot =
                    await transaction.get(
                        studentRef
                    );

                if (!studentSnapshot.exists()) {
                    throw new Error(
                        "Student profile does not exist."
                    );
                }

                const student =
                    studentSnapshot.data();

                const wallet =
                    calculateWallet(student);

                if (amount > wallet.availableBalance) {
                    throw new Error(
                        `Payment is greater than the available balance of ${formatNumber(wallet.availableBalance)} تومان.`
                    );
                }

                const newTotalWithdrawn =
                    wallet.totalWithdrawn + amount;

                const newBalance =
                    wallet.totalReward - newTotalWithdrawn;

                transaction.set(
                    paymentLogRef,
                    {
                        studentId:
                            STUDENT_ID,
                        amount,
                        note,
                        totalRewardAtPayment:
                            wallet.totalReward,
                        balanceBefore:
                            wallet.availableBalance,
                        totalWithdrawnAfter:
                            newTotalWithdrawn,
                        balanceAfter:
                            newBalance,
                        createdAt:
                            serverTimestamp()
                    }
                );

                transaction.set(
                    studentRef,
                    {
                        totalEarnedMoney:
                            wallet.totalReward,
                        totalWithdrawnMoney:
                            newTotalWithdrawn,
                        moneyBalance:
                            newBalance,
                        lastPaymentAmount:
                            amount,
                        lastPaymentNote:
                            note,
                        lastPaymentAt:
                            serverTimestamp(),
                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );

                return {
                    totalReward:
                        wallet.totalReward,
                    totalWithdrawn:
                        newTotalWithdrawn,
                    availableBalance:
                        newBalance
                };
            }
        );

        if (amountInput) {
            amountInput.value = "";
        }

        if (noteInput) {
            noteInput.value = "";
        }

        setParentMessage(
            `Payment recorded: ${formatNumber(amount)} تومان | Remaining balance: ${formatNumber(paymentResult.availableBalance)} تومان`,
            "success"
        );

        alert(
            "Payment recorded successfully!\n\n" +
            `Paid: ${formatNumber(amount)} تومان\n` +
            `Total withdrawn: ${formatNumber(paymentResult.totalWithdrawn)} تومان\n` +
            `Remaining balance: ${formatNumber(paymentResult.availableBalance)} تومان`
        );
    } catch (error) {
        console.error(
            "Payment recording error:",
            error
        );

        setParentMessage(
            `Payment failed: ${error.message}`,
            "error"
        );

        alert(
            `Payment failed:\n${error.message}`
        );
    } finally {
        if (paymentButton) {
            paymentButton.disabled = false;
            paymentButton.textContent =
                "Record Payment";
        }
    }
}

function resetEvaluationForm() {
    const fields = [
        "song-name",
        "payment-amount",
        "payment-note"
    ];

    fields.forEach(
        function (id) {
            const element = getElement(id);

            if (element) {
                element.value = "";
            }
        }
    );

    const selects = [
        "performance",
        "repetition",
        "rhythm",
        "notes",
        "expression"
    ];

    selects.forEach(
        function (id) {
            const element = getElement(id);

            if (element) {
                element.value = "0";
            }
        }
    );

    const difficulty = getElement("difficulty");

    if (difficulty) {
        difficulty.selectedIndex = 0;
    }

    document
        .querySelectorAll(".bonus:checked")
        .forEach(
            function (checkbox) {
                checkbox.checked = false;
            }
        );

    const finalXPBox = getElement("final-xp");
    const rewardBox = getElement("reward");

    if (finalXPBox) {
        finalXPBox.textContent = "0";
    }

    if (rewardBox) {
        rewardBox.textContent = "0";
    }
}

async function resetMonthlyProgress() {
    const resetButton = getElement(
        "reset-month-button"
    );

    const firstConfirmation = window.confirm(
        "Reset this month's XP, rewards, withdrawals, and level progress?\n\n" +
        "Previous performance and payment logs will remain saved."
    );

    if (!firstConfirmation) {
        return;
    }

    const typedConfirmation = window.prompt(
        "Type RESET to confirm the monthly reset."
    );

    if (typedConfirmation !== "RESET") {
        setParentMessage(
            "Monthly reset cancelled. Type RESET exactly to confirm.",
            "error"
        );
        return;
    }

    try {
        if (resetButton) {
            resetButton.disabled = true;
            resetButton.textContent =
                "Resetting Monthly Progress...";
        }

        setParentMessage(
            "Saving the monthly archive and resetting progress...",
            "loading"
        );

        const archiveRef = doc(
            collection(
                db,
                "monthlyArchives"
            )
        );

        await runTransaction(
            db,
            async function (transaction) {
                const studentSnapshot =
                    await transaction.get(
                        studentRef
                    );

                if (!studentSnapshot.exists()) {
                    throw new Error(
                        "Student profile does not exist."
                    );
                }

                const student =
                    studentSnapshot.data();

                const levelData =
                    calculateLevelData(
                        student.xp
                    );

                const wallet =
                    calculateWallet(student);

                transaction.set(
                    archiveRef,
                    {
                        studentId:
                            STUDENT_ID,
                        monthKey:
                            new Date()
                                .toISOString()
                                .slice(0, 7),
                        archivedXP:
                            levelData.totalXP,
                        archivedLevel:
                            levelData.level,
                        archivedTotalReward:
                            wallet.totalReward,
                        archivedTotalWithdrawn:
                            wallet.totalWithdrawn,
                        archivedMoneyBalance:
                            wallet.availableBalance,
                        archivedTotalPerformances:
                            Math.max(
                                0,
                                Math.round(
                                    getNumber(
                                        student.totalPerformances
                                    )
                                )
                            ),
                        archivedLatestReport:
                            student.latestReport || null,
                        archivedStatus:
                            student.musicStatus || "",
                        archivedTeacherMessage:
                            student.teacherMessage || "",
                        createdAt:
                            serverTimestamp()
                    }
                );

                transaction.set(
                    studentRef,
                    {
                        xp: 0,
                        level: 1,
                        totalEarnedMoney: 0,
                        totalWithdrawnMoney: 0,
                        moneyBalance: 0,
                        totalPerformances: 0,
                        latestReport: null,
                        musicStatus:
                            "🎹 New month started. Ready for your next performance!",
                        monthlyResetAt:
                            serverTimestamp(),
                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );
            }
        );

        resetEvaluationForm();

        setParentMessage(
            "Monthly progress reset successfully. XP, rewards, and withdrawals are now zero.",
            "success"
        );

        alert(
            "Monthly reset completed successfully!\n\n" +
            "XP: 0\n" +
            "Level: 1\n" +
            "Total reward: 0\n" +
            "Total withdrawn: 0\n" +
            "Available balance: 0"
        );
    } catch (error) {
        console.error(
            "Monthly reset error:",
            error
        );

        setParentMessage(
            `Monthly reset failed: ${error.message}`,
            "error"
        );

        alert(
            `Monthly reset failed:\n${error.message}`
        );
    } finally {
        if (resetButton) {
            resetButton.disabled = false;
            resetButton.textContent =
                "Reset XP for New Month";
        }
    }
}

function initializeParentPanel() {
    const loginButton = getElement(
        "login-button"
    );

    const passwordInput = getElement(
        "password"
    );

    const loginCard = getElement(
        "login-card"
    );

    const parentPanel = getElement(
        "parent-panel"
    );

    const listeningButton = getElement(
        "listening-button"
    );

    const reviewingButton = getElement(
        "reviewing-button"
    );

    const completeButton = getElement(
        "complete-button"
    );

    const teacherMessageButton = getElement(
        "save-teacher-message-button"
    );

    const teacherMessageInput = getElement(
        "teacher-message-input"
    );

    const calculateButton = getElement(
        "calculate-button"
    );

    const saveButton = getElement(
        "save-button"
    );

    const paymentButton = getElement(
        "record-payment-button"
    );

    const resetMonthButton = getElement(
        "reset-month-button"
    );

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            function () {
                if (passwordInput?.value === "1234") {
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

    if (completeButton) {
        completeButton.addEventListener(
            "click",
            function () {
                window.changeStatus(
                    "✅ Performance complete. Excellent work!"
                );
            }
        );
    }

    if (teacherMessageButton) {
        teacherMessageButton.addEventListener(
            "click",
            saveTeacherMessage
        );
    }

    if (teacherMessageInput) {
        teacherMessageInput.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    saveTeacherMessage();
                }
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

    if (paymentButton) {
        paymentButton.addEventListener(
            "click",
            recordPayment
        );
    }

    if (resetMonthButton) {
        resetMonthButton.addEventListener(
            "click",
            resetMonthlyProgress
        );
    }

    console.log(
        "Parent controls initialized:",
        {
            loginButton:
                Boolean(loginButton),
            listeningButton:
                Boolean(listeningButton),
            reviewingButton:
                Boolean(reviewingButton),
            completeButton:
                Boolean(completeButton),
            teacherMessageButton:
                Boolean(teacherMessageButton),
            calculateButton:
                Boolean(calculateButton),
            saveButton:
                Boolean(saveButton),
            paymentButton:
                Boolean(paymentButton),
            resetMonthButton:
                Boolean(resetMonthButton)
        }
    );
}

let applicationStarted = false;

function startApplication() {
    if (applicationStarted) {
        return;
    }

    applicationStarted = true;

    startStudentListener();
    initializeParentPanel();
    initializeChildControls();

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
