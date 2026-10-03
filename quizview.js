var courseKey = "";
var quizList = document.getElementById("quizList");

async function getAllQuiz() {
  var loginUserId = localStorage.getItem("loginUser");

  if (!loginUserId) {
    alert("User not logged in. Redirecting to login page...");
    window.location.href = "./login.html";
    return;
  }

  await firebase
    .database()
    .ref("user")
    .child(loginUserId)
    .get()
    .then((snap) => {
      if (snap.exists() && snap.val()["courseKey"]) {
        console.log(snap.val());
        courseKey = snap.val()["courseKey"];
        fetchAndDisplayQuizzes(courseKey);
      } else {
        quizList.innerHTML = `<p style="color: #64748b; font-size: 14px; grid-column: 1/-1;">No course key found for this user.</p>`;
      }
    })
    .catch((err) => {
      console.error("Error fetching user details:", err);
    });
}

const fetchAndDisplayQuizzes = async (courseKey) => {
  await firebase
    .database()
    .ref("Quiz")
    .get()
    .then((snap) => {
      if (!snap.exists()) {
        quizList.innerHTML = `<p style="color: #64748b; font-size: 14px; grid-column: 1/-1;">No quizzes available right now.</p>`;
        return;
      }

      var db = snap.val();
      const arr = Object.values(db);

      quizList.innerHTML = ""; // Clear existing content before appending

      let quizFound = false;

      arr.forEach((v) => {
        if (v.coursekey == courseKey) {
          quizFound = true;
          quizList.innerHTML += `
            <div class='card'>
              <h3 style="
                margin-bottom: 16px; 
                font-size: 18px; 
                font-weight: 700; 
                color: #0f172a; 
                letter-spacing: 0.3px;
                border-bottom: 2px solid #e2e8f0; 
                padding-bottom: 8px;
                display: inline-block;
                width: 100%;
              ">
                ${v.quizName}
              </h3>
              
              <button 
                id='${v.quizKey}' 
                onclick='setQuiz(this)' 
                style="
                  background-color: #2563eb; 
                  color: white; 
                  border: none; 
                  padding: 9px 18px; 
                  border-radius: 6px; 
                  cursor: pointer; 
                  font-weight: 600; 
                  font-size: 13px; 
                  transition: background 0.2s;
                  margin-top: 5px;
                "
                onmouseover="this.style.backgroundColor='#1d4ed8'"
                onmouseout="this.style.backgroundColor='#2563eb'"
              >
                  Start Quiz
              </button>
            </div>
          `;
        }
      });

      if (!quizFound) {
        quizList.innerHTML = `<p style="color: #64748b; font-size: 14px; grid-column: 1/-1;">No quiz found for your enrolled course.</p>`;
      }
    })
    .catch((err) => {
      console.error("Error fetching quizzes:", err);
    });
};

getAllQuiz();

function setQuiz(e) {
  console.log(e.id);
  localStorage.setItem("quizKey", e.id);
  window.location.href = "./startquiz.html";
}
