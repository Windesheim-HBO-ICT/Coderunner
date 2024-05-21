class CodeBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open'
    });
    this.imports = [
      'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/editor/editor.main.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/loader.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/editor/editor.main.nls.js',
      'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/editor/editor.main.js',
    ];
  }

  connectedCallback() {
    this.render();
    this.loadMonacoResources();
    this.initializeCodeRunner();

    const dropdown = this.shadowRoot.querySelector('select');
    fetch('http://localhost:8080/languages')
    .then(response => response.json())
    .then(languages => {
      languages.forEach(languageObject => {
        const option = document.createElement('option');
        option.value = languageObject.language;
        option.text = languageObject.language;
        option.onclick = () => {
          // set monaco editor language
          monaco.editor.setModelLanguage(monaco.editor.getModels()[0], languageObject.language.toLowerCase());
        };
        dropdown.appendChild(option);
      });
      const language = this.getAttribute('language');
      dropdown.value = language;
    })
    .catch(error => console.error('Error:', error));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
      select {
        width: 20%;
        padding: 0.5rem;
        min-width: 100px;
      }
      .flexcol {
        display: flex;
        flex: 1 1 0%;
      }
      .coderunnerMain {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        align-items: center;
        height: 100vh;
      }
      .coderunner {
        display: flex;
        height: 100%;
        width: 100%;
        background-color: rgb(226, 232, 240);
        border-radius: 0.5rem;
        box-sizing: border-box;
        margin-bottom: 1.25rem;
        flex-direction: column;
        overflow: hidden;
      }
      .coderunnerHeader {
        display: flex;
        width: 100%;
        justify-content: space-between;
        box-sizing: border-box;
        padding-left: 1.25rem;
        padding-right: 1.25rem;
        padding-top: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .coderunnerHeaderButtons {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .runButton {
        cursor: pointer;
        background: none;
        border: none;
      }
      .coderunnerInner {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
      }
      .codeEditor {
        width: 100%;
      }
      .coderunnerResult {
        padding: 1.25rem;
        border-radius: 0.5rem;
      }
      </style>
      <div class="coderunner">
        <div class="coderunnerHeader">
        <select id="language"></select>
        <div class="coderunnerHeaderButtons">
          <button id="runButton" class="runButton"><svg width="32px" height="32px" viewBox="0 0 24.00 24.00" fill="lightgreen" xmlns="http://www.w3.org/2000/svg" transform="rotate(90)" stroke="#2afa00"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"> <g id="Shape / Triangle"> <path id="Vector" d="M4.37891 15.1999C3.46947 16.775 3.01489 17.5634 3.08281 18.2097C3.14206 18.7734 3.43792 19.2851 3.89648 19.6182C4.42204 20.0001 5.3309 20.0001 7.14853 20.0001H16.8515C18.6691 20.0001 19.5778 20.0001 20.1034 19.6182C20.5619 19.2851 20.8579 18.7734 20.9172 18.2097C20.9851 17.5634 20.5307 16.775 19.6212 15.1999L14.7715 6.79986C13.8621 5.22468 13.4071 4.43722 12.8135 4.17291C12.2957 3.94236 11.704 3.94236 11.1862 4.17291C10.5928 4.43711 10.1381 5.22458 9.22946 6.79845L4.37891 15.1999Z" stroke="#2afa00" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg></button>
        </div>
        </div>
        <div class="coderunnerInner">
        <div id="editor" class="flexcol">
          <div id="editorContainer" class="codeEditor"></div>
        </div>
        <div id="output" class="flexcol">
          <div id="resultFrame" class="coderunnerResult" width="100%" height="50%"></div>
        </div>
        </div>
      </div>
    `;
  }

  initializeCodeRunner() {
    const runButton = this.shadowRoot.getElementById('runButton');
    const resultFrame = this.shadowRoot.getElementById('resultFrame');
    const languageDropdown = this.shadowRoot.getElementById('language');

    // Event listener for the run button
    runButton.addEventListener('click', async (event) => {
      event.preventDefault();

      const code = monaco.editor.getModels()[0].getValue();

      // Prepare data to send to the server
      const requestData = {
        language: languageDropdown.value,
        code: code
      };

      // Clear the result frame before making a new request
      resultFrame.innerText = 'Running...';

      // Make a POST request to the server
      await fetch('http://localhost:8080/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      .then(response => response.text())
      .then(result => {
        // Display the result received from the server
        resultFrame.innerText = result;
      })
      .catch(error => {
        // Log the error
        console.error('Error:', error);
        resultFrame.innerText = 'An error occurred. Please try again.';
      });
    });
  }

  loadMonacoResources() {
    const requireConfig = document.createElement('script');
    requireConfig.innerHTML = `var require = { paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs' } };`;
    this.shadowRoot.appendChild(requireConfig);

    // Loader function for the resources
    const loadResource = (resource) => {
      return new Promise((resolve, reject) => {
        const node = resource.endsWith('.css') ? document.createElement('link') : document.createElement('script');
        if (resource.endsWith('.css')) {
          node.rel = 'stylesheet';
          node.href = resource
        } else {
          node.src = resource;
        }
        node.onload = resolve;
        node.onerror = reject;
        this.shadowRoot.appendChild(node);
      });
    }

    // Loop and load the resources but wait for each to finish before loading the next
    // This is neccessary because the Monaco editor requires the resources to be loaded in a specific order
    this.imports.reduce((promise, resource) => {
      return promise.then(() => loadResource(resource));
    }, Promise.resolve())
    .then(() => {
      if (window.monaco) {
        this.initializeMonacoEditor();
      } else {
        window.require(['vs/editor/editor.main'], () => {
          this.initializeMonacoEditor();
        });
      }
    })
    .catch((error) => console.error('Failed to load Monaco Editor:', error));
  }

  initializeMonacoEditor() {
    const editorContainer = this.shadowRoot.getElementById('editorContainer');
    monaco.editor.create(editorContainer, {
      value: this.getAttribute('initialCode') || '',
      language: this.getAttribute('language') || 'javascript',
      theme: 'vs-dark',
    });
  }
}

window.customElements.define('code-block', CodeBlock);