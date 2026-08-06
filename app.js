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




// ==============================
// Status Animation Controller
// ==============================


function updateStatusAnimation(statusText){


    const statusBox =
    document.getElementById(
        "status-box"
    );


    const statusIcon =
    document.getElementById(
        "status-icon"
    );


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
    String(statusText || "")
    .toLowerCase();




    if(
        text.includes("listening")
    ){

        statusBox.classList.add(
            "status-listening"
        );


        statusIcon.classList.add(
            "status-listening-icon"
        );


        statusIcon.textContent =
        "🎧";


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


        statusIcon.textContent =
        "🔍";


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


        statusIcon.textContent =
        "🏆";


    }




    else{


        statusBox.classList.add(
            "status-connecting"
        );


        statusIcon.classList.add(
            "status-connecting-icon"
        );


        statusIcon.textContent =
        "♪";


    }

}







// ==============================
// Firebase Listener
// ==============================


onSnapshot(

    studentRef,


    function(snapshot){


        if(!snapshot.exists()){


            console.error(
                "Student document does not exist."
            );


            return;

        }



        const student =
        snapshot.data();




        const statusBox =
        document.getElementById(
            "status"
        );



        const scoreBox =
        document.getElementById(
            "score"
        );



        const levelBox =
        document.getElementById(
            "level"
        );



        const progressBar =
        document.getElementById(
            "progress"
        );





        const currentStatus =
        student.musicStatus ||
        "🎹 Waiting for your performance...";




        if(statusBox){


            statusBox.textContent =
            currentStatus;


        }




        updateStatusAnimation(
            currentStatus
        );






        const xp =
        Number(student.xp) || 0;



        const level =
        Number(student.level) || 1;




        if(scoreBox){


            scoreBox.textContent =
            xp + " XP";


        }




        if(levelBox){


            levelBox.textContent =
            "⭐ Level " + level;


        }





        if(progressBar){


            progressBar.style.width =
            Math.min(
                (xp / 500) * 100,
                100
            )
            + "%";


        }



        console.log(
            "Firebase data received:",
            student
        );


    },



    function(error){



        console.error(
            "Firebase listener error:",
            error
        );



        const statusBox =
        document.getElementById(
            "status"
        );



        if(statusBox){


            statusBox.textContent =
            "Firebase error: "
            + error.message;


        }


    }


);









// ==============================
// Update Performance Status
// ==============================


window.changeStatus =

async function(newStatus){


    try{


        await setDoc(

            studentRef,


            {

                musicStatus:newStatus,


                updatedAt:
                serverTimestamp()


            },


            {

                merge:true

            }

        );



        console.log(
            "Status updated"
        );


    }



    catch(error){



        console.error(
            error
        );



        alert(
            error.message
        );


    }


};









// ==============================
// Approve Score
// ==============================


window.approveScore =

async function(points){



    try{


        await setDoc(

            studentRef,


            {


                musicStatus:
                "🎉 Congratulations! Your performance has been approved.",



                xp:
                increment(
                    Number(points)
                ),



                updatedAt:
                serverTimestamp()



            },


            {

                merge:true

            }

        );



        alert(
            "Approved +" +
            points +
            " XP"
        );


    }



    catch(error){



        console.error(
            error
        );



        alert(
            error.message
        );


    }



};









// ==============================
// Performance Evaluation
// ==============================


function getSelectValue(id){


    const element =
    document.getElementById(id);



    if(element){


        return Number(
            element.value
        );


    }


    return 0;


}








function calculateXP(){



    let base =
    getSelectValue(
        "performance"
    );



    let repetition =
    getSelectValue(
        "repetition"
    );



    let difficulty =
    getSelectValue(
        "difficulty"
    );



    if(difficulty === 0){


        difficulty = 1;


    }






    let rhythm =
    getSelectValue(
        "rhythm"
    );



    let notes =
    getSelectValue(
        "notes"
    );



    let expression =
    getSelectValue(
        "expression"
    );







    let bonuses = 0;



    document
    .querySelectorAll(
        ".bonus:checked"
    )
    .forEach(

        function(item){


            bonuses +=
            Number(item.value);


        }

    );






    let finalXP =


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





    finalXP =
    Math.round(
        finalXP
    );





    const xpBox =
    document.getElementById(
        "final-xp"
    );



    const moneyBox =
    document.getElementById(
        "reward"
    );





    if(xpBox){


        xpBox.innerText =
        finalXP;


    }





    if(moneyBox){


        moneyBox.innerText =
        finalXP * 100;


    }





    return finalXP;


}








const calculateButton =
document.getElementById(
    "calculate-button"
);





if(calculateButton){



    calculateButton.addEventListener(

        "click",

        calculateXP

    );


}






console.log(
    "app.js loaded successfully."
);
