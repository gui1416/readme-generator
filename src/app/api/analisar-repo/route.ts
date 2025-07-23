import { NextResponse } from 'next/server';

// Função auxiliar para buscar conteúdo de arquivo
async function fetchFileContent(repoUrl: string, filePath: string, token?: string): Promise<string | null> {
 const url = `${repoUrl}/contents/${filePath}`;
 try {
  const response = await fetch(url, {
   headers: {
    Accept: 'application/vnd.github.v3.raw', // Para obter o conteúdo bruto do arquivo
    ...(token && { Authorization: `token ${token}` }), // Adiciona token se disponível
   },
  });

  if (response.status === 404) {
   return null; // Arquivo não encontrado
  }
  if (!response.ok) {
   console.error(`Erro ao buscar ${filePath}:`, response.statusText);
   return null;
  }
  return await response.text();
 } catch (error) {
  console.error(`Exceção ao buscar ${filePath}:`, error);
  return null;
 }
}

export async function POST(request: Request) {
 try {
  // CORREÇÃO AQUI: Desestruturar 'repoUrl' para corresponder ao frontend
  const { repoUrl } = await request.json();

  if (!repoUrl) {
   return NextResponse.json({ error: 'URL do repositório é obrigatória.' }, { status: 400 });
  }

  // Regex mais robusta para validar URLs de repositórios GitHub
  const githubUrlRegex = /^https:\/\/(www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(\/.*)?$/;
  const match = repoUrl.match(githubUrlRegex); // Usar repoUrl aqui

  if (!match) {
   return NextResponse.json({ error: 'URL do GitHub inválida. Por favor, forneça uma URL de repositório válida.' }, { status: 400 });
  }

  const owner = match[2];
  const repoName = match[3];
  const githubApiBaseUrl = `https://api.github.com/repos/${owner}/${repoName}`;

  // Verificar se o repositório existe e obter informações adicionais
  const repoInfoResponse = await fetch(githubApiBaseUrl, {
   headers: {
    // É uma boa prática incluir um User-Agent.
    // Se você tiver um token de acesso pessoal (PAT) do GitHub, pode adicioná-lo aqui
    // para evitar limites de taxa de API para repositórios públicos ou acessar privados.
    // Authorization: `token SEU_GITHUB_PAT_AQUI`,
   },
  });

  if (repoInfoResponse.status === 404) {
   return NextResponse.json({ error: 'Repositório não encontrado. Verifique a URL.' }, { status: 404 });
  }
  if (!repoInfoResponse.ok) {
   console.error('Erro ao buscar informações do repositório:', repoInfoResponse.statusText);
   return NextResponse.json({ error: 'Não foi possível acessar o repositório. Pode ser privado ou o limite de taxa da API do GitHub foi excedido.' }, { status: repoInfoResponse.status });
  }

  const repoDetails = await repoInfoResponse.json();
  const defaultBranch = repoDetails.default_branch;
  const mainLanguage = repoDetails.language; // Linguagem principal do repositório

  // Buscar a estrutura de arquivos do repositório (apenas para a branch padrão)
  const contentsResponse = await fetch(`${githubApiBaseUrl}/contents?ref=${defaultBranch}`);
  if (!contentsResponse.ok) {
   console.error('Erro ao buscar conteúdos do repositório:', contentsResponse.statusText);
   return NextResponse.json({ error: 'Não foi possível listar os arquivos do repositório.' }, { status: contentsResponse.status });
  }
  const contentsData = await contentsResponse.json();

  // Definir tipo para os itens do conteúdo do repositório
  type RepoContentItem = {
   name: string;
   path: string;
   sha: string;
   size: number;
   url: string;
   html_url: string;
   git_url: string;
   download_url: string | null;
   type: 'file' | 'dir' | 'symlink' | 'submodule';
   [key: string]: unknown; // Para propriedades adicionais que possam existir
  };

  // Filtrar apenas arquivos (não diretórios) e pegar seus nomes
  const fileNames = (contentsData as RepoContentItem[])
   .filter((item) => item.type === 'file')
   .map((file) => file.name);

  // Buscar conteúdos de arquivos importantes
  const readmeContent = await fetchFileContent(githubApiBaseUrl, 'README.md');
  const packageJsonContent = await fetchFileContent(githubApiBaseUrl, 'package.json');
  const requirementsTxtContent = await fetchFileContent(githubApiBaseUrl, 'requirements.txt');

  let licenseType = null;
  let licenseContent = null;
  if (repoDetails.license) {
   licenseType = repoDetails.license.spdx_id || repoDetails.license.name;
   // Tentar buscar o conteúdo da licença se houver uma URL de download
   if (repoDetails.license.url) {
    try {
     const licenseResponse = await fetch(repoDetails.license.url, {
      headers: { Accept: 'application/vnd.github.v3.raw' } // Para obter o conteúdo bruto
     });
     if (licenseResponse.ok) {
      licenseContent = await licenseResponse.text();
     }
    } catch (error) {
     console.error('Erro ao buscar conteúdo da licença:', error);
    }
   }
  }

  return NextResponse.json({
   repoName: repoDetails.name,
   owner: repoDetails.owner.login,
   description: repoDetails.description,
   topics: repoDetails.topics,
   mainLanguage: mainLanguage, // Adicionado
   fileNames: fileNames,
   readmeContent: readmeContent,
   packageJsonContent: packageJsonContent,
   requirementsTxtContent: requirementsTxtContent,
   licenseType: licenseType,
   licenseContent: licenseContent, // Adicionado
   repoUrl: repoUrl, // Retornar a URL original como 'repoUrl' para consistência no frontend
  });
 } catch (error) {
  console.error('Erro na rota analisar-repo:', error);
  return NextResponse.json({ error: 'Erro interno do servidor ao analisar o repositório.' }, { status: 500 });
 }
}
