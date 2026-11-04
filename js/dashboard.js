const dashboardMessage = document.querySelector("#dashboard-message");
const accountCards = document.querySelector("#account-cards");
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
const insuranceExhibitionSelect = document.querySelector("#insurance-exhibition-select");
const insuranceReportButton = document.querySelector("#insurance-report-button");
const insuranceReportMessage = document.querySelector("#insurance-report-message");
const insuranceTotalResult = document.querySelector("#insurance-total-result");
const insuranceExhibitionName = document.querySelector("#insurance-exhibition-name");
const insuranceTotalValue = document.querySelector("#insurance-total-value");

let artists = [];
let editingArtistId = null;
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
  name: "exposição",
  path: API_CONFIG.exhibitionsPath,
  formId: "exhibition-form",
  headingId: "exhibition-form-heading",
  idReferenceId: "exhibition-id-reference",
  formMessageId: "exhibition-form-message",
  submitButtonId: "exhibition-submit-button",
  cancelButtonId: "exhibition-cancel-button",
  tableBodyId: "exhibitions-table-body",
  listMessageId: "exhibitions-list-message",
  emptyMessage: "Nenhuma exposição cadastrada.",
  createLabel: "Cadastrar exposição",
  includeIdInUpdate: false,
  fields: [
    { key: "nome", label: "Nome", type: "text" },
    { key: "local", label: "Local", type: "text" },
    { key: "dataInicio", label: "Data de início", type: "date" },
    { key: "dataFim", label: "Data de término", type: "date" }
  ]
});

// Proteção simples de rota no frontend: sem token, volte ao login.
if (!localStorage.getItem("authToken")) {
  window.location.href = "index.html";
} else {
  loadAccount();
}

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
  } else if (sectionName === "exposicoes") {
    exhibitionCatalog.load();
  } else if (sectionName === "seguros") {
    loadInsuranceExhibitions();
  }
}

sectionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const sectionName = link.dataset.sectionLink;
    showSection(sectionName);
    window.history.replaceState(null, "", `#${sectionName}`);
  });
});

showSection(window.location.hash.slice(1) || "inicio");

insuranceReportForm.addEventListener("submit", loadInsuranceReport);
insuranceExhibitionSelect.addEventListener("change", resetInsuranceTotal);

function showInsuranceMessage(message, isError = false) {
  insuranceReportMessage.textContent = message;
  insuranceReportMessage.classList.toggle("message-error", isError);
  insuranceReportMessage.setAttribute("role", isError ? "alert" : "status");
  insuranceReportMessage.hidden = !message;
}

function resetInsuranceTotal() {
  insuranceTotalResult.hidden = true;
  insuranceExhibitionName.textContent = "";
  insuranceTotalValue.textContent = "";
}

async function loadInsuranceExhibitions() {
  insuranceExhibitionSelect.disabled = true;
  insuranceReportButton.disabled = true;
  insuranceExhibitionSelect.replaceChildren(new Option("Carregando exposições…", ""));
  resetInsuranceTotal();
  showInsuranceMessage("");

  try {
    const response = await apiRequest(API_CONFIG.exhibitionsPath);
    const exhibitions = extractCatalogList(response);
    insuranceExhibitionSelect.replaceChildren(new Option("Selecione uma exposição", ""));

    exhibitions.forEach((exhibition) => {
      if (exhibition.id === null || exhibition.id === undefined) {
        return;
      }

      const option = new Option(
        `${exhibition.nome || `Exposição ${exhibition.id}`}${exhibition.local ? ` — ${exhibition.local}` : ""}`,
        String(exhibition.id)
      );
      insuranceExhibitionSelect.add(option);
    });

    if (insuranceExhibitionSelect.options.length === 1) {
      showInsuranceMessage("Nenhuma exposição disponível para consulta.");
      return;
    }

    insuranceExhibitionSelect.disabled = false;
    insuranceReportButton.disabled = false;
  } catch (error) {
    insuranceExhibitionSelect.replaceChildren(new Option("Não foi possível carregar as exposições", ""));
    showInsuranceMessage(error.message, true);
  }
}

