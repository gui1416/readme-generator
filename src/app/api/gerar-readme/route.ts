import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
 try {
  const { infoRepo, urlRepo } = await request.json()

  // Acessa a chave da API do Gemini do ambiente
  const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiApiKey) {
   return NextResponse.json(
    { error: "Chave da API Gemini não configurada." },
    { status: 500 }
   );
  }

  const prompt = `
Você é um escritor técnico especialista encarregado de criar um arquivo README.md abrangente para um repositório do GitHub em português brasileiro.

Informações do Repositório:
- Nome: ${infoRepo.name}
- Descrição: ${infoRepo.description}
- Linguagem Principal: ${infoRepo.language}
- Tópicos: ${infoRepo.topics.join(", ")}
- Tem Package.json: ${infoRepo.hasPackageJson}
- Tem Requirements.txt: ${infoRepo.hasRequirements}
- Tem Licença: ${infoRepo.hasLicense}
- URL do Repositório: ${urlRepo}
- Estrutura de Arquivos: ${infoRepo.structure.join(", ")}

Por favor, gere um arquivo README.md abrangente em português brasileiro que inclua:

1.  **Título e Descrição do Projeto**: Nome claro e envolvente do projeto e descrição
2.  **Badges**: Badges relevantes para o projeto (linguagem, licença, etc.)
3.  **Índice**: Para navegação fácil
4.  **Instruções de Instalação**: Guia passo a passo de configuração baseado na stack tecnológica detectada
5.  **Exemplos de Uso**: Exemplos de código e instruções básicas de uso
6.  **Funcionalidades**: Principais recursos e capacidades
7.  **Documentação da API**: Se aplicável baseado na estrutura do projeto
8.  **Diretrizes de Contribuição**: Como outros podem contribuir
9.  **Informações de Licença**: Se licença for detectada
10. **Contato/Suporte**: Como obter ajuda ou contatar mantenedores

Diretrizes:
- Use formatação Markdown adequada
- Inclua blocos de código com destaque de sintaxe apropriado
- Torne-o amigável para iniciantes mas abrangente
- Adapte o conteúdo baseado na linguagem de programação detectada e estrutura do projeto
- Inclua emojis relevantes para torná-lo visualmente atraente
- Garanta que todas as seções sejam bem organizadas e fáceis de ler
- Adicione conteúdo placeholder onde detalhes específicos não estão disponíveis, mas deixe claro o que deve ser preenchido
- Escreva TUDO em português brasileiro
Gere um README profissional e bem estruturado que ajudaria qualquer desenvolvedor a entender e usar este projeto.
`

  const { text } = await generateText({
   model: google("gemini-1.5-flash"),
   prompt,
   maxTokens: 4000,
  })

  return NextResponse.json({ readme: text })
 } catch (error) {
  console.error("Erro ao gerar README:", error)
  return NextResponse.json({ error: "Falha ao gerar README" }, { status: 500 })
 }
}