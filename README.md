# 💳 Pay API – Gateway de Pagamentos para Checkout

Esta aplicação é uma API REST que atua como gateway de pagamentos para checkouts de e-commerce. Ela se comunica com provedores externos simulados e é capaz de alternar entre eles automaticamente em caso de falha. Também oferece suporte a estorno e consulta de transações.

## ✨ Funcionalidades

- Processamento de pagamentos via múltiplos provedores
- Alternância automática entre provedores em caso de erro
- Estorno de pagamentos (bônus)
- Consulta de transações (bônus)
- Logs detalhados e mensagens de erro claras
- Logs com rastreamento de requisições
- Testes unitários e de integração

- Documentação de endpoints com exemplos

## 🚀 Como executar

### Pré-requisitos

- Node.js >= 20
- npm
- Docker (para rodar com Docker Compose)
- PostgreSQL (se for rodar localmente sem Docker)

### Passo a passo

1. Copie o arquivo `.env.example` e renomeie para `.env`:

```bash
cp .env.example .env
```

2. Para rodar com Docker Compose (recomendado):

```bash
docker-compose up --build
```

3. Para rodar localmente (sem Docker):

Certifique-se de que o PostgreSQL esteja rodando e configurado de acordo com o `.env`.

```bash
# Instale as dependências
npm install

# Execute a geração dos arquivos do Prisma
npx prisma generate

# Execute a criação das tabelas
npm run prisma:db

# Rode a aplicação em modo de desenvolvimento com hot reload
npm run start:dev

# Ou em modo de produção sem hot reload
npm run start
```

A API estará disponível em: `http://localhost:3000`

## 🧪 Testes

```bash
# Execute os testes com cobertura
npm run test

# Execute os testes com coverage report
npm run test:cov
```

## 📌 Endpoints

### POST `/payments`

Cria uma nova cobrança. Obs: caso informe um cartão numero 4000000000000002 o provedor 1 irá retornar um erro, assim a cobrança será processada pelo provedor 2.

**Body exemplo:**

```json
{
  "merchantId": "1323",
  "orderId": "789456",
  "amount": 1500,
  "currency": "BRL",
  "description": "Some product",
  "paymentMethod": {
    "type": "credit",
    "installments": 1,
    "card": {
      "number": "4111111111111111",
      "holderName": "jonh doe",
      "cvv": "123",
      "expirationDate": "12/2025"
    }    
  }
}
```

---

### GET `/payments/{id}`

Retorna detalhes de uma transação.

**Exemplo de retorno:**

```json
{
  "id": "f4dd6431-cdef-436b-8f28-09b7b8445e13",
  "merchantId": "1323",
  "orderId": "468sseded8",
  "amount": 1500,
  "currency": "BRL",
  "description": "Pedido #erro",
  "status": "paid",
  "paymentMethod": {
    "paymentType": "credit",
    "installments": 1
  },
  "providerId": "6e918ee8-62e2-47d4-a57e-5fc96e30f37d",
  "providerName": "stripe",
  "currentAmount": 1450,
  "paymentSource": {
    "id": "a6a5c1f3-f81a-4149-8cb8-7d7521327516",
    "sourceType": "card"
  },
  "createdAt": "2025-03-27T09:40:52.208Z",
  "updatedAt": "2025-03-27T09:40:52.234Z"
}
```
---

### GET `/payments`

Retorna lista de transações.
Query params:
- `page`: número da página (opcional) default: 1 
- `limit`: quantidade de registros por página (opcional) default: 5 min 1 max 100
- `merchantId`: ID do lojista (opcional) - `merchantId`: ID do lojista (opcional)
- `orderId`: ID do pedido (opcional) - `orderId`: ID do pedido (opcional)
- `sort`: ordenação (asc/desc) (opcional) default: asc

**Exemplo de retorno:**

```json
{
  "meta": {
    "itemCount": 1,
    "totalItems": 1,
    "itemsPerPage": 5,
    "totalPages": 1,
    "currentPage": 1
  },
  "items": [
    {
      "id": "f4dd6431-cdef-436b-8f28-09b7b8445e13",
      "merchantId": "1323",
      "orderId": "468sseded8",
      "amount": 1500,
      "currency": "BRL",
      "description": "Pedido #erro",
      "status": "paid",
      "paymentMethod": {
        "paymentType": "credit",
        "installments": 1
      },
      "providerId": "6e918ee8-62e2-47d4-a57e-5fc96e30f37d",
      "providerName": "stripe",
      "currentAmount": 1500,
      "paymentSource": {
        "id": "a6a5c1f3-f81a-4149-8cb8-7d7521327516",
        "sourceType": "card"
      },
      "createdAt": "2025-03-27T09:40:52.208Z",
      "updatedAt": "2025-03-27T09:40:52.234Z"
    }
  ]
}
```
---

### POST `/refunds/:chargeId`

Estorna um pagamento previamente processado.
Path params:
- `chargeId`: ID da cobrança a ser estornada (obrigatório)
Body:
- `amount`: valor a ser estornado (obrigatório) - Não pode ser maior que o valor da cobrança

**Body exemplo:**

```json
{
  "amount": 50
}
```
**Exemplo de retorno:**

```json
{
  "id": "f4dd6431-cdef-436b-8f28-09b7b8445e13",
  "merchantId": "1323",
  "orderId": "468sseded8",
  "amount": 1500,
  "currency": "BRL",
  "description": "Pedido #erro",
  "status": "paid",
  "paymentMethod": {
    "paymentType": "credit",
    "installments": 1
  },
  "providerId": "6e918ee8-62e2-47d4-a57e-5fc96e30f37d",
  "providerName": "stripe",
  "currentAmount": 1450,
  "paymentSource": {
    "id": "a6a5c1f3-f81a-4149-8cb8-7d7521327516",
    "sourceType": "card"
  },
  "createdAt": "2025-03-27T09:40:52.208Z",
  "updatedAt": "2025-03-27T09:40:52.234Z"
}
```
---

## 🧱 Arquitetura

- NestJS
- Domain-driven design (DDD)
- Módulos para cada contexto
- Adaptadores para provedores de pagamento
- Testes com Testcontainers e Jest
- Coverage de 100% nos testes
- Injeção de dependências
- Separação de camadas (domain, application, infra)

## ⚙️ Configuração dos Mocks

Os provedores externos são simulados em `/mocks`. Por padrão, a aplicação se comunica com eles localmente via HTTP.

Você pode alterar os endpoints mockados no arquivo `.env`:

```
PROVIDER_1_URL=http://localhost:3000/mock/provider1
PROVIDER_2_URL=http://localhost:3000/mock/provider2
```

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

Repositório público: [https://github.com/brlga002/pay-api](https://github.com/brlga002/pay-api)

---

## 🧪 Testando com o arquivo `api.http`

O projeto inclui um arquivo `api.http` na raiz com exemplos prontos de requisições para todos os endpoints:

- Criar uma cobrança
- Listar cobranças
- Consultar por ID
- Estornar uma cobrança

Você pode executá-las diretamente do VS Code utilizando a extensão **REST Client**:
📦 [REST Client - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

Basta abrir o arquivo `api.http`, posicionar o cursor sobre a requisição desejada e clicar em **"Send Request"**.

