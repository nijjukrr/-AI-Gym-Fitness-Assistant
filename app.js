/* ==========================================
   TRIVAN'S TECH AI Gym & Fitness Assistant Core Logic
   Authentication Flow & Theme Redesign Included
   ========================================== */

// Global State
// Resolve API base URL dynamically based on current deployment
const API_BASE = "https://ai-gym-fitness-assistant-1.onrender.com/api";

let generatedOTP = "123456";
let isLoggedIn = false;
let gymSocket = null;

document.addEventListener("DOMContentLoaded", () => {
  checkAuthState();
  initTheme();
  initHeaderInteractions();
});

async function checkAuthState() {
  const authState = localStorage.getItem("trivan_is_logged_in");
  const token = localStorage.getItem("trivan_jwt_token");
  const loginContainer = document.getElementById("login-container");
  const appWrapper = document.getElementById("app-wrapper");

  if (authState === "true") {
    isLoggedIn = true;
    loginContainer.classList.add("hidden");
    appWrapper.classList.remove("hidden");
    
    // Fetch profile details using JWT token
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.status === 200) {
          const user = await res.json();
          document.querySelectorAll(".user-name").forEach(el => el.innerText = user.name || "Nishanth KR");
          const avatarText = (user.name || "NK").split(" ").map(n => n[0]).join("").toUpperCase();
          document.querySelectorAll(".user-avatar").forEach(el => el.innerText = avatarText);
        } else if (res.status === 401) {
          console.warn("Session expired. Logging out.");
          logout();
          return;
        }
      } catch (err) {
        console.warn("Failed to contact auth server. Continuing with cached session.", err);
      }
    }
    
    // Initialize Dashboard & Modules
    initRouter();
    initLucideIcons();
    initGymTrainer();
    initDietician();
    initSmartGym();
    initHabitTracker();
    initGymBuddy();
    initPerformanceAnalyzer();
    initGymRecommender();
  } else {
    isLoggedIn = false;
    loginContainer.classList.remove("hidden");
    appWrapper.classList.add("hidden");
    initLucideIcons(); // Load icons for login screen
  }
}

/* ==========================================
   GMAIL OTP AUTHENTICATION SYSTEM
   ========================================== */
function showGmailToast(otp, email) {
  const toast = document.getElementById("gmail-toast");
  const otpSpan = document.getElementById("toast-otp");
  if (!toast || !otpSpan) return;

  otpSpan.innerText = otp;
  toast.classList.remove("hidden");
  toast.classList.remove("hide");

  initLucideIcons();

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    hideGmailToast();
  }, 10000);

  toast.onclick = () => {
    hideGmailToast();
  };
}

function hideGmailToast() {
  const toast = document.getElementById("gmail-toast");
  if (!toast) return;
  toast.classList.add("hide");
  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("hide");
  }, 300);
}

async function startGmailVerification() {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  
  if (!emailInput.checkValidity() || !emailInput.value) {
    showAppNotification("Please enter a valid Gmail address.", "warning");
    return;
  }
  if (!passwordInput.value || passwordInput.value.length < 4) {
    showAppNotification("Please enter a password (minimum 4 characters).", "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value })
    });
    const data = await res.json();
    if (res.status === 200 || data.otp) {
      generatedOTP = data.otp;
      showGmailToast(generatedOTP, emailInput.value);
      console.log(`[TRIVAN'S TECH Verification System] OTP sent: ${generatedOTP}`);
      
      document.getElementById("otp-wrapper").classList.remove("hidden");
      document.getElementById("btn-verify-gmail").classList.add("hidden");
      document.getElementById("btn-login-submit").classList.remove("hidden");
    } else {
      showAppNotification(data.detail || "Failed to start verification.", "warning");
    }
  } catch (err) {
    console.warn("[Auth Offline] Running local validation mode.", err);
    generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    showGmailToast(generatedOTP, emailInput.value);
    document.getElementById("otp-wrapper").classList.remove("hidden");
    document.getElementById("btn-verify-gmail").classList.add("hidden");
    document.getElementById("btn-login-submit").classList.remove("hidden");
  }
}

async function resendOTP() {
  const emailVal = document.getElementById("login-email").value.trim();
  const passwordVal = document.getElementById("login-password").value;
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passwordVal })
    });
    const data = await res.json();
    if (data.otp) {
      generatedOTP = data.otp;
      showGmailToast(generatedOTP, emailVal);
      console.log(`[TRIVAN'S TECH Verification System] New OTP sent: ${generatedOTP}`);
    }
  } catch (err) {
    generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    showGmailToast(generatedOTP, emailVal);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  
  const otpWrapper = document.getElementById("otp-wrapper");
  const isOtpVisible = otpWrapper && !otpWrapper.classList.contains("hidden");

  if (!isOtpVisible) {
    startGmailVerification();
    return;
  }
  
  const emailVal = document.getElementById("login-email").value.trim();
  const passwordVal = document.getElementById("login-password").value;
  const otpInput = document.getElementById("login-otp").value.trim();
  
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passwordVal, otp: otpInput })
    });
    
    const data = await res.json();
    if (res.status === 200) {
      localStorage.setItem("trivan_jwt_token", data.token);
      localStorage.setItem("trivan_is_logged_in", "true");
      localStorage.setItem("trivan_user_name", data.user.name || "Nishanth KR");
      localStorage.setItem("trivan_user_email", data.user.email);
      showAppNotification("Successfully logged in!", "success");
      checkAuthState();
    } else {
      showAppNotification(data.detail || "Authentication failed. Incorrect details.", "warning");
    }
  } catch (err) {
    console.warn("[Auth Offline] Running local validation fallback.", err);
    if (otpInput === generatedOTP || otpInput === "123456") {
      localStorage.setItem("trivan_is_logged_in", "true");
      localStorage.setItem("trivan_user_name", "Nishanth KR");
      localStorage.setItem("trivan_user_email", emailVal);
      checkAuthState();
    } else {
      showAppNotification("Invalid verification code. Please check the code and try again.", "warning");
    }
  }
}

function logout() {
  localStorage.removeItem("trivan_jwt_token");
  localStorage.setItem("trivan_is_logged_in", "false");
  localStorage.removeItem("trivan_user_name");
  localStorage.removeItem("trivan_user_email");
  
  // Stop running simulators
  stopTrainer();
  stopTreadmillBeltAnimation();
  if (gymSocket) {
    gymSocket.close();
    gymSocket = null;
  }
  
  // Reset login fields
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("login-otp").value = "";
  document.getElementById("otp-wrapper").classList.add("hidden");
  document.getElementById("btn-verify-gmail").classList.remove("hidden");
  document.getElementById("btn-login-submit").classList.add("hidden");

  // Switch views
  checkAuthState();
}

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ==========================================
   1. ROUTER & NAVIGATION SYSTEM
   ========================================== */
function initRouter() {
  const menuItems = document.querySelectorAll(".menu-item");
  const tabContents = document.querySelectorAll(".tab-content");
  const navButtons = document.querySelectorAll(".btn-nav-tab");

  function navigateToTab(targetTabId) {
    tabContents.forEach(tab => {
      tab.classList.add("hidden");
    });
    menuItems.forEach(item => {
      item.classList.remove("active");
    });

    const targetSection = document.getElementById(targetTabId);
    if (targetSection) {
      targetSection.classList.remove("hidden");
    }

    const activeNav = document.getElementById(`nav-${targetTabId}`);
    if (activeNav) {
      activeNav.classList.add("active");
    }

    document.querySelector(".content-body").scrollTop = 0;

    if (targetTabId === "pose-analyzer") {
      renderCharts();
    }
    if (targetTabId === "smart-gym") {
      startTreadmillBeltAnimation();
    } else {
      stopTreadmillBeltAnimation();
    }
  }

  menuItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTabId = item.getAttribute("href").substring(1);
      navigateToTab(targetTabId);
      window.location.hash = targetTabId;
    });
  });

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.getAttribute("data-target");
      navigateToTab(targetTabId);
      window.location.hash = targetTabId;
    });
  });

  const initialHash = window.location.hash.substring(1);
  if (initialHash) {
    navigateToTab(initialHash);
  }
}

/* ==========================================
   THEME SWITCHER (DARK / LIGHT MODE)
   ========================================== */
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector("#theme-toggle i");
  if (icon) {
    if (theme === "light") {
      icon.setAttribute("data-lucide", "moon");
    } else {
      icon.setAttribute("data-lucide", "sun");
    }
    initLucideIcons();
  }
}

/* ==========================================
   2. MODULE 1: AI GYM TRAINER (POSE TRACKING & DEMO)
   ========================================== */
let webcamStream = null;
let poseDetector = null;
let cameraHelper = null;
let trainerRepCount = 0;
let lastRepCount = 0;
let exerciseState = "neutral";
let currentExercise = "bicep-curl";
let isTrainerActive = false;
let isDemoMode = false;
let demoAnimationId = null;
let sessionStartTime = null;
let trainerGoodFormCount = 0;
let isFormGoodDuringCurrentRep = true;
let repMaxAngle = 0;
let repMinAngle = 180;

const EXERCISE_CONFIGS = {
  "bicep-curl": {
    name: "Bicep Curls",
    startAngle: 145,
    peakAngle: 75,
    isFlexionFirst: true,
    minThreshold: 60,
    label1: "Elbow Angle:",
    label2: "Shoulder Angle:",
    label3: "Wrist Incline:",
    target: "10 reps"
  },
  "shoulder-press": {
    name: "Shoulder Press",
    startAngle: 75,
    peakAngle: 145,
    isFlexionFirst: false,
    minThreshold: 60,
    label1: "Shoulder Angle:",
    label2: "Elbow Angle:",
    label3: "Torso Angle:",
    target: "10 reps"
  },
  "lateral-raise": {
    name: "Lateral Raises",
    startAngle: 35,
    peakAngle: 105,
    isFlexionFirst: false,
    minThreshold: 60,
    label1: "Shoulder Angle:",
    label2: "Elbow Angle:",
    label3: "Torso Angle:",
    target: "10 reps"
  },
  "push-up": {
    name: "Push-Ups",
    startAngle: 150,
    peakAngle: 75,
    isFlexionFirst: true,
    minThreshold: 60,
    label1: "Elbow Angle:",
    label2: "Body Straightness:",
    label3: "Wrist Incline:",
    target: "12 reps"
  },
  "squat": {
    name: "Squats",
    startAngle: 160,
    peakAngle: 85,
    isFlexionFirst: true,
    minThreshold: 60,
    label1: "Knee Angle:",
    label2: "Hip Angle:",
    label3: "Back Incline:",
    target: "12 reps"
  },
  "tricep-dip": {
    name: "Tricep Dips",
    startAngle: 150,
    peakAngle: 75,
    isFlexionFirst: true,
    minThreshold: 60,
    label1: "Elbow Angle:",
    label2: "Shoulder Angle:",
    label3: "Torso Incline:",
    target: "10 reps"
  },
  "jumping-jack": {
    name: "Jumping Jacks",
    startAngle: 35,
    peakAngle: 115,
    isFlexionFirst: false,
    minThreshold: 60,
    label1: "Shoulder Angle:",
    label2: "Foot Spread Angle:",
    label3: "Hand Distance:",
    target: "15 reps"
  },
  "lunges": {
    name: "Lunges",
    startAngle: 155,
    peakAngle: 80,
    isFlexionFirst: true,
    minThreshold: 60,
    label1: "Front Knee Angle:",
    label2: "Back Knee Angle:",
    label3: "Torso Angle:",
    target: "10 reps (each leg)"
  },
  "sit-up": {
    name: "Sit-Ups",
    startAngle: 145,
    peakAngle: 70,
    isFlexionFirst: true,
    minThreshold: 60,
    label1: "Hip Angle:",
    label2: "Knee Angle:",
    label3: "Torso Angle:",
    target: "15 reps"
  },
  "calf-raise": {
    name: "Calf Raises",
    startAngle: 90,
    peakAngle: 160,
    isFlexionFirst: false,
    minThreshold: 60,
    label1: "Ankle Angle:",
    label2: "Knee Angle:",
    label3: "Heel Rise:",
    target: "15 reps"
  }
};

