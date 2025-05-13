import { Endpoint } from '../interfaces/endpoint.interface';

export function formatToMarkdown(endpoint: Endpoint): string {
  let markdown = `# ${endpoint.endpoint}\n\n`;
  markdown += `**Method:** ${endpoint.method}\n\n`;
  markdown += `**Description:** ${endpoint.description}\n\n`;

  if (endpoint.parameters && endpoint.parameters.length > 0) {
    markdown += `## Parameters\n\n`;
    endpoint.parameters.forEach(param => {
      markdown += `- **${param.name}** (${param.type}): ${param.description} (${param.required ? 'required' : 'optional'})\n`;
    });
    markdown += `\n`;
  }

  if (endpoint.exampleRequest) {
    markdown += `## Example Request\n\n`;
    markdown += `\`\`\`\n${endpoint.exampleRequest}\n\`\`\`\n\n`;
  }

  if (endpoint.exampleResponse) {
    markdown += `## Example Response\n\n`;
    markdown += `\`\`\`json\n${endpoint.exampleResponse}\n\`\`\`\n\n`;
  }

  if (endpoint.snippets && Object.keys(endpoint.snippets).length > 0) {
    markdown += `## Code Snippets\n\n`;
    for (const language in endpoint.snippets) {
      markdown += `### ${language}\n\n`;
      markdown += `\`\`\`${language}\n${endpoint.snippets[language]}\n\`\`\`\n\n`;
    }
  }

  return markdown;
}
