import { type NextRequest, NextResponse } from "next/server"

interface ArquivoGitHub {
 name: string
 type: string
 path: string
}

interface RepoGitHub {
 name: string
 description: string
 language: string
 topics: string[]
 license?: { name: string }
}

export async function POST(request: NextRequest) {
 try {
  const { urlRepo } = await request.json()

  const urlMatch = urlRepo.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!urlMatch) {
   return NextResponse.json({ error: "URL do GitHub inválida" }, { status: 400 })
  }

  const [, owner, repo] = urlMatch
  const repoLimpo = repo.replace(/\.git$/, "")

  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repoLimpo}`)
  if (!repoResponse.ok) {
   return NextResponse.json({ error: "Repositório não encontrado" }, { status: 404 })
  }

  const repoData: RepoGitHub = await repoResponse.json()

  const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repoLimpo}/contents`)
  const contentsData: ArquivoGitHub[] = contentsResponse.ok ? await contentsResponse.json() : []

  const structure = contentsData.map((file) => file.name)
  const hasPackageJson = structure.includes("package.json")
  const hasRequirements = structure.includes("requirements.txt") || structure.includes("Pipfile")
  const hasLicense = !!repoData.license

  const arquivosImportantes = ["README.md", "package.json", "requirements.txt", "setup.py", "Cargo.toml", "go.mod"]
  const conteudoArquivos: Record<string, string> = {}

  for (const nomeArquivo of arquivosImportantes) {
   if (structure.includes(nomeArquivo)) {
    try {
     const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repoLimpo}/contents/${nomeArquivo}`)
     if (fileResponse.ok) {
      const fileData = await fileResponse.json()
      if (fileData.content) {
       conteudoArquivos[nomeArquivo] = Buffer.from(fileData.content, "base64").toString("utf-8")
      }
     }
    } catch (error) {

     console.log(`Falha ao buscar ${nomeArquivo}:`, error)
    }
   }
  }

  return NextResponse.json({
   name: repoData.name,
   description: repoData.description || "",
   language: repoData.language || "",
   topics: repoData.topics || [],
   hasLicense,
   hasPackageJson,
   hasRequirements,
   structure,
   conteudoArquivos,
  })
 } catch (error) {
  console.error("Erro ao analisar repositório:", error)
  return NextResponse.json({ error: "Falha ao analisar repositório" }, { status: 500 })
 }
}