function initGymTrainer() {
  const startBtn = document.getElementById("btn-start-camera");
  const stopBtn = document.getElementById("btn-stop-camera");
  const demoBtn = document.getElementById("btn-demo-mode");
  const exerciseSelect = document.getElementById("select-exercise");

  if (!startBtn) return;

  if (exerciseSelect) {
    exerciseSelect.value = currentExercise;
    exerciseSelect.addEventListener("change", (e) => {
      currentExercise = e.target.value;
      const exerciseLinkMap = {
        "bicep-curl": "https://en.wikipedia.org/wiki/Bicep_curl",
        "shoulder-press": "https://en.wikipedia.org/wiki/Overhead_press",
        "lateral-raise": "https://en.wikipedia.org/wiki/Lateral_raise",
        "push-up": "https://en.wikipedia.org/wiki/Push-up",
        "squat": "https://en.wikipedia.org/wiki/Squat_(exercise)",
        "tricep-dip": "https://en.wikipedia.org/wiki/Dip_(exercise)",
        "jumping-jack": "https://en.wikipedia.org/wiki/Jumping_jack",
        "lunges": "https://en.wikipedia.org/wiki/Lunge_(exercise)",
        "sit-up": "https://en.wikipedia.org/wiki/Sit-up",
        "calf-raise": "https://en.wikipedia.org/wiki/Calf_raises"
      };
      const linkElem = document.getElementById("exercise-link");
      if (linkElem) {
        linkElem.href = exerciseLinkMap[currentExercise] || "#";
      }
      updateTrainerLabels();
      resetTrainerStats();
      if (isTrainerActive) {
        if (isDemoMode) {
          startDemoTrainer();
        } else {
          startRealTrainer();
        }
      }
    });
  }

  // Initial link load
  const exerciseLinkMap = {
    "bicep-curl": "https://en.wikipedia.org/wiki/Bicep_curl",
    "shoulder-press": "https://en.wikipedia.org/wiki/Overhead_press",
    "lateral-raise": "https://en.wikipedia.org/wiki/Lateral_raise",
    "push-up": "https://en.wikipedia.org/wiki/Push-up",
    "squat": "https://en.wikipedia.org/wiki/Squat_(exercise)",
    "tricep-dip": "https://en.wikipedia.org/wiki/Dip_(exercise)",
    "jumping-jack": "https://en.wikipedia.org/wiki/Jumping_jack",
    "lunges": "https://en.wikipedia.org/wiki/Lunge_(exercise)",
    "sit-up": "https://en.wikipedia.org/wiki/Sit-up",
    "calf-raise": "https://en.wikipedia.org/wiki/Calf_raises"
  };
  const linkElem = document.getElementById("exercise-link");
  if (linkElem) {
    linkElem.href = exerciseLinkMap[currentExercise] || "#";
  }

  startBtn.addEventListener("click", startRealTrainer);
  stopBtn.addEventListener("click", stopTrainer);
  demoBtn.addEventListener("click", startDemoTrainer);
}

function resetTrainerStats() {
  trainerRepCount = 0;
  lastRepCount = 0;
  exerciseState = "neutral";
  repMaxAngle = 0;
  repMinAngle = 180;
  sessionStartTime = Date.now();
  trainerGoodFormCount = 0;
  isFormGoodDuringCurrentRep = true;
  
  document.getElementById("trainer-rep-count").innerText = "0";
  document.getElementById("trainer-rep-progress").style.width = "0%";
  
  document.getElementById("dash-trainer-reps").innerText = "0 Reps";
  
  const feedbackLogs = document.getElementById("feedback-logs");
  if (feedbackLogs) {
    const config = EXERCISE_CONFIGS[currentExercise];
    const exName = config ? config.name : "Exercises";
    feedbackLogs.innerHTML = `
      <div class="feedback-item info">
        <span class="time">00:00</span>
        <span class="msg">Session reset. Ready for ${exName}.</span>
      </div>
    `;
  }
}

function updateTrainerLabels() {
  const targetLabel = document.getElementById("trainer-rep-target");
  const angle1Name = document.getElementById("angle-1-name");
  const angle2Name = document.getElementById("angle-2-name");
  const angle3Name = document.getElementById("angle-3-name");

  const config = EXERCISE_CONFIGS[currentExercise];
  if (config) {
    if (targetLabel) targetLabel.innerText = config.target;
    if (angle1Name) angle1Name.innerText = config.label1;
    if (angle2Name) angle2Name.innerText = config.label2;
    if (angle3Name) angle3Name.innerText = config.label3;
  }
}

