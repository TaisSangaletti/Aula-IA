// Configuração central da API.
const API_CONFIG = {
  baseUrl: "http://localhost:8080",
  loginPath: "/login",
  registerPath: "/usuarios",
  accountPath: "/usuarios/me",
  companiesPath: "/empresas",
  artistsPath: "/artistas",
  artworksPath: "/obras",
  exhibitionsPath: "/exposicoes"
};

/**
 * Faz uma requisição HTTP e retorna o JSON (ou texto) da resposta.
 * @param {string} path Caminho do endpoint, por exemplo "/usuarios/me".
 * @param {{ method?: string, body?: unknown, headers?: Record<string, string>, auth?: boolean }} options
 * @returns {Promise<unknown>}
 */
async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    auth = true
  } = options;

  // Só inclua o token em chamadas autenticadas e quando ele existir.
  const token = auth ? localStorage.getItem("authToken") : null;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    // Falhas de rede/CORS acontecem antes de existir uma resposta HTTP.
    console.error("Não foi possível conectar à API.", error);
    throw new Error("Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.");
  }

  // Alguns endpoints respondem com 204 ou sem corpo.
  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const messages = {
      401: "Sessão inválida ou credenciais incorretas. Verifique os dados e tente novamente.",
      404: "O endpoint solicitado não foi encontrado. Confira o caminho configurado no Swagger.",
      400: "Os dados enviados são inválidos. Revise os campos e tente novamente.",
      409: "Há um conflito entre os dados enviados. Revise as informações e tente novamente.",
      500: "O servidor encontrou um erro. Tente novamente mais tarde."
    };
    const serverMessage = getApiErrorMessage(data);
    const message = serverMessage || messages[response.status]
      || `A API respondeu com erro HTTP ${response.status}.`;

    console.error(`Erro HTTP ${response.status} em ${path}.`, data);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

function getApiErrorMessage(data, visited = new WeakSet()) {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }
  if (!data || typeof data !== "object") {
    return "";
  }
  if (visited.has(data)) {
    return "";
  }
  visited.add(data);
  if (Array.isArray(data)) {
    return [...new Set(data.map((item) => getApiErrorMessage(item, visited)).filter(Boolean))].join(" ");
  }

  const messages = [];
  for (const key of ["message", "mensagem", "detail", "details", "error", "erro", "title"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      messages.push(value.trim());
    }
    if (Array.isArray(value) || (value && typeof value === "object")) {
      messages.push(getApiErrorMessage(value, visited));
    }
  }

  for (const key of ["errors", "erros", "data"]) {
    const value = data[key];
    if (value && typeof value === "object") {
      messages.push(getApiErrorMessage(value, visited));
      if (!Array.isArray(value)) {
        const fieldMessages = Object.entries(value).flatMap(([field, fieldErrors]) => {
          const details = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
          return details
            .filter((item) => typeof item === "string" && item.trim())
            .map((item) => `${field}: ${item.trim()}`);
        });
        messages.push(...fieldMessages);
      }
    }
  }
  return [...new Set(messages.filter(Boolean))].join(" ");
}
