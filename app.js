import { db } from "./firebase.js";

import {
    doc,
    onSnapshot,
    setDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const studentRef = doc(
    db,
    "users",
    "kiamaher"
);


/* دریافت زنده اطلاعات از Firebase */
onSnapshot(
    studentRef,

    function (snapshot) {
        if (!snapshot.exists()) {
            console.error("Student document does not exist.");

            const statusBox =
                document.getElementById("status");

            if (statusBox) {
                statusBox.textContent =
                    "Student profile was not found.";
            }

            return;
        }

        const student = snapshot.data();

        const statusBox =
            document.getElementById("status");

        const scoreBox =
            document.getElementById("score");

        const levelBox =
            document.getElementById("level");

        const progressBar =
            document.getElementById("progress");


        if (statusBox) {
            statusBox.textContent =
                student.musicStatus ||
                "🎹 Waiting for your performance...";
        }


        const xp = Number(student.xp) || 0;
        const level = Number(student.level) || 1;


        if (scoreBox) {
            scoreBox.textContent = xp + " XP";
        }


        if (levelBox) {
            levelBox.textContent =
                "⭐ Level " + level;
        }


        if (progressBar) {
            const percentage =
                Math.min((xp / 500) * 100, 100);

            progressBar.style.width =
                percentage + "%";
        }


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

        const statusBox =
            document.getElementById("status");

        if (statusBox) {
            statusBox.textContent =
                "Firebase connection error: " +
                error.message;
        }
    }
);


/* تغییر وضعیت اجرا از پنل مادر */
window.changeStatus =
async function (newStatus) {
    try {
        console.log(
            "Updating status:",
            newStatus
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

        console.log(
            "Status updated successfully."
        );

        alert(
            "Performance status updated successfully."
        );
    } catch (error) {
        console.error(
            "Status update failed:",
            error
        );

        alert(
            "Firebase error: " +
            error.message
        );
    }
};


/* تأیید اجرا و افزودن ۵۰ امتیاز */
window.approveScore =
async function (points) {
    try {
        const numericPoints =
            Number(points);

        await setDoc(
            studentRef,

            {
                musicStatus:
                    "🎉 Congratulations! Your performance has been approved.",

                xp: increment(numericPoints),

                updatedAt: serverTimestamp()
            },

            {
                merge: true
            }
        );

        console.log(
            "Performance approved."
        );

        alert(
            "Performance approved! +" +
            numericPoints +
            " XP"
        );
    } catch (error) {
        console.error(
            "Approval failed:",
            error
        );

        alert(
            "Firebase error: " +
            error.message
        );
    }
};


console.log(
    "app.js loaded successfully."
);




function getRadioValue(name){

    const item =
    document.querySelector(
        `input[name="${name}"]:checked`
    );

    return item ? Number(item.value) : 0;

}




function calculateXP(){


let base =
getRadioValue("performance");


let repetition =
getRadioValue("repetition");


let difficulty =
getRadioValue("difficulty");


if(difficulty === 0){
    difficulty = 1;
}



let bonuses = 0;


document
.querySelectorAll(".bonus:checked")
.forEach(
(item)=>{
    bonuses += Number(item.value);
}
);



let rhythm =
getRadioValue("rhythm");


let notes =
getRadioValue("notes");


let expression =
getRadioValue("expression");



let total =
(
base +
repetition +
bonuses +
rhythm +
notes +
expression
)
*
difficulty;



document.getElementById(
"final-xp"
).innerText =
Math.round(total);



document.getElementById(
"reward"
).innerText =
Math.round(total * 100);



return Math.round(total);


}




document
.getElementById("calculate-button")
?.addEventListener(
"click",
calculateXP
);

