var container = document.getElementById("container");
var TotalQuestion = document.getElementById("TotalQuestion");
var MainCard = document.getElementById("MainCard");
var result = document.getElementById("result");
var timer = document.getElementById("timer");

var QuizData = [];
var index = 0;
var score = 0;

// Timer configuration (e.g. 10 Minutes = 600 Seconds)
var totalTimeInSeconds = 10 * 60;
var timerInterval = null;

// Array shuffling function (Fisher-Yates Shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Fetch questions from Firebase
async function getAllQuestions() {
  var quizkey = localStorage.getItem("quizKey");

  if (!quizkey) {
    alert("Quiz Key not found. Redirecting...");
    window.location.href = "./quizview.html";
    return;
  }

  await firebase
    .database()
    .ref(" Questions")
    .child(quizkey)
    .get()
    .then((snap) => {
      if (snap.exists() && snap.val()) {
        var arr = Object.values(snap.val());
        QuizData = shuffleArray(arr);
        showQuizQuestion();
        startTimer();
      } else {
        container.innerHTML = `<p style="color: #64748b; font-size: 16px;">No questions found for this quiz.</p>`;
      }
    })
    .catch((err) => {
      console.error("Error fetching questions:", err);
    });
}

// Countdown Timer logic
function startTimer() {
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    totalTimeInSeconds--;
    updateTimerDisplay();

    if (totalTimeInSeconds <= 0) {
      clearInterval(timerInterval);
      alert("Time is up! Submitting your quiz automatically.");
      autoSubmitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  var minutes = Math.floor(totalTimeInSeconds / 60);
  var seconds = totalTimeInSeconds % 60;

  var formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  var formattedSeconds = seconds < 10 ? "0" + seconds : seconds;

  timer.innerText = `${formattedMinutes}:${formattedSeconds}`;
}

// Render single question card
function showQuizQuestion() {
  TotalQuestion.innerText = `${index + 1} of ${QuizData.length}`;
  container.innerHTML = "";

  var ul = document.createElement("ul");
  var h1 = document.createElement("h1");

  h1.innerText = `${index + 1}. ${QuizData[index].question}`;

  for (var i = 0; i < 4; i++) {
    var optionNumber = i + 1;
    var optionId = `option${optionNumber}`;
    var optionValue = QuizData[index][`option${optionNumber}`];

    var li = document.createElement("li");
    var inp = document.createElement("input");
    inp.type = "radio";
    inp.id = optionId;
    inp.name = "QuizOption";
    inp.value = optionValue;

    var label = document.createElement("label");
    label.innerText = optionValue;
    label.setAttribute("for", optionId);

    li.appendChild(inp);
    li.appendChild(label);
    ul.appendChild(li);
  }

  var div = document.createElement("div");
  div.id = "btn1";

  var button = document.createElement("button");
  button.disabled = true;
  button.style.backgroundColor = "#94a3b8";
  button.style.cursor = "not-allowed";

  if (index === QuizData.length - 1) {
    button.innerText = "Submit Quiz";
    button.setAttribute("onclick", "submit()");
  } else {
    button.innerText = "Next Question";
    button.setAttribute("onclick", "ShowNext()");
  }

  div.appendChild(button);
  container.append(h1, ul, div);

  // Event delegation / Radio change listener
  var inputs = container.getElementsByTagName("input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("change", function () {
      button.disabled = false;
      button.style.backgroundColor = "#4f46e5";
      button.style.cursor = "pointer";
    });
  }
}

// Next question button handler
function ShowNext() {
  var selectedOption = document.querySelector(
    'input[name="QuizOption"]:checked',
  );

  if (!selectedOption) {
    alert("Please select an option before proceeding.");
    return;
  }

  if (selectedOption.value === QuizData[index].answer) {
    score++;
  }

  index++;
  showQuizQuestion();
}

// Submit quiz handler
async function submit() {
  var selectedOption = document.querySelector(
    'input[name="QuizOption"]:checked',
  );

  if (!selectedOption) {
    alert("Please select an option to submit.");
    return;
  }

  if (selectedOption.value === QuizData[index].answer) {
    score++;
  }

  finishAndSaveQuiz();
}

// Automatic submission on timer expiration
async function autoSubmitQuiz() {
  finishAndSaveQuiz();
}

// Helper function to save results & show result screen
async function finishAndSaveQuiz() {
  if (timerInterval) clearInterval(timerInterval);

  MainCard.style.display = "none";
  result.style.display = "block";

  var percentage = ((score / QuizData.length) * 100).toFixed(0);

  result.innerHTML = `
        <h1>🎉 Quiz Result</h1>
        <div class="score">${percentage}%</div>
        <div class="box">
            <span>Total Questions</span>
            <strong>${QuizData.length}</strong>
        </div>
        <div class="box">
            <span>Correct Answers</span>
            <strong>${score}</strong>
        </div>
        <div class="box">
            <span>Wrong Answers</span>
            <strong>${QuizData.length - score}</strong>
        </div>
        <div class="box">
            <span>Your Percentage</span>
            <strong>${percentage}%</strong>
        </div>
        <button onclick="window.location.href='./quizview.html'">Back to Quizzes</button>
    `;

  var quizkey = localStorage.getItem("quizKey");
  var loginUser = localStorage.getItem("loginUser");

  if (loginUser && quizkey) {
    var resultObj = {
      quizkey: quizkey,
      loginUser: loginUser,
      score: percentage,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    };

    try {
      await firebase
        .database()
        .ref("user")
        .child(loginUser)
        .child("Result")
        .push(resultObj);
    } catch (err) {
      console.error("Error saving result:", err);
    }
  }
}

// Pre-check if quiz was already attempted
async function checkQuiz() {
  var quizkey = localStorage.getItem("quizKey");
  var loginUser = localStorage.getItem("loginUser");

  if (!loginUser) {
    window.location.href = "./login.html";
    return;
  }

  try {
    const snap = await firebase
      .database()
      .ref("user")
      .child(loginUser)
      .child("Result")
      .get();

    if (snap.exists() && snap.val()) {
      var results = Object.values(snap.val());
      var alreadyAttempted = results.find((res) => res.quizkey === quizkey);

      if (alreadyAttempted) {
        MainCard.style.display = "none";
        result.style.display = "block";
        result.innerHTML = `
                    <h1>🎉 Quiz Already Completed</h1>
                    <div class="score">${alreadyAttempted.score}%</div>
                    <button onclick="window.location.href='./quizview.html'">Back to Quizzes</button>
                `;
        return;
      }
    }
    getAllQuestions();
  } catch (err) {
    console.error("Error checking existing quiz status:", err);
    getAllQuestions();
  }
}

checkQuiz();