function speakFeedback(text) {
  if (isDemoMode) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.4;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

function speakRepCount(count) {
  if (isDemoMode) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(count.toString());
    utterance.rate = 1.6;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function trackRepCountState(currentAngle) {
  const config = EXERCISE_CONFIGS[currentExercise];
  if (!config) return;

  repMinAngle = Math.min(repMinAngle, currentAngle);
  repMaxAngle = Math.max(repMaxAngle, currentAngle);

  if (exerciseState === "neutral") {
    if (config.isFlexionFirst) {
      if (currentAngle >= config.startAngle) {
        exerciseState = "start";
        repMinAngle = currentAngle;
        repMaxAngle = currentAngle;
      }
    } else {
      if (currentAngle <= config.startAngle) {
        exerciseState = "start";
        repMinAngle = currentAngle;
        repMaxAngle = currentAngle;
      }
    }
    return;
  }

  if (exerciseState === "start") {
    if (config.isFlexionFirst) {
      if (currentAngle <= config.peakAngle) {
        const range = repMaxAngle - currentAngle;
        if (range >= 60) {
          exerciseState = "peak";
          repMinAngle = currentAngle;
          repMaxAngle = currentAngle;
          addFeedbackLog("Peak contraction reached, now return.", "info");
        }
      }
    } else {
      if (currentAngle >= config.peakAngle) {
        const range = currentAngle - repMinAngle;
        if (range >= 60) {
          exerciseState = "peak";
          repMinAngle = currentAngle;
          repMaxAngle = currentAngle;
          addFeedbackLog("Peak extension reached, now return.", "info");
        }
      }
    }
  } else if (exerciseState === "peak") {
    if (config.isFlexionFirst) {
      if (currentAngle >= config.startAngle) {
        const range = currentAngle - repMinAngle;
        if (range >= 60) {
          trainerRepCount++;
          if (isFormGoodDuringCurrentRep) {
            trainerGoodFormCount++;
          }
          isFormGoodDuringCurrentRep = true;
          exerciseState = "start";
          repMinAngle = currentAngle;
          repMaxAngle = currentAngle;
          addFeedbackLog(`Rep ${trainerRepCount} complete!`, "success");
          if (!isDemoMode) {
            speakRepCount(trainerRepCount);
          }
        }
      }
    } else {
      if (currentAngle <= config.startAngle) {
        const range = repMaxAngle - currentAngle;
        if (range >= 60) {
          trainerRepCount++;
          if (isFormGoodDuringCurrentRep) {
            trainerGoodFormCount++;
          }
          isFormGoodDuringCurrentRep = true;
          exerciseState = "start";
          repMinAngle = currentAngle;
          repMaxAngle = currentAngle;
          addFeedbackLog(`Rep ${trainerRepCount} complete!`, "success");
          if (!isDemoMode) {
            speakRepCount(trainerRepCount);
          }
        }
      }
    }
  }
}

function addFeedbackLog(message, type = "info") {
  if (type === "warn") {
    isFormGoodDuringCurrentRep = false;
  }
  const logsContainer = document.getElementById("feedback-logs");
  if (!logsContainer) return;

  const now = new Date();
  const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  const logDiv = document.createElement("div");
  logDiv.className = `feedback-item ${type}`;
  logDiv.innerHTML = `
    <span class="time">${timeStr}</span>
    <span class="msg">${message}</span>
  `;
  
  logsContainer.prepend(logDiv);
  
  if (type === "warn" || type === "success") {
    const bubble = document.getElementById("feedback-bubble");
    const bubbleText = document.getElementById("feedback-text");
    bubbleText.innerText = message;
    
    if (type === "warn") {
      bubble.style.backgroundColor = "var(--color-red)";
      bubble.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.3)";
    } else {
      bubble.style.backgroundColor = "var(--color-green)";
      bubble.style.boxShadow = "0 8px 25px rgba(34, 197, 94, 0.3)";
    }
    
    bubble.classList.remove("hidden");
    
    if (type === "warn") {
      speakFeedback(message);
    }
    
    setTimeout(() => {
      bubble.classList.add("hidden");
    }, 3000);
  }
}

/* --- DEMO MODE ANIMATOR --- */
function startDemoTrainer() {
  stopTrainer();
  isTrainerActive = true;
  isDemoMode = true;
  resetTrainerStats();
  
  document.getElementById("camera-status").classList.add("hidden");
  // Start button remains visible during demo mode
  document.getElementById("btn-stop-camera").classList.remove("hidden");
  document.getElementById("btn-demo-mode").classList.add("active");

  const canvas = document.getElementById("camera-overlay");
  const ctx = canvas.getContext("2d");
  
  let frameCount = 0;
  
  addFeedbackLog("Demo Mode Activated. Simulating workout posture.", "info");

  function animateDemo() {
    if (!isTrainerActive || !isDemoMode) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid lines for camera matrix representation
    ctx.strokeStyle = "rgba(239, 68, 68, 0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // Sinusoidal movement cycle
    frameCount++;
    const speedCoeff = 0.025;
    const cycle = (frameCount * speedCoeff) % (2 * Math.PI);
    const amount = (Math.sin(cycle - Math.PI/2) + 1) / 2;
    
    let hipX = 320, hipY = 220;
    let shoulderX = 320, shoulderY = 130;
    let elbowX = 340, elbowY = 180;
    let wristX = 340, wristY = 230;
    let kneeX = 320, kneeY = 320;
    let ankleX = 320, ankleY = 410;
    let headX = 320, headY = 90;

    let leftShoulderX = 320, leftShoulderY = 130;
    let leftElbowX = 300, leftElbowY = 180;
    let leftWristX = 300, leftWristY = 230;
    let leftHipX = 320, leftHipY = 220;
    let leftKneeX = 320, leftKneeY = 320;
    let leftAnkleX = 320, leftAnkleY = 410;

    let angle1 = 0, angle2 = 0, angle3 = 0;

    if (currentExercise === "bicep-curl") {
      elbowX = 345;
      elbowY = 190;
      
      const wristRadius = 70;
      const startWristAngle = Math.PI * 0.45;
      const endWristAngle = -Math.PI * 0.45;
      const currentWristAngle = startWristAngle - amount * (startWristAngle - endWristAngle);
      
      wristX = elbowX + wristRadius * Math.cos(currentWristAngle);
      wristY = elbowY + wristRadius * Math.sin(currentWristAngle);
      
      angle1 = 160 - Math.round(amount * 120);
      angle2 = 15;
      angle3 = 10;

      if (frameCount % 240 === 180 && Math.random() > 0.5) {
        addFeedbackLog("Avoid swinging your upper arm!", "warn");
      }

    } else if (currentExercise === "shoulder-press") {
      elbowX = 355 - amount * 15;
      elbowY = 160 - amount * 60;
      wristX = 355 - amount * 15;
      wristY = 120 - amount * 70;
      
      angle1 = 60 + Math.round(amount * 100);
      angle2 = 45 + Math.round(amount * 90);
      angle3 = 175;

      if (frameCount % 240 === 180 && Math.random() > 0.5) {
        addFeedbackLog("Extend your arms fully overhead!", "warn");
      }

    } else if (currentExercise === "lateral-raise") {
      const elbowAngle = Math.PI/2 - amount * Math.PI/2;
      elbowX = shoulderX + 70 * Math.cos(elbowAngle);
      elbowY = shoulderY + 70 * Math.sin(elbowAngle);
      wristX = elbowX + 60 * Math.cos(elbowAngle);
      wristY = elbowY + 60 * Math.sin(elbowAngle);
      
      angle1 = 20 + Math.round(amount * 70);
      angle2 = 160;
      angle3 = 175;

      if (frameCount % 240 === 180 && Math.random() > 0.5) {
        addFeedbackLog("Keep your elbows slightly bent!", "warn");
      }

    } else if (currentExercise === "push-up") {
      ankleX = 460; ankleY = 380;
      leftAnkleX = 460; leftAnkleY = 380;
      wristX = 250; wristY = 380;
      
      const pushupY = 360 - amount * 60;
      const pushupX = 250 - amount * 10;
      
      shoulderX = pushupX;
      shoulderY = pushupY;
      headX = shoulderX - 40;
      headY = shoulderY - 20;
      
      hipX = shoulderX + 70;
      hipY = shoulderY + 20;
      kneeX = hipX + 60;
      kneeY = hipY + 20;
      
      elbowX = shoulderX + 20;
      elbowY = shoulderY + 40 - amount * 20;
      
      angle1 = 70 + Math.round(amount * 90);
      angle2 = 175;
      angle3 = 5;

      if (frameCount % 240 === 180 && Math.random() > 0.5) {
        addFeedbackLog("Keep your core tight and body straight!", "warn");
      }

    } else if (currentExercise === "squat") {
      ankleX = 320;
      ankleY = 410;
      kneeX = 300 - amount * 25;
      kneeY = 320 + amount * 30;
      hipX = 340 - amount * 40;
      hipY = 220 + amount * 80;
      shoulderX = hipX;
      shoulderY = hipY - 90;
      headX = shoulderX + 5;
      headY = shoulderY - 35;
      
      elbowX = shoulderX + 30;
      elbowY = shoulderY;
      wristX = elbowX + 40;
      wristY = elbowY;
      
      angle1 = 170 - Math.round(amount * 90);
      angle2 = 165 - Math.round(amount * 95);
      angle3 = 10 + Math.round(amount * 35);

      if (frameCount % 250 === 120 && Math.random() > 0.6) {
        addFeedbackLog("Keep chest lifted, don't bend forward too much!", "warn");
      }

    } else if (currentExercise === "tricep-dip") {
      wristX = 350; wristY = 300;
      ankleX = 270; ankleY = 410;
      
      hipX = 320;
      hipY = 320 - amount * 60;
      shoulderX = 320;
      shoulderY = hipY - 90;
      headX = 320;
      headY = shoulderY - 35;
      
      kneeX = 270;
      kneeY = 340 - amount * 20;
      
      elbowX = 355 + (1 - amount) * 20;
      elbowY = shoulderY + 40;
      
      angle1 = 80 + Math.round(amount * 80);
      angle2 = 25 + Math.round(amount * 45);
      angle3 = 175;

      if (frameCount % 240 === 180 && Math.random() > 0.5) {
        addFeedbackLog("Keep your back close to the bench!", "warn");
      }

    } else if (currentExercise === "jumping-jack") {
      headX = 320;
      headY = 90 - amount * 10;
      shoulderX = 320;
      shoulderY = 130 - amount * 10;
      hipX = 320;
      hipY = 220 - amount * 10;
      
      ankleX = 320 + amount * 40;
      ankleY = 410;
      leftAnkleX = 320 - amount * 40;
      leftAnkleY = 410;
      
      kneeX = 320 + amount * 25;
      kneeY = 320 - amount * 10;
      leftKneeX = 320 - amount * 25;
      leftKneeY = 320 - amount * 10;
      
      elbowX = shoulderX + 40 * Math.sin(amount * Math.PI * 0.8);
      elbowY = shoulderY + 40 * Math.cos(amount * Math.PI * 0.8);
      wristX = shoulderX + 80 * Math.sin(amount * Math.PI * 0.8);
      wristY = shoulderY + 80 * Math.cos(amount * Math.PI * 0.8);
      
      leftElbowX = shoulderX - 40 * Math.sin(amount * Math.PI * 0.8);
      leftElbowY = shoulderY + 40 * Math.cos(amount * Math.PI * 0.8);
      leftWristX = shoulderX - 80 * Math.sin(amount * Math.PI * 0.8);
      leftWristY = shoulderY + 80 * Math.cos(amount * Math.PI * 0.8);
      
      angle1 = 20 + Math.round(amount * 120);
      angle2 = 10 + Math.round(amount * 30);
      angle3 = Math.round(Math.hypot(wristX - leftWristX, wristY - leftWristY));

    } else if (currentExercise === "lunges") {
      ankleX = 260; ankleY = 410;
      leftAnkleX = 380; leftAnkleY = 410;
      
      kneeX = 260 + (1 - amount) * 20;
      kneeY = 360 + amount * 25;
      leftKneeX = 360;
      leftKneeY = 360;
      
      hipX = 320 - (1 - amount) * 20;
      hipY = 220 + amount * 80;
      
      shoulderX = hipX;
      shoulderY = hipY - 90;
      headX = shoulderX;
      headY = shoulderY - 35;
      
      angle1 = 165 - Math.round(amount * 75);
      angle2 = 165 - Math.round(amount * 85);
      angle3 = 175;

      if (frameCount % 240 === 180 && Math.random() > 0.5) {
        addFeedbackLog("Keep your torso upright!", "warn");
      }

    } else if (currentExercise === "sit-up") {
      hipX = 320; hipY = 380;
      kneeX = 260; kneeY = 380;
      ankleX = 220; ankleY = 410;
      
      shoulderX = 400 - amount * 110;
      shoulderY = 380 - amount * 80;
      headX = shoulderX + 30 * (1 - amount) - 10 * amount;
      headY = shoulderY - 30;
      
      elbowX = shoulderX - 20;
      elbowY = shoulderY + 20;
      wristX = 260;
      wristY = 380;
      
      angle1 = 150 - Math.round(amount * 90);
      angle2 = 120;
      angle3 = 10;

    } else if (currentExercise === "calf-raise") {
      ankleX = 320;
      ankleY = 410 - amount * 25;
      kneeX = 320;
      kneeY = 320 - amount * 25;
      hipX = 320;
      hipY = 220 - amount * 25;
      shoulderX = 320;
      shoulderY = 130 - amount * 25;
      headX = 320;
      headY = 90 - amount * 25;
      
      elbowX = 340;
      elbowY = 180 - amount * 25;
      wristX = 340;
      wristY = 230 - amount * 25;
      
      angle1 = 95 + Math.round(amount * 60);
      angle2 = 180;
      angle3 = Math.round(amount * 25);
    }

    // Draw Skeleton using RED accents
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    
    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(ankleX, ankleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(wristX, wristY);
    ctx.stroke();

    ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
    ctx.beginPath();
    ctx.arc(headX, headY, 18, 0, Math.PI * 2);
    ctx.fill();

    if (currentExercise === "jumping-jack") {
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(leftElbowX, leftElbowY);
      ctx.lineTo(leftWristX, leftWristY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(leftKneeX, leftKneeY);
      ctx.lineTo(leftAnkleX, leftAnkleY);
      ctx.stroke();
    }

    const joints = [
      {x: shoulderX, y: shoulderY},
      {x: elbowX, y: elbowY},
      {x: wristX, y: wristY},
      {x: hipX, y: hipY},
      {x: kneeX, y: kneeY},
      {x: ankleX, y: ankleY}
    ];

    joints.forEach(j => {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(j.x, j.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 68, 68, 1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(j.x, j.y, 10, 0, Math.PI * 2);
      ctx.stroke();
    });

    document.getElementById("angle-1-val").innerText = `${angle1}°`;
    document.getElementById("angle-2-val").innerText = `${angle2}°`;
    document.getElementById("angle-3-val").innerText = `${angle3}°`;
    
    // Process the rep count using our unified state machine
    trackRepCountState(angle1);

    document.getElementById("trainer-rep-count").innerText = trainerRepCount;
    
    const targetReps = currentExercise === "squat" ? 12 : (currentExercise === "jumping-jack" || currentExercise === "calf-raise" || currentExercise === "sit-up" ? 15 : 10);
    const progressPercent = Math.min((trainerRepCount / targetReps) * 100, 100);
    document.getElementById("trainer-rep-progress").style.width = `${progressPercent}%`;
    
    document.getElementById("dash-trainer-reps").innerText = `${trainerRepCount} Reps`;

    demoAnimationId = requestAnimationFrame(animateDemo);
  }

  animateDemo();
}

/* --- REAL WEBCAM & MEDIAPIPE TRACKER --- */
function startRealTrainer() {
  // Ensure any demo animation is cancelled before starting real trainer
  if (demoAnimationId) {
    cancelAnimationFrame(demoAnimationId);
    demoAnimationId = null;
  }
  stopTrainer();
  isTrainerActive = true;
  isDemoMode = false;
  resetTrainerStats();
  
  const video = document.getElementById("webcam");
  const canvas = document.getElementById("camera-overlay");
  const ctx = canvas.getContext("2d");
  const cameraOverlayStatus = document.getElementById("camera-status");

  cameraOverlayStatus.innerHTML = `
    <i data-lucide="loader" class="cam-icon animate-spin"></i>
    <p>Loading MediaPipe Pose Model...</p>
    <small>Please allow webcam permissions if prompted.</small>
  `;
  initLucideIcons();

  try {
    poseDetector = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseDetector.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    poseDetector.onResults((results) => {
      drawRealPoseSkeleton(results, canvas, ctx);
    });

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        webcamStream = stream;
        video.srcObject = stream;
        video.play();
        
        cameraOverlayStatus.classList.add("hidden");
        document.getElementById("btn-start-camera").classList.add("hidden");
        document.getElementById("btn-stop-camera").classList.remove("hidden");
        
        cameraHelper = new Camera(video, {
          onFrame: async () => {
            if (isTrainerActive && !isDemoMode) {
              await poseDetector.send({ image: video });
            }
          },
          width: 640,
          height: 480
        });
        cameraHelper.start();
        addFeedbackLog("Live AI Pose Tracking Started.", "info");
      })
      .catch((err) => {
        console.error(err);
        addFeedbackLog("Failed to access webcam. Switching to Demo Simulator.", "warn");
        startDemoTrainer();
      });

  } catch (e) {
    console.error(e);
    addFeedbackLog("MediaPipe Model failed to load. Launching Demo Simulator.", "warn");
    startDemoTrainer();
  }
}

function stopTrainer() {
  isTrainerActive = false;
  isDemoMode = false;
  
  if (demoAnimationId) {
    cancelAnimationFrame(demoAnimationId);
    demoAnimationId = null;
  }
  
  if (cameraHelper) {
    cameraHelper.stop();
    cameraHelper = null;
  }
  
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  
  const video = document.getElementById("webcam");
  if (video) video.srcObject = null;
  
  const canvas = document.getElementById("camera-overlay");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  const cameraOverlayStatus = document.getElementById("camera-status");
  if (cameraOverlayStatus) {
    cameraOverlayStatus.classList.remove("hidden");
    cameraOverlayStatus.innerHTML = `
      <i data-lucide="video-off" class="cam-icon"></i>
      <p>Session Ended</p>
      <small>Click "Start Session" to connect your webcam again.</small>
    `;
  }

  const startBtn = document.getElementById("btn-start-camera");
  if (startBtn) startBtn.classList.remove("hidden");
  
  const stopBtn = document.getElementById("btn-stop-camera");
  if (stopBtn) stopBtn.classList.add("hidden");

  const demoBtn = document.getElementById("btn-demo-mode");
  if (demoBtn) demoBtn.classList.remove("active");
  
  initLucideIcons();
  
  // Cancel any in-progress or queued voice feedback immediately on session stop
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  if (trainerRepCount > 0) {
    const exercise = currentExercise;
    const reps = trainerRepCount;
    const sets = parseInt(document.getElementById("workout-sets")?.value) || 1;
    const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
    
    const totalReps = trainerRepCount;
    const goodFormCount = trainerGoodFormCount || 0; 
    const formAccuracy = totalReps > 0 ? (goodFormCount / totalReps) : 0;
    const durationBonus = Math.min(10, Math.floor(duration / 30));
    const performance_score = Math.round((formAccuracy * 80) + durationBonus + 10);
    
    const token = localStorage.getItem("trivan_jwt_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API_BASE}/workout/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ exercise, reps, sets, duration, performance_score })
    })
    .then(res => res.json())
    .then(data => {
      console.log("[LOGGED WORKOUT]", data);
      addFeedbackLog(`Logged ${reps} reps (${sets} sets, ${duration}s) of ${exercise}!`, "success");
    })
    .catch(err => {
      console.warn("[Backend Offline] Failed to log workout to server.", err);
      addFeedbackLog(`Session logged locally: Completed ${reps} reps of ${exercise}.`, "success");
    });
  } else {
    addFeedbackLog("Session stopped.", "info");
  }
}

function findAngle(ax, ay, bx, by, cx, cy) {
  const angle = Math.atan2(cy - by, cx - bx) - Math.atan2(ay - by, ax - bx);
  let degrees = Math.abs(angle * 180 / Math.PI);
  if (degrees > 180) {
    degrees = 360 - degrees;
  }
  return Math.round(degrees);
}

function drawRealPoseSkeleton(results, canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  
  if (!results.poseLandmarks) return;
  
  const lm = results.poseLandmarks;
  
  const points = {
    lShoulder: {x: lm[11].x * canvas.width, y: lm[11].y * canvas.height},
    rShoulder: {x: lm[12].x * canvas.width, y: lm[12].y * canvas.height},
    lElbow: {x: lm[13].x * canvas.width, y: lm[13].y * canvas.height},
    rElbow: {x: lm[14].x * canvas.width, y: lm[14].y * canvas.height},
    lWrist: {x: lm[15].x * canvas.width, y: lm[15].y * canvas.height},
    rWrist: {x: lm[16].x * canvas.width, y: lm[16].y * canvas.height},
    lHip: {x: lm[23].x * canvas.width, y: lm[23].y * canvas.height},
    rHip: {x: lm[24].x * canvas.width, y: lm[24].y * canvas.height},
    lKnee: {x: lm[25].x * canvas.width, y: lm[25].y * canvas.height},
    rKnee: {x: lm[26].x * canvas.width, y: lm[26].y * canvas.height},
    lAnkle: {x: lm[27].x * canvas.width, y: lm[27].y * canvas.height},
    rAnkle: {x: lm[28].x * canvas.width, y: lm[28].y * canvas.height}
  };
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
  ctx.lineCap = "round";

  const drawLine = (p1, p2) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  };

  drawLine(points.lShoulder, points.rShoulder);
  drawLine(points.lHip, points.rHip);
  drawLine(points.lShoulder, points.lElbow);
  drawLine(points.lElbow, points.lWrist);
  drawLine(points.rShoulder, points.rElbow);
  drawLine(points.rElbow, points.rWrist);
  drawLine(points.lHip, points.lKnee);
  drawLine(points.lKnee, points.lAnkle);
  drawLine(points.rHip, points.rKnee);
  drawLine(points.rKnee, points.rAnkle);

  for (let key in points) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(points[key].x, points[key].y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(239, 68, 68, 1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(points[key].x, points[key].y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  let angle1 = 0, angle2 = 0, angle3 = 0;

  if (currentExercise === "bicep-curl") {
    angle1 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rElbow.x, points.rElbow.y, points.rWrist.x, points.rWrist.y);
    angle2 = findAngle(points.rHip.x, points.rHip.y, points.rShoulder.x, points.rShoulder.y, points.rElbow.x, points.rElbow.y);
    angle3 = Math.round(Math.abs(points.rWrist.y - points.rElbow.y));
    
    if (angle2 > 35) {
      addFeedbackLog("Tuck your elbow in close to your ribs!", "warn");
    }
  } else if (currentExercise === "shoulder-press") {
    angle1 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rElbow.x, points.rElbow.y, points.rWrist.x, points.rWrist.y);
    angle2 = findAngle(points.rElbow.x, points.rElbow.y, points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y);
    angle3 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rAnkle.x, points.rAnkle.y);
    
    if (angle3 < 160) {
      addFeedbackLog("Keep your torso upright and core engaged!", "warn");
    }
  } else if (currentExercise === "lateral-raise") {
    angle1 = findAngle(points.rElbow.x, points.rElbow.y, points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y);
    angle2 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rElbow.x, points.rElbow.y, points.rWrist.x, points.rWrist.y);
    angle3 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rAnkle.x, points.rAnkle.y);
    
    if (angle2 < 140) {
      addFeedbackLog("Keep your arms relatively straight!", "warn");
    }
  } else if (currentExercise === "push-up") {
    angle1 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rElbow.x, points.rElbow.y, points.rWrist.x, points.rWrist.y);
    angle2 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rAnkle.x, points.rAnkle.y);
    angle3 = Math.round(Math.abs(points.rWrist.y - points.rElbow.y));
    
    if (angle2 < 155) {
      addFeedbackLog("Keep your body straight during push-ups!", "warn");
    }
  } else if (currentExercise === "squat") {
    angle1 = findAngle(points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y, points.rAnkle.x, points.rAnkle.y);
    angle2 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y);
    angle3 = Math.round(Math.abs(findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rHip.x, points.rHip.y - 100)));
    
    if (angle3 > 45) {
      addFeedbackLog("Keep your chest up and back flat!", "warn");
    }
  } else if (currentExercise === "tricep-dip") {
    angle1 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rElbow.x, points.rElbow.y, points.rWrist.x, points.rWrist.y);
    angle2 = findAngle(points.rElbow.x, points.rElbow.y, points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y);
    angle3 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rAnkle.x, points.rAnkle.y);
    
    if (angle3 < 150) {
      addFeedbackLog("Keep your torso close to the bench!", "warn");
    }
  } else if (currentExercise === "jumping-jack") {
    angle1 = findAngle(points.rElbow.x, points.rElbow.y, points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y);
    angle2 = findAngle(points.lAnkle.x, points.lAnkle.y, points.rHip.x, points.rHip.y, points.rAnkle.x, points.rAnkle.y);
    angle3 = Math.round(Math.hypot(points.rWrist.x - points.lWrist.x, points.rWrist.y - points.lWrist.y));
  } else if (currentExercise === "lunges") {
    angle1 = findAngle(points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y, points.rAnkle.x, points.rAnkle.y);
    angle2 = findAngle(points.lHip.x, points.lHip.y, points.lKnee.x, points.lKnee.y, points.lAnkle.x, points.lAnkle.y);
    angle3 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y);
    
    if (angle3 < 100) {
      addFeedbackLog("Keep your torso upright!", "warn");
    }
  } else if (currentExercise === "sit-up") {
    angle1 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y);
    angle2 = findAngle(points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y, points.rAnkle.x, points.rAnkle.y);
    angle3 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rAnkle.x, points.rAnkle.y);
  } else if (currentExercise === "calf-raise") {
    points.rToe = {x: lm[32].x * canvas.width, y: lm[32].y * canvas.height};
    points.rHeel = {x: lm[30].x * canvas.width, y: lm[30].y * canvas.height};
    const baseAngle = findAngle(points.rKnee.x, points.rKnee.y, points.rAnkle.x, points.rAnkle.y, points.rToe.x, points.rToe.y);
    angle1 = Math.round(95 + Math.max(0, baseAngle - 95) * 2.0);
    angle2 = findAngle(points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y, points.rAnkle.x, points.rAnkle.y);
    angle3 = Math.round(Math.abs(points.rAnkle.y - points.rHeel.y));
  }

  trackRepCountState(angle1);

  document.getElementById("angle-1-val").innerText = `${angle1}°`;
  document.getElementById("angle-2-val").innerText = `${angle2}°`;
  document.getElementById("angle-3-val").innerText = `${angle3}°`;
  document.getElementById("trainer-rep-count").innerText = trainerRepCount;
  
  const targetReps = currentExercise === "squat" ? 12 : (currentExercise === "jumping-jack" || currentExercise === "calf-raise" || currentExercise === "sit-up" ? 15 : 10);
  const progressPercent = Math.min((trainerRepCount / targetReps) * 100, 100);
  document.getElementById("trainer-rep-progress").style.width = `${progressPercent}%`;
  
  document.getElementById("dash-trainer-reps").innerText = `${trainerRepCount} Reps`;
}

