import { Endpoint } from '../interfaces/endpoint.interface';

export function formatToHtml(endpoint: Endpoint): string {
  let html = `<h1>${endpoint.endpoint}</h1>\n`;
  html += `<p><strong>Method:</strong> ${endpoint.method}</p>\n`;
  html += `<p><strong>Description:</strong> ${endpoint.description}</p>\n`;

  if (endpoint.parameters && endpoint.parameters.length > 0) {
    html += `<h2>Parameters</h2>\n`;
    html += `<ul>\n`;
    endpoint.parameters.forEach(param => {
      html += `<li><strong>${param.name}</strong> (${param.type}): ${param.description} (${param.required ? 'required' : 'optional'})</li>\n`;
    });
    html += `</ul>\n`;
  }

  if (endpoint.exampleRequest) {
    html += `<h2>Example Request</h2>\n`;
    html += `<pre><code>${endpoint.exampleRequest}</code></pre>\n`;
  }

  if (endpoint.exampleResponse) {
    html += `<h2>Example Response</h2>\n`;
    html += `<pre><code class="json">${endpoint.exampleResponse}</code></pre>\n`;
  }

  if (endpoint.snippets && Object.keys(endpoint.snippets).length > 0) {
    html += `<h2>Code Snippets</h2>\n`;
    for (const language in endpoint.snippets) {
      html += `<h3>${language}</h3>\n`;
      html += `<pre><code class="${language}">${endpoint.snippets[language]}</code></pre>\n`;
    }
  }

  return html;
}
