// Configuração central da API.
// O endereço informado é uma página Swagger, não uma URL de API; por isso
// usamos a origem do servidor. Ajuste os caminhos abaixo conforme o Swagger.
const API_CONFIG = {
  baseUrl: "http://localhost:8080",
  loginPath: "/login",
  registerPath: "/usuarios",
  accountPath: "/usuarios/me",
  companiesPath: "/empresas",
  artistsPath: "/artistas",
  artworksPath: "/obras",
  exhibitionsPath: "/exposicoes",
  // Ajuste o modelo de caminho se a rota publicada no Swagger for diferente.
  insuranceReportPath: "/exposicoes/{id}/relatorio-seguro"
};

/**
 * Faz uma requisição HTTP e retorna o JSON (ou texto) da resposta.
 * @param {string} path Caminho do endpoint, por exemplo "/users/me".
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
      500: "O servidor encontrou um erro. Tente novamente mais tarde."
    };
    const serverMessage = data && typeof data === "object"
      ? data.message || data.error || data.detail
      : null;
    const message = messages[response.status] || serverMessage || `A API respondeu com erro HTTP ${response.status}.`;

    console.error(`Erro HTTP ${response.status} em ${path}.`, data);
    throw new Error(message);
  }

  return data;
}
