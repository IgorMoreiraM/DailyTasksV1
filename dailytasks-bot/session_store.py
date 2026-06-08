"""
Session Store — armazena tokens JWT por Telegram User ID.
Persiste em JSON e registra horário de criação para expiração.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

SESSIONS_FILE = Path("sessions.json")
DATE_FORMAT   = "%Y-%m-%dT%H:%M:%S"


class SessionStore:
    def __init__(self):
        self._data: dict = {}
        self._carregar()

    def _carregar(self):
        if SESSIONS_FILE.exists():
            try:
                self._data = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
                logger.info(f"Sessões carregadas: {len(self._data)} usuário(s)")
            except Exception as e:
                logger.warning(f"Erro ao carregar sessões: {e}")
                self._data = {}

    def _salvar(self):
        try:
            SESSIONS_FILE.write_text(
                json.dumps(self._data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as e:
            logger.error(f"Erro ao salvar sessões: {e}")

    def salvar(self, telegram_id: int, token: str, info: dict):
        self._data[str(telegram_id)] = {
            "token":     token,
            "info":      info,
            "criada_em": datetime.now().strftime(DATE_FORMAT),
        }
        self._salvar()
        logger.info(f"Sessão salva: Telegram ID {telegram_id} ({info.get('username')})")

    def tem_sessao(self, telegram_id: int) -> bool:
        return str(telegram_id) in self._data

    def get_token(self, telegram_id: int) -> Optional[str]:
        entrada = self._data.get(str(telegram_id))
        return entrada["token"] if entrada else None

    def get_info(self, telegram_id: int) -> Optional[dict]:
        entrada = self._data.get(str(telegram_id))
        return entrada["info"] if entrada else None

    def get_criada_em(self, telegram_id: int) -> Optional[datetime]:
        entrada = self._data.get(str(telegram_id))
        if not entrada:
            return None
        criada_str = entrada.get("criada_em")
        if not criada_str:
            # Sessão antiga sem timestamp — considera expirada
            return None
        try:
            return datetime.strptime(criada_str, DATE_FORMAT)
        except Exception:
            return None

    def remover(self, telegram_id: int):
        key = str(telegram_id)
        if key in self._data:
            del self._data[key]
            self._salvar()
            logger.info(f"Sessão removida: Telegram ID {telegram_id}")