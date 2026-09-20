# Documentação Técnica e Justificativa de Arquitetura: Tailscale

Este documento detalha a justificativa arquitetural, o funcionamento técnico e os padrões de segurança que motivaram a adoção do Tailscale na infraestrutura da plataforma Nimbus.

---

## 1. Contexto e Motivação

O projeto Nimbus adota uma arquitetura multi-cloud distribuída: a camada analítica e de dados reside no Google Cloud Platform (GCP), enquanto o processamento, orquestração e APIs residem em instâncias de computação na Magalu Cloud (região Fortaleza / br-ne1).

No modelo de operação tradicional de nuvem, servidores de aplicação exigem um IP público associado e portas de rede abertas (como a porta 22 para SSH ou portas 8000/4200 para APIs e ferramentas de orquestração). Essa abordagem apresenta sérias desvantagens operacionais e de segurança:

1. **Superfície de ataque aberta:** Qualquer porta exposta para a internet pública (0.0.0.0/0) sofre varreduras automatizadas contínuas, ataques de força bruta e tentativas de exploração de vulnerabilidades zero-day.
2. **Fragilidade de listas de controle de acesso (ACLs/Firewall):** Desenvolvedores costumam operar a partir de conexões residenciais com IPs dinâmicos, o que inviabiliza o bloqueio estrito de IPs sem constante manutenção manual de regras de firewall.
3. **Complexidade e custo de servidores Bastion:** A criação de servidores intermediários (bastion hosts ou jump boxes) adiciona custos de infraestrutura adicionais e cria um ponto único de falha.
4. **Alocação de IPv4 público desnecessária:** Provedores de nuvem cobram taxas pela reserva de endereços IPv4 públicos fixos.

Para solucionar essas restrições, a equipe optou por eliminar completamente o IP público da máquina virtual na Magalu Cloud e implementar uma rede overlay baseada em Tailscale.

---

## 2. Fundamentos Técnicos do Tailscale

O Tailscale é uma implementação corporativa de rede privada mesh construída sobre o protocolo moderno de VPN de código aberto **WireGuard**.

### 2.1 Protocolo Criptográfico WireGuard
Diferente de soluções legadas como OpenVPN ou IPsec, que utilizam pilhas criptográficas complexas e volumosas, o WireGuard opera diretamente no kernel do sistema operacional e adota primitivas criptográficas de última geração:
* **Troca de chaves:** Curve25519 (ECDH)
* **Criptografia e autenticação:** ChaCha20 para cifra simétrica e Poly1305 para autenticação de mensagens (AEAD)
* **Função hash:** BLAKE2s
* **Hashing de chaves:** HKDF

Essa base garante altíssimo throughput com overhead mínimo de CPU e baixa latência, fator essencial para a ingestão contínua de telemetria climática do Nimbus.

### 2.2 Topologia Mesh Ponto a Ponto (Peer-to-Peer)
VPNs tradicionais adotam a topologia estrela (hub-and-spoke), em que todo o tráfego precisa passar obrigatoriamente por um servidor concentrador central, gerando gargalo de banda e latência desnecessária.

O Tailscale opera em malha completa (mesh). Quando um membro da equipe estabelece conexão com a máquina virtual na Magalu Cloud, o tráfego trafega diretamente entre a máquina local e o servidor, sem intermediários.

### 2.3 Separação entre Plano de Controle e Plano de Dados
A arquitetura do Tailscale é estritamente dividida em dois domínios:
* **Plano de Controle:** Servidores de coordenação do Tailscale trocam apenas chaves públicas, rotas de rede e políticas de controle de acesso (ACL). Nenhum dado do usuário trafega pelo plano de controle.
* **Plano de Dados:** Os pacotes de rede criptografados trafegam diretamente entre os nós da rede (peer-to-peer). O provedor do Tailscale não possui as chaves privadas e não tem capacidade técnica de inspecionar o tráfego.

