"""
DailyTasks API Client
Wrapper para todos os endpoints usados pelo bot.
"""

import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class DailyTasksAPI:
    def __init__(self, base_url: str, token: str = None):
        self.base_url = base_url.rstrip("/")
        self.token    = token

    @property
    def headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    # ── Autenticação ──────────────────────────────────────────────────────

    def login(self, username: str, password: str) -> dict:
        try:
            r = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": password},
                timeout=10,
            )
            if r.status_code == 200:
                token = r.json().get("token")

                # Decodifica o JWT para pegar as informações básicas
                import base64, json as _json
                payload = token.split(".")[1]
                payload += "=" * (-len(payload) % 4)  # padding
                decoded = _json.loads(base64.b64decode(payload))

                authorities = decoded.get("authorities", [])
                role = "FUNCIONARIO"
                if "ROLE_MASTER"  in authorities: role = "MASTER"
                elif "ROLE_GESTOR"  in authorities: role = "GESTOR"
                elif "ROLE_GERENTE" in authorities: role = "GERENTE"

                return {
                    "ok":    True,
                    "token": token,
                    "info":  {
                        "username":     decoded.get("sub", username),
                        "nomeCompleto": decoded.get("sub", username),
                        "role":         role,
                    },
                }
            elif r.status_code == 403:
                return {"ok": False, "erro": "Usuário ou senha incorretos."}
            else:
                return {"ok": False, "erro": f"Erro {r.status_code}"}
        except requests.exceptions.ConnectionError:
            return {"ok": False, "erro": "Não foi possível conectar ao servidor DailyTasks."}
        except Exception as e:
            return {"ok": False, "erro": str(e)}

    # ── Projetos ──────────────────────────────────────────────────────────

    def listar_projetos(self) -> list:
        try:
            r = requests.get(f"{self.base_url}/projetos", headers=self.headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                return data if isinstance(data, list) else []
            return []
        except Exception as e:
            logger.error(f"Erro ao listar projetos: {e}")
            return []

    def criar_projeto(self, nome: str, descricao: str = "") -> dict:
        try:
            payload = {"nome": nome}
            if descricao:
                payload["descricao"] = descricao

            r = requests.post(
                f"{self.base_url}/projetos",
                json=payload,
                headers=self.headers,
                timeout=10,
            )
            if r.status_code in (200, 201):
                data = r.json()
                return {"ok": True, "id": data.get("id"), "nome": data.get("nome")}
            else:
                return {"ok": False, "erro": r.text or f"Erro {r.status_code}"}
        except Exception as e:
            return {"ok": False, "erro": str(e)}
        

    def listar_listas_projeto(self, projeto_id: int) -> list:
    #Busca as colunas (listas) de um projeto
        try:
            r = requests.get(
                f"{self.base_url}/listas/projeto/{projeto_id}",
                headers=self.headers,
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list):
                    return [{"id": l["id"], "nome": l["nome"]} for l in data]
            return []
        except Exception as e:
            logger.error(f"Erro ao listar listas do projeto {projeto_id}: {e}")
            return []    

    # ── Funcionários ──────────────────────────────────────────────────────

    def listar_funcionarios(self) -> list:
        try:
            r = requests.get(f"{self.base_url}/funcionarios", headers=self.headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                return data if isinstance(data, list) else []
            return []
        except Exception as e:
            logger.error(f"Erro ao listar funcionários: {e}")
            return []

    def buscar_funcionario_por_nome(self, nome: str) -> Optional[dict]:
        """Busca um funcionário pelo nome (busca parcial, case-insensitive)."""
        funcionarios = self.listar_funcionarios()
        nome_lower   = nome.lower().strip()

        # Busca exata primeiro
        for f in funcionarios:
            if f.get("nomeCompleto", "").lower() == nome_lower:
                return f

        # Busca parcial
        for f in funcionarios:
            nome_completo = f.get("nomeCompleto", "").lower()
            # Verifica se todas as palavras do nome estão no nome completo
            palavras = nome_lower.split()
            if all(p in nome_completo for p in palavras):
                return f

        # Busca pelo primeiro nome
        for f in funcionarios:
            primeiro_nome = f.get("nomeCompleto", "").lower().split()[0]
            if nome_lower == primeiro_nome:
                return f

        return None

    # ── Tarefas ───────────────────────────────────────────────────────────

    def listar_tarefas_projeto(self, projeto_id: int) -> list:
        try:
            r = requests.get(
                f"{self.base_url}/tarefas/projeto/{projeto_id}",
                headers=self.headers,
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                return data if isinstance(data, list) else []
            return []
        except Exception as e:
            logger.error(f"Erro ao listar tarefas do projeto {projeto_id}: {e}")
            return []

    def criar_tarefa(
        self,
        titulo: str,
        projeto_id: int,
        funcionario_id: int,
        descricao: str = "",
        prazo: str = None,
        lista_id: int = None,
    ) -> dict:
        try:
            payload = {
                "titulo":        titulo,
                "projetoId":     projeto_id,
                "funcionarioId": funcionario_id,
            }
            if descricao:
                payload["descricao"] = descricao
            if prazo:
                payload["dataDeVencimento"] = prazo
            if lista_id:
                payload["listaId"] = lista_id

            logger.info(f"Criando tarefa — payload: {payload}")
            logger.info(f"Headers: {self.headers}")

            r = requests.post(
                f"{self.base_url}/tarefas",
                json=payload,
                headers=self.headers,
                timeout=10,
            )

            logger.info(f"Resposta criar_tarefa: status={r.status_code} body={r.text[:300]}")

            if r.status_code in (200, 201):
                data = r.json()
                return {"ok": True, "id": data.get("id"), "titulo": data.get("titulo")}
            else:
                return {"ok": False, "erro": r.text or f"Erro {r.status_code}"}
        except Exception as e:
            logger.error(f"Exceção em criar_tarefa: {e}")
            return {"ok": False, "erro": str(e)}

    def alterar_status_tarefa(self, tarefa_id: int, status: str) -> dict:
        try:
            r = requests.put(
                f"{self.base_url}/tarefas/{tarefa_id}",
                json={"status": status},
                headers=self.headers,
                timeout=10,
            )
            if r.status_code == 200:
                return {"ok": True}
            else:
                return {"ok": False, "erro": r.text or f"Erro {r.status_code}"}
        except Exception as e:
            return {"ok": False, "erro": str(e)}