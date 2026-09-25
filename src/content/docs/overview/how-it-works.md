---
title: How VORQ works
description: The components of the VORQ network and the life of a job.
sidebar:
  order: 1
---

VORQ is an async inference exchange. Clients submit jobs, independent providers claim and run them, and the result settles on-chain. Every job is submit-and-poll: you get a job id in milliseconds and read the result when it is ready.

## Components

```
Client SDK (Python / JS)          Provider daemon (vorqd)
        │                            │                 │
        │ HTTP                       │ HTTP            │ HTTP
        ▼                            ▼                 ▼
┌────────────────────────────────────────┐   ┌──────────────────────────┐
│  Coordinator                           │   │ Provider's inference API │
│  /v1/*  client API                     │   │ (vLLM, OpenAI-compatible,│
│  /evm/* provider API                   │   │  queue-style)            │
└───────────────────┬────────────────────┘   └──────────────────────────┘
                    │ reads state, relays signed operations
                    ▼
┌────────────────────────────────────────┐
│  Contracts on Base                     │
│  JobRegistry · ProviderRegistry ·      │
│  AskRegistry                           │
└────────────────────────────────────────┘
```

| Component | Role |
|---|---|
| [Python SDK](/python/) / [JavaScript SDK](/js/) | Submit jobs and batches, read results. Talk only to `/v1/*`. |
| [Provider daemon](/provider/) | Publishes asks, claims jobs, runs them on your backend, settles. |
| [Coordinator](/coordinator/) | Serves the API, indexes the chain, relays signed operations and pays their gas. |
| [Contracts](/contracts/) | The settlement authority: job state, provider registry, ask book. |

Neither SDK holds an RPC client or sends raw transactions. Each signs its own EIP-712 payloads; the coordinator relays them. The contracts verify every signature, so relaying confers no authority.

## Payment

The chain is **Base**, and jobs are paid in **USDC**. A client pays with an EIP-3009 authorization signed alongside the order — there is no approval transaction, and a client never needs ETH. The contract pulls the payment when a provider claims the job.

## Life of a job

| Protocol state | Client status | Meaning |
|---|---|---|
| Open | `queued` | Posted, waiting for a provider. |
| Claimed | `in_progress` | A provider is running it. |
| Settled | `completed` | Result delivered and paid. |
| Cancelled — `cancelled` | `cancelled` | The client cancelled it. |
| Cancelled — `expired` | `cancelled` | No provider claimed it in time. |
| Cancelled — `provider_fail` | `failed` | The provider reported failure. |
| Cancelled — `reclaim` | `failed` | Claimed but not settled within the window. |

A job ends for exactly one reason: `settled`, `cancelled`, `expired`, `provider_fail` or `reclaim`. You are charged for compute only on settled jobs.

## Completion window (`sla`)

`sla` is the maximum time a job may take; jobs usually finish sooner.

| Window | SDK alias | Typical use |
|---|---|---|
| `"1h"` | `async` | Interactive-ish work: minutes, up to an hour. |
| `"24h"` | `batch` | Bulk work: up to 24 hours. |

## Models

Model ids are `family:quantization`, for example `deepseek-v4-pro:fp8`. Each variant has its own order book and prices. A bare family name resolves to the highest-precision registered variant. `GET /v1/models` lists what the network serves.

## OpenAI compatibility

- The Batch API is endpoint-compatible.
- Single text requests work through the Responses API — in background mode, or synchronously with the connection held until the job settles.
- Text payloads are standard OpenAI request and response objects, so the stock `openai` client works against VORQ.

There is no live `/v1/chat/completions`. Media-output models use `/v1/jobs`, which the SDKs expose as one surface for every modality.

## Privacy

Job payloads are encrypted. An order addressed to a specific provider is sealed to that provider's registered key, so only it can open the payload. An open order is sealed to the coordinator's escrow key, which releases the payload key only to the provider whose claim the chain accepted.
