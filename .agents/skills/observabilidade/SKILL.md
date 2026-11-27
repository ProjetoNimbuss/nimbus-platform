---
name: observabilidade
description: >-
  Use quando for adicionar ou alterar alvos de scrape, métricas, regras de alerta do
  Prometheus ou dashboards provisionados do Grafana no Nimbus.
---

# Observabilidade (Prometheus + Grafana)

Arquivos:
- `monitoring/prometheus/prometheus.yml` — jobs atuais: `prometheus`, `node-exporter`, `cadvisor`.
- `monitoring/grafana/provisioning/datasources/datasources.yml`
- `monitoring/grafana/provisioning/dashboards/dashboards.yml` — provider lê
  `/etc/grafana/provisioning/dashboards` com `foldersFromFilesStructure: true`.

## Novo alvo de métricas

1. Garanta que o serviço expõe `/metrics` (ex.: Prefect, Laravel com exporter).
2. Adicione em `prometheus.yml`, usando o **nome do serviço do docker-compose**:
   ```yaml
     - job_name: '<servico>'
       static_configs:
         - targets: ['<servico>:<porta_interna>']
   ```
3. `task up:obs` (ou `task restart`) → `http://localhost:9090/targets` com estado `UP`.

## Regra de alerta

1. Crie `monitoring/prometheus/rules/<dominio>.yml` (ver [alerta_template.yml](examples/alerta_template.yml)).
2. Referencie em `rule_files:` no `prometheus.yml` (e confirme o volume no docker-compose).
3. Valide: `docker-compose exec prometheus promtool check config /etc/prometheus/prometheus.yml`.

## Dashboard

1. Crie o JSON em `monitoring/grafana/provisioning/dashboards/<pasta>/<nome>.json`
   (`"id": null`, `uid` fixo, datasource pelo `uid` definido em `datasources.yml`).
2. Recarrega em até 30s → `http://localhost:3001`, pasta "Nimbus Observability".

Não altere credenciais do Grafana; não exponha portas novas sem avisar o usuário.
