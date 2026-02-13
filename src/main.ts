import Fastify from 'fastify'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'

const fastify = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>()

// Register a find-my-way constraint strategy so routes can be distinguished
// based on the `x-github-event` header. This lets you register multiple
// routes with the same method+url but different header values.
fastify.addConstraintStrategy({
  name: 'github_event',
  storage: () => {
    const handlers: Record<string, any> = {}
    return {
      get: (value: unknown) => handlers[String(value)] ?? null,
      set: (value: unknown, handler: any) => {
        handlers[String(value)] = handler
      },
      del: (value: unknown) => {
        delete handlers[String(value)]
      },
      empty: () => {
        for (const k of Object.keys(handlers)) delete handlers[k]
      },
    }
  },
  deriveConstraint: (request) => {
    return request.headers['x-github-event'] ?? ''
  },
})

fastify.route({
  method: 'POST',
  url: '/',
  constraints: {
    github_event: 'issue_comment',
  },
  schema: {
    body: Type.Object({
      action: Type.String(),
      issue: Type.Object({
        number: Type.Number(),
        title: Type.String(),
      }),
      comment: Type.Object({
        id: Type.Number(),
        body: Type.String(),
        user: Type.Object({
          login: Type.String(),
        }),
      }),
      repository: Type.Object({
        name: Type.String(),
      }),
    }),
  },
  handler: (request, reply) => {
    console.log('issue comment: ' + request.body.comment.body)

    reply.send({ ok: true })
  },
})

fastify.route({
  method: 'POST',
  url: '/',
  constraints: {
    github_event: 'issues',
  },
  schema: {
    body: Type.Object({
      action: Type.String(),
      issue: Type.Object({
        number: Type.Number(),
        title: Type.String(),
        state: Type.String(),
      }),
      repository: Type.Object({
        name: Type.String(),
      }),
    }),
  },
  handler: (request, reply) => {
    console.log('issue: ' + request.body.issue.title)

    reply.send({ ok: true })
  },
})

console.log(fastify.printRoutes())

await fastify.listen({ port: 3000 })