/* ==========================================
   3. MODULE 2: AI DIETICIAN & CALORIE COACH
   ========================================== */
let calorieLogList = [
  { food: "Oatmeal with Almonds", kcal: 350 },
  { food: "Grilled Chicken Breast & Rice", kcal: 650 },
  { food: "Whey Protein Shake", kcal: 250 },
  { food: "Greek Yogurt with Berries", kcal: 200 }
];

function initDietician() {
  calculateBMI();
  fetchCalorieLogs();
}

function fetchCalorieLogs() {
  const token = localStorage.getItem("trivan_jwt_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  fetch(`${API_BASE}/diet/logs`, { headers })
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        calorieLogList = data;
      }
      renderCalorieLogs();
    })
    .catch(err => {
      console.warn("[Backend Offline] Failed to fetch diet logs from server. Using mock defaults.");
      renderCalorieLogs();
    });
}

function calculateBMI() {
  const wInput = document.getElementById("bmi-weight");
  if (!wInput) return;

  const w = parseFloat(wInput.value);
  const h = parseFloat(document.getElementById("bmi-height").value) / 100;
  const resultDiv = document.getElementById("bmi-result");
  const bmiVal = document.getElementById("bmi-val");
  const bmiClass = document.getElementById("bmi-class");
  const bmiDesc = document.getElementById("bmi-desc");

  if (w > 0 && h > 0) {
    const bmi = (w / (h * h)).toFixed(1);
    bmiVal.innerText = bmi;
    resultDiv.classList.remove("hidden");

    if (bmi < 18.5) {
      bmiClass.innerText = "Underweight";
      bmiClass.className = "bmi-class-badge bg-orange text-orange";
      bmiDesc.innerText = "Your BMI is below normal range. We suggest a caloric surplus plan focusing on healthy fats and clean proteins.";
    } else if (bmi >= 18.5 && bmi < 25) {
      bmiClass.innerText = "Normal Weight";
      bmiClass.className = "bmi-class-badge bg-green text-green";
      bmiDesc.innerText = "Fantastic! You are in the healthy BMI weight zone. Focus on weight maintenance and muscle synthesis.";
    } else if (bmi >= 25 && bmi < 30) {
      bmiClass.innerText = "Overweight";
      bmiClass.className = "bmi-class-badge bg-orange text-orange";
      bmiDesc.innerText = "Your BMI is slightly high. An active caloric deficit with regular metabolic scaling will help return to target range.";
    } else {
      bmiClass.innerText = "Obese";
      bmiClass.className = "bmi-class-badge bg-red text-red";
      bmiDesc.innerText = "Your BMI is in the obese category. We highly recommend a structured cardio program, lower calorie density intake, and consulting a physician.";
    }
  }
}

