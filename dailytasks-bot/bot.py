"""
DailyTasks Bot — Telegram + Google Gemini
==========================================
Fluxo inteligente:
  - Se usuário passa todas as infos → vai direto para tela de revisão
  - Prazo é obrigatório para tarefas
  - Projeto e coluna podem ser identificados pelo nome no comando
"""

import os
import json
import logging
import tempfile
from pathlib import Path
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

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DAILYTASKS_URL = os.getenv("DAILYTASKS_URL", "http://localhost:8080")

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


def formatar_lista_tarefas(tarefas: list) -> str:
    if not tarefas:
        return "✅ Nenhuma tarefa encontrada."
    STATUS_EMOJI = {
        "PENDENTE": "🟡", "EM_ANDAMENTO": "🔵",
        "CONCLUIDA": "🟢", "BLOQUEADA": "🔴", "CANCELADA": "⚫",
    }
    linhas = []
    for t in tarefas[:15]:
        emoji = STATUS_EMOJI.get(t.get("status", ""), "⚪")
        prazo = t.get("dataDeVencimento", "")
        prazo_str = f" · 📅 {prazo}" if prazo else ""
        linhas.append(f"{emoji} *{t.get('titulo','—')}*\n   👤 {t.get('nomeFuncionario','—')}{prazo_str}")
    total  = len(tarefas)
    return f"📋 *{total} tarefa{'s' if total!=1 else ''} encontrada{'s' if total!=1 else ''}:*\n\n" + "\n\n".join(linhas)


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

    proj_str = projeto.get("nome",        "❓ Não identificado") if projeto     else "❓ Não identificado"
    col_str  = coluna.get("nome",         "📭 Sem coluna")       if coluna      else "📭 Sem coluna"
    func_str = funcionario.get("nomeCompleto", "❓ Não identificado") if funcionario else "❓ Não identificado"
    desc_str = f"\n📝 _{descricao}_"                              if descricao   else ""

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
    """Verifica o que falta e avança para o próximo passo ou revisão."""
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


