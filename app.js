// دریافت وضعیت ذخیره شده

let status =
localStorage.getItem("musicStatus")
|| "هنوز اجرا ثبت نشده";


let score =
localStorage.getItem("score")
|| 0;



function updateChildPage(){


let statusBox =
document.getElementById("status");


if(statusBox){

statusBox.innerHTML=status;

}


let scoreBox =
document.getElementById("score");


if(scoreBox){

scoreBox.innerHTML=score+" XP";

}


}



function approveScore(points){


score =
Number(score)+Number(points);


localStorage.setItem(
"score",
score
);


localStorage.setItem(
"musicStatus",
"🎉 تبریک می‌گویم! موسیقی شما تایید شد."
);


updateChildPage();


}



function changeStatus(newStatus){


localStorage.setItem(
"musicStatus",
newStatus
);


updateChildPage();


}




window.onload=function(){

updateChildPage();

}