function addCalorieItem() {
  const foodInput = document.getElementById("calorie-food-name");
  const kcalInput = document.getElementById("calorie-amount");
  const food = foodInput.value.trim();
  const kcal = parseInt(kcalInput.value);

  if (food && kcal > 0) {
    const token = localStorage.getItem("trivan_jwt_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API_BASE}/diet/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ food, kcal })
    })
    .then(res => res.json())
    .then(data => {
      calorieLogList.push({ food, kcal });
      foodInput.value = "";
      kcalInput.value = "";
      renderCalorieLogs();
    })
    .catch(err => {
      console.warn("[Backend Offline] Saving calorie log locally.");
      calorieLogList.push({ food, kcal });
      foodInput.value = "";
      kcalInput.value = "";
      renderCalorieLogs();
    });
  }
}

function renderCalorieLogs() {
  const listContainer = document.getElementById("calorie-list-items");
  if (!listContainer) return;

  listContainer.innerHTML = "";
  
  let total = 0;
  calorieLogList.forEach(item => {
    total += item.kcal;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="food">${item.food}</span>
      <span class="kcal">+${item.kcal} kcal</span>
    `;
    listContainer.appendChild(li);
  });

  document.getElementById("total-calories-val").innerText = `${total} kcal`;
  document.getElementById("dash-calories").innerText = `${total} kcal`;
  
  const target = 2200;
  const progressPercent = Math.min((total / target) * 100, 100);
  document.getElementById("dash-diet-progress").style.width = `${progressPercent}%`;
  document.getElementById("dash-diet-progress").parentElement.nextElementSibling.innerText = `Calories: ${total} / ${target} kcal`;
}

function handleDietChatKeyPress(event) {
  if (event.key === "Enter") {
    sendDietChat();
  }
}

function sendDietPrompt(text) {
  document.getElementById("diet-chat-input").value = text;
  sendDietChat();
}

function sendDietChat() {
  const chatInput = document.getElementById("diet-chat-input");
  const text = chatInput.value.trim();
  if (!text) return;

  appendDietChatBubble(text, "user");
  chatInput.value = "";

  const token = localStorage.getItem("trivan_jwt_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  fetch(`${API_BASE}/ai/coach`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: text })
  })
  .then(res => res.json())
  .then(data => {
    appendDietChatBubble(data.response, "bot");
  })
  .catch(err => {
    console.error("AI Coach request failed:", err);
    appendDietChatBubble("AI unavailable, please try again", "bot");
  });
}

function appendDietChatBubble(text, sender) {
  const chatMessages = document.getElementById("diet-chat-messages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = text.replace(/\n/g, "<br>");
  
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getDieticianResponse(query) {
  const q = query.toLowerCase();
  
  if (q.includes("breakfast") || q.includes("recipe")) {
    return "<strong>High-Protein Fuel Breakfast (Recipe Recommendation):</strong>\n\n• <strong>Scrambled Egg White Medley</strong>: 4 egg whites, 1 whole egg, 50g spinach, 30g cherry tomatoes.\n• <strong>Sides</strong>: 1 slice of toasted whole wheat bread with 1/4 sliced avocado.\n• <strong>Macros</strong>: 380 kcal | 28g Protein | 14g Fats | 22g Carbs.\n\nEnjoy with unsweetened green tea to boost metabolic rates!";
  }
  
  if (q.includes("snack") || q.includes("post-workout")) {
    return "<strong>Post-Workout Anabolic Snacks:</strong>\n\n1. <strong>Whey & Banana Blitz</strong>: 1 scoop whey isolate blended with 1 medium banana and water. Fast absorbing, restores glycogen levels rapidly.\n2. <strong>Greek Parfait</strong>: 150g fat-free Greek yogurt topped with a handful of fresh blueberries and a drizzle of honey.\n3. <strong>Rice Cake Boost</strong>: 2 brown rice cakes topped with 1 tbsp peanut butter and strawberry slices.";
  }
  
  if (q.includes("grocery") || q.includes("list")) {
    return "<strong>Lean Muscle & Keto Grocery List:</strong>\n\n• <strong>Proteins</strong>: Chicken breast, wild salmon, lean ground turkey, liquid egg whites.\n• <strong>Complex Carbs</strong>: Sweet potatoes, quinoa, steel-cut oats.\n• <strong>Fibrous Veggies</strong>: Broccoli, spinach, asparagus, kale.\n• <strong>Healthy Fats</strong>: Extra virgin olive oil, almonds, avocados.\n• <strong>Dairy/Alternatives</strong>: Greek yogurt (0%), unsweetened almond milk.";
  }

  if (q.includes("calorie") || q.includes("target") || q.includes("deficit")) {
    const weight = parseFloat(document.getElementById("bmi-weight").value) || 70;
    const maint = Math.round(weight * 24 * 1.35);
    const cut = maint - 500;
    return `Based on your current Weight (${weight}kg) and active metrics:\n\n• <strong>Maintenance Calories</strong>: ~${maint} kcal/day\n• <strong>Fat Loss Caloric Deficit (20% Cut)</strong>: ~${cut} kcal/day\n• <strong>Target Daily Macros</strong>:\n  - Protein: ${Math.round(weight * 2.0)}g (30%)\n  - Carbs: ${Math.round(cut * 0.4 / 4)}g (40%)\n  - Fats: ${Math.round(cut * 0.3 / 9)}g (30%)`;
  }

  return "I understand! To get the most tailored response, specify if you are trying to **lose body fat**, **build lean mass**, or need a **vegetarian meal prep plan**. Let me know, and I will generate the complete macro details for you.";
}

/* ==========================================
   4. MODULE 3: SMART GYM ASSISTANT (IoT SIMULATOR)
   ========================================== */
let treadmillSpeed = 6.5;
let treadmillIncline = 3;
let treadmillRunning = true;
let treadmillDistance = 1.25;
let treadmillCalBurn = 140;
let treadmillInterval = null;
let treadmillBeltOffset = 0;
let treadmillCanvas = null;
let treadmillCtx = null;

function initSmartGym() {
  treadmillCanvas = document.getElementById("treadmill-belt");
  if (!treadmillCanvas) return;

  treadmillCtx = treadmillCanvas.getContext("2d");
  startTreadmillBeltAnimation();
  
  if (treadmillInterval) clearInterval(treadmillInterval);

  const wsUrl = "wss://ai-gym-fitness-assistant-1.onrender.com/api/iot/ws";

  try {
    if (gymSocket) {
      gymSocket.close();
    }
    gymSocket = new WebSocket(wsUrl);
    
    gymSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.treadmill && treadmillRunning && isLoggedIn) {
        treadmillDistance = data.treadmill.distance;
        treadmillCalBurn = data.treadmill.calories;
        
        document.getElementById("treadmill-dist").innerText = `${treadmillDistance.toFixed(2)} mi`;
        document.getElementById("treadmill-calories").innerText = `${Math.round(treadmillCalBurn)} kcal`;
        document.getElementById("treadmill-heartrate").innerText = `${data.treadmill.heartrate} bpm`;
        
        document.getElementById("dash-iot-status").innerText = `${data.treadmill.speed.toFixed(1)} mph (Incline ${data.treadmill.incline}%)`;
      }
      if (data.dumbbell) {
        document.getElementById("cable-power").innerText = `${data.dumbbell.power_w} W`;
      }
    };

    gymSocket.onerror = (err) => {
      console.warn("IoT WebSocket error. Falling back to local intervals.", err);
      runTreadmillFallback();
    };
  } catch (e) {
    console.warn("Failed to connect to IoT WebSocket. Running client fallback.", e);
    runTreadmillFallback();
  }
}

function runTreadmillFallback() {
  if (treadmillInterval) clearInterval(treadmillInterval);
  treadmillInterval = setInterval(() => {
    if (treadmillRunning && isLoggedIn) {
      treadmillDistance += (treadmillSpeed / 3600);
      const distEl = document.getElementById("treadmill-dist");
      if (distEl) distEl.innerText = `${treadmillDistance.toFixed(2)} mi`;

      const calRate = (treadmillSpeed * 0.15) + (treadmillIncline * 0.08);
      treadmillCalBurn += calRate;
      const calEl = document.getElementById("treadmill-calories");
      if (calEl) calEl.innerText = `${Math.round(treadmillCalBurn)} kcal`;

      const baseHr = 110 + (treadmillSpeed * 6) + (treadmillIncline * 3);
      const hr = Math.round(baseHr + (Math.random() * 4 - 2));
      const hrEl = document.getElementById("treadmill-heartrate");
      if (hrEl) hrEl.innerText = `${hr} bpm`;
      
      const statusEl = document.getElementById("dash-iot-status");
      if (statusEl) statusEl.innerText = `${treadmillSpeed.toFixed(1)} mph (Incline ${treadmillIncline}%)`;
    }
  }, 1000);
}

function updateTreadmillSettings() {
  treadmillSpeed = parseFloat(document.getElementById("treadmill-speed").value);
  treadmillIncline = parseInt(document.getElementById("treadmill-incline").value);

  document.getElementById("treadmill-speed-val").innerText = `${treadmillSpeed.toFixed(1)} mph`;
  document.getElementById("treadmill-incline-val").innerText = `${treadmillIncline} %`;

  if (gymSocket && gymSocket.readyState === WebSocket.OPEN) {
    gymSocket.send(JSON.stringify({ speed: treadmillSpeed, incline: treadmillIncline }));
  }
}

function toggleTreadmill() {
  const toggleBtn = document.getElementById("btn-treadmill-toggle");
  const badge = document.querySelector(".iot-badge");
  treadmillRunning = !treadmillRunning;

  if (treadmillRunning) {
    toggleBtn.innerText = "Pause Treadmill";
    toggleBtn.className = "btn btn-orange btn-lg w-full";
    badge.innerText = "Running";
    badge.className = "iot-badge online";
  } else {
    toggleBtn.innerText = "Start Treadmill";
    toggleBtn.className = "btn btn-red btn-lg w-full";
    badge.innerText = "Paused";
    badge.className = "iot-badge online bg-purple text-purple";
    document.getElementById("treadmill-heartrate").innerText = "72 bpm";
    document.getElementById("dash-iot-status").innerText = "Treadmill Standby";
  }
}

function updateCableWeight() {
  const weight = document.getElementById("cable-weight").value;
  document.getElementById("cable-weight-val").innerText = `${weight} lbs`;
  
  const power = Math.round(weight * 2.25);
  document.getElementById("cable-power").innerText = `${power} W`;
}

let treadmillAnimationId = null;

function startTreadmillBeltAnimation() {
  if (treadmillAnimationId) return;

  function renderBelt() {
    if (!treadmillCanvas) return;
    
    treadmillCtx.clearRect(0, 0, treadmillCanvas.width, treadmillCanvas.height);
    
    treadmillCtx.save();
    treadmillCtx.translate(0, treadmillCanvas.height);
    const angleRad = -treadmillIncline * (Math.PI / 180) * 1.5;
    treadmillCtx.rotate(angleRad);
    treadmillCtx.translate(0, -treadmillCanvas.height);

    treadmillCtx.fillStyle = "#1c1c20";
    treadmillCtx.fillRect(40, 40, treadmillCanvas.width - 80, 70);
    treadmillCtx.strokeStyle = "#3f3f46";
    treadmillCtx.lineWidth = 4;
    treadmillCtx.strokeRect(40, 40, treadmillCanvas.width - 80, 70);

    if (treadmillRunning) {
      treadmillBeltOffset = (treadmillBeltOffset + (treadmillSpeed * 0.85)) % 60;
    }
    
    // RED belt dashes to match the theme
    treadmillCtx.strokeStyle = "var(--color-red)";
    treadmillCtx.lineWidth = 2;
    for (let x = 50 - treadmillBeltOffset; x < treadmillCanvas.width - 50; x += 60) {
      if (x > 45 && x < treadmillCanvas.width - 45) {
        treadmillCtx.beginPath();
        treadmillCtx.moveTo(x, 42);
        treadmillCtx.lineTo(x, 108);
        treadmillCtx.stroke();
      }
    }

    treadmillCtx.fillStyle = "#27272a";
    treadmillCtx.fillRect(40, 34, treadmillCanvas.width - 80, 6);
    treadmillCtx.fillRect(40, 110, treadmillCanvas.width - 80, 6);

    treadmillCtx.restore();

    treadmillAnimationId = requestAnimationFrame(renderBelt);
  }

  renderBelt();
}

function stopTreadmillBeltAnimation() {
  if (treadmillAnimationId) {
    cancelAnimationFrame(treadmillAnimationId);
    treadmillAnimationId = null;
  }
}

/* ==========================================
   5. MODULE 4: AI FITNESS HABIT TRACKER
   ========================================== */
function initHabitTracker() {
  renderCalendar();
  runHabitPredictor();
}

function runHabitPredictor() {
  const sleepInput = document.getElementById("habit-sleep");
  if (!sleepInput) return;

  const sleep = parseFloat(sleepInput.value);
  const stress = parseInt(document.getElementById("habit-stress").value);
  const energy = parseInt(document.getElementById("habit-energy").value);
  const days = parseInt(document.getElementById("habit-days").value);

  document.getElementById("habit-sleep-val").innerText = `${sleep} hours`;
  document.getElementById("habit-stress-val").innerText = `${stress} / 10`;
  document.getElementById("habit-energy-val").innerText = `${energy} / 10`;
  document.getElementById("habit-days-val").innerText = days === 1 ? "1 Day" : `${days} Days`;

  const token = localStorage.getItem("trivan_jwt_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  fetch(`${API_BASE}/ml/habit-predict`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sleep, stress, energy, days_since_workout: days })
  })
  .then(res => res.json())
  .then(data => {
    updateHabitPredictorUI(data.risk_probability, data.advice);
  })
  .catch(err => {
    console.warn("[Backend Offline] Calculating habit risk locally.", err);
    let risk = 30;
    risk += (8.0 - sleep) * 12;
    risk += stress * 8;
    risk += (8 - energy) * 10;
    risk += days * 15;
    risk = Math.max(5, Math.min(98, Math.round(risk)));
    
    let advice = "You're in the optimal zone! Head to the gym between 5 PM and 7 PM for a high-energy session. Your consistency score is protected.";
    if (risk >= 60) {
      advice = "Skipping likelihood is high. Let's work around it: do a simple bodyweight stretch at home now or schedule a Virtual Buddy chat for encouragement.";
    } else if (risk >= 25) {
      advice = "Energy is slightly low, which boosts mental friction. AI recommends doing a short, focused 15-minute workout to maintain the habit node.";
    }
    updateHabitPredictorUI(risk, advice);
  });
}

function updateHabitPredictorUI(risk, advice) {
  document.getElementById("habit-prediction-percent").innerText = `${risk}%`;
  document.getElementById("dash-habit-risk").innerText = `${risk}%`;

  const badge = document.getElementById("habit-risk-badge");
  const nudgeText = document.getElementById("habit-nudge-text");
  if (!badge || !nudgeText) return;
  
  if (risk < 25) {
    badge.innerText = "Low Risk";
    badge.className = "risk-badge low";
    nudgeText.innerText = advice;
    document.getElementById("dash-habit-risk").className = "preview-value text-green";
  } else if (risk >= 25 && risk < 60) {
    badge.innerText = "Medium Risk";
    badge.className = "risk-badge medium";
    nudgeText.innerText = advice;
    document.getElementById("dash-habit-risk").className = "preview-value text-orange";
  } else {
    badge.innerText = "High Risk";
    badge.className = "risk-badge high";
    nudgeText.innerText = advice;
    document.getElementById("dash-habit-risk").className = "preview-value text-red";
  }
}

function renderCalendar() {
  const calendarContainer = document.getElementById("calendar-days");
  if (!calendarContainer) return;

  calendarContainer.innerHTML = "";

  const daysInMonth = 30;
  const doneDays = [1, 2, 3, 5, 6, 8, 9, 12, 13, 15, 16, 19, 20, 22, 23, 26, 27, 29, 30];
  const skippedDays = [10, 24];
  const restDays = [4, 7, 11, 14, 18, 21, 25, 28];

  for (let i = 1; i <= daysInMonth; i++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day-cell";
    
    if (doneDays.includes(i)) {
      dayCell.classList.add("done");
    } else if (skippedDays.includes(i)) {
      dayCell.classList.add("skipped");
    } else if (restDays.includes(i)) {
      dayCell.classList.add("rest");
    }
    
    dayCell.innerHTML = `
      <span class="num">${i}</span>
      <span class="day-status-indicator"></span>
    `;
    calendarContainer.appendChild(dayCell);
  }
}

/* ==========================================
   6. MODULE 5: VIRTUAL GYM BUDDY
   ========================================== */
function initGymBuddy() {
  // Glow orb initialized
}

function handleBuddyChatKeyPress(event) {
  if (event.key === "Enter") {
    sendBuddyChat();
  }
}

function sendBuddyPrompt(text) {
  document.getElementById("buddy-chat-input").value = text;
  sendBuddyChat();
}

function sendBuddyChat() {
  const chatInput = document.getElementById("buddy-chat-input");
  const text = chatInput.value.trim();
  if (!text) return;

  appendBuddyChatBubble(text, "user");
  chatInput.value = "";

  const token = localStorage.getItem("trivan_jwt_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  fetch(`${API_BASE}/ai/buddy`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: text })
  })
  .then(res => res.json())
  .then(data => {
    updateBuddyMood(data.sentiment || "focused");
    appendBuddyChatBubble(data.response, "bot");
    const voiceChecked = document.getElementById("buddy-voice-enabled").checked;
    if (voiceChecked) {
      speakBuddyResponse(data.response);
    }
  })
  .catch(err => {
    console.error("AI Buddy request failed:", err);
    appendBuddyChatBubble("AI unavailable, please try again", "bot");
  });
}

function appendBuddyChatBubble(text, sender) {
  const chatMessages = document.getElementById("buddy-chat-messages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerText = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function analyzeSentiment(text) {
  const t = text.toLowerCase();
  
  if (t.includes("tired") || t.includes("exhausted") || t.includes("lazy") || t.includes("sleepy") || t.includes("sore")) {
    return "empathetic";
  }
  if (t.includes("hype") || t.includes("ready") || t.includes("crush") || t.includes("let's go") || t.includes("excited") || t.includes("go")) {
    return "excited";
  }
  if (t.includes("calm") || t.includes("chill") || t.includes("relax") || t.includes("breathe")) {
    return "calm";
  }
  
  return "focused";
}

function updateBuddyMood(mood) {
  const orb = document.getElementById("buddy-orb");
  const sentimentVal = document.getElementById("buddy-sentiment");
  const energyVal = document.getElementById("buddy-energy");
  const dashBuddyMood = document.getElementById("dash-buddy-mood");

  if (!orb) return;

  orb.className = "buddy-energy-orb";
  orb.classList.add(mood);

  if (mood === "excited") {
    sentimentVal.innerText = "Pumped & Excited!";
    energyVal.innerText = "98%";
    dashBuddyMood.innerText = "Psyched! 🔥";
  } else if (mood === "empathetic") {
    sentimentVal.innerText = "Empathetic & Supportive";
    energyVal.innerText = "85%";
    dashBuddyMood.innerText = "Empathetic ❤️";
  } else if (mood === "calm") {
    sentimentVal.innerText = "Centered & Calm";
    energyVal.innerText = "75%";
    dashBuddyMood.innerText = "Zen Mode 🧘‍♂️";
  } else {
    sentimentVal.innerText = "Focused & Analytical";
    energyVal.innerText = "92%";
    dashBuddyMood.innerText = "Focused 🎯";
  }
}

function getBuddyResponse(query, mood) {
  const q = query.toLowerCase();

  if (mood === "empathetic") {
    return "I hear you, Nishanth. Feeling sore or exhausted is completely normal. Remember, consistency doesn't mean breaking records every day. A quick 10-minute active stretch session counts! How about we start small and see how we feel?";
  }
  if (mood === "excited") {
    return "YEAH! That's what I am talking about! The iron is waiting! Let's load the rack, lock in the posture, and get those reps moving. You've got this, let's smash those goals!";
  }
  if (q.includes("quote")) {
    const quotes = [
      "The body achieves what the mind believes. Let's make today count!",
      "Success isn't always about greatness. It's about consistency. Keep pushing!",
      "Your only limit is you. Let's hit the weights!",
      "Strength does not come from winning. Your struggles develop your strengths."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (q.includes("goal")) {
    return "Let's set a goal. We are tracking towards Squats. Try matching 12 full squats in Gym Trainer today and I'll award you the 'Glute Master' badge. Deal?";
  }

  return "I'm with you, Nishanth. Let's focus on maintaining form. Open the Gym Trainer tab, choose your exercise, and I'll count every single rep with you. Let's get to work!";
}

function speakBuddyResponse(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }
}

/* ==========================================
   7. MODULE 6: POSE-TO-PERFORMANCE ANALYZER
   ========================================== */
let perfChartInstance = null;
let rangeChartInstance = null;

function initPerformanceAnalyzer() {
  // Initialization trigger
}

function refreshAnalyzerData() {
  renderCharts(true);
  addFeedbackLog("Performance analytics dashboard updated.", "success");
}

async function renderCharts(forceRefresh = false) {
  const pCtx = document.getElementById("performanceChart")?.getContext("2d");
  const rCtx = document.getElementById("rangeChart")?.getContext("2d");

  if (!pCtx || !rCtx) return;

  if (perfChartInstance && forceRefresh) perfChartInstance.destroy();
  if (rangeChartInstance && forceRefresh) rangeChartInstance.destroy();

  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const gridColor = isLight ? "#e4e4e7" : "#27272a";
  const labelColor = isLight ? "#71717a" : "#a1a1aa";

  let scores = [78, 82, 85, 87, 90, 92];
  let reps = [8, 10, 8, 12, 10, 11, 12, 10, 11, 12];
  let repLabels = ["Rep 1", "Rep 2", "Rep 3", "Rep 4", "Rep 5", "Rep 6", "Rep 7", "Rep 8", "Rep 9", "Rep 10"];

  const token = localStorage.getItem("trivan_jwt_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/workout/logs`, { headers });
    if (res.status === 200) {
      const logs = await res.json();
      if (logs && logs.length > 0) {
        logs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        scores = logs.map(l => l.score || 90);
        if (scores.length > 6) {
          scores = scores.slice(-6);
        }
        
        reps = logs.map(l => l.reps || 10);
        if (reps.length > 10) {
          reps = reps.slice(-10);
        }
        repLabels = reps.map((_, i) => `Set ${i + 1}`);
      }
    }
  } catch (err) {
    console.warn("Failed to fetch workout logs for performance charts, using fallback.", err);
  }

  // Red theme for weekly performance
  perfChartInstance = new Chart(pCtx, {
    type: "line",
    data: {
      labels: scores.map((_, i) => `Session ${i + 1}`),
      datasets: [{
        label: "Pose Accuracy Score",
        data: scores,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.2,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#ef4444",
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: "Plus Jakarta Sans" } }
        },
        y: {
          min: 60,
          max: 100,
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: "Plus Jakarta Sans" } }
        }
      }
    }
  });

  // Green theme for reps completed
  rangeChartInstance = new Chart(rCtx, {
    type: "bar",
    data: {
      labels: repLabels,
      datasets: [{
        label: "Reps Completed",
        data: reps,
        backgroundColor: "rgba(34, 197, 94, 0.75)",
        borderColor: "#22c55e",
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: "rgba(34, 197, 94, 0.9)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: "Plus Jakarta Sans" } }
        },
        y: {
          min: 0,
          max: 25,
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: "Plus Jakarta Sans" } }
        }
      }
    }
  });
}

