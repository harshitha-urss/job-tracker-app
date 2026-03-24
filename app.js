console.log("App started");

// ================= THEME =================
const savedTheme = localStorage.getItem("theme");
function toggleTheme() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

(function () {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
})();

// ================= PREFERENCES =================
const defaultPreferences = {
  roleKeywords: "",
  preferredLocations: [],
  preferredMode: [],
  experienceLevel: "",
  skills: "",
  minMatchScore: 40
};

function getPreferences(){
  const saved = JSON.parse(localStorage.getItem("jobTrackerPreferences"));

  return {
    roleKeywords: saved?.roleKeywords || "",
    preferredLocations: saved?.preferredLocations || [],
    preferredMode: saved?.preferredMode || [],
    experienceLevel: saved?.experienceLevel || "",
    skills: saved?.skills || "",
    minMatchScore: saved?.minMatchScore || 40
  };
}

// ================= STATUS =================
function getStatusMap(){
  return JSON.parse(localStorage.getItem("jobTrackerStatus")) || {};
}

function setStatus(jobId, status){
  const map = getStatusMap();
  map[jobId] = status;
  localStorage.setItem("jobTrackerStatus", JSON.stringify(map));

  addStatusLog(jobId, status);
  showToast(`Status updated: ${status}`);
}

function getStatus(jobId){
  const map = getStatusMap();
  return map[jobId] || "Not Applied";
}

// ================= DATA =================
const companies = [
  "Infosys","TCS","Wipro","Accenture","Capgemini","Cognizant",
  "IBM","Oracle","SAP","Dell","Amazon","Flipkart",
  "Swiggy","Razorpay","PhonePe","Paytm","Zoho",
  "Freshworks","Juspay","CRED","Groww","Meesho"
];

const roles = [
  "SDE Intern",
  "Graduate Engineer Trainee",
  "Junior Backend Developer",
  "Frontend Intern",
  "QA Intern",
  "Data Analyst Intern",
  "Java Developer (0-1)",
  "Python Developer (Fresher)",
  "React Developer (1-3)"
];

const locations = ["Bangalore","Hyderabad","Chennai","Pune","Remote"];
const modes = ["Remote","Hybrid","Onsite"];
const experiences = ["Fresher","0-1","1-3","3-5"];
const salaries = [
  "3-5 LPA",
  "6-10 LPA",
  "10-18 LPA",
  "₹15k-₹40k/month Internship"
];
const sources = ["LinkedIn","Naukri","Indeed"];

// ================= JOB DATA =================
const jobs = [];

for (let i = 1; i <= 60; i++) {
  jobs.push({
    id: i,
    title: roles[Math.floor(Math.random()*roles.length)],
    company: companies[Math.floor(Math.random()*companies.length)],
    location: locations[Math.floor(Math.random()*locations.length)],
    mode: modes[Math.floor(Math.random()*modes.length)],
    experience: experiences[Math.floor(Math.random()*experiences.length)],
    salaryRange: salaries[Math.floor(Math.random()*salaries.length)],
    source: sources[Math.floor(Math.random()*sources.length)],
    postedDaysAgo: Math.floor(Math.random()*11),
    skills: ["JavaScript","React","Node","Python","SQL"]
      .sort(()=>0.5-Math.random()).slice(0,3),
    applyUrl: "https://careers.example.com/job/"+i,
    description:
      "Work on scalable systems, collaborate with teams, build clean code, and contribute to impactful features using modern tech."
  });
}

// ================= ELEMENTS =================
const jobList = document.getElementById("job-list");
const searchInput = document.getElementById("search");
const locationFilter = document.getElementById("locationFilter");
const modeFilter = document.getElementById("modeFilter");
const expFilter = document.getElementById("experienceFilter");
const sourceFilter = document.getElementById("sourceFilter");
const sortFilter = document.getElementById("sortFilter");
const statusFilter = document.getElementById("statusFilter");

// ================= MATCH SCORE =================
function calculateMatchScore(job){
  const prefs = getPreferences();
  let score = 0;

  const keywords = prefs.roleKeywords.toLowerCase().split(",");

  // FIXED: ANY match only once
  if(keywords.some(k => job.title.toLowerCase().includes(k.trim()))){
    score += 25;
  }

  if(keywords.some(k => job.description.toLowerCase().includes(k.trim()))){
    score += 15;
  }

  if(prefs.preferredLocations.includes(job.location)) score += 15;
  if(prefs.preferredMode.includes(job.mode)) score += 10;
  if(prefs.experienceLevel === job.experience) score += 10;

  const userSkills = prefs.skills.toLowerCase().split(",");
  if(job.skills.some(skill => userSkills.includes(skill.toLowerCase()))){
    score += 15;
  }

  if(job.postedDaysAgo <= 2) score += 5;
  if(job.source === "LinkedIn") score += 5;

  return Math.min(score, 100);
}

