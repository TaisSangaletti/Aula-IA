const dashboardMessage = document.querySelector("#dashboard-message");
const accountCards = document.querySelector("#account-cards");
const dashboardGreeting = document.querySelector("#dashboard-greeting");
const overviewMessage = document.querySelector("#overview-message");
const overviewArtworkCount = document.querySelector("#overview-artwork-count");
const overviewActiveExhibitionCount = document.querySelector("#overview-active-exhibition-count");
const overviewInsuranceTotal = document.querySelector("#overview-insurance-total");
const logoutButton = document.querySelector("#logout-button");
const sectionLinks = document.querySelectorAll("[data-section-link]");
const dashboardSections = document.querySelectorAll(".dashboard-section");
const artistsTableBody = document.querySelector("#artists-table-body");
const artistsListMessage = document.querySelector("#artists-list-message");
const artistForm = document.querySelector("#artist-form");
const artistFormHeading = document.querySelector("#artist-form-heading");
const artistIdReference = document.querySelector("#artist-id-reference");
const artistFormMessage = document.querySelector("#artist-form-message");
const artistCpfInput = document.querySelector("#artist-cpf");
const artistSubmitButton = document.querySelector("#artist-submit-button");
const artistCancelButton = document.querySelector("#artist-cancel-button");
const insuranceReportForm = document.querySelector("#insurance-report-form");
const insuranceReportButton = document.querySelector("#insurance-report-button");
const insuranceReportMessage = document.querySelector("#insurance-report-message");
const insuranceTotalResult = document.querySelector("#insurance-total-result");
const insuranceArtworkCount = document.querySelector("#insurance-artwork-count");
const insuranceTotalValue = document.querySelector("#insurance-total-value");
const insuranceTableBody = document.querySelector("#insurance-table-body");
const companySidebar = document.querySelector("#company-sidebar");
const companySidebarToggle = document.querySelector("#toggle-sidebar-btn");
const companySelector = document.querySelector("#company-selector");
const currentCompany = document.querySelector("#current-company");
const changeCompanyButton = document.querySelector("#change-company-btn");
const companyMessage = document.querySelector("#company-message");

let artists = [];
let editingArtistId = null;
let selectedCompanyId = localStorage.getItem("selectedCompanyId");
const artworkCatalog = setupEntityCrud({
  name: "obra",
  path: API_CONFIG.artworksPath,
  formId: "artwork-form",
  headingId: "artwork-form-heading",
  idReferenceId: "artwork-id-reference",
  formMessageId: "artwork-form-message",
  submitButtonId: "artwork-submit-button",
  cancelButtonId: "artwork-cancel-button",
  tableBodyId: "artworks-table-body",
  listMessageId: "artworks-list-message",
  emptyMessage: "Nenhuma obra cadastrada.",
  createLabel: "Cadastrar obra",
  includeIdInUpdate: false,
  fields: [
    { key: "titulo", label: "Título", type: "text" },
    { key: "tecnica", label: "Técnica", type: "text" },
    { key: "anoCriacao", label: "Ano de criação", type: "text" },
    { key: "valorSeguro", label: "Valor do seguro", type: "number", format: formatCurrency }
  ]
});
const exhibitionCatalog = setupEntityCrud({

// Proteção simples de rota no frontend: sem token, volte ao login.
if (!localStorage.getItem("authToken")) {
  window.location.href = "index.html";
} else {
  loadAccount();
}

const companiesReady = localStorage.getItem("authToken")
  ? loadCompanies()
  : Promise.resolve();
restoreSidebarState();

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("authToken");
  window.location.href = "index.html";
});

