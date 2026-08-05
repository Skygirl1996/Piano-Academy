let score = 0;


function addScore(){

score += 50;


document.getElementById(
"score"
).innerHTML = score;


let money = score * 100;


document.getElementById(
"money"
).innerHTML = money;


let percent = score / 10;


document.getElementById(
"progress"
).style.width =
percent+"%";

}
