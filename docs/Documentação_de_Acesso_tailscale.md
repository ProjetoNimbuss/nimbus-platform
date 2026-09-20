# Guia de Acesso ao Servidor via Tailscale

Este documento orienta os membros da equipe sobre como configurar e utilizar o Tailscale para acessar o ambiente de computação do projeto Nimbus de forma segura e privada.

---

## 1. Visão Geral

A infraestrutura de servidores do projeto Nimbus opera sem IP público direto exposto para a internet. O acesso administrativo e o consumo de serviços internos são realizados exclusivamente por meio de uma rede overlay mesh criptografada, viabilizada pelo Tailscale.

Dessa forma, apenas usuários autenticados e autorizados na rede privada (Tailnet) do projeto conseguem estabelecer comunicação com a máquina virtual.

---

## 2. Pré-requisitos

Antes de iniciar a configuração na sua máquina local, certifique-se de:

* Ter uma conta de desenvolvedor cadastrada e convidada para a Tailnet do projeto Nimbus;
* Possuir privilégios de administrador local no seu sistema operacional para instalar o cliente de rede;
* Ter um cliente SSH instalado (OpenSSH para Linux/macOS ou OpenSSH/PowerShell para Windows).

---

## 3. Instalação do Cliente Tailscale

Instale o aplicativo oficial do Tailscale de acordo com o seu sistema operacional:

### Linux (Ubuntu, Debian, Linux Mint e derivados)
Execute o script de instalação oficial no terminal:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

### macOS
* Baixe o aplicativo diretamente pela Mac App Store ou instale via Homebrew:
```bash
brew install --cask tailscale
```

### Windows
* Baixe o instalador oficial `.msi` diretamente do site oficial do Tailscale (tailscale.com/download/windows) e conclua a instalação padrão.

---

## 4. Autenticação na Tailnet do Projeto

Após a instalação, é necessário autenticar o seu dispositivo:

1. Inicie a conexão no terminal:
   ```bash
   sudo tailscale up
   ```
2. O terminal exibirá uma URL de autenticação.
3. Copie a URL e abra no navegador logado com a sua conta autorizada da organização Nimbus.
4. Conceda permissão para que o seu dispositivo entre na rede.

Para verificar se o seu dispositivo está ativo e visualizar os demais nós da rede, execute:
```bash
tailscale status
```
O nó correspondente ao servidor de produção do Nimbus deverá constar na lista com o status online.

---

## 5. Acesso via SSH ao Servidor

Com o Tailscale ativo na sua máquina, a resolução de nomes interna (MagicDNS) permite o acesso direto pelo hostname da máquina virtual, sem necessidade de memorizar endereços IP.

### Conexão padrão
Execute no seu terminal:
```bash
ssh debian@nimbus-server-prod
```

### Conexão via Tailscale SSH
Caso o seu usuário utilize a autenticação nativa do Tailscale SSH:
```bash
tailscale ssh debian@nimbus-server-prod
```

---

## 6. Acesso a Serviços Internos (Port Forwarding)

Determinados serviços (como a API FastAPI, interfaces de orquestração do Prefect ou bancos de dados locais) rodam em portas internas na máquina virtual.

Existem duas formas de acessá-los:

### Acesso Direto pela Rede Mesh
Como o seu computador e a máquina virtual compartilham a mesma rede privada, você pode abrir o navegador e apontar diretamente para o hostname e a porta do serviço desejado:
* Exemplo API: `http://nimbus-server-prod:8000`
* Exemplo Painel de Orquestração: `http://nimbus-server-prod:4200`

### Redirecionamento de Portas via Túnel SSH
Se preferir mapear uma porta da máquina remota para a sua máquina local:
```bash
ssh -L 8000:localhost:8000 debian@nimbus-server-prod
```
Neste cenário, acessar `http://localhost:8000` no seu computador direcionará o tráfego de forma criptografada para a porta 8000 do servidor Nimbus.

---

## 7. Diagnóstico e Resolução de Problemas

### Servidor inacessível via SSH
1. Verifique se o serviço do Tailscale está rodando no seu computador:
   ```bash
   tailscale status
   ```
2. Tente realizar um ping na rede Tailscale:
   ```bash
   tailscale ping nimbus-server-prod
   ```
3. Se a resolução de nomes falhar, tente a conexão utilizando o IP atribuído pelo Tailscale (disponível na saída de `tailscale status`).

### Sessão desconectada ou expirada
Se a chave de autenticação do seu nó local expirar, execute novamente:
```bash
sudo tailscale up --reset
```
E repita o fluxo de login no navegador.