function showSection(sectionName) {
  const activeSection = document.getElementById(`section-${sectionName}`);
  if (!activeSection || !activeSection.classList.contains("dashboard-section")) {
    return;
  }

  dashboardSections.forEach((section) => {
    section.hidden = section !== activeSection;
  });

  sectionLinks.forEach((link) => {
    const isActive = link.dataset.sectionLink === sectionName && link.classList.contains("nav-link");
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (sectionName === "artistas") {
    loadArtists();
  } else if (sectionName === "obras") {
    artworkCatalog.load();
  else if (sectionName === "exposicoes") {
    exhibitionCatalog.load();
    carregarObrasParaExposicao();
} else if (sectionName === "seguros") {
    loadInsuranceReport();
  } else if (sectionName === "inicio") {
    loadOverview();
  }
}

async function loadCompanies() {
  companySelector.disabled = true;
  changeCompanyButton.disabled = true;
  companySelector.replaceChildren(new Option("Carregando empresas…", ""));
  showCompanyMessage("Carregando empresas…");

  try {
    const response = await apiRequest(API_CONFIG.companiesPath);
    const companies = extractCompanyList(response)
      .map((company) => ({
        id: company.id ?? company.empresaId ?? company.empresa_id,
        name: company.nome || company.name || company.razaoSocial || company.nomeFantasia
      }))
      .filter((company) => company.id !== null && company.id !== undefined);

    companySelector.replaceChildren(new Option("Selecione uma empresa", ""));
    companies.forEach(({ id, name }) => {
      companySelector.add(new Option(name || `Empresa ${id}`, String(id)));
    });

    if (companies.length === 0) {
      selectedCompanyId = null;
      localStorage.removeItem("selectedCompanyId");
      localStorage.removeItem("selectedCompanyName");
      atualizarEmpresaAtualNaTela(null);
      showCompanyMessage("Nenhuma empresa disponível para esta conta.", true);
      return;
    }

    const restoredCompany = restaurarEmpresaAtual(companies);
    companySelector.value = String(restoredCompany.id);
    companySelector.disabled = companies.length < 2;
    updateChangeCompanyButton();
    showCompanyMessage("");
  } catch (error) {
    companySelector.replaceChildren(new Option("Não foi possível carregar", ""));
    currentCompany.textContent = localStorage.getItem("selectedCompanyName")
      || "Nenhuma empresa selecionada";
    showCompanyMessage(error.message, true);
  }
}

function extractCompanyList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === "object") {
    for (const key of ["content", "data", "empresas", "companies"]) {
      if (response[key] !== undefined && response[key] !== null) {
        return extractCompanyList(response[key]);
      }
    }
  }

  throw new Error("A API não retornou uma lista de empresas em formato reconhecido.");
}

function restaurarEmpresaAtual(companies) {
  const company = companies.find(({ id }) => String(id) === selectedCompanyId) || companies[0];
  salvarEmpresaAtual(company);
  return company;
}

function salvarEmpresaAtual(company) {
  selectedCompanyId = String(company.id);
  localStorage.setItem("selectedCompanyId", selectedCompanyId);
  localStorage.setItem("selectedCompanyName", company.name || `Empresa ${company.id}`);
  atualizarEmpresaAtualNaTela(company);
}

function atualizarEmpresaAtualNaTela(company) {
  currentCompany.textContent = company
    ? company.name || `Empresa ${company.id}`
    : "Nenhuma empresa selecionada";
}

async function selecionarEmpresa() {
  const company = Array.from(companySelector.options)
    .filter((option) => option.value)
    .map((option) => ({ id: option.value, name: option.textContent }))
    .find(({ id }) => id === companySelector.value);

  if (!company) {
    showCompanyMessage("Selecione uma empresa válida para continuar.", true);
    return;
  }

  if (String(company.id) === selectedCompanyId) {
    updateChangeCompanyButton();
    return;
  }

  salvarEmpresaAtual(company);
  updateChangeCompanyButton();
  showCompanyMessage("Carregando os dados da empresa…");
  const results = await Promise.all([
    loadArtists(),
    artworkCatalog.load(),
    exhibitionCatalog.load(),
    loadOverview(),
    loadInsuranceReport()
  ]);
  const allLoaded = results.every((result) => result === true);
  showCompanyMessage(
    allLoaded
      ? `Dados de ${company.name} carregados.`
      : "Empresa selecionada, mas alguns dados não puderam ser carregados. Confira as mensagens dos módulos.",
    !allLoaded
  );
}

function updateChangeCompanyButton() {
  changeCompanyButton.disabled = !companySelector.value
    || companySelector.value === selectedCompanyId;
}

function showCompanyMessage(message, isError = false) {
  companyMessage.textContent = message;
  companyMessage.classList.toggle("message-error", isError);
  companyMessage.hidden = !message;
}

function companyScopedPath(path) {
  if (!selectedCompanyId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}empresa_id=${encodeURIComponent(selectedCompanyId)}`;
}

function toggleSidebar() {
  const collapsed = !companySidebar.classList.contains("collapsed");
  setSidebarCollapsed(collapsed);
  localStorage.setItem("sidebarCollapsed", String(collapsed));
}

function restoreSidebarState() {
  setSidebarCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
}

function setSidebarCollapsed(collapsed) {
  companySidebar.classList.toggle("collapsed", collapsed);
  document.body.classList.toggle("company-sidebar-collapsed", collapsed);
  companySidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  companySidebarToggle.setAttribute(
    "aria-label",
    collapsed ? "Expandir menu de empresas" : "Recolher menu de empresas"
  );
  companySidebarToggle.title = collapsed
    ? "Expandir menu de empresas"
    : "Recolher menu de empresas";
  companySidebarToggle.querySelector("path").setAttribute(
    "d",
    collapsed ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"
  );
}

companySelector.addEventListener("change", updateChangeCompanyButton);
changeCompanyButton.addEventListener("click", selecionarEmpresa);
companySidebarToggle.addEventListener("click", toggleSidebar);

sectionLinks.forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    await companiesReady;
    const sectionName = link.dataset.sectionLink;
    showSection(sectionName);
    window.history.replaceState(null, "", `#${sectionName}`);
  });
});

