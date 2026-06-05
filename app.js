/* ==========================================
   TRIVAN'S TECH AI Gym & Fitness Assistant Core Logic
   Authentication Flow & Theme Redesign Included
   ========================================== */

// Global State
const API_BASE = "http://localhost:8000/api";
let generatedOTP = "123456";
let isLoggedIn = false;

document.addEventListener("DOMContentLoaded", () => {
  checkAuthState();
  initTheme();
  initHeaderInteractions();
});

function checkAuthState() {
  const authState = localStorage.getItem("trivan_is_logged_in");
  const loginContainer = document.getElementById("login-container");
  const appWrapper = document.getElementById("app-wrapper");

  if (authState === "true") {
    isLoggedIn = true;
    loginContainer.classList.add("hidden");
    appWrapper.classList.remove("hidden");
    
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

function startGmailVerification() {
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

  // Generate random 6-digit OTP code for simulation
  generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
  
  // Display code to user via custom simulated Gmail notification toast
  showGmailToast(generatedOTP, emailInput.value);
  
  // Log it to console as fallback
  console.log(`[TRIVAN'S TECH Verification System] OTP sent: ${generatedOTP}`);

  // Display OTP input fields in form
  document.getElementById("otp-wrapper").classList.remove("hidden");
  document.getElementById("btn-verify-gmail").classList.add("hidden");
  document.getElementById("btn-login-submit").classList.remove("hidden");
}

function resendOTP() {
  const emailVal = document.getElementById("login-email").value;
  generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
  showGmailToast(generatedOTP, emailVal);
  console.log(`[TRIVAN'S TECH Verification System] New OTP sent: ${generatedOTP}`);
}

function handleLoginSubmit(event) {
  event.preventDefault();
  
  const otpWrapper = document.getElementById("otp-wrapper");
  const isOtpVisible = otpWrapper && !otpWrapper.classList.contains("hidden");

  // If the user hit enter inside inputs before verification OTP was sent
  if (!isOtpVisible) {
    startGmailVerification();
    return;
  }
  
  const otpInput = document.getElementById("login-otp").value.trim();
  
  if (otpInput === generatedOTP || otpInput === "123456") {
    // Write state
    localStorage.setItem("trivan_is_logged_in", "true");
    
    // Transition UI
    checkAuthState();
  } else {
    showAppNotification("Invalid verification code. Please check the code and try again.", "warning");
  }
}

function logout() {
  localStorage.setItem("trivan_is_logged_in", "false");
  
  // Stop running simulators
  stopTrainer();
  stopTreadmillBeltAnimation();
  
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
let exerciseState = "down";
let currentExercise = "bicep-curl";
let isTrainerActive = false;
let isDemoMode = false;
let demoAnimationId = null;

function initGymTrainer() {
  const startBtn = document.getElementById("btn-start-camera");
  const stopBtn = document.getElementById("btn-stop-camera");
  const demoBtn = document.getElementById("btn-demo-mode");
  const exerciseSelect = document.getElementById("select-exercise");

  if (!startBtn) return;

  exerciseSelect.addEventListener("change", (e) => {
    currentExercise = e.target.value;
    resetTrainerStats();
    updateTrainerLabels();
  });

  startBtn.addEventListener("click", startRealTrainer);
  stopBtn.addEventListener("click", stopTrainer);
  demoBtn.addEventListener("click", startDemoTrainer);
}

function resetTrainerStats() {
  trainerRepCount = 0;
  lastRepCount = 0;
  document.getElementById("trainer-rep-count").innerText = "0";
  document.getElementById("trainer-rep-progress").style.width = "0%";
  
  document.getElementById("dash-trainer-reps").innerText = "0 Reps";
  
  const feedbackLogs = document.getElementById("feedback-logs");
  feedbackLogs.innerHTML = `
    <div class="feedback-item info">
      <span class="time">00:00</span>
      <span class="msg">Session reset. Ready for ${currentExercise === "squat" ? "Squats" : "Bicep Curls"}.</span>
    </div>
  `;
}

function updateTrainerLabels() {
  const targetLabel = document.getElementById("trainer-rep-target");
  const angle1Name = document.getElementById("angle-1-name");
  const angle2Name = document.getElementById("angle-2-name");
  const angle3Name = document.getElementById("angle-3-name");

  if (currentExercise === "squat") {
    targetLabel.innerText = "12 reps";
    angle1Name.innerText = "Knee Angle:";
    angle2Name.innerText = "Hip Angle:";
    angle3Name.innerText = "Back Incline:";
  } else {
    targetLabel.innerText = "10 reps";
    angle1Name.innerText = "Elbow Angle:";
    angle2Name.innerText = "Shoulder Angle:";
    angle3Name.innerText = "Wrist Incline:";
  }
}

function speakFeedback(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

function addFeedbackLog(message, type = "info") {
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
    speakFeedback(message);
    
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
  document.getElementById("btn-start-camera").classList.add("hidden");
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
    
    let hipX = 320, hipY = 220;
    let shoulderX = 320, shoulderY = 130;
    let elbowX = 360, elbowY = 130;
    let wristX = 380, wristY = 150;
    let kneeX = 320, kneeY = 320;
    let ankleX = 320, ankleY = 410;
    let headX = 320, headY = 90;

    let angle1 = 0, angle2 = 0, angle3 = 0;

    if (currentExercise === "bicep-curl") {
      const curlAmount = (Math.sin(cycle - Math.PI/2) + 1) / 2;
      elbowX = 345;
      elbowY = 190;
      
      const wristRadius = 70;
      const startWristAngle = Math.PI * 0.45;
      const endWristAngle = -Math.PI * 0.45;
      const currentWristAngle = startWristAngle - curlAmount * (startWristAngle - endWristAngle);
      
      wristX = elbowX + wristRadius * Math.cos(currentWristAngle);
      wristY = elbowY + wristRadius * Math.sin(currentWristAngle);
      
      angle1 = Math.round((startWristAngle - currentWristAngle) * (180 / Math.PI));
      angle1 = 180 - angle1;
      
      angle2 = 12 + Math.round(Math.sin(cycle) * 5);
      angle3 = Math.round(currentWristAngle * (180/Math.PI));
      
      if (angle1 < 50 && exerciseState === "down") {
        exerciseState = "up";
      } else if (angle1 > 150 && exerciseState === "up") {
        exerciseState = "down";
        trainerRepCount++;
        addFeedbackLog(`Rep ${trainerRepCount} complete! Perfect range of motion.`, "success");
      }
      
      if (frameCount % 240 === 180 && Math.random() > 0.5) {
        addFeedbackLog("Avoid swinging your upper arm!", "warn");
      }

    } else if (currentExercise === "squat") {
      const squatAmount = (Math.sin(cycle - Math.PI/2) + 1) / 2;
      ankleX = 320;
      ankleY = 410;
      kneeX = 300 - squatAmount * 25;
      kneeY = 320;
      hipX = 330 - squatAmount * 40;
      hipY = 220 + squatAmount * 70;
      shoulderX = hipX;
      shoulderY = hipY - 90;
      headX = shoulderX + 5;
      headY = shoulderY - 35;
      
      angle1 = 175 - Math.round(squatAmount * 95);
      angle2 = 150 - Math.round(squatAmount * 70);
      angle3 = Math.round(squatAmount * 15);
      
      if (angle1 < 95 && exerciseState === "up") {
        exerciseState = "down";
      } else if (angle1 > 165 && exerciseState === "down") {
        exerciseState = "up";
        trainerRepCount++;
        addFeedbackLog(`Rep ${trainerRepCount} complete! Excellent depth.`, "success");
      }
      
      if (frameCount % 250 === 120 && Math.random() > 0.6) {
        addFeedbackLog("Keep chest lifted, don't bend forward too much!", "warn");
      }
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
    document.getElementById("trainer-rep-count").innerText = trainerRepCount;
    
    const targetReps = currentExercise === "squat" ? 12 : 10;
    const progressPercent = Math.min((trainerRepCount / targetReps) * 100, 100);
    document.getElementById("trainer-rep-progress").style.width = `${progressPercent}%`;
    
    document.getElementById("dash-trainer-reps").innerText = `${trainerRepCount} Reps`;

    demoAnimationId = requestAnimationFrame(animateDemo);
  }

  animateDemo();
}

/* --- REAL WEBCAM & MEDIAPIPE TRACKER --- */
function startRealTrainer() {
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
  
  addFeedbackLog("Session stopped.", "info");
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

    if (angle1 < 45 && exerciseState === "down") {
      exerciseState = "up";
    } else if (angle1 > 150 && exerciseState === "up") {
      exerciseState = "down";
      trainerRepCount++;
      addFeedbackLog(`Rep ${trainerRepCount} complete! Nice form.`, "success");
    }

    if (angle2 > 35 && exerciseState === "up") {
      addFeedbackLog("Tuck your elbow in close to your ribs!", "warn");
    }

  } else if (currentExercise === "squat") {
    angle1 = findAngle(points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y, points.rAnkle.x, points.rAnkle.y);
    angle2 = findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rKnee.x, points.rKnee.y);
    angle3 = Math.round(Math.abs(findAngle(points.rShoulder.x, points.rShoulder.y, points.rHip.x, points.rHip.y, points.rHip.x, points.rHip.y - 100)));

    if (angle1 < 100 && exerciseState === "up") {
      exerciseState = "down";
    } else if (angle1 > 160 && exerciseState === "down") {
      exerciseState = "up";
      trainerRepCount++;
      addFeedbackLog(`Rep ${trainerRepCount} complete! Full range reached.`, "success");
    }

    if (angle3 > 45 && exerciseState === "down") {
      addFeedbackLog("Keep your chest up and back flat!", "warn");
    }
  }

  document.getElementById("angle-1-val").innerText = `${angle1}°`;
  document.getElementById("angle-2-val").innerText = `${angle2}°`;
  document.getElementById("angle-3-val").innerText = `${angle3}°`;
  document.getElementById("trainer-rep-count").innerText = trainerRepCount;
  
  const targetReps = currentExercise === "squat" ? 12 : 10;
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
  fetch(`${API_BASE}/diet/logs`)
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
    fetch(`${API_BASE}/diet/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  fetch(`${API_BASE}/ai/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  })
  .then(res => res.json())
  .then(data => {
    appendDietChatBubble(data.response, "bot");
  })
  .catch(err => {
    console.warn("[Backend Offline] Using local dietician fallback parser.");
    setTimeout(() => {
      const response = getDieticianResponse(text);
      appendDietChatBubble(response, "bot");
    }, 1000);
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

  let risk = 30;
  risk += (8.0 - sleep) * 12;
  risk += stress * 8;
  risk += (8 - energy) * 10;
  risk += days * 15;

  risk = Math.max(5, Math.min(98, Math.round(risk)));
  
  document.getElementById("habit-prediction-percent").innerText = `${risk}%`;
  document.getElementById("dash-habit-risk").innerText = `${risk}%`;

  const badge = document.getElementById("habit-risk-badge");
  const nudgeText = document.getElementById("habit-nudge-text");
  
  if (risk < 25) {
    badge.innerText = "Low Risk";
    badge.className = "risk-badge low";
    nudgeText.innerText = "You're in the optimal zone! Head to the gym between 5 PM and 7 PM for a high-energy session. Your consistency score is protected.";
    document.getElementById("dash-habit-risk").className = "preview-value text-green";
  } else if (risk >= 25 && risk < 60) {
    badge.innerText = "Medium Risk";
    badge.className = "risk-badge medium";
    nudgeText.innerText = "Energy is slightly low, which boosts mental friction. AI recommends doing a short, focused 15-minute workout to maintain the habit node.";
    document.getElementById("dash-habit-risk").className = "preview-value text-orange";
  } else {
    badge.innerText = "High Risk";
    badge.className = "risk-badge high";
    nudgeText.innerText = "Skipping likelihood is high. Let's work around it: do a simple bodyweight stretch at home now or schedule a Virtual Buddy chat for encouragement.";
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

  const mood = analyzeSentiment(text);
  updateBuddyMood(mood);

  setTimeout(() => {
    const response = getBuddyResponse(text, mood);
    appendBuddyChatBubble(response, "bot");
    
    const voiceChecked = document.getElementById("buddy-voice-enabled").checked;
    if (voiceChecked) {
      speakBuddyResponse(response);
    }
  }, 1000);
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

function renderCharts(forceRefresh = false) {
  const pCtx = document.getElementById("performanceChart")?.getContext("2d");
  const rCtx = document.getElementById("rangeChart")?.getContext("2d");

  if (!pCtx || !rCtx) return;

  if (perfChartInstance && forceRefresh) perfChartInstance.destroy();
  if (rangeChartInstance && forceRefresh) rangeChartInstance.destroy();

  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const gridColor = isLight ? "#e4e4e7" : "#27272a";
  const labelColor = isLight ? "#71717a" : "#a1a1aa";

  const scoreData = forceRefresh 
    ? [80, 84, 83, 89, 91, 95] 
    : [78, 82, 85, 87, 90, 92];
    
  const rangeData = forceRefresh
    ? [125, 130, 138, 142, 142, 145, 140, 142, 144, 145]
    : [120, 128, 135, 140, 142, 141, 139, 142, 142, 142];

  // Red theme for weekly performance
  perfChartInstance = new Chart(pCtx, {
    type: "line",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      datasets: [{
        label: "Efficiency Score",
        data: scoreData,
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

  // Green theme for range of motion
  rangeChartInstance = new Chart(rCtx, {
    type: "bar",
    data: {
      labels: ["Rep 1", "Rep 2", "Rep 3", "Rep 4", "Rep 5", "Rep 6", "Rep 7", "Rep 8", "Rep 9", "Rep 10"],
      datasets: [{
        label: "Knee Angle Reach",
        data: rangeData,
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
          min: 90,
          max: 160,
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
const gymDatabase = [
  { name: "Gold's Fitness Hub", distance: 2.1, rating: 4.8, pool: true, sauna: true, trainers: true, match: 96, address: "502 Cyber Square Ave, Metro City" },
  { name: "Iron & Steel Barbell Gym", distance: 4.5, rating: 4.6, pool: false, sauna: false, trainers: true, match: 88, address: "88 Iron Parkway Rd, East District" },
  { name: "Aqua-Zen Wellness Resort", distance: 7.2, rating: 4.9, pool: true, sauna: true, trainers: false, match: 92, address: "12 Wellness Dr, Bay Area" },
  { name: "Velocity Cardio & HIIT Club", distance: 8.9, rating: 4.2, pool: false, sauna: true, trainers: true, match: 81, address: "204 Speed Lane, High Rise District" },
  { name: "Powerhouse Elite Club", distance: 12.4, rating: 4.7, pool: true, sauna: false, trainers: true, match: 85, address: "707 Heavy Stack Way, West Industrial" }
];

function initGymRecommender() {
  filterGyms();
}

function filterGyms() {
  const distSelect = document.getElementById("gym-distance");
  if (!distSelect) return;

  const maxDistance = parseFloat(distSelect.value);
  const typeFilter = document.getElementById("gym-type").value;
  
  const resultsContainer = document.getElementById("gym-list-results");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = "";

  const filtered = gymDatabase.filter(gym => {
    if (gym.distance > maxDistance) return false;
    
    if (typeFilter === "pool" && !gym.pool) return false;
    if (typeFilter === "sauna" && !gym.sauna) return false;
    if (typeFilter === "trainers" && !gym.trainers) return false;

    return true;
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `
      <div class="block-card text-center text-muted">
        <p>No gyms match your select criteria. Try increasing the search distance radius.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(gym => {
    const card = document.createElement("div");
    card.className = "block-card gym-card hover-scale";
    
    let tagsHtml = "";
    if (gym.pool) tagsHtml += `<span class="tag">Pool</span>`;
    if (gym.sauna) tagsHtml += `<span class="tag">Sauna</span>`;
    if (gym.trainers) tagsHtml += `<span class="tag">Trainers</span>`;

    card.innerHTML = `
      <div class="gym-card-info">
        <h4>${gym.name}</h4>
        <span class="desc">${gym.address}</span>
        <div class="gym-tags mt-2">
          ${tagsHtml}
        </div>
      </div>
      <div class="gym-card-right">
        <span class="dist">${gym.distance} miles</span>
        <span class="match">${gym.match}% Match Rating</span>
      </div>
    `;

    resultsContainer.appendChild(card);
  });
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