async function loadInsuranceReport(event) {
  event.preventDefault();
  resetInsuranceTotal();
  showInsuranceMessage("");

  const exhibitionId = insuranceExhibitionSelect.value;
  if (!exhibitionId) {
    showInsuranceMessage("Selecione uma exposição para consultar o relatório.", true);
    insuranceExhibitionSelect.focus();
    return;
  }

  const selectedExhibition = insuranceExhibitionSelect.selectedOptions[0].textContent;
  insuranceExhibitionSelect.disabled = true;
  insuranceReportButton.disabled = true;
  insuranceReportButton.textContent = "Consultando…";
  showInsuranceMessage("Consultando o valor total do seguro…");

  try {
    const path = API_CONFIG.insuranceReportPath.replace(
      "{id}",
      encodeURIComponent(exhibitionId)
    );
    const response = await apiRequest(path);
    const total = extractInsuranceTotal(response);
    insuranceExhibitionName.textContent = selectedExhibition;
    insuranceTotalValue.textContent = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(total);
    insuranceTotalResult.hidden = false;
    showInsuranceMessage("");
  } catch (error) {
    showInsuranceMessage(error.message, true);
  } finally {
    insuranceExhibitionSelect.disabled = insuranceExhibitionSelect.options.length <= 1;
    insuranceReportButton.disabled = false;
    insuranceReportButton.textContent = "Consultar relatório";
  }
}

function extractInsuranceTotal(response) {
  const total = typeof response === "number"
    ? response
    : response && typeof response === "object"
      ? response.valorTotalSeguro
      : null;

  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) {
    throw new Error("A resposta do relatório deve conter valorTotalSeguro como número não negativo.");
  }

  return total;
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
    const response = await apiRequest(API_CONFIG.artistsPath);
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
    appendTextCell(row, artist.status);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    if (artist.id !== null && artist.id !== undefined) {
      actions.append(
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
  return button;
}

function editArtist(artist) {
  editingArtistId = artist.id;
  artistForm.elements.namedItem("nome").value = artist.nome || "";
  const cpfDigits = String(artist.cpf || "").replace(/\D/g, "");
  artistCpfInput.value = cpfDigits.length === 11 ? formatCpf(cpfDigits) : String(artist.cpf || "");
  artistForm.elements.namedItem("nacionalidade").value = artist.nacionalidade || "";
  artistForm.elements.namedItem("status").value = artist.status || "";
  artistFormHeading.textContent = "Editar artista";
  artistIdReference.textContent = `ID do artista: ${artist.id}`;
  artistIdReference.hidden = false;
  artistSubmitButton.textContent = "Salvar alterações";
  artistCancelButton.hidden = false;
  showArtistFormMessage("");
  artistForm.elements.namedItem("nome").focus();
}

function resetArtistForm() {
  editingArtistId = null;
  artistForm.reset();
  artistForm.elements.namedItem("status").value = "Ativo";
  artistFormHeading.textContent = "Novo artista";
  artistIdReference.textContent = "";
  artistIdReference.hidden = true;
  artistSubmitButton.textContent = "Cadastrar artista";
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
    nacionalidade: String(formData.get("nacionalidade") || "").trim(),
    status: String(formData.get("status") || "").trim()
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
      const response = await apiRequest(config.path);
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

/**
 * Converte os campos da resposta em cartões sem inserir HTML recebido da API.
 * Usar textContent evita interpretar dados externos como marcação HTML.
 */
function renderAccount(data) {
  // Algumas APIs envolvem o objeto principal em uma propriedade "data".
  const account = data && typeof data === "object" && !Array.isArray(data) && data.data
    ? data.data
    : data;

  if (!account || typeof account !== "object" || Array.isArray(account)) {
    throw new Error("A API não retornou um objeto de conta em formato reconhecido.");
  }

  const entries = Object.entries(account);
  if (entries.length === 0) {
    throw new Error("A API retornou a conta sem campos para exibir.");
  }

  const fragment = document.createDocumentFragment();
  entries.forEach(([key, value]) => {
    const card = document.createElement("dl");
    card.className = "data-card";

    const label = document.createElement("dt");
    label.textContent = key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ");

    const content = document.createElement("dd");
    if (value === null || value === undefined) {
      content.textContent = "—";
    } else if (typeof value === "object") {
      content.textContent = JSON.stringify(value);
    } else {
      content.textContent = String(value);
    }

    card.append(label, content);
    fragment.append(card);
  });

  accountCards.replaceChildren(fragment);
  dashboardMessage.hidden = true;
}

async function loadAccount() {
  try {
    const data = await apiRequest(API_CONFIG.accountPath);
    renderAccount(data);
  } catch (error) {
    // Token expirado/invalidado: remova-o para que a pessoa possa autenticar novamente.
    if (error.message.startsWith("Sessão inválida")) {
      localStorage.removeItem("authToken");
      window.location.href = "index.html";
      return;
    }

    dashboardMessage.textContent = error.message;
    dashboardMessage.classList.add("message-error");
    dashboardMessage.setAttribute("role", "alert");
    dashboardMessage.hidden = false;
  }
}