// ================= RENDER =================
function renderJobs(jobArray){

  if (!jobList) return;

  jobList.innerHTML = "";

  const prefs = getPreferences();

  const noPrefs =
    !prefs.roleKeywords &&
    prefs.preferredLocations.length === 0 &&
    prefs.preferredMode.length === 0 &&
    !prefs.experienceLevel &&
    !prefs.skills;

  if(noPrefs){
    jobList.innerHTML = "<h3>Set your preferences to activate intelligent matching.</h3>";
    return;
  }

  if(jobArray.length === 0){
  jobList.innerHTML = `
    <div class="empty-state-wrapper">
    <div class="empty-state">
        <h3>No Jobs Saved Yet</h3>
        <p>Explore and save jobs to see them here.</p>
        <p>Go to the dashboard and click "Save" on jobs you like.</p>
      </div>
    </div>
  `;
  return;

}
  jobArray.forEach(job=>{
    const card = document.createElement("div");
    card.className = "ds-card";

    const score = calculateMatchScore(job);
    const status = getStatus(job.id);

    let badgeColor = "grey";
    if(score >= 80) badgeColor = "green";
    else if(score >= 60) badgeColor = "amber";
    else if(score >= 40) badgeColor = "neutral";

    card.innerHTML = `
    <h3>${job.title}</h3>
    <p>${job.company}</p>
    <p>${job.location} • ${job.mode}</p>
    <p>${job.experience}</p>
    <p>${job.salaryRange}</p>
    <p>${job.source} • ${job.postedDaysAgo} days ago</p>

    <p class="match ${badgeColor}">Match: ${score}</p>

    <!-- ✅ STATUS -->
    <p class="status ${status.toLowerCase().replace(" ", "-")}">${status}</p>

    <!-- ✅ STATUS BUTTONS -->
    <!-- STATUS BUTTONS -->
<div class="button-group">
    <button onclick="setStatus(${job.id}, 'Applied')">Applied</button>
    <button onclick="setStatus(${job.id}, 'Rejected')">Rejected</button>
    <button onclick="setStatus(${job.id}, 'Selected')">Selected</button>
</div>

<!-- ACTION BUTTONS -->
<div class="button-group">
    <button onclick="viewJob(${job.id})">View</button>

    ${window.location.pathname.includes("saved.html")
        ? `<button onclick="removeSaved(${job.id})">Unsave</button>`
        : `<button onclick="saveJob(${job.id})">Save</button>`
    }

    <button class="apply-btn" onclick="applyJob('${job.applyUrl}')">Apply</button>
</div>
    `;

    jobList.appendChild(card);
  });
}

// ================= FILTER =================
function applyFilters(){

  let filtered = jobs.filter(job=>{
  return (
    job.title.toLowerCase().includes(searchInput.value.toLowerCase()) &&
    (locationFilter.value==="All"||job.location===locationFilter.value) &&
    (modeFilter.value==="All"||job.mode===modeFilter.value) &&
    (expFilter.value==="All"||job.experience===expFilter.value) &&
    (sourceFilter.value==="All"||job.source===sourceFilter.value) &&
    (!statusFilter || statusFilter.value==="All" || getStatus(job.id)===statusFilter.value)
  );
});

  const prefs = getPreferences();
  const matchToggle = document.getElementById("matchToggle");

  if(matchToggle && matchToggle.checked){
    filtered = filtered.filter(job =>
      calculateMatchScore(job) >= prefs.minMatchScore
    );
  }

  if(sortFilter.value === "latest"){
    filtered.sort((a,b)=>a.postedDaysAgo - b.postedDaysAgo);
  }

  if(sortFilter.value === "match"){
    filtered.sort((a,b)=>calculateMatchScore(b) - calculateMatchScore(a));
  }

  // NEW: salary sort
  if(sortFilter.value === "salary"){
    filtered.sort((a,b)=>{
      const getNum = s => parseInt(s.match(/\d+/)?.[0] || 0);
      return getNum(b.salaryRange) - getNum(a.salaryRange);
    });
  }

  renderJobs(filtered);
}

// ================= EVENTS =================
if (!window.location.pathname.includes("saved.html")) {
  renderJobs(jobs);

  if(searchInput) searchInput.oninput = applyFilters;
  if(locationFilter) locationFilter.onchange = applyFilters;
  if(modeFilter) modeFilter.onchange = applyFilters;
  if(expFilter) expFilter.onchange = applyFilters;
  if(sourceFilter) sourceFilter.onchange = applyFilters;
  if(sortFilter) sortFilter.onchange = applyFilters;
  if(statusFilter) statusFilter.onchange = applyFilters;
}

