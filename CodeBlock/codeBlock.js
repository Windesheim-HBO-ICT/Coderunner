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

    console.log(this.code);
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
              // monaco.editor.getModels()[0],
              this.monacoModel,
              languageObject.language.toLowerCase(),
            );
          };
          dropdown.appendChild(option);
        });
        dropdown.value = this.language;
      })
      .catch((error) => console.error("Error:", error));
  }

  render() {
    this.shadowRoot.innerHTML = `
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
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        color: #ff0000;
        font-weight: 700;
      }
      .coderunnerResult {
        padding: 1.25rem;
        border-radius: 0.5rem;
      }
      .hidden {
        display: none;
      }
      </style>
      <div class="flexCol monaco-editor-background ${this.disabled ? "minimal" : ""}">
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
            <button id="clearButton" class="clearButton">X</button>
          </div>
          <hr>
          <pre id="output" class="coderunnerResult"></pre>
        </div>
      </div>
    `;
  }

  createRunButton(absolute) {
    const classList = absolute ? "runButton absolute" : "runButton";

    return `<button id="runButton" class="${classList}"><svg width="32px" height="32px" viewBox="0 0 24.00 24.00" fill="lightgreen" xmlns="http://www.w3.org/2000/svg" transform="rotate(90)" stroke="#2afa00"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"> <g id="Shape / Triangle"> <path id="Vector" d="M4.37891 15.1999C3.46947 16.775 3.01489 17.5634 3.08281 18.2097C3.14206 18.7734 3.43792 19.2851 3.89648 19.6182C4.42204 20.0001 5.3309 20.0001 7.14853 20.0001H16.8515C18.6691 20.0001 19.5778 20.0001 20.1034 19.6182C20.5619 19.2851 20.8579 18.7734 20.9172 18.2097C20.9851 17.5634 20.5307 16.775 19.6212 15.1999L14.7715 6.79986C13.8621 5.22468 13.4071 4.43722 12.8135 4.17291C12.2957 3.94236 11.704 3.94236 11.1862 4.17291C10.5928 4.43711 10.1381 5.22458 9.22946 6.79845L4.37891 15.1999Z" stroke="#2afa00" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg></button>`;
  }

  initializeCodeRunner() {
    if (this.disabled) return;
    const runButton = this.shadowRoot.getElementById("runButton");
    const clearButton = this.shadowRoot.getElementById("clearButton");
    const languageDropdown = this.shadowRoot.getElementById("language");

    // Event listener for the clear button
    clearButton.addEventListener("click", () => {
      if (this.shadowRoot.getElementById("output").innerText === "Running...")
        return;
      this.shadowRoot.getElementById("output").innerText = "";
      this.shadowRoot.getElementById("outputContainer").classList.add("hidden");
    });

    // Event listener for the run button
    runButton.addEventListener("click", async (event) => {
      event.preventDefault();

      // const code = monaco.editor.getModels()[0].getValue();
      const code = this.monacoModel.getValue();
      console.log("running code:", code);

      // Prepare data to send to the server
      const requestData = {
        language: languageDropdown?.value ?? this.language,
        code: code,
      };

      // Clear the result frame before making a new request
      this.setResults("Running...");

      // Make a POST request to the server
      await fetch("http://localhost:8080/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })
        .then((response) => response.text())
        .then((result) => {
          // Display the result received from the server
          this.setResults(result);
        })
        .catch((error) => {
          // Log the error
          console.error("Error:", error);
          this.setResults("An error occurred. Please try again.");
        });
    });
  }

  setResults(result) {
    const output = this.shadowRoot.getElementById("output");
    const outputContainer = this.shadowRoot.getElementById("outputContainer");
    outputContainer.classList.remove("hidden");
    output.innerText = result;
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
}

window.customElements.define("code-block", CodeBlock);
