
# 🎨 ArtGallery — Front-End

Interface web para o **ArtGallery**, um sistema de gestão administrativa de galerias e exposições de arte. O login e o painel são páginas HTML distintas; dentro do painel, a navegação entre módulos ocorre sem recarregar a página.

---

## 📋 Funcionalidades Principais

* **Autenticação e Cadastro (`index.html`):**
  * Fluxo de uma página alternando entre **Login** e **Cadastro de Novo Usuário**.
  * Login enviado como `{ login, senha }`; o Swagger descreve `login` como CPF (`string`), sem especificar se deve conter máscara. O front-end envia o valor informado sem remover a máscara.
  * Validação de CPF no cadastro, data de nascimento, senha com mínimo de 8 caracteres e vínculo por ID da empresa. O Swagger tipa `empresa_id` como inteiro, mas não define limite mínimo; o front-end mantém a regra não negativa até confirmar se o ID zero é inválido.
* **Painel Administrativo (`dashboard.html`):**
  * **Visão Geral (Início):** Dados da conta e indicadores do acervo.
  * **Gestão de Artistas:** Cadastro, edição e listagem de artistas.
  * **Gestão de Obras de Arte:** Cadastro de título, técnica, ano de criação e valor do seguro; o front-end mantém a validação não negativa existente.
  * **Programação de Exposições:** Cadastro, edição e listagem de exposições e obras vinculadas.
  * **Relatório de Seguro:** Obtido de `GET /obras`; o front-end exibe os valores cadastrados e calcula o total. Não há um endpoint de relatório configurado no contrato OpenAPI consultado.
* **Gestão Multi-Empresa:**
  * Barra lateral retrátil para visualização e troca da empresa ativa no painel.
* **Tema Claro e Escuro (Dark/Light Mode):**
  * Alternância de tema com detecção da preferência do sistema operacional e persistência via `localStorage`. O tema inicial é aplicado antes do carregamento dos estilos; os botões de cada página permanecem no local adequado ao seu layout.

---

## 🗂️ Estrutura do Projeto

```text
Aula-IA/
├── index.html               # Tela de autenticação (Login e Cadastro de Usuário)
├── dashboard.html           # Painel administrativo principal e módulos de gestão
├── css/
│   ├── style.css            # Estilos globais, variáveis de tema (claro/escuro) e autenticação
│   ├── dashboard.css        # Estilos específicos do painel, sidebar, tabelas e cartões
│   └── assets/
│       └── logo.png         # Identidade visual do ArtGallery
└── js/
    ├── theme-init.js        # Aplica o tema inicial antes dos estilos
    ├── theme-toggle.js      # Módulo ES para alternância e persistência de tema
    ├── api.js               # Configuração de requisições e comunicação com o back-end
    ├── login.js             # Lógica de autenticação e cadastro de usuários
    └── dashboard.js         # Controle de navegação, CRUD de módulos e relatórios

```

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Marcação semântica (`<main>`, `<aside>`, `<section>`) e recursos de acessibilidade (`aria-live`, `aria-labelledby`, `role="status"` e `role="alert"`).


* **CSS3:** Estilização responsiva e customização de temas claro/escuro via `data-theme`.


* **JavaScript (ES6+):** Manipulação do DOM, módulo ES para os controles de tema e consumo assíncrono da API REST via `fetch`.



---

## 🚀 Como Executar o Projeto

1. **Clone o repositório:**
```bash
git clone https://github.com/TaisSangaletti/Aula-IA.git

```


2. **Acesse a pasta do projeto:**
```bash
cd Aula-IA

```


3. **Inicie um servidor HTTP para o front-end**, por exemplo, com Live Server no VS Code ou `python -m http.server 5500`, e abra o endereço local servido. O módulo ES de tema não deve ser carregado diretamente por `file://`.

4. **Conexão com o Back-End:** A configuração atual usa `http://localhost:8080` em `js/api.js`. Como o front-end e a API normalmente usam portas diferentes, a API deve permitir via CORS a origem usada pelo servidor front-end.

---

## 👩‍💻 Autoria

Desenvolvido por **Taís Sangaletti**.

