#!/usr/bin/env python3
"""
Monitor de Espaço em Disco com Alerta por E-mail - Nimbus Platform
Verifica a utilização da partição raiz (/) e dispara e-mail de alerta caso atinja o limite.
Possui cooldown configurável (padrão: 24 horas) para evitar spam de notificações.
"""

import os
import sys
import shutil
import smtplib
import ssl
import time
import socket
import argparse
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configurações padrão
DEFAULT_THRESHOLD = 95.0
DEFAULT_COOLDOWN_HOURS = 24
DEFAULT_RECIPIENTS = ["viniciuslsantana4@gmail.com", "igor.maciel@ufrpe.br"]
DEFAULT_STATE_FILE = "/dev/shm/nimbus_disk_alert_last_sent"


def load_env_file(filepath: str) -> None:
    """Carrega variáveis de um arquivo .env simples sem dependências externas."""
    if not os.path.isfile(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"[WARN] Falha ao ler {filepath}: {e}", file=sys.stderr)


def get_disk_usage(path: str = "/") -> dict:
    """Calcula estatísticas de uso do disco."""
    total, used, free = shutil.disk_usage(path)
    percent_used = (used / total) * 100.0
    return {
        "path": path,
        "total_gb": total / (1024 ** 3),
        "used_gb": used / (1024 ** 3),
        "free_mb": free / (1024 ** 2),
        "free_gb": free / (1024 ** 3),
        "percent": percent_used,
    }


def should_send_alert(state_file: str, cooldown_seconds: int) -> tuple[bool, float]:
    """
    Verifica se o alerta pode ser enviado respeitando a janela de cooldown.
    Retorna (pode_enviar, horas_desde_ultimo_envio).
    """
    if not os.path.exists(state_file):
        return True, float("inf")

    try:
        with open(state_file, "r") as f:
            content = f.read().strip()
            last_sent = float(content)
            now = time.time()
            elapsed = now - last_sent
            if elapsed < cooldown_seconds:
                return False, elapsed / 3600.0
            return True, elapsed / 3600.0
    except Exception as e:
        print(f"[WARN] Não foi possível ler state file ({state_file}): {e}", file=sys.stderr)
        return True, float("inf")


def record_alert_sent(state_file: str) -> None:
    """Registra o timestamp do alerta enviado no state_file."""
    paths_to_try = [state_file, "/run/nimbus_disk_alert_last_sent", "/tmp/nimbus_disk_alert_last_sent"]
    for path in paths_to_try:
        try:
            with open(path, "w") as f:
                f.write(str(time.time()))
            return
        except Exception:
            continue