// ================= SAVE =================
function saveJob(id){
  let saved = JSON.parse(localStorage.getItem("savedJobs")) || [];

  if(!saved.includes(id)){
    saved.push(id);
    localStorage.setItem("savedJobs", JSON.stringify(saved));
    alert("Saved!");
  }
}

// ================= REMOVE =================
function removeSaved(id){
  let saved = JSON.parse(localStorage.getItem("savedJobs")) || [];
  saved = saved.filter(jobId => jobId !== id);
  localStorage.setItem("savedJobs", JSON.stringify(saved));
  loadSavedJobs();
}

// ================= LOAD SAVED =================
function loadSavedJobs(){
  const savedIds = JSON.parse(localStorage.getItem("savedJobs")) || [];
  const savedJobs = jobs.filter(job => savedIds.includes(job.id));
  renderJobs(savedJobs);
}

// ================= LOAD SETTINGS =================
function loadPreferencesToUI(){
  const prefs = getPreferences();

  document.getElementById("roleKeywords").value = prefs.roleKeywords;
  document.getElementById("skills").value = prefs.skills;
  document.getElementById("experience").value = prefs.experienceLevel;
  document.getElementById("minScore").value = prefs.minMatchScore;

  const scoreValue = document.getElementById("scoreValue");
  if(scoreValue){
    scoreValue.innerText = prefs.minMatchScore;
 }

  const locSelect = document.getElementById("preferredLocations");
  [...locSelect.options].forEach(option=>{
    option.selected = prefs.preferredLocations.includes(option.value);
  });

  document.querySelectorAll(".mode").forEach(m=>{
    m.checked = prefs.preferredMode.includes(m.value);
  });
}

// ================= SLIDER VALUE DISPLAY =================
const slider = document.getElementById("minScore");
const scoreValue = document.getElementById("scoreValue");

if (slider && scoreValue) {
  scoreValue.innerText = slider.value;

  slider.oninput = () => {
    scoreValue.innerText = slider.value;
  };
}

// ================= SETTINGS =================
function savePreferences(){

  const locations = [...document.getElementById("preferredLocations").selectedOptions]
    .map(o => o.value);

  const modes = [...document.querySelectorAll(".mode:checked")]
    .map(m => m.value);

  const prefs = {
    roleKeywords: document.getElementById("roleKeywords").value,
    preferredLocations: locations,
    preferredMode: modes,
    experienceLevel: document.getElementById("experience").value,
    skills: document.getElementById("skills").value,
    minMatchScore: Number(document.getElementById("minScore").value)
  };

  localStorage.setItem("jobTrackerPreferences", JSON.stringify(prefs));
  alert("Preferences saved!");
}

// ================= APPLY =================
function applyJob(url){
  window.open(url,"_blank");
}

// ================= VIEW =================
function viewJob(id){
  const job = jobs.find(j=>j.id===id);

  document.getElementById("modal-title").innerText = job.title;
  document.getElementById("modal-desc").innerText = job.description;
  document.getElementById("modal-skills").innerText =
    "Skills: "+job.skills.join(", ");

  document.getElementById("modal").classList.remove("hidden");
}

// CLOSE MODAL
const closeBtn = document.getElementById("closeModal");
if(closeBtn){
  closeBtn.onclick = ()=>{
    document.getElementById("modal").classList.add("hidden");
  };
}

// ================= DARK MODE =================
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  const btn = document.querySelector("nav button");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    if(btn) btn.innerText = "☀️";
  } else {
    localStorage.setItem("theme", "light");
    if(btn) btn.innerText = "🌙";
  }
}

// LOAD SAVED PAGE
if (window.location.pathname.includes("saved.html")) {
  loadSavedJobs();
}

// LOAD SETTINGS PAGE PREFILL
if (window.location.pathname.includes("settings.html")) {
  loadPreferencesToUI();
}