companiesReady.then(() => showSection(window.location.hash.slice(1) || "inicio"));

insuranceReportForm.addEventListener("submit", loadInsuranceReport);

function showInsuranceMessage(message, isError = false) {
  insuranceReportMessage.textContent = message;
  insuranceReportMessage.classList.toggle("message-error", isError);
  insuranceReportMessage.setAttribute("role", isError ? "alert" : "status");
  insuranceReportMessage.hidden = !message;
}

async function loadInsuranceReport(event) {
  if (event) {
    event.preventDefault();
  }

  insuranceReportButton.disabled = true;
  insuranceReportButton.textContent = "Atualizando…";
  insuranceTotalResult.hidden = true;
  insuranceArtworkCount.textContent = "";
  insuranceTotalValue.textContent = "";
  insuranceTableBody.replaceChildren();
  showInsuranceMessage("Carregando valores de seguro…");

  try {
    const response = await apiRequest(companyScopedPath(API_CONFIG.artworksPath));
    const artworks = extractCatalogList(response);
    const reportItems = artworks.map((artwork) => {
      if (!artwork || typeof artwork !== "object" || Array.isArray(artwork)) {
        throw new Error("A API retornou uma obra em formato inválido.");
      }

      const rawInsuranceValue = artwork.valorSeguro;
      const insuranceValue = Number(rawInsuranceValue);
      if (rawInsuranceValue === null || rawInsuranceValue === undefined
        || rawInsuranceValue === "" || !Number.isFinite(insuranceValue)
        || insuranceValue < 0) {
        const artworkName = artwork.titulo || artwork.id || "sem identificação";
        throw new Error(`O valor do seguro da obra "${artworkName}" é inválido.`);
      }

      return { artwork, insuranceValue };
    });

    renderInsuranceReport(reportItems);
    insuranceTotalResult.hidden = false;
    showInsuranceMessage(reportItems.length === 0
      ? "Nenhuma obra cadastrada para esta empresa."
      : `${reportItems.length} obra${reportItems.length === 1 ? "" : "s"} incluída${reportItems.length === 1 ? "" : "s"} no relatório.`);
    return true;
  } catch (error) {
    showInsuranceMessage(error.message, true);
    return false;
  } finally {
    insuranceReportButton.disabled = false;
    insuranceReportButton.textContent = "Atualizar relatório";
  }
}

function renderInsuranceReport(reportItems) {
  const fragment = document.createDocumentFragment();
  let total = 0;

  reportItems.forEach(({ artwork, insuranceValue }) => {
    total += insuranceValue;
    const row = document.createElement("tr");
    const values = [
      artwork.id ?? "—",
      artwork.titulo || "—",
      artwork.tecnica || "—",
      artwork.anoCriacao ?? "—",
      formatCurrency(insuranceValue)
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.append(cell);
    });
    fragment.append(row);
  });

  if (reportItems.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.className = "table-empty-cell";
    cell.colSpan = 5;
    cell.textContent = "Nenhuma obra cadastrada.";
    row.append(cell);
    fragment.append(row);
  }

  insuranceTableBody.replaceChildren(fragment);
  insuranceArtworkCount.textContent = String(reportItems.length);
  insuranceTotalValue.textContent = formatCurrency(total);
}

artistCpfInput.addEventListener("input", () => {
  const digits = artistCpfInput.value.replace(/\D/g, "").slice(0, 11);
  artistCpfInput.value = formatCpf(digits);
});

artistForm.addEventListener("submit", saveArtist);
artistCancelButton.addEventListener("click", resetArtistForm);

artistsTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const artist = artists.find((item) => String(item.id) === button.dataset.id);
  if (!artist) {
    showArtistsMessage("Não foi possível localizar esse artista. Atualize a listagem e tente novamente.", true);
    return;
  }

  if (button.dataset.action === "edit") {
    editArtist(artist);
    return;
  }

  if (button.dataset.action === "delete") {
    await deleteArtist(artist);
    return;
  }

  if (button.dataset.action === "toggle-status") {
    await toggleArtistStatus(artist, button);
  }
});

