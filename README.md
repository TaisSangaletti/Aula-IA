
```markdown
# 🎨 ArtGallery — Front-End

Interface web para o **ArtGallery**, um sistema de gestão administrativa de galerias e exposições de arte. Este projeto foi desenvolvido com foco em arquitetura Multi-Page Application (MPA), semântica HTML5, acessibilidade e integração com APIs REST.

---

## 📋 Funcionalidades Principais

* **Autenticação e Cadastro (`index.html`):**
  * Fluxo dinâmico em página única alternando entre **Login** e **Cadastro de Novo Usuário**[cite: 1].
  * Validação nativa de campos (CPF com 11 dígitos, data de nascimento, senha com mínimo de 8 caracteres e vínculo por ID da empresa)[cite: 1].
* **Painel Administrativo (`dashboard.html`):**
  * **Visão Geral (Início):** Exibição dos dados da conta autenticada e indicadores em tempo real do acervo (total de obras cadastradas, exposições ativas e valor total segurado)[cite: 2].
  * **Gestão de Artistas:** Cadastro, edição e listagem de artistas representados pela galeria (Nome, CPF, Nacionalidade e Status)[cite: 2].
  * **Gestão de Obras de Arte:** Controle completo do acervo com título, técnica, ano de criação (4 dígitos) e valor do seguro em Reais (R$)[cite: 2].
  * **Programação de Exposições:** Cadastro e acompanhamento de exposições com nome, local, data de início e data de término[cite: 2].
  * **Relatório de Seguro:** Consulta individual do valor segurado por obra e cálculo consolidado do valor total do acervo da empresa selecionada[cite: 2].
* **Gestão Multi-Empresa:**
  * Barra lateral retrátil dedicada para visualização e troca rápida da empresa ativa no painel[cite: 2].
* **Tema Claro e Escuro (Dark/Light Mode):**
  * Alternância de tema com detecção automática da preferência do sistema operacional e persistência via `localStorage`[cite: 1, 2].

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
    ├── theme-toggle.js      # Módulo ES para alternância e persistência de tema
    ├── api.js               # Configuração de requisições e comunicação com o back-end
    ├── login.js             # Lógica de autenticação e cadastro de usuários
    └── dashboard.js         # Controle de navegação, CRUD de módulos e relatórios

```

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Marcação semântica (`<main>`, `<aside>`, `<section>`) e recursos de acessibilidade (`aria-live`, `aria-labelledby`, `role="status"` e `role="alert"`).


* **CSS3:** Estilização responsiva e customização de temas claro/escuro via `data-theme`.


* **JavaScript (ES6+):** Manipulação do DOM, módulos nativos (`type="module"`) e consumo assíncrono de API REST.



---

## 🚀 Como Executar o Projeto

1. **Clone o repositório:**
```bash
git clone [https://github.com/TaisSangaletti/Aula-IA.git](https://github.com/TaisSangaletti/Aula-IA.git)

```


2. **Acesse a pasta do projeto:**
```bash
cd Aula-IA

```


3. **Inicie um servidor local:**
* Como o projeto utiliza **ES Modules** (`js/theme-toggle.js`), abra o arquivo `index.html` através de um servidor local (como a extensão **Live Server** do VS Code ou similar) para evitar bloqueios de CORS do navegador.




4. **Conexão com o Back-End:**
* Certifique-se de que a API REST do **ArtGallery** esteja em execução e configurada no arquivo `js/api.js` para habilitar o login e o carregamento dos dados no painel.





---

## 👩‍💻 Autoria

Desenvolvido por **Taís Sangaletti**.

```

```

