const CodeBlockActionButtonState = Object.freeze({
  RUN: Symbol(0),
  LOADING: Symbol(1),
  STOP: Symbol(2),
  RECONNECT: Symbol(3),
  NONE: Symbol(4),
});

class CodeBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: "open",
    });
    this.imports = [
      "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/editor/editor.main.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/loader.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/editor/editor.main.nls.js",
      "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/editor/editor.main.js",
    ];

    this.outputMap = {
      "-- START OUTPUT --": () => this.startRun(),
      "-- END OUTPUT --": () => this.endRun(),
      pong: () => this.ping(),
    };
  }

  connectedCallback() {
    // Initialize the component after the browser has finished rendering
    // This is necessary because we need the innerHTML of the component to be available
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        this.init();
      });
    });
  }

  init() {
    this.initProperties();
    this.render();
    this.loadMonacoResources();
    this.initializeCodeRunner();
    if (this.sandbox) {
      this.activateSandbox();
    }
  }

  initProperties() {
    this.actionButtonState = CodeBlockActionButtonState.NONE;
    this.sandbox = this.getAttribute("sandbox") !== null;
    this.disabled = this.getAttribute("read-only") !== null;
    this.language = this.getAttribute("language");

    const sandbox = document.createElement("div");

    let rawCode = this.innerHTML;
    // Create a sandbox element to parse HTML entities (e.g. &lt;)
    (rawCode.match(/&.+;/gi) || []).forEach((entity) => {
      // Insert the HTML entity as HTML in an HTML element:
      sandbox.innerHTML = entity;

      // Retrieve the HTML elements innerText to get the parsed entity (the actual character):
      rawCode = rawCode.replace(entity, sandbox.innerText);
    });

    this.code = rawCode;
    sandbox.remove();

    this.innerHTML = "";
  }

  activateSandbox() {
    this.createLanguageDropdown();
  }

  createLanguageDropdown() {
    const dropdown = this.shadowRoot.querySelector("select");
    fetch("http://localhost:8080/languages")
      .then((response) => response.json())
      .then((languages) => {
        languages.forEach((languageObject) => {
          const option = document.createElement("option");
          option.value = languageObject.language;
          option.text = languageObject.language;
          option.onclick = () => {
            // set monaco editor language
            monaco.editor.setModelLanguage(
              this.monacoModel,
              languageObject.language.toLowerCase(),
            );
          };
          dropdown.appendChild(option);
        });
        dropdown.value = this.language;
      })
      .catch((error) => {
        console.error("Error:", error);
        this.showToaster(
          'Code-Block kan geen verbinding maken met de Code-Runner server. Lees de <a target="_blank" href="https://github.com/Windesheim-HBO-ICT/Deeltaken/wiki/Getting-Started">documentatie</a> voor meer informatie.',
          "warning",
        );
      });
  }

  render() {
    this.shadowRoot.innerHTML =
      `
      <style>
      .minimal {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        border: none !important;
      }
      .coderunnerContainer {
        overflow: auto;
        resize: vertical;
        height: ${this.code.split("\n").length + 1 * 1.5}rem;
        min-height: 100px;
      }
      .flexCol {
        border: 1px solid #ddd;
        margin: 1rem 0;
        display: flex;
        gap: 1rem;
        flex-direction: column;
        position: relative;
      }
      select {
        width: 20%;
        padding: 0.5rem;
        min-width: 100px;
      }
      .coderunnerHeader {
        display: flex;
        border-bottom: 1px solid #ddd;
        width: 100%;
        justify-content: space-between;
        box-sizing: border-box;
        padding: 0.75rem 1.25rem;
      }
      .absolute {
        position: absolute;
      }
      .runButton {
        z-index: 25;
        top: 0.75rem;
        right: 1.25rem;
        width: 25px;
        height: 25px;
        color: inherit;
        padding: 0;
        cursor: pointer;
        background: none;
        border: none;
      }
      .coderunnerOutputContainer {
        border-top: 1px solid #ddd;
        padding: 0.3rem 1rem;
      }
      .flexRow {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .clearButton {
        cursor: pointer;
        border: black 1px solid;
        padding: 0.5rem;
        font-size: 1.25rem;
        color: #333;
      }
      .coderunnerResult {
        padding: 1.25rem;
        border-radius: 0.5rem;
      }
      .loader {
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        cursor: default;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        width: 100%;
        height: 100%;
        color: transparent !important;
        animation: spin 2s linear infinite;
      }
      .loader svg {
        display: none;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .hidden {
        display: none;
      }
      @keyframes slideInFromRight {
        0% { transform: translateX(100%); }
        100% { transform: translateX(0); }
      }
      @keyframes slideDown {
        0% { transform: translateY(0); }
        100% { transform: translateY(300%); }
      }
      .toaster {
        position: fixed;
        z-index: 999;
        bottom: 30px;
        right: 30px;
        width: 430px;
        max-width: calc(100vw - 60px);
        animation: slideInFromRight 0.5s ease;
      }
      .toaster-content {
        padding: 20px;
        border: 3px solid #ddd;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        border-radius: 3px;
      }
      .close {
        position: absolute;
        top: 1px;
        right: 10px;
        float: right;
        font-size: 26px;
        cursor: pointer;
        user-select: none;
      }
      .slideDown { animation: slideDown 0.8s ease forwards; }
      .toaster[type="danger"] .toaster-content {border-color: #f44336;}
      .toaster[type="warning"] .toaster-content {border-color: #ff9800;}
      .toaster[type="success"] .toaster-content {border-color: #4caf50;}
      .toaster[type="info"] .toaster-content {border-color: #2196F3;}
      .toaster[type="danger"] .toaster-content .close {color: #f44336;}
      .toaster[type="warning"] .toaster-content .close {color: #ff9800;}
      .toaster[type="success"] .toaster-content .close {color: #4caf50;}
      .toaster[type="info"] .toaster-content .close {color: #2196F3;}
      </style>
      <div class="flexCol monaco-editor monaco-editor-background ${this.disabled ? "minimal" : ""}">
      ${
        this.sandbox
          ? `
        <div class="coderunnerHeader">
          <select id="language"></select>
          ${this.createRunButton(false)}
        </div>
        `
          : !this.disabled
            ? this.createRunButton(true)
            : ""
      }
        <div id="editor" class="coderunnerContainer"></div>
        <div id="outputContainer" class="coderunnerOutputContainer hidden">
          <div class="flexRow">
            <h3>Output:</h3>
            <button id="outputButton" class="clearButton">Clear</button>
          </div>
          <hr>
          <pre id="output" class="coderunnerResult"></pre>
        </div>
      </div>
      <div class="toaster hidden" id="toaster">
        <div class="toaster-content monaco-editor monaco-editor-background">
          ` +
      this.createToasterDismissButton() +
      `
          <span id="toaster-message"></span>
        </div>
      </div>
    `;
  }

  createRunButton(absolute) {
    const classList = absolute ? "runButton absolute" : "runButton";

    return `<button id="runButton" class="${classList}"></button>`;
  }

  initializeCodeRunner() {
    if (this.disabled) return;

    this.bindEvents();
    this.connectWebSocket();
  }

  bindEvents() {
    const runButton = this.shadowRoot.getElementById("runButton");
    if (runButton) this.runButton = runButton;
    const clearButton = this.shadowRoot.getElementById("outputButton");
    if (clearButton) this.clearButton = clearButton;

    // Event listener for the clear button
    this.clearButton?.addEventListener("click", () => {
      if (this.running) return;

      this.setResults("");
      this.shadowRoot.getElementById("outputContainer").classList.add("hidden");
    });

    // Event listener for the run button
    this.runButton?.addEventListener("click", async (event) => {
      event.preventDefault();
      this.onActionButtonClick();
    });

    this.updateActionButtonState();
  }

  connectWebSocket() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
      this.socket = null;
    }

    // Try to connect to the server
    const socket = new WebSocket(
      "ws://localhost:8080/codeSocket?language=" + this.language,
    );

    // Check if the socket is open
    socket.onopen = () => {
      console.log("Connected to the server");
      if (this.socket) this.socket.close();
      this.socket = socket;
      this.updateActionButtonState();
      this.ping();
    };

    socket.onmessage = (event) => {
      const data = event.data;

      const mapFunc = this.outputMap[data];
      if (mapFunc) mapFunc(data);
      else this.appendResults(event.data);
    };

    // Check if the socket is closed
    socket.onclose = () => {
      console.log("Disconnected from the server");

      if (this.socket)
        this.showToaster(
          'Verbinding met de Code-Runner server verbroken. Lees de <a target="_blank" href="https://github.com/windesheim-hbo-ict/code-runner">documentatie</a> voor meer informatie.',
          "danger",
        );
      else
        this.showToaster(
          'Code-Runner server niet gevonden. Lees de <a target="_blank" href="https://github.com/windesheim-hbo-ict/code-runner">documentatie</a> voor meer informatie.',
          "danger",
        );

      this.socket = null;
      this.updateActionButtonState();
    };
  }

  ping() {
    if (!this.socket) return;

    if (this.pingTimeout) clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
      this.socket.send("ping");
    }, 10000);
  }

  endRun() {
    this.running = false;

    const outputButton = this.shadowRoot.getElementById("outputButton");
    outputButton.classList.value = "";
    outputButton.classList.add("clearButton");

    this.updateActionButtonState();
    this.ping();
  }

  startRun() {
    this.running = true;
    this.setResults("");
    this.updateActionButtonState();
  }

  runCode(code) {
    if (!this.socket) {
      this.showToaster(
        'Code-Block kon de code niet naar de Code-Runner server sturen. Lees de <a target="_blank" href="https://github.com/Windesheim-HBO-ICT/Deeltaken/wiki/Getting-Started">documentatie</a> voor meer informatie.',
        "danger",
      );
      return;
    }

    clearTimeout(this.pingTimeout);
    this.updateActionButtonState(CodeBlockActionButtonState.LOADING);
    this.setResults("Preparing the code runner...");
    this.socket.send(code);
  }

  onActionButtonClick() {
    switch (this.actionButtonState) {
      case CodeBlockActionButtonState.RUN:
        const code = this.monacoModel.getValue();
        // Send the data to the server
        this.runCode(code);
        break;
      case CodeBlockActionButtonState.CANCEL:
        this.cancelCode();
        break;
      case CodeBlockActionButtonState.RECONNECT:
        this.connectWebSocket();
        break;
    }
  }

  updateActionButtonState(newState) {
    if (!newState) newState = this.getActionButtonState();
    this.actionButtonState = newState;
    this.runButton.innerHTML = icons[newState];
  }

  getActionButtonState() {
    if (!this.socket) return CodeBlockActionButtonState.RECONNECT;
    if (this.running) return CodeBlockActionButtonState.STOP;
    return CodeBlockActionButtonState.RUN;
  }

  setResults(result) {
    const output = this.shadowRoot.getElementById("output");
    const outputContainer = this.shadowRoot.getElementById("outputContainer");
    outputContainer.classList.remove("hidden");
    output.innerText = result;
  }

  appendResults(result) {
    const output = this.shadowRoot.getElementById("output");
    output.innerText += result;
  }

  loadMonacoResources() {
    const requireConfig = document.createElement("script");
    requireConfig.innerHTML = `var require = { paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs' } };`;
    this.shadowRoot.appendChild(requireConfig);

    // Loader function for the resources
    const loadResource = (resource) => {
      return new Promise((resolve, reject) => {
        const node = resource.endsWith(".css")
          ? document.createElement("link")
          : document.createElement("script");
        if (resource.endsWith(".css")) {
          node.rel = "stylesheet";
          node.href = resource;
        } else {
          node.src = resource;
        }
        node.onload = resolve;
        node.onerror = reject;
        this.shadowRoot.appendChild(node);
      });
    };

    // Loop and load the resources but wait for each to finish before loading the next
    // This is neccessary because the Monaco editor requires the resources to be loaded in a specific order
    this.imports
      .reduce((promise, resource) => {
        return promise.then(() => loadResource(resource));
      }, Promise.resolve())
      .then(() => {
        if (window.monaco) {
          this.initializeMonacoEditor();
        } else {
          window.require(["vs/editor/editor.main"], () => {
            this.initializeMonacoEditor();
          });
        }
      })
      .catch((error) => console.error("Failed to load Monaco Editor:", error));
  }

  initializeMonacoEditor() {
    console.log("Monaco Editor initialized");
    const curTheme = localStorage.getItem("theme") ?? "light";
    const editorContainer = this.shadowRoot.getElementById("editor");
    const scrollbarsStyle = this.disabled ? "hidden" : "auto";
    this.monacoModel = monaco.editor.create(editorContainer, {
      value: this.code || "",
      language: this.language || "javascript",
      theme: "vs-" + curTheme,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false,
      },
      fixedOverflowWidgets: true,
      wordWrap: "on",
      scrollbar: {
        vertical: scrollbarsStyle,
        horizontal: scrollbarsStyle,
      },
      // Read-only settings
      glyphMargin: !this.disabled,
      renderFinalNewline: !this.disabled,
      readOnly: this.disabled,
    });

    console.log("This model created", this.monacoModel);

    document.addEventListener("themechange", (e) => {
      monaco.editor.setTheme(
        e.detail.theme === "light" ? "vs-light" : "vs-dark",
      );
    });
  }

  showToaster(message, type) {
    const toaster = this.shadowRoot.getElementById("toaster");
    const toasterMessage = this.shadowRoot.getElementById("toaster-message");
    toaster.setAttribute("type", type);
    toaster.classList.remove("slideDown");
    toaster.classList.remove("hidden");
    toasterMessage.innerHTML = message;
  }

  createToasterDismissButton() {
    const button = document.createElement("span");
    button.innerHTML = "&times;";
    button.classList.add("close");
    button.setAttribute(
      "onclick",
      `
      const toaster = this.parentElement.parentElement;
      toaster.classList.add('slideDown');
      setTimeout(() => { toaster.classList.add('hidden') }, 500)
    `,
    );
    return button.outerHTML;
  }
}

const icons = Object.freeze({
  [CodeBlockActionButtonState.RUN]: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
</svg>`,
  [CodeBlockActionButtonState.RECONNECT]: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>`,
  [CodeBlockActionButtonState.NONE]: ``,
  [CodeBlockActionButtonState.STOP]: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 0 1 9 14.437V9.564Z" />
  </svg>
`,
  [CodeBlockActionButtonState.LOADING]: `<div class="loader"></div>`,
});

window.customElements.define("code-block", CodeBlock);
