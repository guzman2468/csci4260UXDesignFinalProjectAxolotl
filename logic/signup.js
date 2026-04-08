const signupForm = document.getElementById("signupForm");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const confirmPassword = document.getElementById("confirmPassword");
const signupEmailError = document.getElementById("signupEmailError");
const signupPasswordError = document.getElementById("signupPasswordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const signupSuccess = document.getElementById("signupSuccess");
const signupToggleButtons = document.querySelectorAll(".toggle-btn");
const supabaseUrl = "https://ogizpqbereqnqcxihkfp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naXpwcWJlcmVxbnFjeGloa2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDEyODIsImV4cCI6MjA5MTA3NzI4Mn0.8cWpsMa2pj4-olPORCdzvb4V--UgT9SeceDa1LRErGI";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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

// signupForm.addEventListener("submit", function (event) {
//   event.preventDefault();

//   let isValid = true;
//   signupSuccess.textContent = "";

//   clearError(signupEmail, signupEmailError);
//   clearError(signupPassword, signupPasswordError);
//   clearError(confirmPassword, confirmPasswordError);

//   if (signupEmail.value.trim() === "") {
//     setError(signupEmail, signupEmailError, "Email is required.");
//     isValid = false;
//   } else if (!validEmail(signupEmail.value)) {
//     setError(signupEmail, signupEmailError, "Enter a valid email address.");
//     isValid = false;
//   }

//   if (signupPassword.value.trim() === "") {
//     setError(signupPassword, signupPasswordError, "Password is required.");
//     isValid = false;
//   } else if (signupPassword.value.length < 8) {
//     setError(signupPassword, signupPasswordError, "Password must be at least 8 characters.");
//     isValid = false;
//   } else if (!/[A-Z]/.test(signupPassword.value) || !/[0-9]/.test(signupPassword.value)) {
//     setError(signupPassword, signupPasswordError, "Use at least 1 uppercase letter and 1 number.");
//     isValid = false;
//   }

//   if (confirmPassword.value.trim() === "") {
//     setError(confirmPassword, confirmPasswordError, "Please confirm your password.");
//     isValid = false;
//   } else if (confirmPassword.value !== signupPassword.value) {
//     setError(confirmPassword, confirmPasswordError, "Passwords do not match.");
//     isValid = false;
//   }

//   if (isValid) {
//     signupSuccess.textContent = "Signup form is valid.";
//   }
// });

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

signupForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  let isValid = true;
  signupSuccess.textContent = "";

  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const confirm = confirmPassword.value;

  // clear old errors
  clearError(signupEmail, signupEmailError);
  clearError(signupPassword, signupPasswordError);
  clearError(confirmPassword, confirmPasswordError);

  // EMAIL VALIDATION
  if (email === "") {
    setError(signupEmail, signupEmailError, "Email is required.");
    isValid = false;
  } else if (!validEmail(email)) {
    setError(signupEmail, signupEmailError, "Enter a valid email address.");
    isValid = false;
  }

  // PASSWORD VALIDATION
  if (password.trim() === "") {
    setError(signupPassword, signupPasswordError, "Password is required.");
    isValid = false;
  } else if (password.length < 8) {
    setError(signupPassword, signupPasswordError, "Password must be at least 8 characters.");
    isValid = false;
  } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    setError(signupPassword, signupPasswordError, "Use at least 1 uppercase letter and 1 number.");
    isValid = false;
  }

  // CONFIRM PASSWORD
  if (confirm.trim() === "") {
    setError(confirmPassword, confirmPasswordError, "Please confirm your password.");
    isValid = false;
  } else if (confirm !== password) {
    setError(confirmPassword, confirmPasswordError, "Passwords do not match.");
    isValid = false;
  }

  // 🚨 STOP HERE if invalid
  if (!isValid) return;

  // ✅ ONLY RUN IF VALID
  const { data, error } = await supabaseClient
    .from("users")
    .insert([
      {
        email: email,
        password: password
      }
    ]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  signupSuccess.textContent = "Account created!";
  alert("Signup successful");
});