### 2.4 Transposição de NAT (NAT Traversal)
Servidores e desenvolvedores operam frequentemente atrás de roteadores e firewalls corporativos ou residenciais (NAT). O Tailscale implementa técnicas avançadas de NAT traversal (utilizando STUN e ICE) para descobrir portas e estabelecer conexões UDP diretas mesmo entre redes privadas distintas. Em cenários extremos onde conexões UDP diretas são bloqueadas por firewalls restritivos, a comunicação utiliza relays criptografados distribuídos globalmente (servidores DERP).

---

## 3. Modelo de Segurança Zero Trust e Tailscale SSH

A integração do Tailscale ao projeto Nimbus estabelece uma postura de segurança alinhada ao princípio de Privilégio Mínimo e Zero Trust:

### 3.1 Superfície de Ataque Reduzida a Zero
Ao configurar `allocate_public_ipv4 = false` na instância da Magalu Cloud via Terraform, a máquina virtual não possui interface de entrada pública. Qualquer tentativa de varredura ou ataque vindo da internet pública é descartada antes de chegar ao sistema operacional.

### 3.2 Tailscale SSH e Gestão de Identidade
Tradicionalmente, o acesso administrativo requer o gerenciamento descentralizado de arquivos de chaves SSH públicas e privadas (`id_rsa` / `id_ed25519`). Essa prática acarreta riscos de vazamento de chaves ou dificuldade de revogação de acessos quando membros deixam o time.

Com o Tailscale SSH ativado no servidor (`tailscale up --ssh`):
* A autenticação é vinculada à identidade do usuário no provedor de SSO/OIDC (conta da organização);
* A autorização é controlada centralmente pelo painel de controle;
* As chaves de sessão são temporárias e renovadas automaticamente;
* O acesso pode ser revogado instantaneamente sem necessidade de alterar o arquivo `authorized_keys` no servidor.

---

## 4. Integração com a Infraestrutura como Código (Terraform)

O provisionamento da infraestrutura do Tailscale no projeto Nimbus é 100% automatizado no repositório Terraform:

1. **Declaração de Segredos:** A chave de autorização temporária (`tailscale_auth_key`) é injetada via variável sensível no módulo `mgc_compute`.
2. **Inicialização via Cloud-Init:** A máquina virtual na Magalu Cloud recebe um script codificado em base64 no parâmetro `user_data`.
3. **Auto-registro na Rede:** No primeiro boot da instância Debian 12 na região `br-ne1`, o sistema executa a instalação do pacote e registra o hostname oficial `nimbus-server-prod` na rede mesh.
4. **Isolamento de Rede:** O Security Group da Magalu Cloud dispensa a abertura da porta 22 para a internet, mantendo apenas portas locais ou comunicação privada.

---

## 5. Benefícios Operacionais para o Projeto Nimbus

| Critério | Abordagem Tradicional (IP Público / Bastion) | Abordagem Nimbus (Tailscale Mesh) |
| :--- | :--- | :--- |
| **Exposição a Ataques** | Alta (Portas 22 e serviços abertos na internet) | Nula (Nenhuma porta exposta publicamente) |
| **Custo de Infraestrutura** | Cobrança por IPv4 público e servidores extras | Custo zero (Camada gratuita para equipes e sem IP público) |
| **Latência de Acesso** | Roteamento variável pela internet pública | Comunicação direta ponto a ponto criptografada |
| **Gestão de Chaves SSH** | Manual, arquivo por arquivo em cada máquina | Vinculada à identidade do usuário (Single Sign-On) |
| **Acesso a Serviços Internos** | Exige configuração de túneis manuais ou VPN legada | Nativo via MagicDNS (ex: `http://nimbus-server-prod:8000`) |

---

## 6. Conclusão

A utilização do Tailscale consolida uma infraestrutura moderna, robusta e aderente aos mais altos padrões de segurança em nuvem. O projeto Nimbus elimina custos desnecessários com endereçamento público e servidores intermediários, garantindo que o acesso operacional aos pipelines de dados e orquestração ocorra de forma transparente, rápida e estritamente restrita aos membros autorizados da equipe.
