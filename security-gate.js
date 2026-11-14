(() => {
  "use strict";
  const db = window.GOT_SUPABASE;
  if (!db || window.__GOT_SECURITY_GATE_ACTIVE) return;
  window.__GOT_SECURITY_GATE_ACTIVE = true;

  let suppressAuthEvents = false;
  let activeSessionId = null;
  let overlay = null;
  let busy = false;

  const style = document.createElement("style");
  style.textContent = `
    #gotSecurityGate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(5,9,20,.94);backdrop-filter:blur(14px);font-family:inherit;color:#f7f8ff}
    #gotSecurityGate[hidden]{display:none}
    #gotSecurityGate .got-security-card{width:min(100%,470px);padding:28px;border:1px solid rgba(148,163,184,.28);border-radius:24px;background:linear-gradient(145deg,#17243a,#101827);box-shadow:0 24px 90px rgba(0,0,0,.55)}
    #gotSecurityGate .got-security-mark{width:46px;height:46px;display:grid;place-items:center;border-radius:15px;background:rgba(59,130,246,.18);color:#93c5fd;font-size:23px;margin-bottom:18px}
    #gotSecurityGate h2{font-size:23px;line-height:1.2;margin:0 0 10px}
    #gotSecurityGate p{color:#b8c3d6;line-height:1.55;margin:0 0 18px;font-size:14px}
    #gotSecurityGate label{display:block;font-size:13px;color:#dbe5f5;margin:14px 0 7px}
    #gotSecurityGate input{box-sizing:border-box;width:100%;padding:13px 14px;border-radius:12px;border:1px solid #40516b;background:#0b1422;color:white;font:inherit;outline:none}
    #gotSecurityGate input:focus{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(96,165,250,.15)}
    #gotSecurityGate button{width:100%;border:0;border-radius:12px;padding:13px 15px;margin-top:13px;background:#3b82f6;color:white;font-weight:750;font:inherit;cursor:pointer}
    #gotSecurityGate button:disabled{opacity:.55;cursor:wait}
    #gotSecurityGate .got-security-secondary{background:transparent;border:1px solid #465873;color:#dbeafe}
    #gotSecurityGate .got-security-message{min-height:20px;margin:12px 0 0;color:#fbbf24;font-size:13px}
    #gotSecurityGate .got-security-foot{font-size:12px;color:#8796ad;margin-top:16px}
    #gotSecurityGate .got-security-email{font-weight:700;color:#e2e8f0;overflow-wrap:anywhere}
  `;
  document.head.appendChild(style);

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "gotSecurityGate";
    overlay.hidden = true;
    overlay.innerHTML = '<section class="got-security-card" role="dialog" aria-modal="true" aria-labelledby="gotSecurityTitle"><div class="got-security-mark" aria-hidden="true">⌑</div><h2 id="gotSecurityTitle">Protecting your account</h2><p id="gotSecurityDescription">Checking this sign-in…</p><div id="gotSecurityForm"></div><div class="got-security-message" id="gotSecurityMessage" role="status" aria-live="polite"></div><div class="got-security-foot">G.O.T. account security · Your account data stays locked until verification succeeds.</div></section>';
    document.body.appendChild(overlay);
    return overlay;
  }
  function setMessage(value) {
    const node = ensureOverlay().querySelector("#gotSecurityMessage");
    node.textContent = value || "";
  }
  function show(title, description, formHtml) {
    const root = ensureOverlay();
    root.hidden = false;
    root.querySelector("#gotSecurityTitle").textContent = title;
    root.querySelector("#gotSecurityDescription").textContent = description;
    root.querySelector("#gotSecurityForm").innerHTML = formHtml;
    setMessage("");
  }
  function hide() {
    if (overlay) overlay.hidden = true;
  }
  function setBusy(value) {
    busy = value;
    if (!overlay) return;
    overlay.querySelectorAll("button,input").forEach(el => el.disabled = value);
  }
  async function securityCall(action, extra = {}) {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError) throw sessionError;
    const session = sessionData.session;
    if (!session?.access_token) throw new Error("Your sign-in session ended. Please log in again.");
    const { data, error } = await db.functions.invoke("got-login-security", {
      body: { action, ...extra }
    });
    if (error) throw new Error(error.message || "Security check failed.");
    return data;
  }
  function emailForSession() {
    return db.auth.getSession().then(({data}) => data.session?.user?.email || "");
  }
  function sessionIdFromClientSession(session) {
    try {
      const part = session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
      return String(payload.session_id || "");
    } catch (_) { return ""; }
  }
  function savePendingEmail(challengeId, enrollment) {
    try {
      const session = db.auth.getSession();
      session.then(({data}) => {
        if (!data.session) return;
        localStorage.setItem("gotSecurityPendingEmailV1", JSON.stringify({
          challengeId, enrollment: !!enrollment,
          originalSessionId: sessionIdFromClientSession(data.session),
          savedAt: Date.now()
        }));
      });
    } catch (_) {}
  }
  function readPendingEmail() {
    try {
      const value = JSON.parse(localStorage.getItem("gotSecurityPendingEmailV1") || "null");
      if (!value || Date.now() - Number(value.savedAt || 0) > 10 * 60 * 1000) {
        localStorage.removeItem("gotSecurityPendingEmailV1");
        return null;
      }
      return value;
    } catch (_) { return null; }
  }
  function clearPendingEmail() {
    try { localStorage.removeItem("gotSecurityPendingEmailV1"); } catch (_) {}
  }
  async function sendEmailCode(challengeId, enrollment) {
    const email = await emailForSession();
    if (!email) throw new Error("This account has no email address for verification.");
    const {data} = await db.auth.getSession();
    if (!data.session) throw new Error("Your sign-in session ended. Please log in again.");
    localStorage.setItem("gotSecurityPendingEmailV1", JSON.stringify({
      challengeId, enrollment: !!enrollment,
      originalSessionId: sessionIdFromClientSession(data.session),
      savedAt: Date.now()
    }));
    const { error } = await db.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });
    if (error) throw error;
    return email;
  }
  function maskedEmail(email) {
    const parts = String(email || "").split("@");
    if (parts.length !== 2) return "your account email";
    const name = parts[0];
    return (name.length < 3 ? name[0] + "…" : name.slice(0, 2) + "…" + name.slice(-1)) + "@" + parts[1];
  }
  function renderEmailCode(email, enrollment, challengeId) {
    show(
      enrollment ? "Confirm your email" : "Email verification",
      enrollment
        ? "Before setting your security question, confirm you own this account."
        : "The security answer wasn't accepted or you chose email verification. We'll send a one-time code to:",
      '<div class="got-security-email">' + escapeText(maskedEmail(email)) + '</div><label for="gotSecurityOtp">6-digit email code</label><input id="gotSecurityOtp" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Enter the code"><button id="gotSecuritySend">Send code</button><button id="gotSecurityVerify">Verify code</button>'
    );
    const sendButton = overlay.querySelector("#gotSecuritySend");
    const verifyButton = overlay.querySelector("#gotSecurityVerify");
    sendButton.addEventListener("click", async () => {
      if (busy) return;
      setBusy(true);
      try {
        await sendEmailCode(challengeId, enrollment);
        setMessage("Code sent. Check your inbox and spam folder.");
      } catch (error) {
        setMessage("Email could not be sent: " + (error.message || "Please retry."));
      } finally { setBusy(false); }
    });
    verifyButton.addEventListener("click", async () => {
      if (busy) return;
      const token = overlay.querySelector("#gotSecurityOtp").value.trim();
      if (!/^\d{6,8}$/.test(token)) { setMessage("Enter the code from your email."); return; }
      setBusy(true);
      suppressAuthEvents = true;
      try {
        const {data, error} = await db.auth.verifyOtp({email, token, type:"email"});
        if (error) throw error;
        if (!data.session) throw new Error("Email verification did not create a session.");
        const result = await securityCall("complete_email", {challenge_id: challengeId});
        clearPendingEmail();
        if (result.status === "enrollment_verified") {
          renderQuestionSetup();
        } else if (result.status === "verified") {
          setMessage("Email verified. Opening your account…");
          window.location.reload();
        } else {
          throw new Error(result.error || "Email verification could not be completed.");
        }
      } catch (error) {
        setMessage(error.message || "That code could not be verified.");
      } finally {
        suppressAuthEvents = false;
        setBusy(false);
      }
    });
  }
  function renderQuestionSetup() {
    show(
      "Create your security question",
      "Choose a question only you can answer. Avoid answers other people could easily guess. You can use a pet's name, a private nickname, or another memorable answer.",
      '<label for="gotSecurityQuestion">Your question</label><input id="gotSecurityQuestion" maxlength="180" placeholder="Example: What was the name of my first pet?"><label for="gotSecurityAnswer">Your private answer</label><input id="gotSecurityAnswer" maxlength="160" autocomplete="off" placeholder="Enter an answer only you know"><button id="gotSecuritySave">Save security question</button>'
    );
    overlay.querySelector("#gotSecuritySave").addEventListener("click", async () => {
      if (busy) return;
      const question = overlay.querySelector("#gotSecurityQuestion").value.trim();
      const answer = overlay.querySelector("#gotSecurityAnswer").value;
      if (question.length < 8 || answer.trim().length < 3) { setMessage("Enter a question and an answer with at least 3 characters."); return; }
      setBusy(true);
      try {
        const result = await securityCall("set_question", {question, answer});
        if (result.status !== "question_saved") throw new Error(result.error || "Couldn't save the question.");
        setMessage("Security question saved. Opening your account…");
        window.location.reload();
      } catch (error) {
        setMessage(error.message || "Couldn't save your security question.");
      } finally { setBusy(false); }
    });
  }
  function renderQuestion(question, country, challengeId) {
    show(
      "Unusual sign-in detected",
      "This sign-in appears to be from " + (country || "an unfamiliar location") + ". Answer your security question to continue.",
      '<div class="got-security-email">' + escapeText(question || "Your security question") + '</div><label for="gotSecurityAnswer">Your answer</label><input id="gotSecurityAnswer" autocomplete="off" maxlength="160" placeholder="Enter your answer"><button id="gotSecurityAnswerSubmit">Verify answer</button><button class="got-security-secondary" id="gotSecurityUseEmail">I can’t answer · Use email instead</button>'
    );
    overlay.querySelector("#gotSecurityAnswerSubmit").addEventListener("click", async () => {
      if (busy) return;
      const answer = overlay.querySelector("#gotSecurityAnswer").value;
      setBusy(true);
      try {
        const result = await securityCall("answer_question", {answer});
        if (result.status === "verified") {
          setMessage("Verified. Opening your account…");
          window.location.reload();
        } else if (result.status === "email_required") {
          const email = await sendEmailCode(challengeId, false);
          renderEmailCode(email, false, challengeId);
          setMessage("Code sent. Check your inbox and spam folder.");
        } else if (result.status === "wrong_answer") {
          setMessage("That answer wasn't correct. " + result.remaining + " attempt(s) before email verification.");
        } else if (result.status === "temporarily_blocked") {
          show("Verification temporarily paused", "Too many attempts. Try again after " + new Date(result.retry_at).toLocaleTimeString() + ".", '<button id="gotSecurityReload">Check again</button>');
          overlay.querySelector("#gotSecurityReload").addEventListener("click", () => window.location.reload());
        } else {
          throw new Error(result.error || "The challenge expired. Please log in again.");
        }
      } catch (error) { setMessage(error.message || "Verification failed."); }
      finally { setBusy(false); }
    });
    overlay.querySelector("#gotSecurityUseEmail").addEventListener("click", async () => {
      if (busy) return;
      setBusy(true);
      try {
        const email = await sendEmailCode(challengeId, false);
        renderEmailCode(email, false, challengeId);
        setMessage("Code sent. Check your inbox and spam folder.");
      } catch (error) { setMessage("Email could not be sent: " + (error.message || "Please retry.")); }
      finally { setBusy(false); }
    });
  }
  function escapeText(value) {
    return String(value || "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    })[ch]);
  }
  async function completeEmailFromLink(session, pending) {
    const currentSessionId = sessionIdFromClientSession(session);
    if (!currentSessionId || currentSessionId === pending.originalSessionId) return false;
    suppressAuthEvents = true;
    try {
      const result = await securityCall("complete_email", {challenge_id: pending.challengeId});
      clearPendingEmail();
      if (result.status === "enrollment_verified") {
        renderQuestionSetup();
      } else if (result.status === "verified") {
        window.location.reload();
      } else {
        throw new Error(result.error || "Email verification could not be completed.");
      }
      return true;
    } catch (error) {
      setMessage(error.message || "Email verification could not be completed.");
      return true;
    } finally {
      suppressAuthEvents = false;
    }
  }
  async function inspectSession(session) {
    if (!session?.access_token || busy) return;
    const pendingEmail = readPendingEmail();
    if (pendingEmail && await completeEmailFromLink(session, pendingEmail)) return;
    const id = session.access_token.split(".")[1] || "";
    if (activeSessionId === id) return;
    activeSessionId = id;
    show("Checking your sign-in", "Checking the sign-in location and session…", "");
    try {
      const result = await securityCall("inspect");
      if (result.status === "verified") {
        hide();
        if (result.newlyVerified) window.location.reload();
      } else if (result.status === "enrollment_required") {
        const email = result.email || session.user?.email || "";
        renderEmailCode(email, true, result.challengeId);
        try {
          await sendEmailCode(result.challengeId, true);
          setMessage("A verification code was sent to " + maskedEmail(email) + ".");
        } catch (error) {
          setMessage("Couldn't send the email code: " + (error.message || "Please retry using Send code."));
        }
      } else if (result.status === "question_required") {
        renderQuestion(result.question, result.country, result.challengeId);
      } else if (result.status === "temporarily_blocked") {
        show("Verification temporarily paused", "Too many incorrect attempts. Try again after " + new Date(result.retry_at).toLocaleTimeString() + ".", '<button id="gotSecurityReload">Check again</button>');
        overlay.querySelector("#gotSecurityReload").addEventListener("click", () => window.location.reload());
      } else {
        throw new Error(result.error || "The sign-in could not be verified.");
      }
    } catch (error) {
      show("Security check unavailable", "Your account data is staying locked. Retry the security check before continuing.", '<button id="gotSecurityRetry">Retry security check</button><button class="got-security-secondary" id="gotSecuritySignOut">Sign out</button>');
      setMessage(error.message || "Temporary security service issue.");
      overlay.querySelector("#gotSecurityRetry").addEventListener("click", () => {
        activeSessionId = null;
        inspectSession(session);
      });
      overlay.querySelector("#gotSecuritySignOut").addEventListener("click", async () => {
        await db.auth.signOut();
        hide();
      });
    }
  }

  db.auth.onAuthStateChange((_event, session) => {
    if (suppressAuthEvents) return;
    if (!session) { activeSessionId = null; hide(); return; }
    setTimeout(() => inspectSession(session), 0);
  });
  db.auth.getSession().then(({data, error}) => {
    if (error) return;
    if (data.session) inspectSession(data.session);
  }).catch(() => {});
})();