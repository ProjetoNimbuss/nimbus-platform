# Monitor de Disco & Alerta por E-mail (Nimbus Platform)

Este serviço monitora o espaço em disco da máquina virtual e dispara um e-mail de emergência automático caso a partição raiz (`/`) atinja o limiar configurado (padrão: **95%**, configurável até **100%**).

## 🛡️ Características Principais

- **Independente do Docker/PostgreSQL**: Executa nativamente no sistema operacional da VM via Python 3 (biblioteca padrão) e `systemd timer`, garantindo disparo mesmo se containers travarem por falta de espaço.
- **Proteção contra Spam (Cooldown 24h)**: Quando o disco atinge o limite, o e-mail é enviado e o timestamp é salvo em memória RAM (`/dev/shm`), garantindo que apenas **1 e-mail a cada 24 horas** seja disparado enquanto o problema persistir.
- **Resiliente a Disco 100%**: Utiliza `tmpfs` (`/dev/shm`) para o arquivo de estado, evitando erros de gravação em disco quando a capacidade estiver em 100% (0 bytes livres).
- **Destinatários Padrão**:
  - `viniciuslsantana4@gmail.com`
  - `igor.maciel@ufrpe.br`

---

## ⚙️ Variáveis de Configuração (`.env`)

Adicione ao arquivo `.env` da VM (`/home/debian/nimbus-platform/.env`):

```bash
# Configurações do Alerta de Disco
DISK_THRESHOLD_PERCENT=95.0
COOLDOWN_HOURS=24
ALERT_EMAILS=viniciuslsantana4@gmail.com,igor.maciel@ufrpe.br

# Provedor SMTP (Exemplo com Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=tls
SMTP_USER=projetonimbusw@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx   # Senha de App de 16 dígitos gerada no Google
SMTP_FROM=Nimbus Alertas <projetonimbusw@gmail.com>
```

> **Como gerar Senha de App no Gmail:**
> 1. Acesse https://myaccount.google.com/apppasswords com a conta do Gmail.
> 2. Crie uma nova senha de app com o nome `Nimbus VM Alertas`.
> 3. Cole a senha de 16 caracteres no campo `SMTP_PASSWORD`.

---

## 🚀 Instalação na VM

Na VM, execute:

```bash
cd /home/debian/nimbus-platform
bash monitoring/disk_alert/install.sh
```

Ou via Taskfile:
```bash
task alert:disk:install
```

---

## 🧪 Teste Manual

Para testar o disparo de e-mail imediatamente (ignora o percentual de disco e o cooldown):

```bash
python3 monitoring/disk_alert/check_disk.py --test
```