// ================= DIGEST =================
function generateDigest(){

  const prefs = getPreferences();
  const container = document.getElementById("digest-container");

  if(!container) return;

  const noPrefs =
    !prefs.roleKeywords &&
    prefs.preferredLocations.length === 0 &&
    prefs.preferredMode.length === 0 &&
    !prefs.experienceLevel &&
    !prefs.skills;

  if(noPrefs){
    container.innerHTML =
      "<h3>Set preferences to generate a personalized digest.</h3>";
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const key = "jobTrackerDigest_" + today;

  const existing = localStorage.getItem(key);

  if(existing){
    renderDigest(JSON.parse(existing));
    return;
  }

  let sorted = [...jobs];

  sorted.sort((a,b)=>{
    return calculateMatchScore(b) - calculateMatchScore(a) ||
           a.postedDaysAgo - b.postedDaysAgo;
  });

  const top10 = sorted.slice(0,10);

  if(top10.length === 0){
    container.innerHTML = "<h3>No matching roles today. Check again tomorrow.</h3>";
    return;
  }

  localStorage.setItem(key, JSON.stringify(top10));

  renderDigest(top10);
}

function addStatusLog(jobId, status){
  const logs = JSON.parse(localStorage.getItem("jobTrackerLogs")) || [];

  const job = jobs.find(j=>j.id===jobId);

  logs.unshift({
    title: job.title,
    company: job.company,
    status,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("jobTrackerLogs", JSON.stringify(logs.slice(0,10)));
}

function renderDigest(list){

  const container = document.getElementById("digest-container");
  const today = new Date().toDateString();

  const logs = JSON.parse(localStorage.getItem("jobTrackerLogs")) || [];

  const logHTML = logs.map(l => `
    <p>${l.title} - ${l.company} - ${l.status} (${l.date})</p>
  `).join("");

  container.innerHTML = `
    <div style="max-width:720px;margin:auto;background:white;padding:20px">

      <h2>Top 10 Jobs For You — 9AM Digest</h2>
      <p>${today}</p>

      ${list.map(job => `
        <div class="ds-card">
          <h3>${job.title}</h3>
          <p>${job.company}</p>
          <p>${job.location}</p>
          <p>${job.experience}</p>
          <p>Match: ${calculateMatchScore(job)}</p>
          <button onclick="applyJob('${job.applyUrl}')">Apply</button>
        </div>
      `).join("")}

      <p>This digest was generated based on your preferences.</p>

      <button onclick="copyDigest()">Copy Digest</button>
      <button onclick="emailDigest()">Create Email Draft</button>

      <h3>Recent Status Updates</h3>
      ${logHTML || "<p>No recent updates</p>"}

      <p style="font-size:12px;color:gray;">
        Demo Mode: Daily 9AM trigger simulated manually.
      </p>

    </div>
  `;
}

// COPY
function copyDigest(){
  const text = document.getElementById("digest-container").innerText;
  navigator.clipboard.writeText(text);
  alert("Copied!");
}

// EMAIL
function emailDigest(){
  const text = document.getElementById("digest-container").innerText;
  window.location.href =
    `mailto:?subject=My 9AM Job Digest&body=${encodeURIComponent(text)}`;
}

// ================= TOAST =================
function showToast(msg){
  const toast = document.createElement("div");
  toast.innerText = msg;
  toast.className = "toast";

  document.body.appendChild(toast);

  setTimeout(()=>{
    toast.remove();
  },2000);
}

function loadTestChecklist() {
  const container = document.getElementById("testContainer");
  if (!container) return;

  const tests = [
    "Preferences persist after refresh",
    "Match score calculates correctly",
    "Show only matches toggle works",
    "Save job persists after refresh",
    "Apply opens in new tab",
    "Status update persists after refresh",
    "Status filter works correctly",
    "Digest generates top 10",
    "Digest persists for the day",
    "No console errors"
  ];

  let saved = JSON.parse(localStorage.getItem("testStatus")) || {};

  container.innerHTML = tests.map((test, i) => `
    <div>
      <input type="checkbox" id="t${i}" ${saved[i] ? "checked" : ""} onchange="updateTest(${i})">
      ${test}
    </div>
  `).join("");

  updateCounter();
}

const testStatus = JSON.parse(localStorage.getItem("jobTrackerTestStatus")) || {};
const passed = Object.values(testStatus).filter(v => v).length;

if (window.location.pathname.includes("proof.html") && passed < 10) {
  alert("Complete all tests before shipping!");
  window.location.href = "test.html";
}

function updateCounter() {
  let saved = JSON.parse(localStorage.getItem("testStatus")) || {};
  let passed = Object.values(saved).filter(v => v).length;

  let counter = document.getElementById("counter");
  if (!counter) {
    counter = document.createElement("h3");
    counter.id = "counter";
    document.body.prepend(counter);
  }

  counter.innerText = `Tests Passed: ${passed} / 10`;
}

loadTestChecklist();

function resetPreferences(){
  localStorage.removeItem("jobTrackerPreferences");

  // Reset UI fields
  document.getElementById("roleKeywords").value = "";
  document.getElementById("skills").value = "";
  document.getElementById("experience").value = "";
  document.getElementById("minScore").value = 40;

  document.getElementById("scoreValue").innerText = 40;

  // Reset multi-select
  const locSelect = document.getElementById("preferredLocations");
  [...locSelect.options].forEach(o => o.selected = false);

  // Reset checkboxes
  document.querySelectorAll(".mode").forEach(m => m.checked = false);

  alert("Preferences reset!");
}