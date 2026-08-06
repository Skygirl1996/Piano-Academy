import { db } from "./firebase.js";

import {
    doc,
    onSnapshot,
    setDoc,
    addDoc,
    collection,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const studentRef =
doc(
    db,
    "users",
    "kiamaher"
);




// ==============================
// Status Animation
// ==============================


function updateStatusAnimation(statusText){


    const statusBox =
    document.getElementById("status-box");


    const statusIcon =
    document.getElementById("status-icon");


    if(!statusBox || !statusIcon){
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



    const text =
    String(statusText).toLowerCase();



    if(text.includes("listening")){


        statusBox.classList.add(
            "status-listening"
        );


        statusIcon.classList.add(
            "status-listening-icon"
        );


        statusIcon.textContent="🎧";

    }


    else if(
        text.includes("review")
        ||
        text.includes("accuracy")
    ){


        statusBox.classList.add(
            "status-reviewing"
        );


        statusIcon.classList.add(
            "status-reviewing-icon"
        );


        statusIcon.textContent="🔍";

    }


    else if(
        text.includes("approved")
        ||
        text.includes("congratulations")
    ){


        statusBox.classList.add(
            "status-approved"
        );


        statusIcon.classList.add(
            "status-approved-icon"
        );


        statusIcon.textContent="🏆";

    }


    else{


        statusBox.classList.add(
            "status-connecting"
        );


        statusIcon.textContent="♪";

    }

}






// ==============================
// Firebase Student Listener
// ==============================


onSnapshot(

studentRef,


(snapshot)=>{


    if(!snapshot.exists()){
        return;
    }



    const student =
    snapshot.data();



    const status =
    student.musicStatus ||
    "🎹 Waiting for your performance...";



    const statusBox =
    document.getElementById("status");



    if(statusBox){

        statusBox.textContent=status;

    }



    updateStatusAnimation(status);




    const xp =
    Number(student.xp)||0;


    const level =
    Number(student.level)||1;



    const scoreBox =
    document.getElementById("score");


    const levelBox =
    document.getElementById("level");


    const progress =
    document.getElementById("progress");



    if(scoreBox){

        scoreBox.textContent =
        xp+" XP";

    }



    if(levelBox){

        levelBox.textContent =
        "⭐ Level "+level;

    }



    if(progress){

        progress.style.width =
        Math.min((xp/500)*100,100)+"%";

    }


}

);








// ==============================
// Change Status
// ==============================


window.changeStatus =
async function(status){


    await setDoc(

        studentRef,

        {

            musicStatus:status,

            updatedAt:
            serverTimestamp()

        },

        {
            merge:true
        }

    );


};









// ==============================
// XP Calculator
// ==============================


function getSelectValue(id){


    const element =
    document.getElementById(id);


    return element
    ?
    Number(element.value)
    :
    0;

}





function calculateXP(){


    let base =
    getSelectValue("performance");


    let repetition =
    getSelectValue("repetition");


    let difficulty =
    getSelectValue("difficulty");



    let rhythm =
    getSelectValue("rhythm");


    let notes =
    getSelectValue("notes");


    let expression =
    getSelectValue("expression");



    if(difficulty===0){

        difficulty=1;

    }




    let bonusXP=0;



    document
    .querySelectorAll(".bonus:checked")
    .forEach(item=>{

        bonusXP +=
        Number(item.value);

    });





    let total =

    (
        base+
        repetition+
        rhythm+
        notes+
        expression+
        bonusXP

    )
    *
    difficulty;



    total =
    Math.round(total);




    document
    .getElementById("final-xp")
    .innerText=total;



    document
    .getElementById("reward")
    .innerText=
    total*100;



    return total;

}







document
.getElementById("calculate-button")
?.addEventListener(
"click",
calculateXP
);









// ==============================
// Save Performance
// ==============================


async function savePerformance(){


    const totalXP =
    calculateXP();



    const song =
    document
    .getElementById("song-name")
    .value
    ||
    "Unknown Song";



    const report = {


        studentId:
        "kiamaher",


        song:song,


        performanceXP:
        getSelectValue("performance"),


        repetitionXP:
        getSelectValue("repetition"),


        rhythmXP:
        getSelectValue("rhythm"),


        notesXP:
        getSelectValue("notes"),


        expressionXP:
        getSelectValue("expression"),



        totalXP:totalXP,


        reward:
        totalXP*100,


        createdAt:
        serverTimestamp()


    };





    await addDoc(

        collection(
            db,
            "performanceLogs"
        ),

        report

    );






    await setDoc(

        studentRef,

        {


            xp:
            increment(totalXP),



            musicStatus:
            "🎉 Congratulations! Your performance has been approved.",


            latestReport:
            report,


            updatedAt:
            serverTimestamp()


        },


        {
            merge:true
        }

    );



    alert(
        "Performance saved +"+
        totalXP+
        " XP"
    );


}







document
.getElementById("save-button")
?.addEventListener(
"click",
savePerformance
);






console.log(
"app.js loaded successfully"
);