function formatCpf(value) {
  return value
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function showArtistsMessage(message, isError = false) {
  artistsListMessage.textContent = message;
  artistsListMessage.classList.toggle("message-error", isError);
  artistsListMessage.hidden = !message;
}

function showArtistFormMessage(message, isError = false) {
  artistFormMessage.textContent = message;
  artistFormMessage.classList.toggle("message-error", isError);
  artistFormMessage.setAttribute("role", isError ? "alert" : "status");
  artistFormMessage.hidden = !message;
}

function extractArtistList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === "object") {
    const wrappedList = response.content || response.data || response.artistas || response.artists;
    if (wrappedList !== undefined) {
      return extractArtistList(wrappedList);
    }
  }

  throw new Error("A API não retornou uma lista de artistas em formato reconhecido.");
}

async function loadArtists() {
  showArtistsMessage("Carregando artistas…");
  try {
    const response = await apiRequest(companyScopedPath(API_CONFIG.artistsPath));
    artists = extractArtistList(response);
    renderArtists();
    return true;
  } catch (error) {
    artists = [];
    renderArtists();
    showArtistsMessage(error.message, true);
    return false;
  }
}

function renderArtists() {
  artistsTableBody.replaceChildren();

  if (artists.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "table-empty-cell";
    cell.textContent = "Nenhum artista cadastrado.";
    row.append(cell);
    artistsTableBody.append(row);
    showArtistsMessage("");
    return;
  }

  const fragment = document.createDocumentFragment();
  artists.forEach((artist) => {
    const row = document.createElement("tr");
    appendTextCell(row, artist.id);
    appendTextCell(row, artist.nome);
    appendTextCell(row, artist.cpf);
    appendTextCell(row, artist.nacionalidade);
    const isActive = isArtistActive(artist);
    const statusCell = document.createElement("td");
    const statusIndicator = document.createElement("span");
    statusIndicator.className = `status ${isActive ? "status-active" : "status-inactive"}`;
    statusIndicator.textContent = isActive ? "● Ativo" : "● Inativo";
    statusCell.append(statusIndicator);
    row.append(statusCell);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    if (artist.id !== null && artist.id !== undefined) {
      actions.append(
        createArtistActionButton(
          "toggle-status",
          artist,
          isActive ? "Inativar" : "Ativar",
          `status-toggle ${isActive ? "active" : "inactive"}`
        ),
        createArtistActionButton("edit", artist, "Editar", "button-secondary"),
        createArtistActionButton("delete", artist, "Excluir", "button-danger")
      );
    }
    actionsCell.append(actions);
    row.append(actionsCell);
    fragment.append(row);
  });

  artistsTableBody.append(fragment);
  showArtistsMessage("");
}

function appendTextCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value === null || value === undefined ? "—" : String(value);
  row.append(cell);
}

function createArtistActionButton(action, artist, label, style) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = String(artist.id);
  button.className = `button button-small ${style}`;
  button.textContent = label;
  button.setAttribute("aria-label", `${label} ${artist.nome || "artista"}`);
  if (action === "toggle-status") {
    button.title = `${label} ${artist.nome || "artista"}`;
  }
  return button;
}

function isArtistActive(artist) {
  return String(artist.status || "").trim().toUpperCase() === "ATIVO";
}

