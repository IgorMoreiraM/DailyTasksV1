"""
DailyTasks Bot — Telegram + Google Gemini
==========================================
- Autenticação via token gerado no site (ConfiguracoesPage)
- Sessão expira após 12 horas
- Fluxo inteligente de criação de tarefa
"""

import os
import json
import logging
import tempfile
from pathlib import Path
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    CallbackQueryHandler, ContextTypes, filters,
)

import google.generativeai as genai
from dailytasks_api import DailyTasksAPI
from session_store import SessionStore

# ── Configuração ──────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN  = os.getenv("TELEGRAM_TOKEN")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
DAILYTASKS_URL  = os.getenv("DAILYTASKS_URL", "http://localhost:8080")
SESSION_TIMEOUT = timedelta(hours=12)

genai.configure(api_key=GEMINI_API_KEY)
sessions = SessionStore()

# ── Prompt do Gemini ──────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
Você é um assistente de gerenciamento de tarefas para o sistema DailyTasks.
Sua função é interpretar comandos de voz ou texto em português e retornar um JSON estruturado.

Responda APENAS com JSON válido, sem markdown, sem explicações.

Comandos disponíveis:

- criar_projeto:
  { "acao": "criar_projeto", "nome": "...", "descricao": "..." }

- criar_tarefa:
  {
    "acao": "criar_tarefa",
    "titulo": "...",
    "descricao": "...",
    "funcionario": "nome do funcionário ou null",
    "prazo": "YYYY-MM-DD (obrigatório — se não informado use null)",
    "projeto": "nome do projeto ou null",
    "coluna": "nome da coluna ou null"
  }

- listar_tarefas:
  { "acao": "listar_tarefas", "filtro": "pendentes|em_andamento|concluidas|todas" }

- alterar_status:
  { "acao": "alterar_status", "tarefa": "parte do título", "status": "PENDENTE|EM_ANDAMENTO|CONCLUIDA|BLOQUEADA|CANCELADA" }

- ajuda: { "acao": "ajuda" }
- desconhecido: { "acao": "desconhecido", "mensagem": "o que foi dito" }

Regras:
- Prazo é OBRIGATÓRIO para criar_tarefa. Se não mencionado, use null.
- Extraia projeto se mencionado: "no projeto App Mobile" → "projeto": "App Mobile"
- Extraia coluna se mencionada: "na coluna A Fazer" → "coluna": "A Fazer"
- Converta datas relativas para YYYY-MM-DD. Data de hoje: {hoje}

Exemplos:
- "Cria tarefa de login para Ana prazo sexta no projeto App Mobile coluna A Fazer"
  → { "acao": "criar_tarefa", "titulo": "login", "funcionario": "Ana", "prazo": "2026-04-04", "projeto": "App Mobile", "coluna": "A Fazer" }
