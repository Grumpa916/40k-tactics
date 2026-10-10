function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

/**
 * Single-owner sign-in controls. Account creation and tabletop-player accounts
 * intentionally stay out of this UI; provision the owner account in Supabase.
 */
export function createSupabaseAuthPanel(container, { client, onAuthChange = () => {} } = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (typeof client?.auth?.getUser !== "function" ||
      typeof client.auth.signInWithPassword !== "function" ||
      typeof client.auth.signOut !== "function") {
    throw new TypeError("A Supabase client with password sign-in and sign-out is required.");
  }

  let user = null;
  let message = "Checking sign-in status…";
  let busy = false;
  let destroyed = false;
  let email = "";
  let subscription = null;

  function render() {
    if (destroyed) return;
    container.innerHTML = user
      ? `<section class="supabase-auth" aria-label="Cloud account">
          <div><strong>Cloud account connected</strong><span>${escapeHtml(user.email ?? "Owner account")}</span></div>
          <button type="button" data-supabase-sign-out ${busy ? "disabled" : ""}>Sign out</button>
          ${message ? `<p role="status">${escapeHtml(message)}</p>` : ""}
        </section>`
      : `<section class="supabase-auth" aria-labelledby="supabase-auth-title">
          <h2 id="supabase-auth-title">Cloud account</h2>
          <p>Sign in to your single-owner account to save and resume battles.</p>
          <form data-supabase-sign-in>
            <label for="supabase-owner-email">Owner email</label>
            <input id="supabase-owner-email" name="email" type="email" autocomplete="username"
              required value="${escapeHtml(email)}" ${busy ? "disabled" : ""}>
            <label for="supabase-owner-password">Password</label>
            <input id="supabase-owner-password" name="password" type="password" autocomplete="current-password"
              required ${busy ? "disabled" : ""}>
            <button type="submit" ${busy ? "disabled" : ""}>Sign in</button>
          </form>
          ${message ? `<p role="status">${escapeHtml(message)}</p>` : ""}
        </section>`;
  }

  function publishUser(nextUser) {
    if (destroyed) return;
    user = nextUser ?? null;
    onAuthChange(user);
    render();
  }

  async function checkUser() {
    try {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      publishUser(data?.user ?? null);
      message = user ? "Signed in. Cloud saves are available." : "Sign in to enable cloud saves.";
    } catch (error) {
      publishUser(null);
      message = error?.message ?? String(error);
    }
    render();
  }

  async function handleSubmit(event) {
    const form = event.target?.closest?.("[data-supabase-sign-in]");
    if (!form || !container.contains(form)) return;
    event.preventDefault();
    const emailInput = form.querySelector?.('[name="email"]');
    const passwordInput = form.querySelector?.('[name="password"]');
    email = String(emailInput?.value ?? "").trim();
    const password = String(passwordInput?.value ?? "");
    if (!email || !password) {
      message = "Enter the owner email and password.";
      render();
      return;
    }
    busy = true;
    message = "Signing in…";
    render();
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      publishUser(data?.user ?? null);
      message = user ? "Signed in. Cloud saves are available." : "Sign-in returned no owner account.";
    } catch (error) {
      message = error?.message ?? String(error);
      publishUser(null);
    } finally {
      busy = false;
      render();
    }
  }

  async function handleClick(event) {
    const button = event.target?.closest?.("[data-supabase-sign-out]");
    if (!button || !container.contains(button) || busy) return;
    busy = true;
    message = "Signing out…";
    render();
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      publishUser(null);
      message = "Signed out. Cloud saves are unavailable until you sign in again.";
    } catch (error) {
      message = error?.message ?? String(error);
    } finally {
      busy = false;
      render();
    }
  }

  container.addEventListener?.("submit", handleSubmit);
  container.addEventListener?.("click", handleClick);
  const authSubscription = client.auth.onAuthStateChange?.((_event, session) => {
    if (destroyed) return;
    publishUser(session?.user ?? null);
  });
  subscription = authSubscription?.data?.subscription ?? authSubscription?.subscription ?? null;
  render();
  void checkUser();

  return {
    getUser: () => user,
    destroy() {
      destroyed = true;
      subscription?.unsubscribe?.();
      container.removeEventListener?.("submit", handleSubmit);
      container.removeEventListener?.("click", handleClick);
      container.replaceChildren();
    }
  };
}