/* ==========================================
   8. MODULE 7: GYM RECOMMENDER & PLANNER
   ========================================== */
let userCoords = null;

function initGymRecommender() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log("[Geolocation Success] User coords set:", userCoords);
        filterGyms();
      },
      (err) => {
        console.warn("[Geolocation Warning] Failed or denied, using Bangalore fallback:", err);
        userCoords = { lat: 12.9716, lng: 77.5946 };
        filterGyms();
      }
    );
  } else {
    filterGyms();
  }
}

async function filterGyms() {
  const distSelect = document.getElementById("gym-distance");
  if (!distSelect) return;

  const maxDistance = parseFloat(distSelect.value);
  const typeFilter = document.getElementById("gym-type").value;
  
  const resultsContainer = document.getElementById("gym-list-results");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `
    <div class="block-card text-center text-muted" style="padding: 30px;">
      <p>Searching for nearby gyms...</p>
    </div>
  `;

  // Determine user location
  let locQuery = "12.9716,77.5946"; // fallback Bangalore coordinates
  if (userCoords) {
    locQuery = `${userCoords.lat},${userCoords.lng}`;
  }

  // Fetch gyms from backend which queries Google Places API
  const token = localStorage.getItem("trivan_jwt_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/gyms/search?location=${locQuery}&radius_miles=${maxDistance}`, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.detail || "Location services unavailable. Please try again later.";
      resultsContainer.innerHTML = `
        <div class="block-card text-center text-muted" style="padding: 30px;">
          <p>${errMsg}</p>
        </div>
      `;
      return;
    }

    let gyms = await res.json();

    // Filter by type if needed
    if (typeFilter !== "all" && typeFilter !== "all-gyms") {
      gyms = gyms.filter(gym => {
        if (typeFilter === "pool" && !gym.pool) return false;
        if (typeFilter === "sauna" && !gym.sauna) return false;
        if (typeFilter === "trainers" && !gym.trainers) return false;
        return true;
      });
    }

    // Sort by calculated distance
    gyms.sort((a, b) => a.calculatedDistance - b.calculatedDistance);

    resultsContainer.innerHTML = "";

    if (gyms.length === 0) {
      resultsContainer.innerHTML = `
        <div class="block-card text-center text-muted" style="padding: 30px;">
          <p>No gyms match your select criteria. Try increasing the search distance radius.</p>
        </div>
      `;
      return;
    }

    // Apply active workout goal boost to matches dynamically
    const workoutGoal = document.getElementById("workout-goal")?.value || "maintenance";

    gyms.forEach(gym => {
      let matchScore = gym.calculatedMatch;
      if (workoutGoal === "muscle-gain") {
        if (gym.name.includes("Barbell") || gym.name.includes("Elite")) {
          matchScore = Math.min(99, matchScore + 10);
        } else if (gym.trainers) {
          matchScore = Math.min(99, matchScore + 5);
        }
      } else if (workoutGoal === "weight-loss") {
        if (gym.name.includes("Cardio") || gym.name.includes("HIIT")) {
          matchScore = Math.min(99, matchScore + 10);
        } else if (gym.sauna) {
          matchScore = Math.min(99, matchScore + 5);
        }
      } else if (workoutGoal === "maintenance") {
        if (gym.pool && gym.sauna) {
          matchScore = Math.min(99, matchScore + 8);
        }
      }

      const card = document.createElement("div");
      card.className = "block-card gym-card hover-scale";
      
      let tagsHtml = "";
      if (gym.pool) tagsHtml += `<span class="tag">Pool</span>`;
      if (gym.sauna) tagsHtml += `<span class="tag">Sauna</span>`;
      if (gym.trainers) tagsHtml += `<span class="tag">Trainers</span>`;

      card.innerHTML = `
        <div class="camera-controls button-panel">
          <h4>${gym.name}</h4>
          <span class="desc">${gym.address}</span>
          <div class="gym-tags mt-2">
            ${tagsHtml}
          </div>
        </div>
        <div class="gym-card-right">
          <span class="dist">${gym.calculatedDistance} miles</span>
          <span class="match">${matchScore}% Match Rating</span>
        </div>
      `;

      resultsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Gym search error:", err);
    resultsContainer.innerHTML = `
      <div class="block-card text-center text-muted" style="padding: 30px;">
        <p>Location services unavailable. Please try again later.</p>
      </div>
    `;
  }
}

function togglePlannerDay(day) {
  const planEl = document.getElementById(`plan-${day}`);
  if (!planEl) return;

  const currentProgram = planEl.innerText;
  
  let nextProgram = "Rest Day";
  let nextClass = "rest";
  
  if (currentProgram.includes("Rest")) {
    nextProgram = "Chest & Triceps";
    nextClass = "scheduled";
  } else if (currentProgram.includes("Chest")) {
    nextProgram = "Legs (Squats)";
    nextClass = "scheduled";
  } else if (currentProgram.includes("Legs")) {
    nextProgram = "Back & Biceps";
    nextClass = "scheduled";
  } else if (currentProgram.includes("Back")) {
    nextProgram = "HIIT Cardio";
    nextClass = "scheduled";
  } else {
    nextProgram = "Rest Day";
    nextClass = "rest";
  }

  planEl.innerText = nextProgram;
  planEl.className = `day-program ${nextClass}`;
  
  addFeedbackLog(`Updated ${day} schedule to: ${nextProgram}`, "info");
}

/* ==========================================
   HEADER SEARCH & NOTIFICATIONS LOGIC
   ========================================== */
function initHeaderInteractions() {
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) return;

        let targetTab = null;
        if (query.includes("trainer") || query.includes("squat") || query.includes("curl") || query.includes("camera") || query.includes("gym trainer")) {
          targetTab = "gym-trainer";
        } else if (query.includes("diet") || query.includes("food") || query.includes("recipe") || query.includes("calorie") || query.includes("coach") || query.includes("bmi") || query.includes("dietician")) {
          targetTab = "dietician";
        } else if (query.includes("iot") || query.includes("smart") || query.includes("treadmill") || query.includes("sensor") || query.includes("dumbbell") || query.includes("cable") || query.includes("device")) {
          targetTab = "smart-gym";
        } else if (query.includes("habit") || query.includes("streak") || query.includes("consistent") || query.includes("risk") || query.includes("predict")) {
          targetTab = "habit-tracker";
        } else if (query.includes("buddy") || query.includes("aura") || query.includes("chat") || query.includes("motivation")) {
          targetTab = "gym-buddy";
        } else if (query.includes("pose") || query.includes("analyzer") || query.includes("kinematic") || query.includes("performance") || query.includes("score")) {
          targetTab = "pose-analyzer";
        } else if (query.includes("recommender") || query.includes("challenge") || query.includes("plan") || query.includes("near") || query.includes("program")) {
          targetTab = "recommender";
        }
        
        if (targetTab) {
          // Trigger tab click manually or route
          const menuItems = document.querySelectorAll(".menu-item");
          menuItems.forEach(item => {
            const tabId = item.getAttribute("href").substring(1);
            if (tabId === targetTab) {
              item.click();
              searchInput.value = "";
              addFeedbackLog(`Search matched! Navigated to ${item.querySelector('span').innerText}.`, "info");
            }
          });
        } else {
          showAppNotification(`No sections matched "${searchInput.value}". Try searching for 'trainer', 'diet', 'iot', 'habit', 'buddy', 'pose', or 'challenge'.`, "warning");
        }
      }
    });
  }

  // Click outside to close notifications dropdown
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("notifications-dropdown");
    const bellBtn = document.getElementById("btn-notifications");
    if (dropdown && !dropdown.classList.contains("hidden")) {
      if (!dropdown.contains(e.target) && !bellBtn.contains(e.target) && !bellBtn.querySelector('i').contains(e.target) && !bellBtn.querySelector('span').contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    }
  });
}

