import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const {
      repoName,
      owner,
      description,
      topics,
      mainLanguage,
      fileNames,
      readmeContent,
      packageJsonContent,
      requirementsTxtContent,
      licenseType,
      licenseContent,
      customPromptAddition,
      repoUrl // Certifique-se de que repoUrl é recebido aqui
    } = await request.json();

    if (!repoName || !owner) {
      return NextResponse.json({ error: 'Nome do repositório e proprietário são obrigatórios.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY as string);
    // CORREÇÃO AQUI: Alterar o modelo de 'gemini-pro' para 'gemini-2.0-flash'
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Reconstruindo a string do prompt para evitar erros de sintaxe
    let prompt = `Você é um especialista em documentação de projetos de software. Sua tarefa é gerar um arquivo README.md abrangente e profissional para um repositório GitHub.
    
Considere as seguintes informações do repositório:
- Nome do Repositório: ${repoName}
- Proprietário: ${owner}
${description ? `- Descrição: ${description}` : ''}
${topics && topics.length > 0 ? `- Tópicos: ${topics.join(', ')}` : ''}
${mainLanguage ? `- Linguagem Principal: ${mainLanguage}` : ''}
- Arquivos Encontrados: ${fileNames.join(', ')}

${readmeContent ? `Conteúdo existente do README.md (se houver, para referência):
\`\`\`markdown
${readmeContent}
\`\`\`
` : 'Não há um README.md existente.'}

${packageJsonContent ? `Conteúdo do package.json (para projetos Node.js/JavaScript):
\`\`\`json
${packageJsonContent}
\`\`\`
` : 'Não foi encontrado package.json.'}

${requirementsTxtContent ? `Conteúdo do requirements.txt (para projetos Python):
\`\`\`
${requirementsTxtContent}
\`\`\`
` : 'Não foi encontrado requirements.txt.'}

${licenseType ? `- Tipo de Licença: ${licenseType}` : 'Não foi detectada uma licença específica.'}
${licenseContent ? `Conteúdo da Licença:
\`\`\`
${licenseContent}
\`\`\`
` : ''}


O README.md deve incluir as seguintes seções (use emojis relevantes para cada seção e links quando apropriado):

1.  **Título do Projeto**: Nome do repositório, talvez com um emoji ou badge.
2.  **Descrição**: Uma descrição concisa e clara do projeto, baseada na descrição do repositório e em qualquer inferência do conteúdo dos arquivos.
3.  **Recursos/Funcionalidades**: Liste os principais recursos ou funcionalidades que o projeto oferece.
4.  **Tecnologias Utilizadas**: Liste as principais tecnologias, frameworks e bibliotecas usadas. Use badges (shields.io) para as tecnologias principais, se possível.
5.  **Instalação**: Instruções passo a passo para configurar e instalar o projeto localmente. Inclua pré-requisitos.
6.  **Uso**: Exemplos de como usar o projeto, incluindo trechos de código se aplicável.
7.  **Estrutura do Projeto**: Uma breve visão geral da estrutura de diretórios, se relevante.
8.  **Contribuição**: Diretrizes sobre como outros desenvolvedores podem contribuir para o projeto.
9.  **Licença**: Informações sobre a licença do projeto. Se o conteúdo da licença foi fornecido, inclua-o ou um link para ele. Se apenas o tipo foi detectado, mencione o tipo. **Se nenhuma licença foi detectada, sugira a adição de uma licença e explique brevemente a importância.**
10. **Contato/Autor**: Como entrar em contato com o autor ou equipe.
11. **Agradecimentos (Opcional)**: Se houver alguma menção especial.

**Diretrizes Adicionais:**
-   Mantenha a linguagem clara, concisa e profissional.
-   Use formatação Markdown (títulos, listas, blocos de código, negrito, itálico).
-   Se uma seção não for aplicável ou não houver informações suficientes, indique isso de forma concisa ou omita-a.
-   **Se o repositório parecer ter poucas informações (ex: sem package.json, requirements.txt, ou descrição), gere um README mais genérico, mas ainda útil, e inclua uma seção sugerindo que o usuário adicione mais detalhes ao projeto para um README mais rico.**
-   **Para a seção de tecnologias, tente inferir as tecnologias com base nos \`fileNames\`, \`packageJsonContent\`, \`requirementsTxtContent\` e \`mainLanguage\`.**
-   **Se a licença não for encontrada, adicione um parágrafo no final da seção de licença sugerindo ao usuário que adicione uma licença e por que é importante.**
`;

    // Adicionar a adição personalizada ao prompt, se fornecida
    if (customPromptAddition) {
      prompt += `\n\n**Instruções Adicionais do Usuário:**\n${customPromptAddition}`;
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();

    return NextResponse.json({ readme: generatedText });
  } catch (error) {
    console.error('Erro na rota gerar-readme:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao gerar o README.' }, { status: 500 });
  }
}
