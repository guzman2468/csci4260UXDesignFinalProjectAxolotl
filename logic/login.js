const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginEmailError = document.getElementById("loginEmailError");
const loginPasswordError = document.getElementById("loginPasswordError");
const loginSuccess = document.getElementById("loginSuccess");
const loginToggleBtn = document.querySelector(".toggle-btn");
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

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .limit(1);

  if (error) {
    console.error(error);
    alert("Query failed: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("Login failed");
  } else {
    alert("Login successful");
  }
});