async function toggleArtistStatus(artist, button) {
  const wasActive = isArtistActive(artist);
  const action = wasActive ? "inativar" : "ativar";
  button.disabled = true;
  showArtistsMessage(`Atualizando status de ${artist.nome || "artista"}…`);

  try {
    const path = `${API_CONFIG.artistsPath}/${encodeURIComponent(String(artist.id))}/${action}`;
    await apiRequest(companyScopedPath(path), { method: "PATCH" });
    const refreshed = await loadArtists();
    if (refreshed) {
      showArtistsMessage(
        `Artista ${artist.nome || ""} ${wasActive ? "inativado" : "ativado"} com sucesso.`
      );
    } else {
      showArtistsMessage(
        "O status foi atualizado, mas não foi possível recarregar a lista de artistas.",
        true
      );
    }
  } catch (error) {
    showArtistsMessage(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function editArtist(artist) {
  editingArtistId = artist.id;

  artistForm.elements.namedItem("nome").value =
    artist.nome || "";

  const cpfDigits = String(
    artist.cpf || ""
  ).replace(/\D/g, "");

  artistCpfInput.value =
    cpfDigits.length === 11
      ? formatCpf(cpfDigits)
      : String(artist.cpf || "");

  artistForm.elements.namedItem("nacionalidade").value =
    artist.nacionalidade || "";

  artistFormHeading.textContent = "Editar artista";

  artistIdReference.textContent =
    `ID do artista: ${artist.id}`;

  artistIdReference.hidden = false;

  artistSubmitButton.textContent =
    "Salvar alterações";

  artistCancelButton.hidden = false;

  showArtistFormMessage("");

  artistForm.elements
    .namedItem("nome")
    .focus();
}



function resetArtistForm() {
  editingArtistId = null;

  artistForm.reset();

  artistFormHeading.textContent =
    "Novo artista";

  artistIdReference.textContent = "";

  artistIdReference.hidden = true;

  artistSubmitButton.textContent =
    "Cadastrar artista";

  artistCancelButton.hidden = true;

  showArtistFormMessage("");
}

async function saveArtist(event) {
  event.preventDefault();
  showArtistFormMessage("");

  if (!artistForm.reportValidity()) {
    return;
  }

  const formData = new FormData(artistForm);
  const cpfDigits = String(formData.get("cpf") || "").replace(/\D/g, "");
  if (cpfDigits.length !== 11) {
    showArtistFormMessage("Informe um CPF com exatamente 11 números.", true);
    artistCpfInput.focus();
    return;
  }

  const artistFields = {
  nome: String(formData.get("nome") || "").trim(),
  cpf: formatCpf(cpfDigits),
  nacionalidade: String(formData.get("nacionalidade") || "").trim()
};


  let artist = artistFields;
  let path = API_CONFIG.artistsPath;
  let method = "POST";

  if (editingArtistId !== null) {
    const id = Number(editingArtistId);
    if (!Number.isSafeInteger(id) || id < 0) {
      showArtistFormMessage("O ID do artista não é um número válido para atualização.", true);
      return;
    }

    artist = { id, ...artistFields };
    path = `${API_CONFIG.artistsPath}/${encodeURIComponent(String(editingArtistId))}`;
    method = "PUT";
  }

  artistSubmitButton.disabled = true;
  artistSubmitButton.textContent = editingArtistId === null ? "Cadastrando…" : "Salvando…";
  try {
    await apiRequest(path, { method, body: artist });
    resetArtistForm();
    showArtistFormMessage(method === "POST" ? "Artista cadastrado com sucesso." : "Artista atualizado com sucesso.");
    await loadArtists();
  } catch (error) {
    showArtistFormMessage(error.message, true);
  } finally {
    artistSubmitButton.disabled = false;
    artistSubmitButton.textContent = editingArtistId === null ? "Cadastrar artista" : "Salvar alterações";
  }
}

async function deleteArtist(artist) {
  if (!window.confirm(`Deseja excluir o artista "${artist.nome}"?`)) {
    return;
  }

  try {
    await apiRequest(`${API_CONFIG.artistsPath}/${encodeURIComponent(String(artist.id))}`, {
      method: "DELETE"
    });
    if (String(editingArtistId) === String(artist.id)) {
      resetArtistForm();
    }
    const refreshed = await loadArtists();
    if (refreshed) {
      showArtistsMessage(`Artista "${artist.nome}" excluído com sucesso.`);
    }
  } catch (error) {
    showArtistsMessage(error.message, true);
  }
}

function setupEntityCrud(config) {
  const form = document.getElementById(config.formId);
  const heading = document.getElementById(config.headingId);
  const idReference = document.getElementById(config.idReferenceId);
  const formMessage = document.getElementById(config.formMessageId);
  const submitButton = document.getElementById(config.submitButtonId);
  const cancelButton = document.getElementById(config.cancelButtonId);
  const tableBody = document.getElementById(config.tableBodyId);
  const listMessage = document.getElementById(config.listMessageId);
  let records = [];
  let editingId = null;

  const showListMessage = (message, isError = false) => {
    listMessage.textContent = message;
    listMessage.classList.toggle("message-error", isError);
    listMessage.hidden = !message;
  };

  const showFormMessage = (message, isError = false) => {
    formMessage.textContent = message;
    formMessage.classList.toggle("message-error", isError);
    formMessage.setAttribute("role", isError ? "alert" : "status");
    formMessage.hidden = !message;
  };

  const resetForm = () => {
    editingId = null;
    form.reset();
    heading.textContent = `Nova ${config.name}`;
    idReference.textContent = "";
    idReference.hidden = true;
    submitButton.textContent = config.createLabel;
    cancelButton.hidden = true;
    showFormMessage("");
  };

  const render = () => {
    tableBody.replaceChildren();

    if (records.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = config.fields.length + 2;
      cell.className = "table-empty-cell";
      cell.textContent = config.emptyMessage;
      row.append(cell);
      tableBody.append(row);
      showListMessage("");
      return;
    }

    const fragment = document.createDocumentFragment();
    records.forEach((record) => {
      const row = document.createElement("tr");
      appendTextCell(row, record.id);
      config.fields.forEach(({ key, format }) => {
        appendTextCell(row, format ? format(record[key]) : record[key]);
      });

      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "table-actions";
      if (record.id !== null && record.id !== undefined) {
        actions.append(
          createEntityActionButton("edit", record, "Editar", "button-secondary"),
          createEntityActionButton("delete", record, "Excluir", "button-danger")
        );
      }
      actionsCell.append(actions);
      row.append(actionsCell);
      fragment.append(row);
    });

    tableBody.append(fragment);
    showListMessage("");
  };

  const load = async () => {
    showListMessage(`Carregando ${config.name === "obra" ? "obras" : "exposições"}…`);
    try {
      const response = await apiRequest(companyScopedPath(config.path));
      records = extractCatalogList(response);
      render();
      return true;
    } catch (error) {
      records = [];
      render();
      showListMessage(error.message, true);
      return false;
    }
  };

  const edit = (record) => {
    editingId = record.id;
    config.fields.forEach(({ key, type }) => {
      const input = form.elements.namedItem(key);
      const value = record[key];
      input.value = type === "date" && value ? String(value).slice(0, 10) : value ?? "";
    });
    heading.textContent = `Editar ${config.name}`;
    idReference.textContent = `ID ${config.name}: ${record.id}`;
    idReference.hidden = false;
    submitButton.textContent = "Salvar alterações";
    cancelButton.hidden = false;
    showFormMessage("");
    form.elements.namedItem(config.fields[0].key).focus();
  };

  const remove = async (record) => {
    if (!window.confirm(`Deseja excluir ${config.name} "${record[config.fields[0].key]}"?`)) {
      return;
    }

    try {
      await apiRequest(`${config.path}/${encodeURIComponent(String(record.id))}`, {
        method: "DELETE"
      });
      if (String(editingId) === String(record.id)) {
        resetForm();
      }
      if (await load()) {
        showListMessage(`${config.name[0].toUpperCase()}${config.name.slice(1)} excluída com sucesso.`);
      }
    } catch (error) {
      showListMessage(error.message, true);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    showFormMessage("");
    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const fields = Object.fromEntries(config.fields.map(({ key, type }) => {
      const value = String(formData.get(key) ?? "").trim();
      return [key, type === "number" ? Number(value) : value];
    }));

    if (config.name === "exposição") {

  const obrasSelecionadas =
    Array.from(
      document.getElementById("exhibition-obras").selectedOptions
    ).map(option => Number(option.value));

  fields.obrasIds = obrasSelecionadas;
}

    let payload = fields;
    let path = config.path;
    let method = "POST";
    if (editingId !== null) {
      const numericId = Number(editingId);
      if (!Number.isSafeInteger(numericId) || numericId < 0) {
        showFormMessage(`O ID de ${config.name} não é um número válido para atualização.`, true);
        return;
      }
      payload = config.includeIdInUpdate === false ? fields : { id: numericId, ...fields };
      path = `${config.path}/${encodeURIComponent(String(editingId))}`;
      method = "PUT";
    }

    submitButton.disabled = true;
    submitButton.textContent = editingId === null ? "Cadastrando…" : "Salvando…";
    try {
      await apiRequest(path, { method, body: payload });
      resetForm();
      const refreshed = await load();
      if (refreshed) {
        showFormMessage(method === "POST"
          ? `${config.name[0].toUpperCase()}${config.name.slice(1)} cadastrada com sucesso.`
          : `${config.name[0].toUpperCase()}${config.name.slice(1)} atualizada com sucesso.`);
      }
    } catch (error) {
      showFormMessage(error.message, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = editingId === null ? config.createLabel : "Salvar alterações";
    }
  };

  form.addEventListener("submit", save);
  cancelButton.addEventListener("click", resetForm);
  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const record = records.find((item) => String(item.id) === button.dataset.id);
    if (!record) {
      showListMessage(`Não foi possível localizar ${config.name}. Atualize a listagem e tente novamente.`, true);
      return;
    }

    if (button.dataset.action === "edit") {
      edit(record);
    } else if (button.dataset.action === "delete") {
      await remove(record);
    }
  });

  return { load };
}

function extractCatalogList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === "object") {
    for (const key of ["content", "data", "obras", "exposicoes"]) {
      if (response[key] !== undefined && response[key] !== null) {
        return extractCatalogList(response[key]);
      }
    }
  }

  throw new Error("A API não retornou uma lista em formato reconhecido.");
}

function createEntityActionButton(action, record, label, style) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = String(record.id);
  button.className = `button button-small ${style}`;
  button.textContent = label;
  button.setAttribute("aria-label", `${label} ${record.nome || record.titulo || "registro"}`);
  return button;
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(amount);
}