# ── Handlers ──────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = update.effective_user.id
    if sessions.tem_sessao(tid):
        info = sessions.get_info(tid)
        await update.message.reply_text(
            f"👋 Olá, *{info['nomeCompleto']}*! Você já está conectado.\n\n"
            "Mande um áudio ou texto com seu comando.\n/ajuda para ver exemplos.",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(
            "👋 Bem-vindo ao *DailyTasks Bot*!\n\nFaça login:\n`/login usuario senha`",
            parse_mode="Markdown"
        )


async def cmd_login(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) < 2:
        await update.message.reply_text("⚠️ Use: `/login usuario senha`", parse_mode="Markdown")
        return
    await update.message.reply_text("🔄 Autenticando...")
    api       = DailyTasksAPI(DAILYTASKS_URL)
    resultado = api.login(args[0], args[1])
    if resultado["ok"]:
        sessions.salvar(update.effective_user.id, resultado["token"], resultado["info"])
        info = resultado["info"]
        await update.message.reply_text(
            f"✅ *Login realizado!*\n\n👤 *{info['nomeCompleto']}*\n🏢 {info['role']}\n\nMande seu comando!",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(f"❌ Falha: {resultado['erro']}")


async def cmd_logout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    sessions.remover(update.effective_user.id)
    await update.message.reply_text("👋 Logout realizado!")


async def cmd_ajuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 *DailyTasks Bot — Comandos*\n\n"
        "📁 *Criar projeto:*\n"
        "_\"Cria projeto App Mobile com descrição plataforma de vendas\"_\n\n"
        "✅ *Criar tarefa (completo — vai direto para revisão):*\n"
        "_\"Cria tarefa de login para Ana prazo 10/04/2026 no projeto App Mobile coluna A Fazer\"_\n\n"
        "✅ *Criar tarefa (mínimo):*\n"
        "_\"Cria tarefa de relatório para João prazo sexta\"_\n\n"
        "📋 *Listar:*\n"
        "_\"Quais tarefas estão pendentes?\"_\n\n"
        "🔄 *Alterar status:*\n"
        "_\"Marca tarefa de login como concluída\"_\n\n"
        "💡 *Dica:* Quanto mais infos você passar no comando "
        "(projeto, coluna, responsável, prazo), menos perguntas o bot faz!\n\n"
        "/login · /logout · /status",
        parse_mode="Markdown"
    )


async def cmd_status_sessao(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = update.effective_user.id
    if not sessions.tem_sessao(tid):
        await update.message.reply_text("❌ Não está logado.\n`/login usuario senha`", parse_mode="Markdown")
        return
    info = sessions.get_info(tid)
    await update.message.reply_text(
        f"✅ *Sessão ativa*\n\n👤 {info['nomeCompleto']}\n🔑 {info['username']}\n🏢 {info['role']}",
        parse_mode="Markdown"
    )


async def processar_audio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = update.effective_user.id
    if not sessions.tem_sessao(tid):
        await update.message.reply_text("❌ Faça login com `/login usuario senha`", parse_mode="Markdown")
        return

    await update.message.reply_text("🎤 Processando áudio...")
    audio   = update.message.voice or update.message.audio
    arquivo = await audio.get_file()

    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        await arquivo.download_to_drive(tmp.name)
        audio_path = tmp.name

    try:
        from datetime import date
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
    tid  = update.effective_user.id
    texto = update.message.text
    if texto.startswith("/"):
        return

    # Verifica se está aguardando prazo
    aguardando = context.user_data.get("aguardando")
    if aguardando == "prazo" and sessions.tem_sessao(tid):
        context.user_data.pop("aguardando", None)
        token = sessions.get_token(tid)
        api   = DailyTasksAPI(DAILYTASKS_URL, token)

        try:
            from datetime import date
            cmd  = await chamar_gemini_texto(
                f"Converta para YYYY-MM-DD: {texto}. Responda só com JSON: {{\"prazo\": \"YYYY-MM-DD\"}}",
                date.today().isoformat()
            )
            prazo = cmd.get("prazo") or texto
        except Exception:
            prazo = texto

        context.user_data["tarefa_pendente"]["prazo"] = prazo
        await _continuar_fluxo_tarefa(update, context, api)
        return

    if not sessions.tem_sessao(tid):
        await update.message.reply_text("❌ Faça login com `/login usuario senha`", parse_mode="Markdown")
        return

    await update.message.reply_text("🧠 Interpretando...")
    try:
        from datetime import date
        comando = await chamar_gemini_texto(texto, date.today().isoformat())
        await executar_comando(update, context, comando)
    except json.JSONDecodeError:
        await update.message.reply_text("❌ Não entendi. Tente reformular.")
    except Exception as e:
        await _tratar_erro_msg(update.message, e)


async def _tratar_erro_msg(msg, e: Exception):
    erro_str = str(e)
    logger.error(f"Erro: {erro_str}")
    if "429" in erro_str or "quota" in erro_str.lower():
        await msg.reply_text("⏳ Limite de requisições atingido. Aguarde e tente novamente.")
    else:
        await msg.reply_text(f"❌ Erro: {erro_str[:200]}")


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
        func_nome = comando.get("funcionario", "")
        prazo     = comando.get("prazo")
        proj_nome = comando.get("projeto", "")
        col_nome  = comando.get("coluna", "")

        if not titulo:
            await update.message.reply_text("⚠️ Título não identificado. Tente novamente.")
            return

        projetos = api.listar_projetos()
        projeto_resolvido  = resolver_por_nome(proj_nome, projetos) if proj_nome else None
        func_resolvido     = api.buscar_funcionario_por_nome(func_nome) if func_nome else None

        coluna_resolvida = None
        if projeto_resolvido and col_nome:
            listas = api.listar_listas_projeto(projeto_resolvido["id"])
            coluna_resolvida = resolver_por_nome(col_nome, listas)

        context.user_data["tarefa_pendente"] = {
            "titulo":               titulo,
            "descricao":            descricao,
            "prazo":                prazo,
            "projeto_resolvido":    projeto_resolvido,
            "coluna_resolvida":     coluna_resolvida,
            "funcionario_resolvido": func_resolvido,
            "projetos":             projetos,
        }

        # Prazo obrigatório
        if not prazo:
            await update.message.reply_text(
                f"📌 *{titulo}*\n\n📅 *Prazo é obrigatório!*\n\nQual é o prazo da tarefa? (ex: `15/04/2026`)",
                parse_mode="Markdown"
            )
            context.user_data["aguardando"] = "prazo"
            return

        await _continuar_fluxo_tarefa(update, context, api)

    # ── LISTAR TAREFAS ─────────────────────────────────────────────────────
    elif acao == "listar_tarefas":
        filtro = comando.get("filtro", "todas")
        STATUS_MAP = {"pendentes": "PENDENTE", "em_andamento": "EM_ANDAMENTO", "concluidas": "CONCLUIDA", "todas": None}
        status_filtro = STATUS_MAP.get(filtro)

        projetos = api.listar_projetos()
        todas    = []
        for p in projetos:
            ts = api.listar_tarefas_projeto(p["id"])
            for t in ts:
                t["nomeProjeto"] = p["nome"]
            todas.extend(ts)
        if status_filtro:
            todas = [t for t in todas if t.get("status") == status_filtro]
        await update.message.reply_text(formatar_lista_tarefas(todas), parse_mode="Markdown")

    # ── ALTERAR STATUS ─────────────────────────────────────────────────────
    elif acao == "alterar_status":
        busca  = comando.get("tarefa", "").strip().lower()
        status = comando.get("status", "").upper()
        STATUS_VALIDOS = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "BLOQUEADA", "CANCELADA"]
        if status not in STATUS_VALIDOS:
            await update.message.reply_text(f"⚠️ Status inválido. Use: {', '.join(STATUS_VALIDOS)}")
            return

        projetos    = api.listar_projetos()
        encontradas = []
        for p in projetos:
            for t in api.listar_tarefas_projeto(p["id"]):
                if busca in t.get("titulo", "").lower():
                    t["nomeProjeto"] = p["nome"]
                    encontradas.append(t)

        if not encontradas:
            await update.message.reply_text(f"❌ Nenhuma tarefa encontrada com *\"{busca}\"*.", parse_mode="Markdown")
            return

        STATUS_LABEL_MAP = {
            "PENDENTE": "🟡 Pendente", "EM_ANDAMENTO": "🔵 Em andamento",
            "CONCLUIDA": "🟢 Concluída", "BLOQUEADA": "🔴 Bloqueada", "CANCELADA": "⚫ Cancelada",
        }
        if len(encontradas) == 1:
            t = encontradas[0]
            keyboard = InlineKeyboardMarkup([[
                InlineKeyboardButton("✅ Confirmar", callback_data=f"status|{t['id']}|{status}"),
                InlineKeyboardButton("❌ Cancelar",  callback_data="cancelar"),
            ]])
            await update.message.reply_text(
                f"🔄 *Alterar status:*\n\n📌 *{t['titulo']}*\nProjeto: {t['nomeProjeto']}\n\n"
                f"Novo status: {STATUS_LABEL_MAP.get(status, status)}\n\nConfirma?",
                parse_mode="Markdown", reply_markup=keyboard,
            )
        else:
            buttons = [[InlineKeyboardButton(f"{t['titulo']} ({t['nomeProjeto']})", callback_data=f"status|{t['id']}|{status}")] for t in encontradas[:6]]
            buttons.append([InlineKeyboardButton("❌ Cancelar", callback_data="cancelar")])
            await update.message.reply_text(
                f"Encontrei {len(encontradas)} tarefas. Qual delas?",
                parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(buttons),
            )

    elif acao == "ajuda":
        await cmd_ajuda(update, context)
    else:
        msg = comando.get("mensagem", "")
        await update.message.reply_text(f"🤔 Não entendi: *\"{msg}\"*\n\n/ajuda para ver exemplos.", parse_mode="Markdown")


# ── Callbacks ─────────────────────────────────────────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    tid   = query.from_user.id
    token = sessions.get_token(tid)
    api   = DailyTasksAPI(DAILYTASKS_URL, token)
    data  = query.data

    if data == "cancelar":
        context.user_data.pop("tarefa_pendente", None)
        context.user_data.pop("aguardando", None)
        await query.edit_message_text("❌ Operação cancelada.")
        return

    # ── Confirmar projeto ──────────────────────────────────────────────────
    if data.startswith("criar_proj|"):
        partes    = data.split("|", 2)
        nome      = partes[1]
        descricao = partes[2] if len(partes) > 2 else ""
        resultado = api.criar_projeto(nome, descricao)
        if resultado["ok"]:
            await query.edit_message_text(f"✅ *Projeto criado!*\n\n📁 *{nome}*", parse_mode="Markdown")
        else:
            await query.edit_message_text(f"❌ Erro: {resultado['erro']}")

    # ── Escolher projeto ───────────────────────────────────────────────────
    elif data.startswith("escolher_proj|"):
        projeto_id = int(data.split("|")[1])
        projetos   = api.listar_projetos()
        projeto    = next((p for p in projetos if p["id"] == projeto_id), None)
        if projeto:
            context.user_data["tarefa_pendente"]["projeto_resolvido"] = projeto
        await _continuar_fluxo_tarefa(update, context, api)

    # ── Escolher funcionário ───────────────────────────────────────────────
    elif data.startswith("escolher_func|"):
        func_id      = int(data.split("|")[1])
        funcionarios = api.listar_funcionarios()
        func         = next((f for f in funcionarios if f["id"] == func_id), None)
        if func:
            context.user_data["tarefa_pendente"]["funcionario_resolvido"] = func
        await _continuar_fluxo_tarefa(update, context, api)

    # ── Escolher coluna ────────────────────────────────────────────────────
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

    # ── Confirmar tarefa ───────────────────────────────────────────────────
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
                f"📁 {projeto.get('nome','—')}{col_str}\n"
                f"👤 {funcionario.get('nomeCompleto','—')}\n"
                f"📅 {pendente.get('prazo','—')}",
                parse_mode="Markdown"
            )
        else:
            await query.edit_message_text(f"❌ Erro: {resultado['erro']}")
        context.user_data.pop("tarefa_pendente", None)

    # ── Alterar status ─────────────────────────────────────────────────────
    elif data.startswith("status|"):
        partes    = data.split("|")
        tarefa_id = int(partes[1])
        status    = partes[2]
        resultado = api.alterar_status_tarefa(tarefa_id, status)
        STATUS_LABEL_MAP = {
            "PENDENTE": "🟡 Pendente", "EM_ANDAMENTO": "🔵 Em andamento",
            "CONCLUIDA": "🟢 Concluída", "BLOQUEADA": "🔴 Bloqueada", "CANCELADA": "⚫ Cancelada",
        }
        if resultado["ok"]:
            await query.edit_message_text(f"✅ Status: *{STATUS_LABEL_MAP.get(status, status)}*", parse_mode="Markdown")
        else:
            await query.edit_message_text(f"❌ Erro: {resultado['erro']}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start",  cmd_start))
    app.add_handler(CommandHandler("login",  cmd_login))
    app.add_handler(CommandHandler("logout", cmd_logout))
    app.add_handler(CommandHandler("ajuda",  cmd_ajuda))
    app.add_handler(CommandHandler("help",   cmd_ajuda))
    app.add_handler(CommandHandler("status", cmd_status_sessao))

    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, processar_audio))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, processar_texto))
    app.add_handler(CallbackQueryHandler(handle_callback))

    logger.info("🤖 DailyTasks Bot iniciado!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()