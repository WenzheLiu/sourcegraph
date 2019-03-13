import * as H from 'history'
import { map as lodashMap } from 'lodash'
import React from 'react'
import { Observable, Subject, Subscription } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'
import { LinkOrButton } from '../../../shared/src/components/LinkOrButton'
import { gql } from '../../../shared/src/graphql/graphql'
import { ExternalServiceKind } from '../../../shared/src/graphql/schema'
import * as GQL from '../../../shared/src/graphql/schema'
import { createAggregateError } from '../../../shared/src/util/errors'
import { mutateGraphQL } from '../backend/graphql'
import { PageTitle } from '../components/PageTitle'
import { refreshSiteFlags } from '../site/backend'
import { ThemeProps } from '../theme'
import { EditorAction } from './configHelpers'
import { ExternalServiceButton } from './ExternalServiceButton'
import {
    AddExternalServiceMetadata,
    ALL_ADD_EXTERNAL_SERVICES,
    asExternalServiceQualifier,
    ExternalServiceQualifier,
    getExternalService,
    gitHubDotComEditorActions,
    gitHubEditorActions,
    getEditorActions,
} from './externalServices'
import { SiteAdminExternalServiceForm } from './SiteAdminExternalServiceForm2'

interface SiteAdminAddExternalServiceProps extends ThemeProps {
    history: H.History
    kind: ExternalServiceKind
    qualifier?: ExternalServiceQualifier

    eventLogger: {
        logViewEvent: (event: 'AddExternalService') => void
        log: (event: 'AddExternalServiceFailed' | 'AddExternalServiceSucceeded', eventProperties?: any) => void
    }
}

interface SiteAdminAddExternalServiceState {
    displayName: string
    config: string

    /**
     * Holds any error returned by the remote GraphQL endpoint on failed requests.
     */
    error?: Error

    /**
     * True if the form is currently being submitted
     */
    loading: boolean
}

/**
 * Page for adding a single external service
 */
export class SiteAdminAddExternalServicePage extends React.Component<
    SiteAdminAddExternalServiceProps,
    SiteAdminAddExternalServiceState
> {
    constructor(props: SiteAdminAddExternalServiceProps) {
        super(props)
        this.state = {
            loading: false,
            displayName: getExternalService(this.props.kind).defaultDisplayName,
            config: getExternalService(this.props.kind).defaultConfig,
        }
    }

    private submits = new Subject<GQL.IAddExternalServiceInput>()
    private subscriptions = new Subscription()

    public componentDidMount(): void {
        this.props.eventLogger.logViewEvent('AddExternalService')
        this.subscriptions.add(
            this.submits
                .pipe(
                    tap(() => this.setState({ loading: true })),
                    switchMap(input =>
                        addExternalService(input, this.props.eventLogger).pipe(
                            map(() => {
                                // Refresh site flags so that global site alerts
                                // reflect the latest configuration.
                                refreshSiteFlags().subscribe(undefined, err => console.error(err))

                                this.setState({ loading: false })
                                this.props.history.push(`/site-admin/external-services`)
                            }),
                            catchError(error => {
                                console.error(error)
                                this.setState({ error, loading: false })
                                return []
                            })
                        )
                    )
                )
                .subscribe()
        )
    }

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        const externalService = getExternalService(this.props.kind)
        return (
            <div className="add-external-service-page">
                <PageTitle title="Add external service" />
                <h1>Add external service</h1>
                <ExternalServiceButton {...externalService} />
                <p>{externalService.longDescription}</p>
                <SiteAdminExternalServiceForm
                    error={this.state.error}
                    input={this.getExternalServiceInput()}
                    externalService={getExternalService(this.props.kind)}
                    editorActions={getEditorActions(this.props.kind, this.props.qualifier)}
                    {...this.props}
                    mode="create"
                    onSubmit={this.onSubmit}
                    onChange={this.onChange}
                    loading={this.state.loading}
                />
            </div>
        )
    }

    private getExternalServiceInput(): GQL.IAddExternalServiceInput {
        return {
            displayName: this.state.displayName,
            config: this.state.config,
            kind: this.props.kind,
        }
    }

    // TODO(beyang): remove kind from GQL.IAddExternalServiceInput?
    private onChange = (input: GQL.IAddExternalServiceInput) => {
        this.setState({
            displayName: input.displayName,
            config: input.config,
        })
    }

    private onSubmit = (event?: React.FormEvent<HTMLFormElement>): void => {
        if (event) {
            event.preventDefault()
        }
        this.submits.next(this.getExternalServiceInput())
    }
}

interface SiteAdminAddExternalServicesProps extends ThemeProps {
    history: H.History
    eventLogger: {
        logViewEvent: (event: 'AddExternalService') => void
        log: (event: 'AddExternalServiceFailed' | 'AddExternalServiceSucceeded', eventProperties?: any) => void
    }
}

interface SiteAdminAddExternalServicesState {}

/**
 * Page for choosing a service kind and qualifier to add, among the available options.
 */
export class SiteAdminAddExternalServicesPage extends React.Component<
    SiteAdminAddExternalServicesProps,
    SiteAdminAddExternalServicesState
> {
    private getExternalServiceKind(): [GQL.ExternalServiceKind | null, ExternalServiceQualifier | null] {
        const params = new URLSearchParams(this.props.history.location.search)
        let kind = params.get('kind') || undefined
        if (kind) {
            kind = kind.toUpperCase()
        }
        const isKnownKind = (kind: string): kind is GQL.ExternalServiceKind =>
            !!getExternalService(kind as GQL.ExternalServiceKind)

        return [kind && isKnownKind(kind) ? kind : null, asExternalServiceQualifier(params.get('qualifier'))]
    }

    private static addServiceURL(addService: AddExternalServiceMetadata): string {
        const components: { [key: string]: string } = {
            kind: encodeURIComponent(addService.serviceKind.toLowerCase()),
        }
        if (addService.qualifier) {
            components.qualifier = encodeURIComponent(addService.qualifier)
        }
        return '?' + lodashMap(components, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    }

    public render(): JSX.Element | null {
        const [kind, qualifier] = this.getExternalServiceKind()
        if (kind) {
            return <SiteAdminAddExternalServicePage {...this.props} kind={kind} qualifier={qualifier || undefined} />
        } else {
            const addExternalServices = ALL_ADD_EXTERNAL_SERVICES
            return (
                <div className="add-external-services-page">
                    <PageTitle title="Choose an external service type to add" />
                    <h1>Add external service</h1>
                    <p>Choose an external service to add to Sourcegraph.</p>
                    {addExternalServices.map((addService, i) => (
                        <LinkOrButton key={i} to={SiteAdminAddExternalServicesPage.addServiceURL(addService)}>
                            <ExternalServiceButton {...addService} />
                        </LinkOrButton>
                    ))}
                </div>
            )
        }
    }
}

function addExternalService(
    input: GQL.IAddExternalServiceInput,
    eventLogger: Pick<SiteAdminAddExternalServiceProps['eventLogger'], 'log'>
): Observable<GQL.IExternalService> {
    return mutateGraphQL(
        gql`
            mutation addExternalService($input: AddExternalServiceInput!) {
                addExternalService(input: $input) {
                    id
                }
            }
        `,
        { input }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || !data.addExternalService || (errors && errors.length > 0)) {
                eventLogger.log('AddExternalServiceFailed')
                throw createAggregateError(errors)
            }
            eventLogger.log('AddExternalServiceSucceeded', {
                externalService: {
                    kind: data.addExternalService.kind,
                },
            })
            return data.addExternalService
        })
    )
}
