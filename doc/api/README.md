# API — OpenAPI (contrato)

- **`openapi.json`** — esquema OpenAPI 3 gerado a partir do FastAPI (RNF-DevEx-08). Pode ser lido offline; não é necessário ter a API em execução.
- **`index.html`** — [ReDoc](https://github.com/Redocly/redoc) a carregar o JSON local.

## Regenerar o JSON após alterar rotas ou modelos

Na raiz do repositório:

```bash
make openapi-export
```

## Ver a documentação sem subir o backend

Na pasta deste ficheiro:

```bash
python3 -m http.server 8766
```

(Em alguns ambientes o comando é `python` em vez de `python3`.)

Abrir no navegador: `http://127.0.0.1:8766/` (ficheiro `index.html` + `openapi.json` no mesmo diretório).

## Com a API em execução

- Esquema JSON: `GET http://localhost:8000/openapi.json`
- UI ReDoc: `http://localhost:8000/redoc` (Swagger UI `/docs` está desativado no código)

## Versões `/api/v1` e `/api/v2`

- **`/api/v1`** — resposta JSON directa dos schemas (painel Next.js).
- **`/api/v2`** — envelope **DEC-06** `{ success, data, errors }`; lista de rotas e política em [execucao/api-v1-v2-deprecacao.md](../execucao/api-v1-v2-deprecacao.md).