function getAccountSources(value) {
  const sources = [];
  const pending = [value];
  const nestedKeys = ["data", "usuario", "user", "account", "principal", "userDetails", "perfil"];

  while (pending.length > 0) {
    const current = pending.shift();
    if (!current || typeof current !== "object" || Array.isArray(current) || sources.includes(current)) {
      continue;
    }

    sources.push(current);
    nestedKeys.forEach((key) => {
      if (current[key] && typeof current[key] === "object" && !Array.isArray(current[key])) {
        pending.push(current[key]);
      }
    });
  }

  return sources;
}

function firstAccountValue(sources, keys) {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }
  }
  return "";
}

function firstAccountProperty(sources, keys) {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
      if (Array.isArray(value) && value.length > 0) {
        return value;
      }
      if (value && typeof value === "object") {
        return value;
      }
    }
  }
  return "";
}

function formatAccountRole(value) {
  const roles = Array.isArray(value) ? value : [value];
  return roles
    .map((role) => {
      if (typeof role === "string") {
        return role.replace(/^ROLE_/, "").replace(/[_-]/g, " ");
      }
      if (role && typeof role === "object") {
        const roleName = role.authority || role.name || role.nome || role.nomePerfil
          || role.perfil || role.tipo;
        return typeof roleName === "string" ? roleName : "";
      }
      return "";
    })
    .filter(Boolean)
    .join(", ");
}

