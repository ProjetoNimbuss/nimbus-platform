#!/usr/bin/env bash
set -euo pipefail

# Script de instalação do monitor de disco via systemd timer
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="nimbus-disk-alert.service"
TIMER_NAME="nimbus-disk-alert.timer"

echo "=== Instalando Nimbus Disk Alert Monitor ==="

# Torna o script executável
chmod +x "${SCRIPT_DIR}/check_disk.py"

# Copia os arquivos de unit do systemd
echo "Copiando units para /etc/systemd/system/..."
sudo cp "${SCRIPT_DIR}/${SERVICE_NAME}" /etc/systemd/system/
sudo cp "${SCRIPT_DIR}/${TIMER_NAME}" /etc/systemd/system/

# Recarrega o daemon do systemd
echo "Recarregando systemd daemon..."
sudo systemctl daemon-reload

# Habilita e inicia o timer
echo "Ativando timer ${TIMER_NAME}..."
sudo systemctl enable --now "${TIMER_NAME}"

echo "=== Instalação concluída com sucesso! ==="
echo "Status do timer:"
systemctl status "${TIMER_NAME}" --no-pager
echo ""
echo "Para testar manualmente o envio de e-mail:"
echo "python3 ${SCRIPT_DIR}/check_disk.py --test"
