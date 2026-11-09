// A tela de login não precisa ser mostrada novamente se já existe um token.
if (localStorage.getItem("authToken")) {
  window.location.href = "dashboard.html";
}

const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-button");
const loginMessage = document.querySelector("#login-message");
const loginView = document.querySelector("#login-view");
const registerView = document.querySelector("#register-view");
const registerForm = document.querySelector("#register-form");
const registerMessage = document.querySelector("#register-message");
const showRegisterButton = document.querySelector("#show-register");
const showLoginButton = document.querySelector("#show-login");
const registerCpf = document.querySelector("#register-cpf");
const registerPassword = document.querySelector("#register-password");
const registerButton = document.querySelector("#register-button");

const registrationNotice = sessionStorage.getItem("registrationNotice");
if (registrationNotice) {
  loginMessage.textContent = registrationNotice;
  loginMessage.classList.add("message-success");
  loginMessage.hidden = false;
  sessionStorage.removeItem("registrationNotice");
}

function showAuthView(viewToShow, fieldToFocus) {
  const isRegisterView = viewToShow === registerView;
  loginView.hidden = isRegisterView;
  registerView.hidden = !isRegisterView;
  fieldToFocus.focus();
}

showRegisterButton.addEventListener("click", () => {
  showAuthView(registerView, document.querySelector("#register-name"));
});

showLoginButton.addEventListener("click", () => {
  showAuthView(loginView, document.querySelector("#username"));
});

// Mantém a máscara na interface; o CPF enviado à API contém apenas 11 dígitos.
registerCpf.addEventListener("input", () => {
  const digits = registerCpf.value.replace(/\D/g, "").slice(0, 11);
  registerCpf.value = digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  registerMessage.hidden = true;
  registerMessage.textContent = "";
  registerMessage.classList.remove("message-error", "message-success");
  registerMessage.setAttribute("role", "status");

  if (!registerForm.reportValidity()) {
    return;
  }

  const formData = new FormData(registerForm);
  const cpf = String(formData.get("cpf") || "").replace(/\D/g, "");
  const empresaId = Number(formData.get("empresa_id"));

  if (cpf.length !== 11) {
    registerMessage.textContent = "Informe um CPF com exatamente 11 números.";
    registerMessage.classList.add("message-error");
    registerMessage.setAttribute("role", "alert");
    registerMessage.hidden = false;
    registerCpf.focus();
    return;
  }

  if (!Number.isInteger(empresaId) || empresaId < 0) {
    registerMessage.textContent = "Informe um ID de empresa válido, usando um número inteiro não negativo.";
    registerMessage.classList.add("message-error");
    registerMessage.setAttribute("role", "alert");
    registerMessage.hidden = false;
    document.querySelector("#register-company-id").focus();
    return;
  }

  // Os nomes e tipos destas propriedades correspondem ao contrato do cadastro.
  // dataNascimento permanece no formato ISO AAAA-MM-DD do input date.
  const user = {
    nome: String(formData.get("nome")).trim(),
    cpf,
    dataNascimento: String(formData.get("dataNascimento")),
    senha: registerPassword.value,
    empresa_id: empresaId
  };

  registerButton.disabled = true;
  registerButton.textContent = "Cadastrando…";

  try {
    await apiRequest(API_CONFIG.registerPath, {
      method: "POST",
      auth: false,
      body: user
    });

    sessionStorage.setItem("registrationNotice", "Cadastro realizado com sucesso! Agora você pode entrar.");
    window.location.href = "index.html";
  } catch (error) {
    registerMessage.textContent = error.message;
    registerMessage.classList.add("message-error");
    registerMessage.setAttribute("role", "alert");
    registerMessage.hidden = false;
  } finally {
    registerButton.disabled = false;
    registerButton.textContent = "Cadastre-se";
  }
});

loginForm.addEventListener("submit", async (event) => {
  // Evita o envio tradicional do formulário, que recarregaria a página.
  event.preventDefault();
  loginMessage.hidden = true;
  loginMessage.textContent = "";
  loginMessage.classList.remove("message-error");

  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password.trim()) {
    loginMessage.textContent = "Preencha o CPF e a senha para continuar.";
    loginMessage.classList.add("message-error");
    loginMessage.hidden = false;
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Entrando…";

  try {
    // Adapte os nomes dos campos ao contrato real do endpoint no Swagger.
    const response = await apiRequest(API_CONFIG.loginPath, {
  method: "POST",
  auth: false,
  body: {
    login: username,
    senha: password
  }
});

console.log("RESPOSTA LOGIN:", response);
console.log("TOKEN:", response.token);
console.log("OBJETO JSON:", JSON.stringify(response, null, 2));


    // APIs costumam nomear o JWT como token, accessToken ou access_token.
    const token = response && typeof response === "object"
      ? response.token || response.accessToken || response.access_token
      : null;

    if (typeof token !== "string" || !token) {
      throw new Error("A resposta de login não contém um token. Confira o formato retornado pela API.");
    }

    localStorage.setItem("authToken", token);
    window.location.href = "dashboard.html";
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.classList.add("message-error");
    loginMessage.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Entrar";
  }
});
