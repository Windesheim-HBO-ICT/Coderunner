// Define the HTML structure as a JavaScript template string

// -- Old Code block --

// const codeBlockHTML = (language) => `
// <div id="codeRunner">
//   <p>Language: <span id="language">${language}</span></p>
//   <button id="runButton">Run</button>
//   <textarea id="codeField" rows="10"></textarea>
//   <iframe id="resultFrame" width="100%" height="500" title="Result Frame"></iframe>
// </div>
// `;

const codeBlockHtml = (language) => `
<div class="coderunnerHeader">
    <p id="language">${language}</p>
    <div class="coderunnerHeaderButtons">
        <button id="runButton" class="runButton"><svg width="32px" height="32px" viewBox="0 0 24.00 24.00" fill="lightgreen" xmlns="http://www.w3.org/2000/svg" transform="rotate(90)" stroke="#2afa00"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"> <g id="Shape / Triangle"> <path id="Vector" d="M4.37891 15.1999C3.46947 16.775 3.01489 17.5634 3.08281 18.2097C3.14206 18.7734 3.43792 19.2851 3.89648 19.6182C4.42204 20.0001 5.3309 20.0001 7.14853 20.0001H16.8515C18.6691 20.0001 19.5778 20.0001 20.1034 19.6182C20.5619 19.2851 20.8579 18.7734 20.9172 18.2097C20.9851 17.5634 20.5307 16.775 19.6212 15.1999L14.7715 6.79986C13.8621 5.22468 13.4071 4.43722 12.8135 4.17291C12.2957 3.94236 11.704 3.94236 11.1862 4.17291C10.5928 4.43711 10.1381 5.22458 9.22946 6.79845L4.37891 15.1999Z" stroke="#2afa00" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg></button>
    </div>
</div>
<div class="coderunnerInner">
    <div id="editor" class="flexcol">
        <textarea id="codeField" class="codeEditor"></textarea>
    </div>
    <div id="output" class="flexcol">
        <iframe id="resultFrame" width="100%" height="400" title="Result Frame"></iframe>
    </div>
</div> 
`


// Function to insert the codeBlock HTML into a specified container
export function insertCodeBlock(containerId, initialLanguage, initialCode = '') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = codeBlockHtml(initialLanguage);
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
  console.log(runButton);

  // Set initial values
  codeInput.value = initialCode;

  // Event listener for the run button
  runButton.addEventListener('click', async (event) => {
    event.preventDefault();
    console.log("Geklikt");

    const code = codeInput.value; // Get code from the textarea

    // Prepare data to send to the server
    const requestData = {
        language: initialLanguage,
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