import type { ResearchRequest } from './types.js';
import { generateSlug, titleFromUrl, titleFromText, isGitHubUrl } from './utils.js';

export function generateResearchPrompt(request: ResearchRequest): string {
  const slug = generateSlug(
    request.url || request.text?.slice(0, 50) || 'research'
  );
  const basePath = `./research/${slug}`;
  const timestamp = new Date().toISOString();

  if (request.type === 'url' && request.url) {
    return generateUrlPrompt(request.url, basePath, timestamp);
  }

  return generateXPostPrompt(
    request.text || '',
    request.containedUrls || [],
    basePath,
    timestamp
  );
}

function generateUrlPrompt(
  url: string,
  basePath: string,
  timestamp: string
): string {
  const isGitHub = isGitHubUrl(url);
  const title = titleFromUrl(url);

  const implementationPhase = isGitHub
    ? `2. **Implementation Phase**
   - Clone the repository to \`${basePath}/repo/\`
   - Explore the codebase structure and understand the architecture
   - Run any available tests or examples
   - Identify the key features and how they work`
    : `2. **Implementation Phase**
   - Create folder: \`${basePath}/\`
   - Implement the KEY examples (focus on 2-3 most important ones)
   - If it's a library/tool: create a working demo
   - If it's a concept: create a minimal proof-of-concept`;

  return `## Research & Implementation Task

I found an interesting resource that I want to learn from:

**URL:** ${url}
**Type:** ${isGitHub ? 'GitHub Repository' : 'Web Article/Tutorial'}

### Your Mission:

1. **Research Phase**
   - Visit and thoroughly read the content at this URL
   - Identify the main concepts, techniques, or tools being discussed
   - Note the KEY code examples or implementation details (not everything)

${implementationPhase}

3. **Testing Phase**
   - Run any available tests
   - Verify your implementation works as expected
   - Document any issues, adaptations, or environment requirements

4. **Report Generation**
   Create a comprehensive markdown report at \`${basePath}/REPORT.md\` with this structure:

\`\`\`markdown
# Research Report: ${title}

## Summary
[2-3 sentences about what this is and why it's interesting]

## Key Concepts
- [Main idea 1]
- [Main idea 2]
- [Main idea 3]

## Implementation Details
### What I Built
[Description of implementation]

### Key Files
- \`path/to/file\` - [purpose]

### How to Run
\`\`\`bash
# Commands to run the implementation
\`\`\`

## Test Results
- [x] [Test that passed]
- [ ] [Test that failed or wasn't available]

### Issues Encountered
[Any problems and how they were solved]

## Applications
[Practical use cases for this knowledge]

## Assessment
**Quality:** [1-5 stars]
**Usefulness:** [1-5 stars]
**Recommendation:** [Should others check this out? Why?]

## Source
- **URL:** ${url}
- **Researched:** ${timestamp}
\`\`\`

### Guidelines:
- Focus on KEY examples only, not exhaustive coverage
- Make implementations actually work
- Be honest about what doesn't work
- Be efficient with your time
`;
}

function generateXPostPrompt(
  text: string,
  containedUrls: string[],
  basePath: string,
  timestamp: string
): string {
  const title = titleFromText(text);
  const hasGitHub = containedUrls.some(isGitHubUrl);
  const hasUrls = containedUrls.length > 0;

  const urlsSection = hasUrls
    ? `**URLs in post:**
${containedUrls.map((u) => `- ${u}`).join('\n')}`
    : '';

  const buildPhase = hasGitHub
    ? `- Clone any GitHub repositories to \`${basePath}/repo/\`
   - Explore the code, run tests if available
   - Understand what makes it interesting`
    : hasUrls
      ? `- Visit the URLs to gather more context
   - Build a proof-of-concept of the idea described
   - Focus on the core concept, not everything`
      : `- Research the topic mentioned
   - Build a minimal proof-of-concept of the idea
   - Focus on demonstrating the core concept`;

  return `## Research & Build from X Post

I found an interesting X/Twitter post:

**Tweet:**
> ${text}

${urlsSection}

### Your Mission:

1. **Understand the Idea**
   - Parse what the post is describing
   - Identify the core concept or technique
   ${hasUrls ? '- Visit URLs for additional context' : '- Research the topic to understand it better'}

2. **Build**
   - Create folder: \`${basePath}/\`
   ${buildPhase}

3. **Test & Verify**
   - Test your implementation
   - Verify it demonstrates the concept
   - Document what works

4. **Generate Report**
   Create \`${basePath}/REPORT.md\` with this structure:

\`\`\`markdown
# Research: ${title}

## Original Post
> ${text.slice(0, 280)}${text.length > 280 ? '...' : ''}

${hasUrls ? `## Referenced URLs\n${containedUrls.map((u) => `- ${u}`).join('\n')}` : ''}

## What I Built
[Description of your implementation]

### Key Files
- \`path/to/file\` - [purpose]

### How to Run
\`\`\`bash
# Commands to run
\`\`\`

## Key Findings
- [Finding 1]
- [Finding 2]

## Test Results
[What worked, what didn't]

## Potential Applications
[Real-world uses for this]

## Assessment
**Is this useful?** [Yes/No/Maybe]
**Quality of idea:** [1-5 stars]
**Worth exploring further?** [Yes/No]

## Source
- **Post:** X/Twitter
- **Researched:** ${timestamp}
\`\`\`

### Guidelines:
- Focus on the CORE idea, not everything mentioned
- Build something minimal but functional
- Be practical and efficient
`;
}

export function generateSessionTitle(request: ResearchRequest): string {
  if (request.type === 'url' && request.url) {
    return `Build & Learn: ${titleFromUrl(request.url)}`;
  }

  if (request.text) {
    return `Build & Learn: ${titleFromText(request.text, 50)}`;
  }

  return `Build & Learn: Research ${new Date().toLocaleDateString()}`;
}
