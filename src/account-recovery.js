import { installV2SupabasePublicConfig } from "./persistence/supabase-runtime-config.js";
import { createSupabaseClientFromPublicConfig } from "./persistence/supabase-client.js";

const root = document.querySelector("[data-account-root]");
const params = new URLSearchParams(window.location.search);
const recoveryError = params.get("error_description") || params.get("error");
let client;
let recoveryMode = false;
let busy = false;

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function render({ message = "", success = false } = {}) {
  if (!root) return;
  root.innerHTML = recoveryMode
    ? `<h1>Set a new password</h1>
       <p>Choose a new password for your 40K Tactics cloud account.</p>
       <form data-update-password>
         <label for="new-password">New password</label>
         <input id="new-password" name="password" type="password" autocomplete="new-password" minlength="8" required ${busy ? "disabled" : ""}>
         <label for="confirm-password">Confirm new password</label>
         <input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required ${busy ? "disabled" : ""}>
         <button type="submit" ${busy ? "disabled" : ""}>Save new password</button>
       </form>
       <p role="status" class="${success ? "success" : ""}">${escapeHtml(message)}</p>
       <a href="./">Return to 40K Tactics</a>`
    : `<h1>Recover your account</h1>
       <p>Enter the email address for your 40K Tactics cloud account. We’ll send a secure password-reset link.</p>
       <form data-request-reset>
         <label for="account-email">Account email</label>
         <input id="account-email" name="email" type="email" autocomplete="username" required ${busy ? "disabled" : ""}>
         <button type="submit" ${busy ? "disabled" : ""}>Send password-reset email</button>
       </form>
       <p role="status" class="${success ? "success" : ""}">${escapeHtml(message)}</p>
       <a href="./">Return to 40K Tactics</a>`;
}

function showRecovery() {
  recoveryMode = true;
  render({ message: "Recovery link accepted. Enter your new password." });
}

root?.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (form.matches("[data-request-reset]")) {
    const email = String(new FormData(form).get("email") ?? "").trim();
    busy = true;
    render({ message: "Sending reset email…" });
    try {
      const redirectTo = new URL("./account.html", window.location.href).href;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      render({ success: true, message: "If an account exists for that email, a password-reset link has been sent. Check your inbox and spam folder." });
    } catch (error) {
      render({ message: error?.message || "Could not send the reset email. Check the configuration and try again." });
    } finally {
      busy = false;
    }
    return;
  }
  if (form.matches("[data-update-password]")) {
    const values = new FormData(form);
    const password = String(values.get("password") ?? "");
    const confirmPassword = String(values.get("confirmPassword") ?? "");
    if (password.length < 8) {
      render({ message: "Use a password with at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      render({ message: "The passwords do not match." });
      return;
    }
    busy = true;
    render({ message: "Saving your new password…" });
    try {
      const { data, error } = await client.auth.updateUser({ password });
      if (error) throw error;
      recoveryMode = false;
      await client.auth.signOut();
      render({ success: true, message: "Password updated. Return to the app and sign in with your new password." });
    } catch (error) {
      render({ message: error?.message || "Could not update the password. The recovery link may have expired; request a new one." });
    } finally {
      busy = false;
    }
  }
});

async function start() {
  if (!root) return;
  if (recoveryError) {
    render({ message: `The recovery link could not be accepted: ${recoveryError}. Request a new link below.` });
  } else {
    render({ message: "Connecting to account service…" });
  }
  try {
    installV2SupabasePublicConfig();
    client = await createSupabaseClientFromPublicConfig();
    client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") showRecovery();
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data?.session && (window.location.hash.includes("type=recovery") || recoveryMode)) showRecovery();
    else if (!recoveryError) render();
  } catch (error) {
    render({ message: error?.message || "Account service could not be reached. Please try again later." });
  }
}

void start();