function renderAccount(profile, profileError = null) {
  const sources = getAccountSources(profile);
  const subject = firstAccountValue(sources, ["sub", "username", "login", "preferred_username"]);
  const email = firstAccountValue(sources, [
    "email", "emailAddress", "email_address", "emailUsuario", "mail"
  ])
    || (subject.includes("@") ? subject : "");
  const name = firstAccountValue(sources, [
    "nome", "nomeUsuario", "nomeCompleto", "nome_completo",
    "name", "fullName", "full_name", "given_name", "givenName"
  ]);
  const roleValue = firstAccountProperty(sources, [
    "perfil", "role", "roles", "authorities", "authority", "scope", "scopes"
  ]);
  const role = formatAccountRole(roleValue);
  const explicitStatus = firstAccountValue(sources, ["status", "situacao", "accountStatus"]);
  const activeSource = sources.find((source) => typeof (source.ativo ?? source.active) === "boolean");
  const isActive = activeSource ? activeSource.ativo ?? activeSource.active : null;
  const status = explicitStatus
    || (typeof isActive === "boolean" ? (isActive ? "Ativo" : "Inativo") : "")
    || (!profileError && sources.length > 0 ? "Autenticado" : "Não informado");
  const entries = [
    ["Nome", name || "Não informado"],
    ["E-mail", email || "Não informado"],
    ["Perfil", role || "Não informado"],
    ["Status do acesso", status]
  ];
  const fragment = document.createDocumentFragment();
  entries.forEach(([key, value]) => {
    const card = document.createElement("dl");
    card.className = "data-card";

    const label = document.createElement("dt");
    label.textContent = key;

    const content = document.createElement("dd");
    content.textContent = value;
    card.append(label, content);
    fragment.append(card);
  });

  accountCards.replaceChildren(fragment);
  dashboardGreeting.textContent = name
    ? `Olá, ${name}. Acompanhe os principais indicadores da galeria.`
    : "Acompanhe os principais indicadores da galeria.";
  const hasProfile = Boolean(name || email || role);
  const hasCompleteProfile = Boolean(name && email && role);
  dashboardMessage.textContent = hasProfile
    ? profileError
      ? "Não foi possível consultar o perfil na API; os dados disponíveis estão abaixo."
      : hasCompleteProfile
        ? "Dados do usuário carregados."
        : "Dados carregados. Um ou mais campos não foram fornecidos pela API."
    : profileError
      ? "Não foi possível carregar os dados da conta. Verifique a conexão e tente novamente."
      : "A API não retornou nome, e-mail ou perfil para exibição.";
  dashboardMessage.classList.toggle("message-error", !hasProfile);
  dashboardMessage.hidden = false;
}

async function loadAccount() {
  try {
    const profile = await apiRequest(API_CONFIG.accountPath);
    renderAccount(profile);
  } catch (error) {
    if (error.message.startsWith("Sessão inválida")) {
      localStorage.removeItem("authToken");
      window.location.href = "index.html";
      return;
    }

    console.warn(`Não foi possível consultar o perfil em ${API_CONFIG.accountPath}.`, error);
    renderAccount(null, error);
  }
}