function toggleNotificationsDropdown() {
  const dropdown = document.getElementById("notifications-dropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
    
    // Clear notifications badge count when opened
    const badge = document.getElementById("notifications-badge");
    if (badge) {
      badge.classList.add("hidden");
    }
  }
}

function clearNotifications() {
  const list = document.getElementById("notifications-list-items");
  if (list) {
    list.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
        No new notifications
      </div>
    `;
  }
  const badge = document.getElementById("notifications-badge");
  if (badge) {
    badge.classList.add("hidden");
  }
}

/* Custom App-level Toast Notification Function */
function showAppNotification(message, type = 'info') {
  // Check if an existing toast exists, remove it
  let existingToast = document.getElementById("app-toast-el");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.id = "app-toast-el";
  toast.className = `app-toast ${type}`;

  // Icon based on type
  let iconHtml = '<i data-lucide="info" style="stroke: var(--color-red)"></i>';
  if (type === 'success') {
    iconHtml = '<i data-lucide="check-circle" style="stroke: var(--color-green)"></i>';
  } else if (type === 'warning') {
    iconHtml = '<i data-lucide="alert-triangle" style="stroke: var(--color-orange)"></i>';
  }

  toast.innerHTML = `
    <div class="app-toast-icon">${iconHtml}</div>
    <div class="app-toast-message">${message}</div>
  `;

  document.body.appendChild(toast);
  
  // Re-run lucide icons rendering
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Force reflow
  toast.offsetHeight;

  // Slide and fade in
  toast.classList.add("show");

  // Automatically fade out and remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

/* ==========================================
   8. MODULE 7: PERSONALIZED PLAN GENERATION HANDLERS
   ========================================== */
async function generateDietPlan() {
  const weight = parseFloat(document.getElementById("bmi-weight").value);
  const height = parseFloat(document.getElementById("bmi-height").value);
  const age = parseInt(document.getElementById("diet-age").value);
  const gender = document.getElementById("diet-gender").value;
  const goal = document.getElementById("diet-goal").value;

  if (weight <= 0 || height <= 0 || age <= 0) {
    showAppNotification("Please enter valid positive values for Weight, Height, and Age.", "warning");
    return;
  }

  const container = document.getElementById("generated-diet-plan-container");
  const content = document.getElementById("generated-diet-plan-content");
  if (!container || !content) return;

  content.innerHTML = `<div class="feedback-item info" style="padding:10px; color:var(--color-green)">Generating your personalized sports diet plan...</div>`;
  container.classList.remove("hidden");

  const token = localStorage.getItem("trivan_jwt_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/diet/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ weight, height, age, gender, goal })
    });
    const data = await res.json();
    if (res.status === 200) {
      content.innerHTML = data.plan_html;
      calculateBMI();
      showAppNotification("Diet plan generated successfully!", "success");
    } else {
      content.innerHTML = `<div class="feedback-item warn">Error generating plan: ${data.detail || "Server error"}</div>`;
    }
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="feedback-item warn">Network error. Running scientific rule fallback.</div>`;
    setTimeout(() => {
      const bmr = gender === 'female' 
        ? 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
        : 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      const tdee = bmr * 1.55;
      const targetCalories = goal === "weight-loss" ? Math.round(tdee - 500) : (goal === "muscle-gain" ? Math.round(tdee + 300) : Math.round(tdee));
      
      const proteinG = Math.round((targetCalories * 0.3) / 4);
      const carbsG = Math.round((targetCalories * 0.45) / 4);
      const fatsG = Math.round((targetCalories * 0.25) / 9);

      let meals = "Breakfast: Eggs and toast. Lunch: Chicken wrap. Snack: Yogurt. Dinner: Salmon and vegetables.";
      let groceries = "Eggs, chicken, salmon, green salad, avocado, nuts.";

      content.innerHTML = `
        <div class='plan-card'>
          <h4 style="margin-top:0;">Macro Targets (Offline Fallback)</h4>
          <div class='macro-pill-row' style='display:flex; gap: 10px; margin-bottom:15px;'>
            <span class='badge bg-red' style='padding:4px 8px; border-radius:4px; font-size:0.8rem; background:rgba(239,68,68,0.1); color:var(--color-red)'>Calories: ${Math.round(targetCalories)} kcal</span>
            <span class='badge bg-green' style='padding:4px 8px; border-radius:4px; font-size:0.8rem; background:rgba(34,197,94,0.1); color:var(--color-green)'>Protein: ${proteinG}g</span>
            <span class='badge bg-orange' style='padding:4px 8px; border-radius:4px; font-size:0.8rem; background:rgba(249,115,22,0.1); color:var(--color-orange)'>Carbs: ${carbsG}g</span>
            <span class='badge bg-purple' style='padding:4px 8px; border-radius:4px; font-size:0.8rem; background:rgba(168,85,247,0.1); color:var(--color-purple)'>Fats: ${fatsG}g</span>
          </div>
          <h3>Daily Meal Plan</h3>
          <p>${meals}</p>
          <h3>Weekly Grocery List</h3>
          <p>${groceries}</p>
        </div>
      `;
      calculateBMI();
    }, 800);
  }
}

