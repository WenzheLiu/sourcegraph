import { BehaviorSubject } from 'rxjs'
import { filter } from 'rxjs/operators'
import * as WebSocket from 'ws'
import { Client, ClientState } from '../../src/client/client'
import { TextDocumentStaticDecorationsFeature } from '../../src/client/features/decorations'
import { TextDocumentHoverFeature } from '../../src/client/features/hover'
import { TextDocumentDidOpenFeature } from '../../src/client/features/textDocuments'
import { createObservableEnvironment, EMPTY_ENVIRONMENT, Environment } from '../../src/environment/environment'
import { NoopProviderRegistry } from '../../src/environment/providers/textDocument'
import { createWebSocketMessageTransports } from '../../src/jsonrpc2/transports/nodeWebSocket'
import { TextDocumentDecorationsParams, TextDocumentDecorationsRequest } from '../../src/protocol/decorations'
import config from './config'

const environment = new BehaviorSubject<Environment>(EMPTY_ENVIRONMENT)

const client = new Client('', '', {
    root: config.root,
    documentSelector: config.documentSelector,
    initializationOptions: config.initializationOptions,
    createMessageTransports: () =>
        createWebSocketMessageTransports(
            new WebSocket(config.url, {
                headers: { Authorization: `token ${config.accessToken}` },
            })
        ),
    environment: createObservableEnvironment(environment),
})
client.registerFeature(new TextDocumentDidOpenFeature(client))
client.registerFeature(new TextDocumentHoverFeature(client, new NoopProviderRegistry()))
client.registerFeature(new TextDocumentStaticDecorationsFeature(client, new NoopProviderRegistry()))
client.state.subscribe(state => console.log('Client state:', ClientState[state]))
client.start()
const onReady = client.state.pipe(filter(state => state === ClientState.Running))

async function run(): Promise<void> {
    console.log('textDocument/hover...')
    try {
        const result = await client.sendRequest<any>('textDocument/hover', {
            textDocument: { uri: `${config.root}#mux.go` },
            position: { character: 5, line: 23 },
        })
        console.log('textDocument/hover result:', result)
    } catch (err) {
        console.error('textDocument/hover failed:', err.message)
    }

    console.log('textDocument/decorations...')
    try {
        const result = await client.sendRequest(TextDocumentDecorationsRequest.type, {
            textDocument: { uri: `${config.root}#mux.go` },
        } as TextDocumentDecorationsParams)
        console.log('textDocument/decorations result:', result)
    } catch (err) {
        console.error('textDocument/decorations failed:', err.message)
    }

    console.log('textDocument/didOpen...')
    environment.next({
        ...environment.value,
        component: {
            document: {
                uri: `${config.root}#mux.go`,
                languageId: 'go',
            },
            selections: [],
            visibleRanges: [],
        },
    })
}

onReady.subscribe(async () => {
    await run()
    await client.stop()
    process.exit(0)
})