function setOverviewMetric(element, value, isError = false) {
  element.textContent = value;
  element.classList.toggle("overview-metric-error", isError);
}

function showOverviewMessage(message, isError = false) {
  overviewMessage.textContent = message;
  overviewMessage.classList.toggle("message-error", isError);
  overviewMessage.setAttribute("role", isError ? "alert" : "status");
  overviewMessage.hidden = !message;
}

function countActiveExhibitions(exhibitions) {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return exhibitions.filter((exhibition) => {
    if (!exhibition || typeof exhibition !== "object" || Array.isArray(exhibition)) {
      throw new Error("A API retornou uma exposição em formato inválido.");
    }

    const isActive = exhibition.ativa ?? exhibition.ativo ?? exhibition.active;
    if (typeof isActive === "boolean") {
      return isActive;
    }

    const status = String(exhibition.status || exhibition.situacao || "").toLocaleLowerCase("pt-BR");
    if (["ativa", "ativo", "active"].includes(status)) {
      return true;
    }
    if (["inativa", "inativo", "encerrada", "encerrado", "inactive"].includes(status)) {
      return false;
    }

    const startValue = exhibition.dataInicio;
    const endValue = exhibition.dataFim;
    if (typeof startValue !== "string" || typeof endValue !== "string") {
      throw new Error("Não foi possível determinar exposições ativas: a API deve retornar dataInicio e dataFim.");
    }

    const start = new Date(`${startValue.slice(0, 10)}T00:00:00`);
    const end = new Date(`${endValue.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("A API retornou uma data inválida para uma exposição.");
    }
    return start <= todayDate && todayDate <= end;
  }).length;
}

async function loadOverview() {
  setOverviewMetric(overviewArtworkCount, "Carregando…");
  setOverviewMetric(overviewActiveExhibitionCount, "Carregando…");
  setOverviewMetric(overviewInsuranceTotal, "Carregando…");
  showOverviewMessage("Carregando indicadores…");
  const errors = [];

  try {
    const response = await apiRequest(companyScopedPath(API_CONFIG.artworksPath));
    const artworks = extractCatalogList(response);
    setOverviewMetric(overviewArtworkCount, String(artworks.length));

    try {
      let totalCents = 0;
      artworks.forEach((artwork) => {
        const value = artwork && artwork.valorSeguro;
        const amount = Number(value);
        if (value === null || value === undefined || value === ""
          || !Number.isFinite(amount) || amount < 0) {
          throw new Error("Uma ou mais obras não possuem um valor de seguro válido.");
        }
        const cents = Math.round(amount * 100);
        if (!Number.isSafeInteger(cents) || !Number.isSafeInteger(totalCents + cents)) {
          throw new Error("O valor total do seguro excede o limite de cálculo seguro.");
        }
        totalCents += cents;
      });
      setOverviewMetric(overviewInsuranceTotal, formatCurrency(totalCents / 100));
    } catch (error) {
      setOverviewMetric(overviewInsuranceTotal, "Indisponível", true);
      errors.push(`valor do seguro: ${error.message}`);
    }
  } catch (error) {
    setOverviewMetric(overviewArtworkCount, "Indisponível", true);
    setOverviewMetric(overviewInsuranceTotal, "Indisponível", true);
    errors.push(`obras: ${error.message}`);
  }

  try {
    const response = await apiRequest(companyScopedPath(API_CONFIG.exhibitionsPath));
    const exhibitions = extractCatalogList(response);
    setOverviewMetric(overviewActiveExhibitionCount, String(countActiveExhibitions(exhibitions)));
  } catch (error) {
    setOverviewMetric(overviewActiveExhibitionCount, "Indisponível", true);
    errors.push(`exposições: ${error.message}`);
  }

  if (errors.length > 0) {
    showOverviewMessage(`Não foi possível carregar todos os indicadores (${errors.join("; ")}).`, true);
    return false;
  }

  showOverviewMessage("Indicadores atualizados.");
  return true;
}

async function carregarObrasParaExposicao() {

  const select = document.getElementById("exhibition-obras");

  if (!select) {
    return;
  }

  try {

    const response = await apiRequest(
      companyScopedPath(API_CONFIG.artworksPath)
    );

    const obras = Array.isArray(response)
      ? response
      : extractCatalogList(response);

    select.innerHTML = "";

    obras.forEach((obra) => {

      const option = document.createElement("option");

      option.value = obra.id;

      option.textContent =
        `${obra.id} - ${obra.titulo}`;

      select.appendChild(option);
    });

  } catch (error) {
    console.error("Erro ao carregar obras", error);
  }
}
