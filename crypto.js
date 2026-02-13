async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function deriveKey(password) {
  const enc = new TextEncoder().encode(password);
  return crypto.subtle.importKey(
    "raw",
    enc,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
}

async function unlock() {
  const answer = document.getElementById("answer").value;
  const error = document.getElementById("error");

  const res = await fetch("secret.json");
  const secret = await res.json();

  const hash = await sha256(answer);

  if (hash !== secret.hash) {
    error.textContent = "OMFG. You were Wrong 💔. Who are you?!?!";
    return;
  }

  const keyMaterial = await deriveKey(answer);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("love"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Uint8Array.from(atob(secret.iv), c => c.charCodeAt(0))
    },
    key,
    Uint8Array.from(atob(secret.ciphertext), c => c.charCodeAt(0))
  );

  document.getElementById("message").textContent =
    new TextDecoder().decode(decrypted);

  document.getElementById("content").classList.remove("hidden");
}
