// script.js — Form submission handling, input validation, orchestration.

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("symptom-form");
  const submitBtn = document.getElementById("submit-btn");
  const loadingSection = document.getElementById("loading");
  const resultsSection = document.getElementById("results-section");
  const mapSection = document.getElementById("map-section");
  const errorSection = document.getElementById("error-section");

  // Result display elements
  const specialistEl = document.getElementById("specialist");
  const urgencyEl = document.getElementById("urgency");
  const explanationEl = document.getElementById("explanation");
  const errorMessageEl = document.getElementById("error-message");
  const emergencySection = document.getElementById("emergency-section");
  const mapHeading = document.querySelector("#map-section h2");
  const showHospitalsBtn = document.getElementById("show-hospitals-btn");

  // ===== Auth Elements =====
  const loginBtn = document.getElementById("login-btn");
  const userInfo = document.getElementById("user-info");
  const userEmailEl = document.getElementById("user-email");
  const profileBtn = document.getElementById("profile-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // Auth Modal
  const authModal = document.getElementById("auth-modal");
  const authModalClose = document.getElementById("auth-modal-close");
  const authForm = document.getElementById("auth-form");
  const authModalTitle = document.getElementById("auth-modal-title");
  const authEmail = document.getElementById("auth-email");
  const authPassword = document.getElementById("auth-password");
  const authPasswordGroup = document.getElementById("auth-password-group");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authError = document.getElementById("auth-error");
  const authSuccess = document.getElementById("auth-success");
  const toggleSignup = document.getElementById("toggle-signup");
  const toggleForgot = document.getElementById("toggle-forgot");

  // Profile Modal
  const profileModal = document.getElementById("profile-modal");
  const profileModalClose = document.getElementById("profile-modal-close");
  const contactsForm = document.getElementById("contacts-form");
  const ecContact1 = document.getElementById("ec-contact1");
  const ecContact2 = document.getElementById("ec-contact2");
  const contactsError = document.getElementById("contacts-error");
  const contactsSuccess = document.getElementById("contacts-success");

  // Emergency Notify
  const emergencyNotify = document.getElementById("emergency-notify");
  const notifyContacts = document.getElementById("notify-contacts");

  // Auth mode: "login" | "signup" | "forgot"
  let authMode = "login";

  // ===== Initialize Auth =====
  try {
    Auth.init();
    const user = await Auth.getSession();
    if (user) updateAuthUI(true);
  } catch (e) {
    console.warn("[Auth] Init failed:", e.message);
  }

  function updateAuthUI(loggedIn) {
    if (loggedIn) {
      hide(loginBtn);
      userEmailEl.textContent = Auth.getUserEmail();
      show(userInfo);
    } else {
      show(loginBtn);
      hide(userInfo);
    }
  }

  // ===== Auth Modal Logic =====
  function setAuthMode(mode) {
    authMode = mode;
    hide(authError);
    hide(authSuccess);
    authEmail.value = "";
    authPassword.value = "";

    if (mode === "login") {
      authModalTitle.textContent = "Login";
      authSubmitBtn.textContent = "Login";
      show(authPasswordGroup);
      authPassword.setAttribute("required", "");
      toggleSignup.innerHTML = "Don't have an account? <strong>Sign Up</strong>";
      show(toggleForgot);
    } else if (mode === "signup") {
      authModalTitle.textContent = "Sign Up";
      authSubmitBtn.textContent = "Sign Up";
      show(authPasswordGroup);
      authPassword.setAttribute("required", "");
      toggleSignup.innerHTML = "Already have an account? <strong>Login</strong>";
      show(toggleForgot);
    } else {
      authModalTitle.textContent = "Reset Password";
      authSubmitBtn.textContent = "Send Reset Email";
      hide(authPasswordGroup);
      authPassword.removeAttribute("required");
      toggleSignup.innerHTML = "Back to <strong>Login</strong>";
      hide(toggleForgot);
    }
  }

  loginBtn.addEventListener("click", () => {
    setAuthMode("login");
    show(authModal);
  });

  authModalClose.addEventListener("click", () => hide(authModal));
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) hide(authModal);
  });

  toggleSignup.addEventListener("click", () => {
    if (authMode === "login") setAuthMode("signup");
    else setAuthMode("login");
  });

  toggleForgot.addEventListener("click", () => setAuthMode("forgot"));

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hide(authError);
    hide(authSuccess);
    authSubmitBtn.disabled = true;

    const email = authEmail.value.trim();
    const password = authPassword.value;

    try {
      if (authMode === "login") {
        await Auth.logIn(email, password);
        updateAuthUI(true);
        hide(authModal);
      } else if (authMode === "signup") {
        await Auth.signUp(email, password);
        authSuccess.textContent = "Account created! Check your email for confirmation, then log in.";
        show(authSuccess);
      } else {
        await Auth.resetPassword(email);
        authSuccess.textContent = "Password reset email sent. Check your inbox.";
        show(authSuccess);
      }
    } catch (err) {
      authError.textContent = err.message;
      show(authError);
    } finally {
      authSubmitBtn.disabled = false;
    }
  });

  // ===== Logout =====
  logoutBtn.addEventListener("click", async () => {
    try {
      await Auth.logOut();
      updateAuthUI(false);
    } catch (err) {
      console.error("[Auth] Logout error:", err);
    }
  });

  // ===== Profile Modal =====
  profileBtn.addEventListener("click", async () => {
    hide(contactsError);
    hide(contactsSuccess);
    try {
      const contacts = await Auth.loadContacts();
      ecContact1.value = contacts.contact1;
      ecContact2.value = contacts.contact2;
    } catch (e) {
      console.warn("[Auth] Failed to load contacts:", e);
    }
    show(profileModal);
  });

  profileModalClose.addEventListener("click", () => hide(profileModal));
  profileModal.addEventListener("click", (e) => {
    if (e.target === profileModal) hide(profileModal);
  });

  contactsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hide(contactsError);
    hide(contactsSuccess);

    const c1 = ecContact1.value.trim();
    const c2 = ecContact2.value.trim();

    if (!c1) {
      contactsError.textContent = "Please enter at least one contact number.";
      show(contactsError);
      return;
    }

    try {
      await Auth.saveContacts(c1, c2);
      contactsSuccess.textContent = "Contacts saved successfully!";
      show(contactsSuccess);
    } catch (err) {
      contactsError.textContent = err.message;
      show(contactsError);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Read and validate inputs
    const symptoms = document.getElementById("symptoms").value.trim();
    const age = document.getElementById("age").value.trim();
    const gender = document.getElementById("gender").value;
    const conditions = document.getElementById("conditions").value.trim();

    if (!symptoms) {
      showError("Please enter at least one symptom.");
      return;
    }

    // Reset UI
    hideAll();
    show(loadingSection);
    submitBtn.disabled = true;

    try {
      // Step 1: Analyze symptoms with AI
      const result = await AI.analyzeSymptoms(symptoms, age, gender, conditions);

      // Step 2: Display recommendation
      displayResult(result);

      // Scroll to results
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

      const isEmergency = result.urgency.toLowerCase() === "high";

      if (isEmergency) {
        // Show emergency warning
        show(emergencySection);
        // Show emergency contact notify if logged in
        showEmergencyNotify();
        // Scroll to emergency section
        emergencySection.scrollIntoView({ behavior: "smooth", block: "start" });
        // Auto-load hospitals immediately
        show(mapSection);
        mapHeading.textContent = "Nearest Hospitals";
        try {
          const hospitalCount = await ClinicMap.loadHospitals();
          if (hospitalCount === 0) {
            showError("No hospitals found nearby. Use the search bar to enter your location.");
          }
        } catch (mapErr) {
          showError("Map error: " + mapErr.message + " — Use the search bar above the map to enter your location manually.");
        }
      } else {
        // Normal flow: show all clinics
        show(mapSection);
        mapHeading.textContent = "Nearby Clinics & Hospitals";
        try {
          const clinicCount = await ClinicMap.loadMap();
          if (clinicCount === 0) {
            showError("No clinics found nearby. Try searching your location using the search bar on the map.");
          }
        } catch (mapErr) {
          showError("Map error: " + mapErr.message + " — Use the search bar above the map to enter your location manually.");
        }
      }
    } catch (err) {
      showError(err.message);
    } finally {
      hide(loadingSection);
      submitBtn.disabled = false;
    }
  });

  /**
   * Display the AI recommendation in the results section.
   */
  function displayResult(result) {
    specialistEl.textContent = result.specialist;

    urgencyEl.textContent = result.urgency;
    urgencyEl.className = "value badge " + result.urgency.toLowerCase();

    explanationEl.textContent = result.explanation;

    show(resultsSection);
  }

  /**
   * Show an error message to the user.
   */
  function showError(message) {
    errorMessageEl.textContent = message;
    show(errorSection);
  }

  // UI helpers
  function show(el) {
    el.classList.remove("hidden");
  }
  function hide(el) {
    el.classList.add("hidden");
  }

  // Location search handler
  const locationBtn = document.getElementById("location-btn");
  const locationInput = document.getElementById("location-input");

  locationBtn.addEventListener("click", async () => {
    const query = locationInput.value.trim();
    if (!query) return;

    locationBtn.disabled = true;
    locationBtn.textContent = "Searching…";
    hide(errorSection);

    try {
      const count = await ClinicMap.searchLocation(query);
      if (count === 0) {
        showError("No clinics found in that area. Try a broader search.");
      }
    } catch (err) {
      showError("Location search error: " + err.message);
    } finally {
      locationBtn.disabled = false;
      locationBtn.textContent = "Search";
    }
  });

  locationInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      locationBtn.click();
    }
  });

  // ===== Emergency "Show Nearest Hospitals" button =====
  showHospitalsBtn.addEventListener("click", async () => {
    show(mapSection);
    mapHeading.textContent = "Nearest Hospitals";
    mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    showHospitalsBtn.disabled = true;
    showHospitalsBtn.textContent = "Loading hospitals…";

    try {
      const count = await ClinicMap.loadHospitals();
      if (count === 0) {
        showError("No hospitals found nearby. Use the search bar on the map to enter your location.");
      }
    } catch (err) {
      showError("Map error: " + err.message + " — Use the search bar to enter your location.");
    } finally {
      showHospitalsBtn.disabled = false;
      showHospitalsBtn.textContent = "Show Nearest Hospitals";
    }
  });

  // ===== Voice Input =====
  const micBtn = document.getElementById("mic-btn");
  const micStatus = document.getElementById("mic-status");
  const symptomsField = document.getElementById("symptoms");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  console.log("[Voice] SpeechRecognition API available:", !!SpeechRecognition);

  if (!SpeechRecognition) {
    // Browser doesn't support speech recognition — hide the mic button
    micBtn.style.display = "none";
    console.log("[Voice] Hiding mic button — API not supported");
  } else {
    let recognition = null;
    let isRecording = false;

    micBtn.addEventListener("click", async () => {
      if (isRecording) {
        console.log("[Voice] Stopping recording...");
        recognition.stop();
        return;
      }

      // First, explicitly request microphone permission
      try {
        console.log("[Voice] Requesting microphone permission...");
        micStatus.textContent = "Requesting microphone access...";
        show(micStatus);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately — we just needed the permission
        stream.getTracks().forEach((t) => t.stop());
        console.log("[Voice] Microphone permission granted");
      } catch (permErr) {
        console.error("[Voice] Microphone permission denied:", permErr);
        micStatus.textContent = "Microphone access denied. Please allow it in your browser settings.";
        return;
      }

      // Start recording
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;

      isRecording = true;
      micBtn.classList.add("recording");
      micStatus.textContent = "Listening... Speak your symptoms now.";
      show(micStatus);

      console.log("[Voice] Starting recognition...");

      recognition.onstart = () => {
        console.log("[Voice] Recognition started — microphone is active");
      };

      recognition.onaudiostart = () => {
        console.log("[Voice] Audio capturing started");
      };

      recognition.onspeechstart = () => {
        console.log("[Voice] Speech detected");
      };

      recognition.onspeechend = () => {
        console.log("[Voice] Speech ended");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        console.log("[Voice] Transcript:", transcript, "| Confidence:", confidence);

        // Ask user to confirm the transcribed text
        const confirmed = confirm(
          "We heard:\n\n\"" + transcript + "\"\n\nIs this correct? Click OK to use it, or Cancel to try again."
        );

        if (confirmed) {
          // Append to existing text or set it
          const existing = symptomsField.value.trim();
          symptomsField.value = existing
            ? existing + ", " + transcript
            : transcript;
        }
      };

      recognition.onerror = (event) => {
        console.error("[Voice] Error:", event.error, event.message);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          micStatus.textContent = "Microphone access denied. Please allow mic access in browser settings.";
        } else if (event.error === "no-speech") {
          micStatus.textContent = "No speech detected. Click the mic and try again.";
        } else if (event.error === "network") {
          micStatus.textContent = "Network error — Speech API requires localhost or HTTPS.";
        } else {
          micStatus.textContent = "Error: " + event.error + ". Try again.";
        }
      };

      recognition.onend = () => {
        console.log("[Voice] Recognition ended");
        isRecording = false;
        micBtn.classList.remove("recording");
        setTimeout(() => hide(micStatus), 4000);
      };

      try {
        recognition.start();
      } catch (err) {
        console.error("[Voice] Failed to start:", err);
        micStatus.textContent = "Failed to start voice input: " + err.message;
        isRecording = false;
        micBtn.classList.remove("recording");
      }
    });
  }

  // ===== Emergency Contact Notify =====
  async function showEmergencyNotify() {
    if (!Auth.isLoggedIn()) {
      hide(emergencyNotify);
      return;
    }

    try {
      const contacts = await Auth.loadContacts();
      if (!contacts.contact1) {
        hide(emergencyNotify);
        return;
      }

      // Get current location for SMS body
      let locationText = "Location unavailable";
      let mapsLink = "";
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        mapsLink = "https://maps.google.com/maps?q=" + lat + "," + lng;
        locationText = "Lat: " + lat + ", Lng: " + lng;
      } catch (geoErr) {
        console.warn("[Notify] Geolocation failed:", geoErr);
      }

      const smsBody = encodeURIComponent(
        "EMERGENCY: I may need immediate medical help. My location: " +
          locationText +
          (mapsLink ? " " + mapsLink : "") +
          " — Sent via SehatMaarg"
      );

      // Build contact buttons
      notifyContacts.innerHTML = "";
      [contacts.contact1, contacts.contact2].forEach((num) => {
        if (!num) return;
        const row = document.createElement("div");
        row.className = "notify-contact";
        row.innerHTML =
          '<span>' + escapeHtml(num) + '</span>' +
          '<a href="tel:' + encodeURIComponent(num) + '" class="notify-btn call">&#128222; Call</a>' +
          '<a href="sms:' + encodeURIComponent(num) + '?body=' + smsBody + '" class="notify-btn sms">&#128172; SMS</a>';
        notifyContacts.appendChild(row);
      });

      show(emergencyNotify);
    } catch (e) {
      console.warn("[Notify] Error:", e);
      hide(emergencyNotify);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function hideAll() {
    hide(resultsSection);
    hide(mapSection);
    hide(errorSection);
    hide(loadingSection);
    hide(emergencySection);
    hide(emergencyNotify);
  }
});