"""


# ── Sessão com expiração ──────────────────────────────────────────────────────

def sessao_valida(tid: int) -> bool:
    if not sessions.tem_sessao(tid):
        return False
    criada_em = sessions.get_criada_em(tid)
    if criada_em is None:
        return False
    if datetime.now() - criada_em > SESSION_TIMEOUT:
        sessions.remover(tid)
        return False
    return True


async def verificar_sessao(update: Update) -> bool:
    tid = update.effective_user.id
    if not sessions.tem_sessao(tid):
        await update.message.reply_text(
            "🔐 *Você precisa conectar sua conta.*\n\n"
            "1️⃣ Acesse o *DailyTasks* no navegador\n"
            "2️⃣ Vá em *Configurações → Bot Telegram*\n"
            "3️⃣ Clique em *Gerar Token*\n"
            "4️⃣ Cole aqui o comando gerado\n\n"
            "Exemplo: `/conectar 847291`",
            parse_mode="Markdown"
        )
        return False

    if not sessao_valida(tid):
        info = sessions.get_info(tid)
        nome = info.get("nomeCompleto", "usuário") if info else "usuário"
        await update.message.reply_text(
            f"⏰ *Sessão expirada*, {nome}.\n\n"
            "Por segurança, as sessões expiram após *12 horas*.\n\n"
            "Para reconectar:\n"
            "1️⃣ Acesse o *DailyTasks* no navegador\n"
            "2️⃣ Vá em *Configurações → Bot Telegram*\n"
            "3️⃣ Clique em *Gerar Token*\n"
            "4️⃣ Cole o comando `/conectar TOKEN` aqui",
            parse_mode="Markdown"
        )
        return False

    return True


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_gemini_response(texto: str) -> dict:
    texto = texto.strip()
    if "```" in texto:
        partes = texto.split("```")
        for parte in partes:
            parte = parte.strip()
            if parte.startswith("json"):
                parte = parte[4:].strip()
            try:
                return json.loads(parte)
            except json.JSONDecodeError:
                continue
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', texto, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


async def chamar_gemini_texto(texto: str, data_hoje: str) -> dict:
    model    = genai.GenerativeModel("gemini-2.5-flash")
    prompt   = SYSTEM_PROMPT.replace("{hoje}", data_hoje) + f"\n\nInterprete: {texto}"
    response = model.generate_content(prompt)
    logger.info(f"Gemini retornou: {response.text}")
    return parse_gemini_response(response.text)


async def chamar_gemini_audio(audio_path: str, data_hoje: str) -> dict:
    model      = genai.GenerativeModel("gemini-2.5-flash")
    audio_file = genai.upload_file(audio_path)
    prompt     = SYSTEM_PROMPT.replace("{hoje}", data_hoje) + \
        "\n\nTranscreva o áudio e retorne o JSON do comando."
    response = model.generate_content([audio_file, prompt])
    logger.info(f"Gemini (áudio) retornou: {response.text}")
    return parse_gemini_response(response.text)


def _prazo_valido(prazo) -> bool:
    """Retorna True se o prazo é uma string não vazia."""
    return isinstance(prazo, str) and bool(prazo.strip())


def _esta_atrasada(tarefa: dict, hoje: str) -> bool:
    """Verifica se a tarefa está atrasada de forma segura (sem NoneType)."""
    prazo  = tarefa.get("dataDeVencimento")
    status = tarefa.get("status", "")
    if not _prazo_valido(prazo):
        return False
    if status in ("CONCLUIDA", "CANCELADA"):
        return False
    try:
        return prazo < hoje
    except TypeError:
        return False


def formatar_lista_tarefas(tarefas: list) -> str:
    if not tarefas:
        return "✅ Nenhuma tarefa encontrada."

    hoje = date.today().isoformat()

    STATUS_EMOJI = {
        "PENDENTE":     "🟡",
        "EM_ANDAMENTO": "🔵",
        "CONCLUIDA":    "🟢",
        "BLOQUEADA":    "🔴",
        "CANCELADA":    "⚫",
    }

    linhas = []
    for t in tarefas[:15]:
        status   = t.get("status", "")
        prazo    = t.get("dataDeVencimento")
        atrasada = _esta_atrasada(t, hoje)

        if atrasada:
            emoji     = "🔴"
            prazo_str = f" · ⚠️ *Atrasada* (venceu {prazo})"
        else:
            emoji     = STATUS_EMOJI.get(status, "⚪")
            prazo_str = f" · 📅 {prazo}" if _prazo_valido(prazo) else ""

        projeto  = t.get("nomeProjeto", "")
        proj_str = f" _[{projeto}]_" if projeto else ""

        linhas.append(
            f"{emoji} *{t.get('titulo', '—')}*{proj_str}\n"
            f"   👤 {t.get('nomeFuncionario', '—')}{prazo_str}"
        )

    total     = len(tarefas)
    atrasadas = sum(1 for t in tarefas if _esta_atrasada(t, hoje))

    header = f"📋 *{total} tarefa{'s' if total != 1 else ''}*"
    if atrasadas:
        header += f" · ⚠️ *{atrasadas} atrasada{'s' if atrasadas != 1 else ''}*"
    header += "\n\n"

    return header + "\n\n".join(linhas)


def resolver_por_nome(nome: str, lista: list, campo: str = "nome") -> dict | None:
    if not nome:
        return None
    nome_lower = nome.lower().strip()
    for item in lista:
        if nome_lower == item.get(campo, "").lower():
            return item
    for item in lista:
        if nome_lower in item.get(campo, "").lower():
            return item
    return None


def montar_revisao_tarefa(dados: dict) -> tuple[str, InlineKeyboardMarkup]:
    titulo      = dados.get("titulo", "—")
    projeto     = dados.get("projeto_resolvido")
    coluna      = dados.get("coluna_resolvida")
    funcionario = dados.get("funcionario_resolvido")
    prazo       = dados.get("prazo", "")
    descricao   = dados.get("descricao", "")

    proj_str = projeto.get("nome",             "❓ Não identificado") if projeto     else "❓ Não identificado"
    col_str  = coluna.get("nome",              "📭 Sem coluna")       if coluna      else "📭 Sem coluna"
    func_str = funcionario.get("nomeCompleto", "❓ Não identificado") if funcionario else "❓ Não identificado"
    desc_str = f"\n📝 _{descricao}_" if descricao else ""

    faltando = []
    if not projeto:     faltando.append("projeto")
    if not funcionario: faltando.append("responsável")
    if not prazo:       faltando.append("prazo")

    msg = (
        f"📋 *Revisão da tarefa:*\n\n"
        f"📌 *{titulo}*{desc_str}\n"
        f"📁 *Projeto:* {proj_str}\n"
        f"📊 *Coluna:* {col_str}\n"
        f"👤 *Responsável:* {func_str}\n"
        f"📅 *Prazo:* {prazo or '❗ Não informado'}\n"
    )

    if faltando:
        msg += f"\n⚠️ Faltando: *{', '.join(faltando)}*"
        keyboard = InlineKeyboardMarkup([[InlineKeyboardButton("❌ Cancelar", callback_data="cancelar")]])
    else:
        msg += "\n✅ Tudo certo! Confirma a criação?"
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ Confirmar", callback_data="confirmar_tarefa"),
            InlineKeyboardButton("❌ Cancelar",  callback_data="cancelar"),
        ]])

    return msg, keyboard


async def _enviar_revisao(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg_texto, keyboard = montar_revisao_tarefa(context.user_data.get("tarefa_pendente", {}))
    if update.callback_query:
        await update.callback_query.edit_message_text(msg_texto, parse_mode="Markdown", reply_markup=keyboard)
    else:
        await update.message.reply_text(msg_texto, parse_mode="Markdown", reply_markup=keyboard)


async def _perguntar_projeto(destino, projetos: list):
    buttons = [[InlineKeyboardButton(p["nome"], callback_data=f"escolher_proj|{p['id']}")] for p in projetos[:8]]
    buttons.append([InlineKeyboardButton("❌ Cancelar", callback_data="cancelar")])
    await destino.reply_text("📁 Em qual *projeto* esta tarefa vai entrar?",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(buttons))


async def _perguntar_funcionario(destino, funcionarios: list):
    buttons = [[InlineKeyboardButton(f["nomeCompleto"], callback_data=f"escolher_func|{f['id']}")] for f in funcionarios[:8]]
    buttons.append([InlineKeyboardButton("❌ Cancelar", callback_data="cancelar")])
    await destino.reply_text("👤 Para qual *funcionário* esta tarefa será atribuída?",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(buttons))


async def _perguntar_coluna(destino, listas: list):
    buttons = [[InlineKeyboardButton(l["nome"], callback_data=f"escolher_col|{l['id']}")] for l in listas[:8]]
    buttons.append([InlineKeyboardButton("📭 Sem coluna", callback_data="escolher_col|0")])
    buttons.append([InlineKeyboardButton("❌ Cancelar",   callback_data="cancelar")])
    await destino.reply_text("📊 Em qual *coluna* do Kanban?",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(buttons))


async def _continuar_fluxo_tarefa(update: Update, context: ContextTypes.DEFAULT_TYPE, api: DailyTasksAPI):
    pendente = context.user_data.get("tarefa_pendente", {})
    destino  = update.message or (update.callback_query.message if update.callback_query else None)

    if not pendente.get("projeto_resolvido"):
        projetos = pendente.get("projetos") or api.listar_projetos()
        await _perguntar_projeto(destino, projetos)
        return

    if not pendente.get("funcionario_resolvido"):
        await _perguntar_funcionario(destino, api.listar_funcionarios())
        return

    if not pendente.get("coluna_resolvida") and pendente.get("coluna_resolvida") is not False:
        proj_id = pendente["projeto_resolvido"]["id"]
        listas  = api.listar_listas_projeto(proj_id)
        if listas:
            await _perguntar_coluna(destino, listas)
            return
        else:
            context.user_data["tarefa_pendente"]["coluna_resolvida"] = False

    await _enviar_revisao(update, context)


async def _tratar_erro_msg(msg, e: Exception):
    erro_str = str(e)
    logger.error(f"Erro: {erro_str}")
    if "429" in erro_str or "quota" in erro_str.lower():
        await msg.reply_text("⏳ Limite de requisições atingido. Aguarde alguns minutos e tente novamente.")
    else:
        await msg.reply_text(f"❌ Erro inesperado: {erro_str[:200]}")


# ── Handlers de comandos ──────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = update.effective_user.id
    if sessao_valida(tid):
        info    = sessions.get_info(tid)
        criada  = sessions.get_criada_em(tid)
        expira  = criada + SESSION_TIMEOUT if criada else None
        exp_str = expira.strftime("%H:%M") if expira else "—"
        await update.message.reply_text(
            f"👋 Olá, *{info['nomeCompleto']}*!\n\n"
            f"✅ Sessão ativa até *{exp_str}*\n\n"
            "Mande um áudio ou texto com seu comando.\n"
            "/ajuda para ver exemplos.",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(
            "👋 Bem-vindo ao *DailyTasks Bot*!\n\n"
            "Para conectar sua conta:\n\n"
            "1️⃣ Acesse o *DailyTasks* no navegador\n"
            "2️⃣ Vá em *Configurações → Bot Telegram*\n"
            "3️⃣ Clique em *Gerar Token*\n"
            "4️⃣ Cole aqui o comando gerado\n\n"
            "Exemplo: `/conectar 847291`",
            parse_mode="Markdown"
        )


async def cmd_conectar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) < 1:
        await update.message.reply_text(
            "⚠️ Use: `/conectar SEU_TOKEN`\n\n"
            "Gere o token em: *DailyTasks → Configurações → Bot Telegram*",
            parse_mode="Markdown"
        )
        return

    codigo = args[0].strip()
    await update.message.reply_text("🔄 Validando token...")

    api       = DailyTasksAPI(DAILYTASKS_URL)
    resultado = api.conectar_com_token(codigo)

    if resultado["ok"]:
        sessions.salvar(update.effective_user.id, resultado["token"], resultado["info"])
        info = resultado["info"]
        await update.message.reply_text(
            f"✅ *Conta conectada com sucesso!*\n\n"
            f"👤 *{info['nomeCompleto']}*\n"
            f"🏢 Papel: {info['role']}\n"
            f"⏰ Sessão válida por *12 horas*\n\n"
            "Agora mande um áudio ou texto com seu comando!\n"
            "/ajuda para ver os exemplos.",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(
            f"❌ *Falha na conexão:* {resultado['erro']}\n\n"
            "Verifique se o token ainda é válido (expira em 10 minutos) "
            "e foi gerado em *Configurações → Bot Telegram* no site.",
            parse_mode="Markdown"
        )


async def cmd_login(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) < 2:
        await update.message.reply_text(
            "⚠️ Use: `/login usuario senha`\n\n"
            "💡 Prefira usar `/conectar TOKEN` — mais seguro!\n"
            "Gere o token em *Configurações → Bot Telegram* no site.",
            parse_mode="Markdown"
        )
        return
    await update.message.reply_text("🔄 Autenticando...")
    api       = DailyTasksAPI(DAILYTASKS_URL)
    resultado = api.login(args[0], args[1])
    if resultado["ok"]:
        sessions.salvar(update.effective_user.id, resultado["token"], resultado["info"])
        info = resultado["info"]
        await update.message.reply_text(
            f"✅ *Login realizado!*\n\n"
            f"👤 *{info['nomeCompleto']}*\n"
            f"🏢 {info['role']}\n"
            f"⏰ Sessão válida por *12 horas*\n\n"
            "Mande seu comando!",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(f"❌ Falha: {resultado['erro']}")


async def cmd_logout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    sessions.remover(update.effective_user.id)
    context.user_data.clear()
    await update.message.reply_text(
        "👋 *Desconectado com sucesso!*\n\n"
        "Use `/conectar TOKEN` para reconectar.",
        parse_mode="Markdown"
    )


async def cmd_ajuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 *DailyTasks Bot — Comandos*\n\n"
        "📁 *Criar projeto:*\n"
        "_\"Cria projeto App Mobile com descrição plataforma de vendas\"_\n\n"
        "✅ *Criar tarefa (completo):*\n"
        "_\"Cria tarefa de login para Ana prazo 10/04/2026 no projeto App Mobile coluna A Fazer\"_\n\n"
        "✅ *Criar tarefa (mínimo):*\n"
        "_\"Cria tarefa de relatório para João prazo sexta\"_\n\n"
        "📋 *Listar tarefas:*\n"
        "_\"Quais tarefas estão pendentes?\"_\n"
        "_\"Lista todas as tarefas\"_\n\n"
        "🔄 *Alterar status:*\n"
        "_\"Marca tarefa de login como concluída\"_\n"
        "_\"Muda autenticação para em andamento\"_\n\n"
        "⚙️ *Conta:*\n"
        "/conectar TOKEN — Conectar via token do site\n"
        "/logout — Desconectar\n"
        "/status — Ver sessão atual\n\n"
        "💡 *Dica:* Quanto mais infos você passar, menos perguntas o bot faz!",
        parse_mode="Markdown"
    )


async def cmd_status_sessao(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = update.effective_user.id
    if not sessions.tem_sessao(tid):
        await update.message.reply_text(
            "❌ Não está conectado.\n\n"
            "Use `/conectar TOKEN` — gere o token em *Configurações → Bot Telegram*.",
            parse_mode="Markdown"
        )
        return

    if not sessao_valida(tid):
        await update.message.reply_text(
            "⏰ Sessão *expirada*.\n\nUse `/conectar TOKEN` para reconectar.",
            parse_mode="Markdown"
        )
        return

    info     = sessions.get_info(tid)
    criada   = sessions.get_criada_em(tid)
    expira   = criada + SESSION_TIMEOUT if criada else None
    restante = expira - datetime.now() if expira else None

    if restante:
        horas    = int(restante.total_seconds() // 3600)
        minutos  = int((restante.total_seconds() % 3600) // 60)
        tempo_str = f"{horas}h {minutos}min"
    else:
        tempo_str = "—"

    await update.message.reply_text(
        f"✅ *Sessão ativa*\n\n"
        f"👤 {info['nomeCompleto']}\n"
        f"🔑 {info['username']}\n"
        f"🏢 {info['role']}\n"
        f"⏰ Expira em: *{tempo_str}*",
        parse_mode="Markdown"
    )


# ── Processamento de mensagens ────────────────────────────────────────────────

async def processar_audio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await verificar_sessao(update):
        return

    await update.message.reply_text("🎤 Processando áudio...")
    audio   = update.message.voice or update.message.audio
    arquivo = await audio.get_file()

    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        await arquivo.download_to_drive(tmp.name)
        audio_path = tmp.name

    try:
        await update.message.reply_text("🧠 Interpretando...")
        comando = await chamar_gemini_audio(audio_path, date.today().isoformat())
        await executar_comando(update, context, comando)
    except json.JSONDecodeError:
        await update.message.reply_text("❌ Não entendi. Tente falar mais claramente.")
    except Exception as e:
        await _tratar_erro_msg(update.message, e)
    finally:
        Path(audio_path).unlink(missing_ok=True)


async def processar_texto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    texto = update.message.text
    if texto.startswith("/"):
        return

    tid        = update.effective_user.id
    aguardando = context.user_data.get("aguardando")

    if not await verificar_sessao(update):
        context.user_data.clear()
        return

    # Captura prazo digitado
    if aguardando == "prazo":
        context.user_data.pop("aguardando", None)
        token = sessions.get_token(tid)
        api   = DailyTasksAPI(DAILYTASKS_URL, token)
        try:
            cmd   = await chamar_gemini_texto(
                f"Converta para YYYY-MM-DD: {texto}. Responda só com JSON: {{\"prazo\": \"YYYY-MM-DD\"}}",
                date.today().isoformat()
            )
            prazo = cmd.get("prazo") or texto
        except Exception:
            prazo = texto

        context.user_data["tarefa_pendente"]["prazo"] = prazo
        await _continuar_fluxo_tarefa(update, context, api)
        return

    await update.message.reply_text("🧠 Interpretando...")
    try:
        comando = await chamar_gemini_texto(texto, date.today().isoformat())
        await executar_comando(update, context, comando)
    except json.JSONDecodeError:
        await update.message.reply_text("❌ Não entendi. Tente reformular.")
    except Exception as e:
        await _tratar_erro_msg(update.message, e)


# ── Execução de comandos ──────────────────────────────────────────────────────

async def executar_comando(update: Update, context: ContextTypes.DEFAULT_TYPE, comando: dict):
    tid   = update.effective_user.id
    token = sessions.get_token(tid)
    info  = sessions.get_info(tid)
    api   = DailyTasksAPI(DAILYTASKS_URL, token)
    acao  = comando.get("acao", "desconhecido")

    logger.info(f"[{info['username']}] {acao} | {comando}")

    # ── CRIAR PROJETO ──────────────────────────────────────────────────────
    if acao == "criar_projeto":
        nome      = comando.get("nome", "").strip()
        descricao = comando.get("descricao", "")
        if not nome:
            await update.message.reply_text("⚠️ Nome do projeto não identificado.")
            return
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ Confirmar", callback_data=f"criar_proj|{nome}|{descricao}"),
            InlineKeyboardButton("❌ Cancelar",  callback_data="cancelar"),
        ]])
        await update.message.reply_text(
            f"📁 *Revisão do projeto:*\n\n*Nome:* {nome}\n*Descrição:* {descricao or '—'}\n\nConfirma?",
            parse_mode="Markdown", reply_markup=keyboard,
        )

    # ── CRIAR TAREFA ───────────────────────────────────────────────────────
    elif acao == "criar_tarefa":
        titulo    = comando.get("titulo", "").strip()
        descricao = comando.get("descricao", "")
        func_nome = comando.get("funcionario", "") or ""
        prazo     = comando.get("prazo")
        proj_nome = comando.get("projeto", "") or ""
        col_nome  = comando.get("coluna", "") or ""

        if not titulo:
            await update.message.reply_text("⚠️ Título não identificado. Tente novamente.")
            return

        projetos          = api.listar_projetos()
        projeto_resolvido = resolver_por_nome(proj_nome,  projetos) if proj_nome  else None
        func_resolvido    = api.buscar_funcionario_por_nome(func_nome) if func_nome else None

        coluna_resolvida = None
        if projeto_resolvido and col_nome:
            listas = api.listar_listas_projeto(projeto_resolvido["id"])
            coluna_resolvida = resolver_por_nome(col_nome, listas)

        context.user_data["tarefa_pendente"] = {
            "titulo":                titulo,
            "descricao":             descricao,
            "prazo":                 prazo,
            "projeto_resolvido":     projeto_resolvido,
            "coluna_resolvida":      coluna_resolvida,
            "funcionario_resolvido": func_resolvido,
            "projetos":              projetos,
        }

        if not prazo:
            await update.message.reply_text(
                f"📌 *{titulo}*\n\n📅 *Prazo é obrigatório!*\n\nQual é o prazo? (ex: `15/04/2026`)",
                parse_mode="Markdown"
            )
            context.user_data["aguardando"] = "prazo"
            return

        await _continuar_fluxo_tarefa(update, context, api)

    # ── LISTAR TAREFAS ─────────────────────────────────────────────────────
    elif acao == "listar_tarefas":
        filtro = comando.get("filtro", "todas")
        STATUS_MAP = {
            "pendentes":    "PENDENTE",
            "em_andamento": "EM_ANDAMENTO",
            "concluidas":   "CONCLUIDA",
            "todas":        None,
        }
        status_filtro = STATUS_MAP.get(filtro)

        projetos = api.listar_projetos()
        todas: list[dict] = []
        for p in projetos:
            ts = api.listar_tarefas_projeto(p["id"])
            for t in ts:
                if isinstance(t, dict):
                    t["nomeProjeto"] = p.get("nome", "")
                    todas.append(t)

        if status_filtro:
            todas = [t for t in todas if t.get("status") == status_filtro]

        await update.message.reply_text(
            formatar_lista_tarefas(todas), parse_mode="Markdown"
        )

    # ── ALTERAR STATUS ─────────────────────────────────────────────────────
    elif acao == "alterar_status":
        busca  = (comando.get("tarefa") or "").strip().lower()
        status = (comando.get("status") or "").upper()

        STATUS_VALIDOS = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "BLOQUEADA", "CANCELADA"]
        if status not in STATUS_VALIDOS:
            await update.message.reply_text(f"⚠️ Status inválido. Use: {', '.join(STATUS_VALIDOS)}")
            return

        projetos: list[dict] = []
        try:
            projetos = api.listar_projetos()
        except Exception:
            pass

        encontradas: list[dict] = []
        for p in projetos:
            try:
                for t in api.listar_tarefas_projeto(p["id"]):
                    if isinstance(t, dict) and busca in (t.get("titulo") or "").lower():
                        t["nomeProjeto"] = p.get("nome", "")
                        encontradas.append(t)
            except Exception:
                continue

        if not encontradas:
            await update.message.reply_text(
                f"❌ Nenhuma tarefa encontrada com *\"{busca}\"*.", parse_mode="Markdown"
            )
            return

        STATUS_LABEL_MAP = {
            "PENDENTE":     "🟡 Pendente",
            "EM_ANDAMENTO": "🔵 Em andamento",
            "CONCLUIDA":    "🟢 Concluída",
            "BLOQUEADA":    "🔴 Bloqueada",
            "CANCELADA":    "⚫ Cancelada",
        }

        if len(encontradas) == 1:
            t = encontradas[0]
            keyboard = InlineKeyboardMarkup([[
                InlineKeyboardButton("✅ Confirmar", callback_data=f"status|{t['id']}|{status}"),
                InlineKeyboardButton("❌ Cancelar",  callback_data="cancelar"),
            ]])
            await update.message.reply_text(
                f"🔄 *Alterar status:*\n\n📌 *{t['titulo']}*\nProjeto: {t.get('nomeProjeto', '—')}\n\n"
                f"Novo status: {STATUS_LABEL_MAP.get(status, status)}\n\nConfirma?",
                parse_mode="Markdown", reply_markup=keyboard,
            )
        else:
            buttons = [
                [InlineKeyboardButton(
                    f"{t.get('titulo','—')} ({t.get('nomeProjeto','—')})",
                    callback_data=f"status|{t['id']}|{status}"
                )]
                for t in encontradas[:6]
            ]
            buttons.append([InlineKeyboardButton("❌ Cancelar", callback_data="cancelar")])
            await update.message.reply_text(
                f"Encontrei {len(encontradas)} tarefas. Qual delas?",
                parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(buttons),
            )

    elif acao == "ajuda":
        await cmd_ajuda(update, context)
    else:
        msg = comando.get("mensagem", "")
        await update.message.reply_text(
            f"🤔 Não entendi: *\"{msg}\"*\n\n/ajuda para ver exemplos.",
            parse_mode="Markdown"
        )


# ── Callbacks ─────────────────────────────────────────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    tid   = query.from_user.id
    token = sessions.get_token(tid)
    api   = DailyTasksAPI(DAILYTASKS_URL, token)
    data  = query.data

    if not sessao_valida(tid) and data != "cancelar":
        await query.edit_message_text(
            "⏰ *Sessão expirada.*\n\nUse `/conectar TOKEN` para reconectar.",
            parse_mode="Markdown"
        )
        context.user_data.clear()
        return

    if data == "cancelar":
        context.user_data.pop("tarefa_pendente", None)
        context.user_data.pop("aguardando", None)
        await query.edit_message_text("❌ Operação cancelada.")
        return

    if data.startswith("criar_proj|"):
        partes    = data.split("|", 2)
        nome      = partes[1]
        descricao = partes[2] if len(partes) > 2 else ""
        resultado = api.criar_projeto(nome, descricao)
        if resultado["ok"]:
            await query.edit_message_text(
                f"✅ *Projeto criado!*\n\n📁 *{nome}*", parse_mode="Markdown"
            )
        else:
            await query.edit_message_text(f"❌ Erro: {resultado['erro']}")

    elif data.startswith("escolher_proj|"):
        projeto_id = int(data.split("|")[1])
        projetos   = api.listar_projetos()
        projeto    = next((p for p in projetos if p["id"] == projeto_id), None)
        if projeto:
            context.user_data["tarefa_pendente"]["projeto_resolvido"] = projeto
        await _continuar_fluxo_tarefa(update, context, api)

    elif data.startswith("escolher_func|"):
        func_id      = int(data.split("|")[1])
        funcionarios = api.listar_funcionarios()
        func         = next((f for f in funcionarios if f["id"] == func_id), None)
        if func:
            context.user_data["tarefa_pendente"]["funcionario_resolvido"] = func
        await _continuar_fluxo_tarefa(update, context, api)

    elif data.startswith("escolher_col|"):
        lista_id = int(data.split("|")[1])
        pendente = context.user_data.get("tarefa_pendente", {})
        if lista_id != 0:
            proj_id = pendente.get("projeto_resolvido", {}).get("id", 0)
            listas  = api.listar_listas_projeto(proj_id)
            coluna  = next((l for l in listas if l["id"] == lista_id), {"id": lista_id, "nome": "—"})
            context.user_data["tarefa_pendente"]["coluna_resolvida"] = coluna
        else:
            context.user_data["tarefa_pendente"]["coluna_resolvida"] = False
        await _enviar_revisao(update, context)

    elif data == "confirmar_tarefa":
        pendente    = context.user_data.get("tarefa_pendente", {})
        projeto     = pendente.get("projeto_resolvido", {})
        coluna      = pendente.get("coluna_resolvida")
        funcionario = pendente.get("funcionario_resolvido", {})

        resultado = api.criar_tarefa(
            titulo=pendente["titulo"],
            descricao=pendente.get("descricao", ""),
            projeto_id=projeto.get("id"),
            funcionario_id=funcionario.get("id"),
            prazo=pendente.get("prazo"),
            lista_id=coluna.get("id") if coluna and isinstance(coluna, dict) else None,
        )

        if resultado["ok"]:
            col_str = f"\n📊 {coluna['nome']}" if coluna and isinstance(coluna, dict) else ""
            await query.edit_message_text(
                f"✅ *Tarefa criada com sucesso!*\n\n"
                f"📌 *{pendente['titulo']}*\n"
                f"📁 {projeto.get('nome', '—')}{col_str}\n"
                f"👤 {funcionario.get('nomeCompleto', '—')}\n"
                f"📅 {pendente.get('prazo', '—')}",
                parse_mode="Markdown"
            )
        else:
            await query.edit_message_text(f"❌ Erro: {resultado['erro']}")

        context.user_data.pop("tarefa_pendente", None)

    elif data.startswith("status|"):
        partes    = data.split("|")
        tarefa_id = int(partes[1])
        status    = partes[2]
        resultado = api.alterar_status_tarefa(tarefa_id, status)
        STATUS_LABEL_MAP = {
            "PENDENTE":     "🟡 Pendente",
            "EM_ANDAMENTO": "🔵 Em andamento",
            "CONCLUIDA":    "🟢 Concluída",
            "BLOQUEADA":    "🔴 Bloqueada",
            "CANCELADA":    "⚫ Cancelada",
        }
        if resultado["ok"]:
            await query.edit_message_text(
                f"✅ Status: *{STATUS_LABEL_MAP.get(status, status)}*", parse_mode="Markdown"
            )
        else:
            await query.edit_message_text(f"❌ Erro: {resultado['erro']}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start",    cmd_start))
    app.add_handler(CommandHandler("conectar", cmd_conectar))
    app.add_handler(CommandHandler("login",    cmd_login))
    app.add_handler(CommandHandler("logout",   cmd_logout))
    app.add_handler(CommandHandler("ajuda",    cmd_ajuda))
    app.add_handler(CommandHandler("help",     cmd_ajuda))
    app.add_handler(CommandHandler("status",   cmd_status_sessao))

    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, processar_audio))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, processar_texto))
    app.add_handler(CallbackQueryHandler(handle_callback))

    logger.info("🤖 DailyTasks Bot iniciado!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()