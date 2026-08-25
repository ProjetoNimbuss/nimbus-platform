# Estratégia de Branches, Pull Requests e Tags de Versionamento

Este documento define o fluxo de trabalho do Git e a estratégia de versionamento para o projeto, considerando o cenário de uma equipe com duas pessoas e a ausência de um ambiente de Homologação (HML) ou de uma branch develop.

## 1. Contexto e Premissas

- **Equipe Enxuta**: Duas pessoas desenvolvedoras.
- **Ambiente Único (Produção)**: Não há ambiente de staging/homologação. O código aprovado reflete diretamente o estado da aplicação.
- **Branch Única Perene (main)**: A branch principal é a fonte da verdade e deve estar sempre estável e pronta para implantação.

## 2. Estratégia de Branches

Para manter a organização e evitar conflitos complexos, adotamos a abordagem baseada no GitHub Flow simplificado.

### Regras de Ouro

- **Qualquer alteração = Nova Branch**: Nenhuma alteração de código (por menor que seja) deve ser commitada diretamente na `main`.
- **Origem Exclusiva**: Toda e qualquer nova branch deve nascer obrigatoriamente a partir da branch `main`. É estritamente proibido criar uma branch a partir de outra branch de trabalho.

### Padrão de Nomenclatura

Para facilitar a identificação do objetivo de cada branch, utilize os seguintes prefixos:

- `feature/nome-curto`: Para novas funcionalidades (ex: `feature/login-usuario`).
- `bugfix/nome-curto`: Para correção de bugs não emergenciais (ex: `bugfix/erro-calculo-imc`).
- `hotfix/nome-curto`: Para correção de bugs críticos em produção (ex: `hotfix/falha-pagamento`).
- `docs/nome-curto`: Para atualizações na documentação.
- `chore/nome-curto`: Para tarefas de manutenção, atualização de dependências, etc.

## 3. Fluxo de Pull Requests (PR)

O processo de integração de código é feito unicamente através de Pull Requests para a `main`.

### Passo a Passo do Fluxo de Trabalho

1. **Atualize sua main local**: Antes de iniciar qualquer trabalho, garanta que você tem o código mais recente.
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Crie a sua branch de trabalho**:
   ```bash
   git checkout -b feature/sua-nova-funcionalidade
   ```

3. **Desenvolva, teste localmente e faça commits**: Faça commits claros e descritivos.

4. **Envie a branch para o repositório remoto**:
   ```bash
   git push origin feature/sua-nova-funcionalidade
   ```

5. **Abra o Pull Request (PR)**:
   - No GitHub, abra um PR da sua branch (ex: `feature/sua-nova-funcionalidade`) apontando para a `main`.
   - Preencha a descrição do PR informando o que foi feito.

6. **Revisão de Código (Code Review)**:
   - Como a equipe tem 2 pessoas, a pessoa que não desenvolveu a alteração deve revisar o PR.
   - Se houver ajustes, faça na mesma branch e o PR será atualizado automaticamente.

7. **Merge e Limpeza**:
   - Após a aprovação, o PR deve ser mesclado (merged) na `main`.
   - Sempre exclua a branch de trabalho após o merge para manter o repositório limpo.

## 4. Tags e Versionamento

Como não há um fluxo de release complexo (sem ambiente HML), o versionamento será feito através de Tags diretamente na branch `main` após a integração de uma funcionalidade importante ou conjunto de correções.

Adotaremos o padrão Semantic Versioning (SemVer) no formato `vMAJOR.MINOR.PATCH`:

- **MAJOR (v1.0.0)**: Mudanças grandes, reestruturações que quebram a compatibilidade.
- **MINOR (v0.1.0)**: Novas funcionalidades adicionadas de forma compatível.
- **PATCH (v0.0.1)**: Correções de bugs ou pequenos ajustes.

### Quando e Como Criar uma Tag

Sempre que a main atingir um estado estável que configure uma nova "entrega" ou marco no projeto, crie a tag:

1. **Acesse a main e atualize**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Crie a tag com uma anotação sobre o lançamento**:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 - Funcionalidade X e Y finalizadas"
   ```

3. **Envie a tag para o repositório remoto**:
   ```bash
   git push origin v1.0.0
   ```
