const signupForm = document.getElementById("signupForm");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const confirmPassword = document.getElementById("confirmPassword");
const signupEmailError = document.getElementById("signupEmailError");
const signupPasswordError = document.getElementById("signupPasswordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const signupSuccess = document.getElementById("signupSuccess");
const signupToggleButtons = document.querySelectorAll(".toggle-btn");

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

signupForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let isValid = true;
  signupSuccess.textContent = "";

  clearError(signupEmail, signupEmailError);
  clearError(signupPassword, signupPasswordError);
  clearError(confirmPassword, confirmPasswordError);

  if (signupEmail.value.trim() === "") {
    setError(signupEmail, signupEmailError, "Email is required.");
    isValid = false;
  } else if (!validEmail(signupEmail.value)) {
    setError(signupEmail, signupEmailError, "Enter a valid email address.");
    isValid = false;
  }

  if (signupPassword.value.trim() === "") {
    setError(signupPassword, signupPasswordError, "Password is required.");
    isValid = false;
  } else if (signupPassword.value.length < 8) {
    setError(signupPassword, signupPasswordError, "Password must be at least 8 characters.");
    isValid = false;
  } else if (!/[A-Z]/.test(signupPassword.value) || !/[0-9]/.test(signupPassword.value)) {
    setError(signupPassword, signupPasswordError, "Use at least 1 uppercase letter and 1 number.");
    isValid = false;
  }

  if (confirmPassword.value.trim() === "") {
    setError(confirmPassword, confirmPasswordError, "Please confirm your password.");
    isValid = false;
  } else if (confirmPassword.value !== signupPassword.value) {
    setError(confirmPassword, confirmPasswordError, "Passwords do not match.");
    isValid = false;
  }

  if (isValid) {
    signupSuccess.textContent = "Signup form is valid.";
  }
});

signupToggleButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const targetInput = document.getElementById(button.dataset.target);

    if (targetInput.type === "password") {
      targetInput.type = "text";
      button.textContent = "Hide";
    } else {
      targetInput.type = "password";
      button.textContent = "Show";
    }
  });
});