def build_email_message(
    sender: str,
    recipients: list[str],
    disk_info: dict,
    hostname: str,
    threshold: float,
) -> MIMEMultipart:
    """Monta o e-mail em texto puro e HTML com visual limpo e instruções emergenciais."""
    percent = disk_info["percent"]
    total = f"{disk_info['total_gb']:.1f} GB"
    used = f"{disk_info['used_gb']:.1f} GB"
    free = f"{disk_info['free_mb']:.0f} MB" if disk_info["free_gb"] < 1.0 else f"{disk_info['free_gb']:.2f} GB"

    # Horário de Brasília (UTC-3)
    tz_br = timezone(timedelta(hours=-3))
    agora_br = datetime.now(tz_br).strftime("%d/%m/%Y às %H:%M:%S (UTC-3)")

    subject = f"🚨 [URGENTE] Nimbus VM - Disco em {percent:.1f}% ({hostname})"

    text_content = f"""URGENTE: O disco da VM do projeto Nimbus atingiu nível crítico!

Servidor: {hostname}
Data/Hora: {agora_br}
Uso Atual: {percent:.1f}% (Limite configurado: {threshold:.0f}%)
Espaço Total: {total}
Espaço Usado: {used}
Espaço Livre: {free}

O disco está quase esgotado ou completamente cheio. Serviços essenciais como
PostgreSQL, Docker e Prefect podem falhar ou corromper dados se não houver limpeza imediata.

AÇÕES RECOMENDADAS DE EMERGÊNCIA (via SSH):
=============================================
1. Acesse a VM:
   ssh debian@{hostname}

2. Limpe o cache de build do Docker (recupera de 1 a 3 GB):
   docker builder prune -af

3. Limpe logs acumulados do sistema:
   sudo journalctl --vacuum-size=100M

4. Limpe pacotes em cache do apt:
   sudo apt clean

5. Verifique o espaço liberado:
   df -h /

------------------------------------------------------------------------
Nota: Este alerta automático é disparado no máximo 1 vez a cada 24 horas.
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
    .card {{ max-width: 620px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #ef4444; overflow: hidden; }}
    .header {{ background: #dc2626; color: #ffffff; padding: 18px 24px; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; }}
    .content {{ padding: 24px; line-height: 1.5; }}
    .metrics {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }}
    .metric-box {{ background: #0f172a; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #ef4444; }}
    .metric-label {{ font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }}
    .metric-value {{ font-size: 22px; font-weight: 700; color: #f8fafc; margin-top: 4px; }}
    .terminal {{ background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 14px; font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; color: #38bdf8; overflow-x: auto; margin: 16px 0; }}
    .terminal-title {{ color: #94a3b8; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; }}
    .footer {{ padding: 16px 24px; background: #0f172a; font-size: 12px; color: #64748b; border-top: 1px solid #334155; text-align: center; }}
    .cmd {{ color: #facc15; }}
    .comment {{ color: #64748b; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚨 Alerta Crítico: Disco Quase Lotado ({percent:.1f}%)</h1>
    </div>
    <div class="content">
      <p>O monitoramento da <strong>Plataforma Nimbus</strong> detectou que o armazenamento da máquina virtual atingiu nível crítico.</p>
      
      <div class="metrics">
        <div class="metric-box">
          <div class="metric-label">Servidor</div>
          <div class="metric-value" style="font-size: 16px;">{hostname}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Uso / Total</div>
          <div class="metric-value">{percent:.1f}% <span style="font-size: 14px; color: #94a3b8;">({used} / {total})</span></div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Espaço Livre</div>
          <div class="metric-value" style="color: #ef4444;">{free}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Horário de Ocorrência</div>
          <div class="metric-value" style="font-size: 14px;">{agora_br}</div>
        </div>
      </div>

      <p style="color: #fca5a5;"><strong>Atenção:</strong> Se o disco atingir 100%, PostgreSQL, Prefect e Docker entrarão em falha imediata por falta de espaço em disco.</p>

      <div class="terminal-title">Comandos para intervenção rápida via SSH:</div>
      <div class="terminal">
        <span class="comment"># 1. Acesse a máquina</span><br>
        <span class="cmd">ssh debian@{hostname}</span><br><br>
        <span class="comment"># 2. Libere cache de build Docker (recupera 1 a 3 GB)</span><br>
        <span class="cmd">docker builder prune -af</span><br><br>
        <span class="comment"># 3. Limpe logs do sistema</span><br>
        <span class="cmd">sudo journalctl --vacuum-size=100M</span><br><br>
        <span class="comment"># 4. Limpe pacotes em cache</span><br>
        <span class="cmd">sudo apt clean</span><br><br>
        <span class="comment"># 5. Confirme o espaço liberado</span><br>
        <span class="cmd">df -h /</span>
      </div>
    </div>
    <div class="footer">
      Este e-mail é gerado automaticamente pelo Nimbus Disk Monitor.<br>
      Intervalo de renotificação: 1 envio a cada 24 horas enquanto o problema persistir.
    </div>
  </div>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))
    return msg


def send_email(
    host: str,
    port: int,
    user: str,
    password: str,
    sender: str,
    recipients: list[str],
    msg: MIMEMultipart,
    use_ssl: bool = False,
) -> None:
    """Dispara a mensagem via SMTP autenticado."""
    context = ssl.create_default_context()

    if use_ssl or port == 465:
        with smtplib.SMTP_SSL(host, port, context=context) as server:
            if user and password:
                server.login(user, password)
            server.sendmail(sender, recipients, msg.as_string())
    else:
        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            if user and password:
                server.login(user, password)
            server.sendmail(sender, recipients, msg.as_string())


def main() -> int:
    parser = argparse.ArgumentParser(description="Verifica disco e dispara e-mail se estiver lotado.")
    parser.add_argument("--test", action="store_true", help="Força o envio do e-mail de teste ignorando limites de disco e cooldown.")
    parser.add_argument("--env-file", type=str, default="", help="Caminho para arquivo .env com credenciais SMTP.")
    parser.add_argument("--threshold", type=float, default=None, help="Porcentagem de uso para disparar alerta (ex: 95 ou 100).")
    args = parser.parse_args()

    # Procura arquivos .env conhecidos
    possible_envs = [
        args.env_file,
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        "/home/debian/nimbus-platform/.env",
        "/etc/nimbus/disk_alert.env",
    ]
    for env_path in possible_envs:
        if env_path and os.path.isfile(env_path):
            load_env_file(env_path)

    # Configurações lidas do ambiente
    threshold = float(args.threshold or os.getenv("DISK_THRESHOLD_PERCENT", str(DEFAULT_THRESHOLD)))
    cooldown_hours = float(os.getenv("COOLDOWN_HOURS", str(DEFAULT_COOLDOWN_HOURS)))
    cooldown_seconds = int(cooldown_hours * 3600)
    state_file = os.getenv("STATE_FILE", DEFAULT_STATE_FILE)

    raw_recipients = os.getenv("ALERT_EMAILS", ",".join(DEFAULT_RECIPIENTS))
    recipients = [r.strip() for r in raw_recipients.split(",") if r.strip()]

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "Nimbus Alertas <alerta@nimbus.local>")
    smtp_secure = os.getenv("SMTP_SECURE", "tls").lower() == "ssl"

    disk = get_disk_usage("/")
    hostname = socket.gethostname()

    print(f"[INFO] Checagem de disco ({hostname}): {disk['percent']:.1f}% usado ({disk['used_gb']:.2f}/{disk['total_gb']:.2f} GB). Limiar: {threshold:.1f}%.")

    if not args.test:
        if disk["percent"] < threshold:
            print("[INFO] Espaço em disco normal. Nenhum alerta necessário.")
            return 0

        can_send, elapsed_hours = should_send_alert(state_file, cooldown_seconds)
        if not can_send:
            print(f"[INFO] Alerta não enviado: cooldown de {cooldown_hours}h ativo (último envio há {elapsed_hours:.1f}h).")
            return 0

    if not smtp_user or not smtp_password:
        print("[ERRO] SMTP_USER ou SMTP_PASSWORD não foram configurados nas variáveis de ambiente.", file=sys.stderr)
        print("[DICA] Configure no .env da máquina ou passe como variável de ambiente.", file=sys.stderr)
        return 1

    print(f"[ACTION] Disparando alerta de e-mail para: {', '.join(recipients)} via {smtp_host}:{smtp_port}...")
    try:
        msg = build_email_message(smtp_from, recipients, disk, hostname, threshold)
        send_email(
            host=smtp_host,
            port=smtp_port,
            user=smtp_user,
            password=smtp_password,
            sender=smtp_from,
            recipients=recipients,
            msg=msg,
            use_ssl=smtp_secure,
        )
        record_alert_sent(state_file)
        print("[SUCESSO] E-mail de alerta enviado com sucesso!")
        return 0
    except Exception as e:
        print(f"[ERRO] Falha ao enviar e-mail: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
