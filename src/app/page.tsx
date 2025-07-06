"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Github,
  Loader2,
  Sparkles,
  FileText,
  Zap,
  History,
  Trash2,
  RotateCcw,
  Clock,
  ExternalLink,
  Eye,
  Code,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"

interface InfoRepositorio {
  name: string
  description: string
  language: string
  topics: string[]
  hasLicense: boolean
  hasPackageJson: boolean
  hasRequirements: boolean
  structure: string[]
}

interface HistoricoItem {
  id: string
  url: string
  info: InfoRepositorio
  readme?: string
  timestamp: number
}

export default function GeradorReadme() {
  const [urlRepo, setUrlRepo] = useState("")
  const [analisando, setAnalisando] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [infoRepo, setInfoRepo] = useState<InfoRepositorio | null>(null)
  const [readmeGerado, setReadmeGerado] = useState("")
  const [erro, setErro] = useState("")
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState("codigo")

  // Carregar histórico do localStorage ao inicializar
  useEffect(() => {
    const historicoSalvo = localStorage.getItem("readme-generator-historico")
    if (historicoSalvo) {
      try {
        setHistorico(JSON.parse(historicoSalvo))
      } catch (error) {
        console.error("Erro ao carregar histórico:", error)
      }
    }
  }, [])

  // Salvar histórico no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("readme-generator-historico", JSON.stringify(historico))
  }, [historico])

  const salvarNoHistorico = (url: string, info: InfoRepositorio, readme?: string) => {
    const novoItem: HistoricoItem = {
      id: Date.now().toString(),
      url,
      info,
      readme,
      timestamp: Date.now(),
    }

    setHistorico((prev) => {
      // Remove item duplicado se existir (mesmo URL)
      const filtrado = prev.filter((item) => item.url !== url)
      // Adiciona no início e mantém apenas os últimos 10
      return [novoItem, ...filtrado].slice(0, 10)
    })
  }

  const carregarDoHistorico = (item: HistoricoItem) => {
    setUrlRepo(item.url)
    setInfoRepo(item.info)
    if (item.readme) {
      setReadmeGerado(item.readme)
    }
    setErro("")
    toast.success("Análise carregada", {
      description: `Repositório ${item.info.name} carregado do histórico.`,
    })
  }

  const limparHistorico = () => {
    setHistorico([])
    toast.success("Histórico limpo", {
      description: "Todas as análises anteriores foram removidas.",
    })
  }

  const analisarRepositorio = async () => {
    if (!urlRepo.trim()) {
      setErro("Por favor, insira uma URL de repositório")
      return
    }

    setAnalisando(true)
    setErro("")
    setInfoRepo(null)
    setReadmeGerado("")

    const loadingToast = toast.loading("Analisando repositório...", {
      description: "Buscando informações do GitHub",
    })

    try {
      const response = await fetch("/api/analisar-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlRepo }),
      })

      if (!response.ok) {
        throw new Error("Falha ao analisar repositório")
      }

      const data = await response.json()
      setInfoRepo(data)
      salvarNoHistorico(urlRepo, data)

      toast.success("Repositório analisado com sucesso!", {
        description: `${data.name} está pronto para gerar README`,
        id: loadingToast,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Falha ao analisar repositório"
      setErro(errorMessage)
      toast.error("Erro na análise", {
        description: errorMessage,
        id: loadingToast,
      })
    } finally {
      setAnalisando(false)
    }
  }

  const gerarReadme = async () => {
    if (!infoRepo) return

    setGerando(true)
    setErro("")

    const loadingToast = toast.loading("Gerando README...", {
      description: "IA Gemini está criando sua documentação",
    })

    try {
      const response = await fetch("/api/gerar-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ infoRepo, urlRepo }),
      })

      if (!response.ok) {
        throw new Error("Falha ao gerar README")
      }

      const data = await response.json()
      setReadmeGerado(data.readme)

      // Atualizar histórico com README gerado
      salvarNoHistorico(urlRepo, infoRepo, data.readme)

      toast.success("README gerado com sucesso!", {
        description: "Sua documentação profissional está pronta",
        id: loadingToast,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Falha ao gerar README"
      setErro(errorMessage)
      toast.error("Erro na geração", {
        description: errorMessage,
        id: loadingToast,
      })
    } finally {
      setGerando(false)
    }
  }

  const copiarParaClipboard = async () => {
    try {
      await navigator.clipboard.writeText(readmeGerado)
      toast.success("Copiado com sucesso!", {
        description: "README copiado para área de transferência",
      })
    } catch (err) {
      toast.error("Erro ao copiar", {
        description: "Não foi possível copiar para a área de transferência",
      })
    }
  }

  const baixarReadme = () => {
    const blob = new Blob([readmeGerado], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "README.md"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Download iniciado!", {
      description: "Arquivo README.md baixado com sucesso",
    })
  }

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-neutral-900 rounded-2xl shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-transparent">
              Gerador de README
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Transforme qualquer repositório em documentação profissional com o poder da inteligência artificial
            </p>
          </div>
        </div>

        {/* Histórico Toggle */}
        {historico.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setMostrarHistorico(!mostrarHistorico)}
              className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-6 py-2 rounded-lg font-medium bg-white/80 backdrop-blur-sm"
            >
              <History className="w-4 h-4 mr-2" />
              {mostrarHistorico ? "Ocultar Histórico" : `Ver Histórico (${historico.length})`}
            </Button>
          </div>
        )}

        {/* Histórico */}
        {mostrarHistorico && historico.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Clock className="w-5 h-5 text-neutral-700" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-neutral-900">Histórico de Análises</CardTitle>
                    <CardDescription className="text-neutral-600 mt-1">
                      Suas análises anteriores salvas automaticamente
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={limparHistorico}
                  className="border-red-300 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-medium bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-neutral-900">{item.info.name}</h4>
                        {item.info.language && (
                          <Badge variant="secondary" className="text-xs">
                            {item.info.language}
                          </Badge>
                        )}
                        {item.readme && <Badge className="bg-green-100 text-green-800 text-xs">README Gerado</Badge>}
                      </div>
                      <p className="text-sm text-neutral-600 truncate max-w-md">
                        {item.info.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{formatarData(item.timestamp)}</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-neutral-700 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver no GitHub
                        </a>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => carregarDoHistorico(item)}
                      className="border-neutral-300 text-neutral-700 hover:bg-white px-4 py-2 rounded-lg font-medium bg-transparent ml-4"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Carregar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Section */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg">
                <Github className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <CardTitle className="text-2xl text-neutral-900">Análise do Repositório</CardTitle>
                <CardDescription className="text-neutral-600 mt-1">
                  Cole a URL do seu repositório GitHub para começar a análise inteligente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="url-repo" className="text-sm font-medium text-neutral-700">
                URL do Repositório
              </Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    id="url-repo"
                    placeholder="https://github.com/usuario/repositorio"
                    value={urlRepo}
                    onChange={(e) => setUrlRepo(e.target.value)}
                    className="pl-4 pr-4 py-3 text-base border-neutral-200 focus:border-neutral-400 focus:ring-neutral-400 rounded-xl"
                  />
                </div>
                <Button
                  onClick={analisarRepositorio}
                  disabled={analisando}
                  className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {analisando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analisar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {erro && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{erro}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Repository Info */}
        {infoRepo && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-neutral-900">Repositório Analisado</CardTitle>
                  <CardDescription className="text-neutral-600 mt-1">
                    Informações extraídas e processadas com sucesso
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                      Nome do Projeto
                    </Label>
                    <p className="text-2xl font-bold text-neutral-900">{infoRepo.name}</p>
                  </div>

                  {infoRepo.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Descrição</Label>
                      <p className="text-neutral-700 leading-relaxed">{infoRepo.description}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                      Linguagem Principal
                    </Label>
                    <Badge
                      variant="secondary"
                      className="bg-neutral-100 text-neutral-800 px-3 py-1 text-sm font-medium"
                    >
                      {infoRepo.language || "Não detectada"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                      Tecnologias Detectadas
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {infoRepo.hasPackageJson && (
                        <Badge className="bg-neutral-900 text-white px-3 py-1">Node.js</Badge>
                      )}
                      {infoRepo.hasRequirements && (
                        <Badge className="bg-neutral-900 text-white px-3 py-1">Python</Badge>
                      )}
                      {infoRepo.hasLicense && <Badge className="bg-neutral-900 text-white px-3 py-1">Licenciado</Badge>}
                      {!infoRepo.hasPackageJson && !infoRepo.hasRequirements && !infoRepo.hasLicense && (
                        <span className="text-neutral-500 text-sm">Nenhuma tecnologia específica detectada</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {infoRepo.topics.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Tópicos do Repositório
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {infoRepo.topics.map((topic) => (
                      <Badge key={topic} variant="outline" className="border-neutral-300 text-neutral-700 px-3 py-1">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="bg-neutral-200" />

              <div className="flex justify-center pt-4">
                <Button
                  onClick={gerarReadme}
                  disabled={gerando}
                  size="lg"
                  className="px-12 py-4 bg-gradient-to-r from-neutral-900 to-neutral-700 hover:from-neutral-800 hover:to-neutral-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  {gerando ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Gerando README...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Gerar README Profissional
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated README with Preview */}
        {readmeGerado && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-neutral-900">README Gerado</CardTitle>
                    <CardDescription className="text-neutral-600 mt-1">
                      Seu arquivo README profissional está pronto para uso
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={copiarParaClipboard}
                    className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-6 py-2 rounded-lg font-medium bg-transparent"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={baixarReadme}
                    className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-6 py-2 rounded-lg font-medium bg-transparent"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-neutral-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="codigo"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Code className="w-4 h-4" />
                    Código Markdown
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="codigo" className="mt-6">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 max-h-[600px] overflow-y-auto">
                    <Textarea
                      value={readmeGerado}
                      readOnly
                      className="min-h-[500px] font-mono text-sm bg-transparent border-none resize-none focus:ring-0 text-neutral-800 leading-relaxed"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-6">
                  <div className="bg-white border border-neutral-200 rounded-xl p-8 max-h-[600px] overflow-y-auto prose prose-neutral max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "")
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneLight}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code
                              className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold text-neutral-900 mb-6 pb-3 border-b border-neutral-200">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-semibold text-neutral-800 mt-8 mb-4">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-semibold text-neutral-800 mt-6 mb-3">{children}</h3>
                        ),
                        p: ({ children }) => <p className="text-neutral-700 leading-relaxed mb-4">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4">{children}</ol>,
                        li: ({ children }) => <li className="text-neutral-700">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-neutral-300 pl-4 italic text-neutral-600 my-4">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-6">
                            <table className="min-w-full border border-neutral-200 rounded-lg">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-neutral-200 px-4 py-2 bg-neutral-50 font-semibold text-left">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => <td className="border border-neutral-200 px-4 py-2">{children}</td>,
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-neutral-900 underline hover:text-neutral-700 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {readmeGerado}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-neutral-500 text-sm">
            Desenvolvido usando IA Gemini • Transforme seus repositórios em documentação profissional
          </p>
        </div>
      </div>
    </div>
  )
}
