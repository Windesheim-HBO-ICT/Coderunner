// Define the HTML structure as a JavaScript template string
const codeBlockHTML = (language) => `
<div id="codeRunner">
  <p>Language: <span id="language">${language}</span></p>
  <button id="runButton">Run</button>
  <textarea id="codeField" rows="10"></textarea>
  <iframe id="resultFrame" width="100%" height="300" title="Result Frame"></iframe>
</div>
`;

// Function to insert the codeBlock HTML into a specified container
export function insertCodeBlock(containerId, initialLanguage, initialCode = '') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = codeBlockHTML(initialLanguage);
    initializeCodeRunner(initialLanguage, initialCode);
  } else {
    console.error(`Container with id "${containerId}" not found.`);
  }
}

// Initialize the code runner component
function initializeCodeRunner(initialLanguage, initialCode) {
  const codeInput = document.getElementById('codeField');
  const runButton = document.getElementById('runButton');
  const resultFrame = document.getElementById('resultFrame');

  // Set initial values
  codeInput.value = initialCode;

  // Event listener for the run button
  runButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const code = codeInput.value; // Get code from the textarea

    // Prepare data to send to the server
    const requestData = {
        language: initialLanguage,
        code: code
    };

    // Make a POST request to the server
    await fetch('http://127.0.0.1:8080/code', {
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