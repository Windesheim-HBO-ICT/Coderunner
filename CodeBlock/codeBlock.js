class CodeBlock extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();

      // Get the language attribute from the custom element
    const language = this.getAttribute('language');
    // Get the dropdown element
    const dropdown = this.shadowRoot.querySelector('select');
    // Set the selected item in the dropdown to the language attribute
    dropdown.value = language;
  }

  render() {
      this.shadowRoot.innerHTML = `
        <style>
          .flexcol{
              display: flex;
              flex: 1 1 0%
          }
          .coderunnerMain{
              display: flex;
              flex-direction: column;
              flex: 1 1 0%;
              align-items: center;
              height: 100vh;
          }
          .coderunner{
              display: flex;
              height: 100vh;
              width: 91.67%;
              background-color: rgb(226, 232, 240);
              border-radius: 0.5rem;
              box-sizing: border-box;
              margin-bottom: 1.25rem;
              flex-direction: column;
              overflow: hidden;
          }
          .coderunnerHeader{
              display: flex;
              width: 100%;
              justify-content: space-between;
              box-sizing: border-box;
              padding-left: 1.25rem;
              padding-right: 1.25rem;
              padding-top: 0.75rem;
              margin-bottom: 0.75rem;
          }
          .coderunnerHeaderButtons{
              display: flex;
              gap: 0.75rem;
              align-items: center;
          }
          .runButton{
              cursor: pointer;
              background: none;
              border: none
          }
          .coderunnerInner{
              display: flex;
              flex-direction: column;
              width: 100%;
              height: 100%;
          }
          .codeEditor{
              width: 100%;
              resize: none;
          }
        </style>
        <div class="coderunnerHeader">
        <select id="language">
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
            <div class="coderunnerHeaderButtons">
            <button id="runButton" class="runButton">Run</button>
            </div>
        </div>
        <div class="coderunnerInner">
            <div id="editor" class="flexcol">
            <textarea id="codeField" class="codeEditor">${this.getAttribute('initialCode')}</textarea>
            </div>
            <div id="output" class="flexcol">
            <iframe id="resultFrame" width="100%" height="400" title="Result Frame"></iframe>
            </div>
        </div>
      `;
      this.initializeCodeRunner(this.getAttribute('language'), this.getAttribute('initialCode'));
  }

  initializeCodeRunner(language, initialCode) {
      const codeInput = this.shadowRoot.getElementById('codeField');
      const runButton = this.shadowRoot.getElementById('runButton');
      const resultFrame = this.shadowRoot.getElementById('resultFrame');
      const languageDropdown = this.shadowRoot.getElementById('language');

      // Set initial values
      codeInput.value = initialCode;
      
      // Event listener for the run button
      runButton.addEventListener('click', async (event) => {
        event.preventDefault();
    
      const code = codeInput.value; // Get code from the textarea
      
          // Prepare data to send to the server
      const requestData = {
          language: languageDropdown.value,
          code: code
      };
      
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
          // Display the result received from the server in the iframe
          resultFrame.contentDocument.body.innerText = result;
      })
      .catch(error => {
          // Log the error
          console.error('Error:', error);
          resultFrame.contentDocument.body.innerText = 'An error occurred. Please try again.';
      });
      });
  }
}

window.customElements.define('code-block', CodeBlock);