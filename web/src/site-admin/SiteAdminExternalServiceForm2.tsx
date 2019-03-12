import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { FormattingOptions } from '@sqs/jsonc-parser'
import { setProperty } from '@sqs/jsonc-parser/lib/edit'
import * as H from 'history'
import { upperFirst } from 'lodash'
import * as React from 'react'
import * as GQL from '../../../shared/src/graphql/schema'
import { ErrorLike } from '../../../shared/src/util/errors'
import { Form } from '../components/Form'
import { DynamicallyImportedMonacoSettingsEditor } from '../settings/DynamicallyImportedMonacoSettingsEditor'
import { EditorAction } from './configHelpers'
import { ExternalServiceMetadata, ExternalServiceQualifier } from './externalServices'

interface Props {
    history: H.History
    externalServiceKind: GQL.ExternalServiceKind
    externalServiceQualifier?: ExternalServiceQualifier
    externalService: ExternalServiceMetadata
    isLightTheme: boolean
    error?: ErrorLike
    mode: 'edit' | 'create'
    loading: boolean
    onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void
    onChange: (change: GQL.IAddExternalServiceInput) => void
}

const defaultFormattingOptions: FormattingOptions = {
    eol: '\n',
    insertSpaces: true,
    tabSize: 2,
}

const gitHubEditorActions: EditorAction[] = [
    {
        id: 'setAccessToken',
        label: 'Set access token',
        run: config => {
            const value = '<GitHub personal access token>'
            const edits = setProperty(config, ['token'], value, defaultFormattingOptions)
            return { edits, selectText: '<GitHub personal access token>' }
        },
    },
    {
        id: 'addOrgRepo',
        label: 'Add organization repositories',
        run: config => {
            const value = 'org:<organization name>'
            const edits = setProperty(config, ['repositoryQuery', -1], value, defaultFormattingOptions)
            return { edits, selectText: '<organization name>' }
        },
    },
    {
        id: 'addSingleRepo',
        label: 'Add single repository',
        run: config => {
            const value = '<GitHub owner>/<GitHub repository name>'
            const edits = setProperty(config, ['repos', -1], value, defaultFormattingOptions)
            return { edits, selectText: '<GitHub owner>/<GitHub repository name>' }
        },
    },
    {
        id: 'addSearchQueryRepos',
        label: 'Add repositories matching search query',
        run: config => {
            const value = '<GitHub search query>'
            const edits = setProperty(config, ['repositoryQuery', -1], value, defaultFormattingOptions)
            return { edits, selectText: '<GitHub search query>' }
        },
    },
]
const gitHubDotComEditorActions: EditorAction[] = [
    {
        id: 'addPublicRepo',
        label: 'Add public repository',
        run: config => {
            const value = '<GitHub owner>/<GitHub repository name>'
            const edits = setProperty(config, ['repos', -1], value, defaultFormattingOptions)
            return { edits, selectText: '<GitHub owner>/<GitHub repository name>' }
        },
    },
]

export class SiteAdminExternalServiceForm extends React.Component<Props, {}> {
    public render(): JSX.Element | null {
        const editorActions: EditorAction[] = []
        if (this.props.externalServiceKind === GQL.ExternalServiceKind.GITHUB) {
            editorActions.push(...gitHubEditorActions)
            if (this.props.externalServiceQualifier === 'dotcom') {
                editorActions.push(...gitHubDotComEditorActions)
            }
        }

        return (
            <Form className="external-service-form" onSubmit={this.props.onSubmit}>
                {this.props.error && <p className="alert alert-danger">{upperFirst(this.props.error.message)}</p>}
                <div className="form-group">
                    <label htmlFor="e2e-external-service-form-display-name">Display name</label>
                    <input
                        id="e2e-external-service-form-display-name"
                        type="text"
                        className="form-control"
                        required={true}
                        autoCorrect="off"
                        autoComplete="off"
                        autoFocus={true}
                        spellCheck={false}
                        value={this.props.externalService.defaultDisplayName}
                        onChange={this.onDisplayNameChange}
                        disabled={this.props.loading}
                    />
                </div>

                <div className="form-group">
                    <DynamicallyImportedMonacoSettingsEditor
                        // DynamicallyImportedMonacoSettingsEditor does not re-render the passed input.config
                        // if it thinks the config is dirty. We want to always replace the config if the kind changes
                        // so the editor is keyed on the kind.
                        value={this.props.externalService.defaultConfig}
                        jsonSchema={this.props.externalService.jsonSchema}
                        canEdit={false}
                        loading={this.props.loading}
                        height={300}
                        isLightTheme={this.props.isLightTheme}
                        onChange={this.onConfigChange}
                        history={this.props.history}
                        actions={editorActions}
                    />
                    <p className="form-text text-muted">
                        <small>Use Ctrl+Space for completion, and hover over JSON properties for documentation.</small>
                    </p>
                </div>
                <button
                    type="submit"
                    className={`btn btn-primary ${this.props.mode === 'create' && 'e2e-add-external-service-button'}`}
                    disabled={this.props.loading}
                >
                    {this.props.loading && <LoadingSpinner className="icon-inline" />}
                    {this.props.mode === 'edit'
                        ? `Update ${this.props.externalService.title}`
                        : `Add ${this.props.externalService.title}`}
                </button>
            </Form>
        )
    }

    private onDisplayNameChange: React.ChangeEventHandler<HTMLInputElement> = () => {
        // this.props.onChange({ ...this.props.input, displayName: event.currentTarget.value })
    }

    private onConfigChange = () => {
        // this.props.onChange({ ...this.props.input, config })
    }
}