async function generateWorkoutPlan() {
  const goal = document.getElementById("workout-goal").value;
  const level = document.getElementById("workout-level").value;

  const resultBox = document.getElementById("workout-plan-result");
  if (!resultBox) return;

  resultBox.innerHTML = `<div class="feedback-item info" style="padding:10px; color:var(--color-red);">Generating weekly routine...</div>`;
  resultBox.classList.remove("hidden");

  const token = localStorage.getItem("trivan_jwt_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/workout/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ goal, level })
    });
    const data = await res.json();
    if (res.status === 200) {
      resultBox.innerHTML = data.plan_html;
      showAppNotification("Workout program generated!", "success");
    } else {
      resultBox.innerHTML = `<div class="feedback-item warn">${data.detail || "Server error"}</div>`;
    }
  } catch (err) {
    console.error(err);
    setTimeout(() => {
      let program = "Squats: 3 sets x 12. Push-ups: 3 sets x 10. Bicep curls: 3 sets x 12. Stretch: 10 mins.";
      resultBox.innerHTML = `
        <div class='plan-card'>
          <h3 style="margin-top:0;">Weekly Schedule (Offline Fallback)</h3>
          <p>${program}</p>
          <h3>Trainer Form Advice</h3>
          <p>Maintain straight posture, lock shoulders, control eccentric path.</p>
        </div>
      `;
    }, 800);
  }
}

