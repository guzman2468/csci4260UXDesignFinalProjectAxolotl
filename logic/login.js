const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginEmailError = document.getElementById("loginEmailError");
const loginPasswordError = document.getElementById("loginPasswordError");
const loginSuccess = document.getElementById("loginSuccess");
const loginToggleBtn = document.querySelector(".toggle-btn");

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function setError(input, errorBox, message) {
  input.classList.add("input-error");
  errorBox.textContent = message;
}

function clearError(input, errorBox) {
  input.classList.remove("input-error");
  errorBox.textContent = "";
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let isValid = true;
  loginSuccess.textContent = "";

  clearError(loginEmail, loginEmailError);
  clearError(loginPassword, loginPasswordError);

  if (loginEmail.value.trim() === "") {
    setError(loginEmail, loginEmailError, "Email is required.");
    isValid = false;
  } else if (!validEmail(loginEmail.value)) {
    setError(loginEmail, loginEmailError, "Enter a valid email address.");
    isValid = false;
  }

  if (loginPassword.value.trim() === "") {
    setError(loginPassword, loginPasswordError, "Password is required.");
    isValid = false;
  } else if (loginPassword.value.length < 6) {
    setError(loginPassword, loginPasswordError, "Password must be at least 6 characters.");
    isValid = false;
  }

  if (isValid) {
    loginSuccess.textContent = "Login form is valid.";
  }
});

loginToggleBtn.addEventListener("click", function () {
  if (loginPassword.type === "password") {
    loginPassword.type = "text";
    loginToggleBtn.textContent = "Hide";
  } else {
    loginPassword.type = "password";
    loginToggleBtn.textContent = "Show";
  }
});
