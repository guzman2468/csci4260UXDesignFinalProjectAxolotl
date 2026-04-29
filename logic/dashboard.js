const createBtn = document.getElementById("createBtn");
const recordingsBtn = document.getElementById("recordingsBtn");
const signInBtn = document.querySelector(".sign-in");
const signUpBtn = document.querySelector(".sign-up");

signInBtn.addEventListener("click", function () {
  window.location.href = "login.html";
});

signUpBtn.addEventListener("click", function () {
  window.location.href = "signup.html";
});

const tourOverlay = document.getElementById("tourOverlay");
const tourHighlight = document.getElementById("tourHighlight");
const tourPopup = document.getElementById("tourPopup");
const tourTitle = document.getElementById("tourTitle");
const tourText = document.getElementById("tourText");
const tourNextBtn = document.getElementById("tourNextBtn");
const tourCloseBtn = document.getElementById("tourCloseBtn");


const supabaseUrl = "https://ogizpqbereqnqcxihkfp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naXpwcWJlcmVxbnFjeGloa2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDEyODIsImV4cCI6MjA5MTA3NzI4Mn0.8cWpsMa2pj4-olPORCdzvb4V--UgT9SeceDa1LRErGI";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const tableBody = document.getElementById("recordingsTable");

async function loadProjects() {
  const { data: userData } = await supabaseClient.auth.getUser();

  const user = userData?.user;

  if (!user) {
    console.log("No logged in user");
    return;
  }

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  tableBody.innerHTML = "";

  data.forEach(project => {
    const row = document.createElement("div");
    row.className = "table-row";

    row.innerHTML = `
      <div class="col-title">${project.name}</div>
      <div class="col-date">${new Date(project.created_at).toLocaleDateString()}</div>
      <div class="col-share">
        <button class="share-btn">Share</button>
      </div>
      <div class="col-delete">
        <button class="delete-btn">Delete</button>
      </div>
    `;

    row.dataset.id = project.id;

    // OPEN PROJECT
    row.addEventListener("click", () => {
      window.location.href = `createPage.html?id=${project.id}`;
    });

    // SHARE BUTTON (IMPORTANT: stop row click)
    row.querySelector(".share-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `sharePage.html?id=${project.id}`;
    });

    row.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteModal.dataset.projectId = project.id;
      deleteModal.dataset.projectName = project.name;
      deleteModalTitle.textContent = `Delete "${project.name}"?`;
      deleteModal.classList.remove("hidden");
    });

    tableBody.appendChild(row);
  });
}

loadProjects();


const deleteModal = document.getElementById("deleteModal");
const deleteModalTitle = document.getElementById("deleteModalTitle");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");

deleteCancelBtn.addEventListener("click", function () {
  deleteModal.classList.add("hidden");
});

deleteConfirmBtn.addEventListener("click", async function () {
  const projectId = deleteModal.dataset.projectId;

  const { error } = await supabaseClient
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    console.error(error);
    alert("Failed to delete project.");
    return;
  }

  deleteModal.classList.add("hidden");
  loadProjects();
});

createBtn.addEventListener("click", function () {
  window.location.href = "createPage.html";
});

recordingsBtn.addEventListener("click", function () {
  window.location.href = "recordings.html";
});


const tourSteps = [
  {
    element: "#createBtn",
    title: "Create Button",
    text: "Click here to go to the create page and start a new recording flow."
  },
  {
    element: "#recordingsBtn",
    title: "Recordings Button",
    text: "Click here to open the recordings page and view saved items."
  },
  {
    element: ".table-card",
    title: "Recordings List",
    text: "This section shows your saved recordings with their date and sharing options."
  },
  {
    element: ".share-btn",
    title: "Share Button",
    text: "Use any share button to open the share page for that recording."
  }
];

let currentTourStep = 0;

function positionTour(step) {
  const target = document.querySelector(step.element);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const padding = 8;

  tourHighlight.style.top = rect.top - padding + "px";
  tourHighlight.style.left = rect.left - padding + "px";
  tourHighlight.style.width = rect.width + padding * 2 + "px";
  tourHighlight.style.height = rect.height + padding * 2 + "px";

  tourTitle.textContent = step.title;
  tourText.textContent = step.text;

  tourPopup.classList.remove("hidden");

  const popupWidth = 320;
  const gap = 16;

  let top = rect.bottom + gap;
  let left = rect.left;

  if (left + popupWidth > window.innerWidth - 16) {
    left = window.innerWidth - popupWidth - 16;
  }

  if (left < 16) {
    left = 16;
  }

  if (top + tourPopup.offsetHeight > window.innerHeight - 16) {
    top = rect.top - tourPopup.offsetHeight - gap;
  }

  if (top < 16) {
    top = 16;
  }

  tourPopup.style.top = top + "px";
  tourPopup.style.left = left + "px";
}

function showTourStep() {
  positionTour(tourSteps[currentTourStep]);
}

function startTour() {
  tourOverlay.classList.remove("hidden");
  currentTourStep = 0;
  showTourStep();
}

function endTour() {
  tourOverlay.classList.add("hidden");
  tourPopup.classList.add("hidden");
  localStorage.setItem("axolotlDashboardTourSeen", "true");
}

tourNextBtn.addEventListener("click", function () {
  currentTourStep++;

  if (currentTourStep >= tourSteps.length) {
    endTour();
    return;
  }

  showTourStep();
});

tourCloseBtn.addEventListener("click", function () {
  endTour();
});

window.addEventListener("resize", function () {
  if (!tourOverlay.classList.contains("hidden")) {
    showTourStep();
  }
});

window.addEventListener("load", function () {
  const hasSeenTour = localStorage.getItem("axolotlDashboardTourSeen");

  if (!hasSeenTour) {
    startTour();
  }
});

const savedEmail = localStorage.getItem("loggedInEmail");
const profileLetter = document.getElementById("profileLetter");

if (savedEmail && profileLetter) {
  profileLetter.textContent = savedEmail.charAt(0).toUpperCase();
}

profileIcon.addEventListener("click", function (event) {
  event.stopPropagation();
  profileDropdown.classList.toggle("hidden");
});

logoutBtn.addEventListener("click", function () {
  localStorage.removeItem("loggedInEmail");
  sessionStorage.removeItem("axolotlSettings");
  window.location.href = "login.html";
});

document.addEventListener("click", function (event) {
  if (!profileIcon.contains(event.target) && !profileDropdown.contains(event.target)) {
    profileDropdown.classList.add("hidden");
  }
});