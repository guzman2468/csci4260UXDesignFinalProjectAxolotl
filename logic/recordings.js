const supabaseUrl = "https://ogizpqbereqnqcxihkfp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naXpwcWJlcmVxbnFjeGloa2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDEyODIsImV4cCI6MjA5MTA3NzI4Mn0.8cWpsMa2pj4-olPORCdzvb4V--UgT9SeceDa1LRErGI";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const tableBody = document.getElementById("recordingsTable");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageLabel = document.getElementById("pageLabel");
const closeBtn = document.getElementById("closeBtn");
const deleteModal = document.getElementById("deleteModal");
const deleteModalTitle = document.getElementById("deleteModalTitle");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");

const PAGE_SIZE = 10;
let currentPage = 0;
let totalCount = 0;

async function loadProjects() {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData?.user;

  if (!user) {
    tableBody.innerHTML = "<div style='padding: 20px;'>Please log in to view your projects.</div>";
    return;
  }

  const from = currentPage * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabaseClient
    .from("projects")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error(error);
    return;
  }

  totalCount = count;
  tableBody.innerHTML = "";

  data.forEach(project => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.dataset.id = project.id;

    row.innerHTML = `
      <div class="col-title">${project.name}</div>
      <div class="col-date">${new Date(project.created_at).toLocaleDateString()}</div>
      <div class="col-share"><button class="share-btn">Share</button></div>
      <div class="col-delete"><button class="delete-btn">Delete</button></div>
    `;

    row.addEventListener("click", () => {
      window.location.href = `createPage.html?id=${project.id}`;
    });

    row.querySelector(".share-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `sharePage.html?id=${project.id}`;
    });

    row.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteModal.dataset.projectId = project.id;
      deleteModalTitle.textContent = `Delete "${project.name}"?`;
      deleteModal.classList.remove("hidden");
    });

    tableBody.appendChild(row);
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  pageLabel.textContent = `Page ${currentPage + 1} of ${totalPages || 1}`;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = (currentPage + 1) * PAGE_SIZE >= totalCount;
}

prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    loadProjects();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextBtn.addEventListener("click", () => {
  if ((currentPage + 1) * PAGE_SIZE < totalCount) {
    currentPage++;
    loadProjects();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

deleteCancelBtn.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
});

deleteConfirmBtn.addEventListener("click", async () => {
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

closeBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

loadProjects();

// Profile
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