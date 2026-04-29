const supabaseUrl = "https://ogizpqbereqnqcxihkfp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naXpwcWJlcmVxbnFjeGloa2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDEyODIsImV4cCI6MjA5MTA3NzI4Mn0.8cWpsMa2pj4-olPORCdzvb4V--UgT9SeceDa1LRErGI";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const projectName = document.getElementById("projectName");
const statusText = document.getElementById("statusText");
const saveBtn = document.getElementById("saveBtn");

const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

let currentProject = null;

async function loadProject() {
  if (!projectId) {
    projectName.textContent = "Invalid link.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    projectName.textContent = "Project not found.";
    return;
  }

  currentProject = data;
  projectName.textContent = data.name;
}

async function saveACopy() {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData?.user;

  if (!user) {
    statusText.textContent = "Please sign in to save a copy.";
    setTimeout(() => {
      window.location.href = `login.html?redirect=viewProject.html?id=${projectId}`;
    }, 1500);
    return;
  }

  const { error } = await supabaseClient
    .from("projects")
    .insert({
      name: `Copy of ${currentProject.name}`,
      user_id: user.id,
      data: currentProject.data
    });

  if (error) {
    console.error(error);
    statusText.textContent = "Failed to save copy.";
    return;
  }

  statusText.textContent = "Saved! Redirecting to dashboard...";
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1500);
}

saveBtn.addEventListener("click", saveACopy);
loadProject();