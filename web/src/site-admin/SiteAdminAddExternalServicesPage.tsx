import * as H from 'history'
import React from 'react'
import { LinkOrButton } from '../../../shared/src/components/LinkOrButton'
import { ExternalServiceKind } from '../../../shared/src/graphql/schema'
import * as GQL from '../../../shared/src/graphql/schema'
import { PageTitle } from '../components/PageTitle'
import { ALL_EXTERNAL_SERVICES } from './externalServices'

interface ButtonProps {
    kind: ExternalServiceKind
    text: string
    secondaryKind?: string // TODO(beyang): e.g., github.com vs GH Enterprise, populate with different default config
}

interface SiteAdminAddExternalServiceProps {
    history: H.History
}
interface SiteAdminAddExternalServiceState {}

export class SiteAdminAddExternalServicePage extends React.Component<
    SiteAdminAddExternalServiceProps,
    SiteAdminAddExternalServiceState
> {
    public render(): JSX.Element | null {
        return <div>TODO</div>
    }
}

interface SiteAdminAddExternalServicesProps {
    history: H.History
    eventLogger: {
        logViewEvent: (event: 'AddExternalService') => void
        log: (event: 'AddExternalServiceFailed' | 'AddExternalServiceSucceeded', eventProperties?: any) => void
    }
}

interface SiteAdminAddExternalServicesState {}

export class SiteAdminAddExternalServicesPage extends React.Component<
    SiteAdminAddExternalServicesProps,
    SiteAdminAddExternalServicesState
> {
    private getExternalServiceKind(): GQL.ExternalServiceKind | null {
        const params = new URLSearchParams(this.props.history.location.search)
        let kind = params.get('kind') || undefined
        if (kind) {
            kind = kind.toUpperCase()
        }
        const isKnownKind = (kind: string): kind is GQL.ExternalServiceKind =>
            !!ALL_EXTERNAL_SERVICES[kind as GQL.ExternalServiceKind]
        return kind && isKnownKind(kind) ? kind : null
    }

    public render(): JSX.Element | null {
        const kind = this.getExternalServiceKind()
        if (kind) {
            return <div>TODO</div>
        } else {
            const buttons: ButtonProps[] = [
                {
                    kind: ExternalServiceKind.AWSCODECOMMIT,
                    text: 'Add repositories from AWS CodeCommit',
                },
                {
                    kind: ExternalServiceKind.GITHUB,
                    text: 'Add repositories from GitHub Enterprise',
                },
                {
                    kind: ExternalServiceKind.GITHUB,
                    text: 'Add repositories from GitHub.com',
                },
                {
                    kind: ExternalServiceKind.GITLAB,
                    text: 'Add projects from GitLab',
                },
                {
                    kind: ExternalServiceKind.BITBUCKETSERVER,
                    text: 'Add repositories from Bitbucket Server',
                },
                {
                    kind: ExternalServiceKind.GITOLITE,
                    text: 'Add repositories from Gitolite',
                },
                {
                    kind: ExternalServiceKind.OTHER,
                    text: 'Add repositories by Git clone URL',
                },
                {
                    kind: ExternalServiceKind.PHABRICATOR,
                    text: 'Link with Phabricator',
                },
            ]
            return (
                <div className="add-external-services-page">
                    <PageTitle title="Choose an external service type to add" />
                    <h1>Add external service</h1>
                    {buttons.map((button, i) => (
                        <LinkOrButton key={i} to={`?kind=${button.kind.toLowerCase()}`}>
                            <button className="btn btn-primary e2e-add-external-service-button add-external-services-page__button">
                                {button.text}
                            </button>
                        </LinkOrButton>
                    ))}
                </div>
            )
        }
    }
}
