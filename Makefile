.PHONY: help install lint extract setup-storage
.DEFAULT_GOAL := help

help:
	@echo "Comandos disponíveis:"
	@echo "  install        - Instala as dependências de desenvolvimento"
	@echo "  lint           - Roda ruff para linting"
	@echo "  extract        - Roda o scraper APAC localmente"
	@echo "  setup-storage  - Provisiona os buckets MinIO (executar uma vez no setup)"

install:
	pip install -r requirements.txt
	pip install ruff pre-commit
	pre-commit install

lint:
	ruff check .

extract:
	python pipeline/extract/extract_apac.py

setup-storage:
	python include/pipeline/storage/setup_minio.py
