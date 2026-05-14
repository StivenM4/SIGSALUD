const moduleButtons = document.querySelectorAll(".module-card");
const systemInput = document.getElementById("systemInput");
const form = document.getElementById("loginForm");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

moduleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    moduleButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    systemInput.value = button.dataset.system;
  });
});

form.addEventListener("submit", (event) => {
  if (!systemInput.value) {
    event.preventDefault();
    alert("Seleccione primero HIS, LIS o RIS.");
  }
});

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.innerHTML = isPassword
    ? '<i class="bi bi-eye-slash"></i>'
    : '<i class="bi bi-eye"></i>';
});
