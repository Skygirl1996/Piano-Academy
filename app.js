let score = Number(localStorage.getItem("score")) || 0;

let musicStatus = 
localStorage.getItem("musicStatus") 
|| "No performance submitted yet";



function updateChildPage() {


    let statusBox = document.getElementById("status");

    if(statusBox){
        statusBox.innerHTML = musicStatus;
    }



    let scoreBox = document.getElementById("score");

    if(scoreBox){
        scoreBox.innerHTML = score + " XP";
    }

}




function changeStatus(newStatus){

    musicStatus = newStatus;


    localStorage.setItem(
        "musicStatus",
        musicStatus
    );


    updateChildPage();

}





function approveScore(points){


    score += Number(points);


    localStorage.setItem(
        "score",
        score
    );


    musicStatus =
    "🎉 Congratulations! Your music has been approved.";


    localStorage.setItem(
        "musicStatus",
        musicStatus
    );


    updateChildPage();


}




window.onload = function(){

    updateChildPage();

};
