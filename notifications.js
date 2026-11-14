/* G.O.T notification badge and live alert toast. Loaded after each page's existing Supabase client. */
(() => {
  const client = window.GOT_SUPABASE;
  const nav = document.querySelector(".main-nav, .site-nav");
  if (!nav) return;

  let link = nav.querySelector("[data-got-alert-link]");
  if (!link) {
    link = document.createElement("a");
    link.href = "notifications.html";
    link.dataset.gotAlertLink = "true";
    link.append(document.createTextNode("Alerts "));
    const badge = document.createElement("span");
    badge.className = "got-alert-count";
    badge.hidden = true;
    badge.setAttribute("aria-hidden", "true");
    link.append(badge);
    const accountArea = nav.querySelector(".account-area");
    nav.insertBefore(link, accountArea || null);
  }
  const badge = link.querySelector(".got-alert-count");
  if (!badge) return;

  if (!document.getElementById("got-alert-ui-style")) {
    const style = document.createElement("style");
    style.id = "got-alert-ui-style";
    style.textContent = `
      [data-got-alert-link]{position:relative;gap:7px}
      .got-alert-count{display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#efbd32;color:#211a0b;font:900 10px/1 system-ui,sans-serif;letter-spacing:0}
      .got-alert-count[hidden]{display:none}
      .got-alert-toast{position:fixed;right:18px;bottom:18px;z-index:9999;width:min(360px,calc(100vw - 36px));padding:14px 16px;border:1px solid rgba(239,189,50,.5);border-radius:12px;background:#151c24;color:#f5f1e7;box-shadow:0 16px 40px rgba(0,0,0,.38);font:600 14px/1.45 system-ui,sans-serif}
      .got-alert-toast a{display:inline-block;margin-top:7px;color:#f2c75a;font-weight:800;text-decoration:none}
      .got-alert-toast button{float:right;border:0;background:transparent;color:#c9c3b6;font-size:19px;cursor:pointer}
      @media(prefers-reduced-motion:no-preference){.got-alert-toast{animation:gotToastIn .2s ease-out}}
      @keyframes gotToastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    `;
    document.head.append(style);
  }

  if (!client) {
    link.title = "Open the G.O.T notification center";
    return;
  }

  let activeUserId = null;
  let channel = null;
  let toastTimer = null;

  function showCount(count) {
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count < 1;
    link.setAttribute("aria-label", count ? "Alerts, " + count + " unread" : "Alerts");
    link.title = count ? count + " unread notification(s)" : "Notification center";
  }

  async function refreshCount(userId) {
    if (!userId) {
      showCount(0);
      return;
    }
    const [allResult, readResult] = await Promise.all([
      client.from("got_notifications").select("id", {count:"exact", head:true}),
      client.from("got_notification_reads").select("notification_id", {count:"exact", head:true}).eq("user_id", userId)
    ]);
    if (allResult.error || readResult.error) {
      console.warn("G.O.T alert count unavailable:", allResult.error || readResult.error);
      return;
    }
    showCount(Math.max(0, (allResult.count || 0) - (readResult.count || 0)));
  }

  function showToast(notification) {
    if (location.pathname.endsWith("/notifications.html") || !notification) return;
    document.querySelector(".got-alert-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "got-alert-toast";
    toast.setAttribute("role", "status");
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";
    close.addEventListener("click", () => toast.remove());
    const heading = document.createElement("strong");
    heading.textContent = notification.title || "New G.O.T alert";
    const body = document.createElement("div");
    body.textContent = notification.message || "There's something new in G.O.T Games.";
    const open = document.createElement("a");
    open.href = "notifications.html";
    open.textContent = "Open notification center →";
    toast.append(close, heading, body, open);
    document.body.append(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 8500);
  }

  async function connectUser(user) {
    const nextUserId = user?.id || null;
    if (nextUserId === activeUserId && channel) {
      await refreshCount(nextUserId);
      return;
    }
    if (channel) {
      await client.removeChannel(channel);
      channel = null;
    }
    activeUserId = nextUserId;
    await refreshCount(activeUserId);
    if (!activeUserId) return;
    channel = client
      .channel("got-alerts-" + activeUserId)
      .on("postgres_changes", {event:"INSERT", schema:"public", table:"got_notifications"}, payload => {
        refreshCount(activeUserId);
        showToast(payload.new);
      })
      .subscribe();
  }

  client.auth.getSession()
    .then(({data, error}) => {
      if (error) throw error;
      return connectUser(data.session?.user || null);
    })
    .catch(error => console.warn("G.O.T alerts could not initialize:", error.message || error));

  client.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => connectUser(session?.user || null), 0);
  });
})();
