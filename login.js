var login = document.getElementById("login");
var email = document.getElementById("email");
var password = document.getElementById("password");
var errorBox = document.getElementById("errorMessage"); // Message Box element

login.addEventListener("click", async function () {
  // 1. Khali Inputs Validation
  if (!email.value.trim() || !password.value.trim()) {
    if (errorBox) {
      errorBox.style.display = "block";
      errorBox.style.backgroundColor = "#fef2f2"; // Red background for error
      errorBox.style.borderColor = "#fecaca";
      errorBox.style.color = "#dc2626";
      errorBox.innerText = "Please enter both email and password.";
    }
    return;
  }

  // Previous message reset
  if (errorBox) {
    errorBox.style.display = "none";
    errorBox.innerText = "";
  }

  await firebase
    .auth()
    .signInWithEmailAndPassword(email.value, password.value)
    .then(async (login) => {
      console.log(login.user.uid);

      await firebase
        .database()
        .ref("user")
        .child(login.user.uid)
        .get()
        .then((db) => {
          console.log(db.val());
          localStorage.setItem("loginUser", login.user.uid);
        })
        .catch((e) => {
          console.log(e);
        });

      // 2. Success Banner Show (Green Box - No Alert Popup)
      if (errorBox) {
        errorBox.style.display = "block";
        errorBox.style.backgroundColor = "#d1fae5"; // Soft Green background
        errorBox.style.borderColor = "#a7f3d0";
        errorBox.style.color = "#047857"; // Dark Green text
        errorBox.innerText = "Successfully Logged In!";
      }

      // 2 Seconds bad Dashboard redirection
      setTimeout(() => {
        window.location.replace("dashboard.html");
      }, 2000);
    })
    .catch((err) => {
      console.log(err);

      // 3. User-friendly Firebase Error Messages
      var customMessage = "";
      switch (err.code) {
        case "auth/user-not-found":
          customMessage = "No account found with this email address.";
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          customMessage = "Incorrect email or password.";
          break;
        case "auth/invalid-email":
          customMessage = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
          customMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          customMessage = err.message;
      }

      // Error Banner Show (Red Box)
      if (errorBox) {
        errorBox.style.display = "block";
        errorBox.style.backgroundColor = "#fef2f2";
        errorBox.style.borderColor = "#fecaca";
        errorBox.style.color = "#dc2626";
        errorBox.innerText = customMessage;
      }
    });
});
